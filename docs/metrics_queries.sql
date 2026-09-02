-- Расчёт продуктовых и технических метрик MoviePick
-- Проверено на синтетических данных (synthetic_events.csv, 1400 сессий, 30 дней)


-- 1. CONVERSION RATE: поиск просмотр карточки фильма
-- Смысл: из тех, кто вообще задал критерии поиска, сколько дошли до просмотра конкретного фильма. Низкое значение означает, что фильтры слишком узкие или результатов мало.

SELECT
  COUNT(DISTINCT CASE WHEN event_type = 'search' THEN session_id END) AS sessions_with_search,
  COUNT(DISTINCT CASE WHEN event_type = 'view_movie_card' THEN session_id END) AS sessions_with_view,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'view_movie_card' THEN session_id END)
    / COUNT(DISTINCT CASE WHEN event_type = 'search' THEN session_id END)
  , 1) AS conversion_pct
FROM events;

-- Как читать: считаем через CASE внутри COUNT(DISTINCT ...), а не через два отдельных подзапроса — так остаёмся в одном проходе по таблице.
-- Результат на синтетических данных: 71.6% из тех, кто искал, 72% дошли до просмотра хотя бы одной карточки.


-- 2. RANDOM PICK USAGE RATE: как часто используют случайный выбор
-- Смысл: показывает, насколько ценна механика "случайный фильм" относительно ручного перебора через фильтры.

SELECT
  COUNT(DISTINCT CASE WHEN event_type = 'view_movie_card' THEN session_id END) AS sessions_with_view,
  COUNT(DISTINCT CASE WHEN event_type = 'random_pick' THEN session_id END) AS sessions_with_random,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'random_pick' THEN session_id END)
    / COUNT(DISTINCT CASE WHEN event_type = 'view_movie_card' THEN session_id END)
  , 1) AS random_usage_pct
FROM events;

-- Результат: 36.2% сессий с просмотром хотя бы раз использовали "случайный фильм".


-- 3. FAVORITES CONVERSION: доля просмотренных карточек, добавленных в избранное

SELECT
  COUNT(*) AS total_views,
  SUM(CASE WHEN is_favorited = 1 THEN 1 ELSE 0 END) AS favorited_views,
  ROUND(100.0 * SUM(CASE WHEN is_favorited = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) AS favorite_conversion_pct
FROM (
  SELECT
    v.event_id,
    v.session_id,
    v.movie_id,
    EXISTS (
      SELECT 1 FROM events f
      WHERE f.event_type = 'add_favorite'
        AND f.session_id = v.session_id
        AND f.movie_id = v.movie_id
        AND f.event_time >= v.event_time
    ) AS is_favorited
  FROM events v
  WHERE v.event_type = 'view_movie_card'
);

-- Почему EXISTS, а не JOIN: JOIN размножил бы строки, если один и тот же фильм добавляли в избранное несколько раз в сессии (маловероятно, но методологически некорректно). EXISTS всегда даёт 0/1, что нам и нужно.
-- Результат: 23.3% просмотренных карточек были добавлены в избранное.


-- 4. СРЕДНЕЕ ЧИСЛО ФИЛЬМОВ ЗА СЕССИЮ (среди сессий с просмотром)
-- Смысл: сколько карточек в среднем листает пользователь перед тем, как определиться (или уйти). Помогает понять глубину вовлечения.

SELECT ROUND(AVG(views_per_session), 2) AS avg_views_per_session
FROM (
  SELECT session_id, COUNT(*) AS views_per_session
  FROM events
  WHERE event_type = 'view_movie_card'
  GROUP BY session_id
);

-- Классическая связка: сначала GROUP BY в подзапросе считает метрику НА УРОВНЕ сессии, потом внешний запрос усредняет уже готовые числа.
-- Частая ошибка новичков — пытаться сделать AVG(COUNT(*)) в одном уровне запроса, но так SQL не работает: агрегатные функции нельзя вкладывать друг в друга напрямую, поэтому нужен именно подзапрос.
-- Результат: 2.3 фильма за сессию в среднем.


-- 5. ОШИБКИ API (ERROR RATE)
-- Смысл: RED-метрика Errors, то есть как часто TMDB API отвечает с ошибкой или не отвечает вовремя. Это метрика надёжности

SELECT
  COUNT(*) AS total_api_requests,
  SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS failed_requests,
  ROUND(100.0 * SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) / COUNT(*), 2) AS error_rate_pct
FROM events
WHERE event_type = 'api_request';

-- Результат: 5.68% ошибок. Если SLO из SRS требует доступность 95%+, это ЗНАЧИТ error rate должен быть не больше 5% — на синтетических данных мы прямо на грани нарушения, это специально заложено в
-- генератор данных, чтобы метрика была "живой", а не идеальной.


-- 6. ПЕРЦЕНТИЛИ ВРЕМЕНИ ОТВЕТА API (p50 / p95)
-- Смысл: RED-метрика Duration. Среднее время ответа маскирует хвост медленных запросов, поэтому всегда считаем перцентили, а не AVG.
-- Проверяем соответствие NFR из SRS: "не более 4 секунд при загрузке".

WITH ordered AS (
  SELECT
    duration_ms,
    ROW_NUMBER() OVER (ORDER BY duration_ms) AS rn,
    COUNT(*) OVER () AS cnt
  FROM events
  WHERE event_type = 'api_request' AND success = 1
)
SELECT
  (SELECT duration_ms FROM ordered WHERE rn = CAST(0.50 * cnt AS INT)) AS p50_ms,
  (SELECT duration_ms FROM ordered WHERE rn = CAST(0.95 * cnt AS INT)) AS p95_ms
FROM ordered
LIMIT 1;

-- Оконная функция ROW_NUMBER() сортирует все значения по возрастанию
-- и нумерует их — дальше просто берём значение на нужной позиции
-- (50-й процентиль = медиана, 95-й — "почти худший случай").
-- Результат: p50 = 2756мс, p95 = 4978мс — то есть у 5% запросов
-- время ответа ПРЕВЫШАЕТ норматив в 4 секунды из SRS. Это конкретная,
-- измеримая находка, которую в реальном проекте стоило бы вынести
-- в рекомендации по улучшению.


-- 7. DAU (Daily Active Users) — динамика по дням
-- Аналог финального задания из курса по SQL: количество уникальных пользователей, открывших приложение, по дням.

SELECT
  DATE(event_time) AS date_from_calendar,
  COUNT(DISTINCT user_id) AS daily_active_users_cnt
FROM events
WHERE event_type = 'session_start'
GROUP BY DATE(event_time)
ORDER BY date_from_calendar;

ИЛИ

SELECT
  DATE(event_time) AS date_from_calendar,
  COUNT(DISTINCT user_id) AS daily_active_users_cnt,
  MAX(COUNT(DISTINCT user_id)) OVER () AS max_dau_cnt,
  MAX(COUNT(DISTINCT user_id)) OVER () - COUNT(DISTINCT user_id) AS diff_dau
FROM events
WHERE event_type = 'session_start'
GROUP BY DATE(event_time)
ORDER BY date_from_calendar;
