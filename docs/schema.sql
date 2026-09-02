-- Схема таблицы событий для аналитики MoviePick
-- Каждая строка = одно событие пользователя в системе 
CREATE TABLE events (
    event_id     INTEGER PRIMARY KEY,   -- уникальный ID события
    user_id      TEXT,                  -- псевдо-идентификатор пользователя (в реальности — хэш браузера/устройства, т.к. регистрации нет)
    session_id   TEXT,                  -- идентификатор сессии (одно открытие приложения)
    event_type   TEXT,                  -- тип события, см. список ниже
    event_time   TEXT,                  -- время события (ISO-подобный формат)
    movie_id     TEXT,                  -- ID фильма, если событие с ним связано (иначе NULL)
    duration_ms  INTEGER,               -- длительность запроса в мс (только для api_request)
    success      INTEGER                -- 1/0, успешен ли запрос (только для api_request)
);

-- Возможные значения event_type:
--   session_start    — пользователь открыл приложение
--   search            — пользователь задал критерии поиска
--   api_request       — приложение отправило запрос к TMDB API (есть duration_ms и success)
--   error_shown       — пользователю показано сообщение об ошибке
--   random_pick       — пользователь использовал случайный выбор
--   view_movie_card   — пользователь открыл карточку фильма (есть movie_id)
--   add_favorite      — пользователь добавил фильм в избранное (есть movie_id)

-- Индексы, которые имело бы смысл добавить в реальной системе:
-- CREATE INDEX idx_events_session ON events(session_id);
-- CREATE INDEX idx_events_user ON events(user_id);
-- CREATE INDEX idx_events_time ON events(event_time);
-- CREATE INDEX idx_events_type ON events(event_type);
