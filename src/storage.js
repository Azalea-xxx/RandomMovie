export function addToLocalStorage(movie) {
    const savedMovies = takeMoviesFromLocalStorage();
    savedMovies.push(movie);
    localStorage.setItem('movies', JSON.stringify(savedMovies))
}

export function takeMoviesFromLocalStorage() {
    return JSON.parse(localStorage.getItem('movies') || '[]')
}

export function refreshStorage(movies) {
    localStorage.setItem('movies', JSON.stringify(movies))
}