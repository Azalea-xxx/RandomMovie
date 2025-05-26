const API_KEY = '12e1b067eb881de3a2d283cfd1bfbe81'
const IMG_URL = 'https://image.tmdb.org/t/p/original'
const DEFAULT_POSTER =
	'https://via.placeholder.com/300x450/212529/6c757d?text=No+poster'

// Элементы DOM
const movieForm = document.getElementById('movieForm')
const movieModal = new bootstrap.Modal(document.getElementById('movieModal'))
const favoritesSidebar = document.getElementById('favoritesSidebar')
const favBtn = document.getElementById('favBtn')
const closeFavorites = document.getElementById('closeFavorites')
const favoritesList = document.getElementById('favoritesList')

// Состояние приложения
let currentMovies = []
let currentIndex = 0
let currentFilters = {}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
	loadFavorites()

	// Обработчик формы
	movieForm.addEventListener('submit', e => {
		e.preventDefault()
		currentIndex = 0
		currentFilters = getFilters()
		searchMovies(currentFilters)
	})

	// Кнопка избранного
	favBtn.addEventListener('click', toggleFavorites)
	closeFavorites.addEventListener('click', toggleFavorites)

	// Обработчики модального окна
	document.getElementById('againBtn').addEventListener('click', showNextMovie)
	document.getElementById('addBtn').addEventListener('click', addToFavorites)
	document
		.getElementById('exitBtn')
		.addEventListener('click', () => movieModal.hide())
})

// Получение фильтров из формы
function getFilters() {
	return {
		with_genres: document.getElementById('genre').value,
		'release_date.gte': document.getElementById('year').value
			? `${document.getElementById('year').value}-01-01`
			: '',
		'with_runtime.lte': document.getElementById('duration').value,
		region: document.getElementById('country').value,
		'vote_average.gte': document.getElementById('rating').value,
		sort_by: document.getElementById('sort').value,
		language: 'ru-RU',
	}
}

// Поиск фильмов
function searchMovies(filters) {
	const url = buildApiUrl(filters)

	fetch(url)
		.then(response => response.json())
		.then(data => {
			if (data.results && data.results.length > 0) {
				currentMovies = data.results
				showMovie(0)
			} else {
				showNoResults()
			}
		})
		.catch(error => {
			console.error('Error:', error)
			alert(
				'Произошла ошибка при загрузке фильмов. Пожалуйста, попробуйте позже.'
			)
		})
}

// Построение URL для API
function buildApiUrl(filters) {
	let url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}`

	for (const key in filters) {
		if (filters[key]) {
			url += `&${key}=${filters[key]}`
		}
	}

	// Добавляем случайную страницу для разнообразия
	url += `&page=${Math.floor(Math.random() * 10) + 1}`

	return url
}

// Показать фильм
function showMovie(index) {
	const movie = currentMovies[index]

	if (!movie) {
		showNoResults()
		return
	}

	// Заполняем данные о фильме
	document.getElementById('movieTitle').textContent =
		movie.title || 'Название неизвестно'

	// Постер
	const poster = document.getElementById('moviePoster')
	if (movie.poster_path) {
		poster.src = IMG_URL + movie.poster_path
		poster.onerror = () => {
			poster.src = DEFAULT_POSTER
		}
	} else {
		poster.src = DEFAULT_POSTER
	}

	// Рейтинг
	const ratingElement = document.getElementById('movieRating')
	ratingElement.textContent = movie.vote_average
		? movie.vote_average.toFixed(1)
		: '?'

	// Цвет рейтинга
	if (movie.vote_average >= 7.5) {
		ratingElement.className = 'rating-high'
	} else if (movie.vote_average >= 5) {
		ratingElement.className = 'rating-medium'
	} else {
		ratingElement.className = 'rating-low'
	}

	// Дата выхода
	document.getElementById('movieReleaseDate').textContent = movie.release_date
		? new Date(movie.release_date).getFullYear()
		: 'Дата неизвестна'

	// Жанры
	const genresList = document.getElementById('movieGenres')
	genresList.innerHTML = ''

	if (movie.genre_ids && movie.genre_ids.length > 0) {
		movie.genre_ids.forEach(genreId => {
			const genreName = getGenreName(genreId)
			if (genreName) {
				const li = document.createElement('li')
				li.className = 'list-inline-item'
				li.textContent = genreName
				genresList.appendChild(li)
			}
		})
	} else {
		genresList.innerHTML = '<li class="list-inline-item">Жанры неизвестны</li>'
	}

	// Описание
	document.getElementById('movieOverview').textContent = movie.overview
		? movie.overview
		: 'Описание отсутствует.'

	// Проверяем, есть ли фильм в избранном
	const addBtn = document.getElementById('addBtn')
	if (isInFavorites(movie.id)) {
		addBtn.innerHTML = '<i class="fas fa-heart me-2"></i>В избранном'
		addBtn.classList.add('disabled')
	} else {
		addBtn.innerHTML = '<i class="far fa-heart me-2"></i>В избранное'
		addBtn.classList.remove('disabled')
	}

	// Показываем модальное окно
	movieModal.show()
}

// Показать следующий фильм
function showNextMovie() {
	currentIndex++

	if (currentIndex >= currentMovies.length) {
		// Если дошли до конца списка, делаем новый запрос
		currentIndex = 0
		searchMovies(currentFilters)
	} else {
		showMovie(currentIndex)
	}
}

// Нет результатов
function showNoResults() {
	alert(
		'По вашим критериям не найдено ни одного фильма. Пожалуйста, измените параметры поиска.'
	)
}

// Получить название жанра по ID
function getGenreName(genreId) {
	const genres = {
		28: 'Боевик',
		12: 'Приключения',
		16: 'Мультфильм',
		35: 'Комедия',
		80: 'Криминал',
		99: 'Документальный',
		18: 'Драма',
		10751: 'Семейный',
		14: 'Фэнтези',
		36: 'История',
		27: 'Ужасы',
		10402: 'Музыка',
		9648: 'Детектив',
		10749: 'Мелодрама',
		878: 'Фантастика',
		10770: 'TV',
		53: 'Триллер',
		10752: 'Военный',
		37: 'Вестерн',
	}

	return genres[genreId] || null
}

// Избранное
function toggleFavorites() {
	favoritesSidebar.classList.toggle('show')
}

// Загрузка избранного
function loadFavorites() {
	const favorites = getFavorites()

	if (favorites.length === 0) {
		favoritesList.innerHTML = `
            <div class="text-center py-5">
                <i class="far fa-heart fa-3x text-secondary mb-3"></i>
                <p class="text-muted">Ваш список избранного пуст</p>
            </div>
        `
		return
	}

	favoritesList.innerHTML = ''

	favorites.forEach(movie => {
		const favoriteItem = document.createElement('div')
		favoriteItem.className = 'favourite-item'
		favoriteItem.innerHTML = `
            <div class="row g-0">
                <div class="col-md-4">
                    <div class="favourite-poster" style="background-image: url(${
											movie.poster_path
												? IMG_URL + movie.poster_path
												: DEFAULT_POSTER
										})"></div>
                </div>
                <div class="col-md-8">
                    <div class="favourite-info">
                        <h5 class="favourite-title">${movie.title}</h5>
                        <div class="favourite-meta">
                            <span class="me-3"><i class="fas fa-star text-warning me-1"></i>${
															movie.vote_average
														}</span>
                            <span><i class="fas fa-calendar-alt text-warning me-1"></i>${
															movie.release_date
																? new Date(movie.release_date).getFullYear()
																: '?'
														}</span>
                        </div>
                        <p class="favourite-overview">${
													movie.overview || 'Описание отсутствует.'
												}</p>
                        <button class="btn btn-sm btn-outline-danger remove-btn" data-id="${
													movie.id
												}">
                            <i class="fas fa-trash me-1"></i>Удалить
                        </button>
                    </div>
                </div>
            </div>
        `
		favoritesList.appendChild(favoriteItem)
	})

	// Добавляем обработчики для кнопок удаления
	document.querySelectorAll('.remove-btn').forEach(btn => {
		btn.addEventListener('click', e => {
			const movieId = parseInt(
				e.target.closest('button').getAttribute('data-id')
			)
			removeFromFavorites(movieId)
			loadFavorites()
		})
	})
}

// Добавить в избранное
function addToFavorites() {
	const movie = currentMovies[currentIndex]
	const favorites = getFavorites()

	if (isInFavorites(movie.id)) {
		return
	}

	favorites.push(movie)
	localStorage.setItem('favorites', JSON.stringify(favorites))

	// Обновляем кнопку
	const addBtn = document.getElementById('addBtn')
	addBtn.innerHTML = '<i class="fas fa-heart me-2"></i>В избранном'
	addBtn.classList.add('disabled')

	// Показываем уведомление
	showNotification('Фильм добавлен в избранное!')

	// Обновляем список избранного
	loadFavorites()
}

// Удалить из избранного
function removeFromFavorites(movieId) {
	let favorites = getFavorites()
	favorites = favorites.filter(movie => movie.id !== movieId)
	localStorage.setItem('favorites', JSON.stringify(favorites))
	showNotification('Фильм удален из избранного')
}

// Получить избранное
function getFavorites() {
	return JSON.parse(localStorage.getItem('favorites')) || []
}

// Проверить, есть ли фильм в избранном
function isInFavorites(movieId) {
	const favorites = getFavorites()
	return favorites.some(movie => movie.id === movieId)
}

// Показать уведомление
function showNotification(message) {
	const notification = document.createElement('div')
	notification.className =
		'position-fixed bottom-0 end-0 m-3 p-3 bg-success text-white rounded shadow'
	notification.style.zIndex = '1100'
	notification.textContent = message
	document.body.appendChild(notification)

	setTimeout(() => {
		notification.classList.add('animate__animated', 'animate__fadeOut')
		setTimeout(() => notification.remove(), 500)
	}, 3000)
}
