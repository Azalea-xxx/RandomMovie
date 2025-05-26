import './style.css'
import { getSelects, createRequest } from './selects';
import { sendRequest } from './server';
import { makeCard } from './card';
import { addToLocalStorage, takeMoviesFromLocalStorage, refreshStorage } from './storage';
import { toCard } from './card';


// const API_KEY = 'ce2f8a0c1341cb0cf081ef2e2df670a2';

export const URL = `https://api.themoviedb.org/3/discover/movie?api_key=ce2f8a0c1341cb0cf081ef2e2df670a2&language=ru-RU&sort_by=popularity.desc&include_adult=false&include_video=false`

const searchBtn = document.getElementById('searchBtn')
const addBtn = document.getElementById('addBtn')


const favBtn = document.querySelector('.favBtn')
const favBlock = document.querySelector('.fav-movies')
const favMenu = document.querySelector('.favourites')
 
const modal = document.querySelector('.modal')

const img = modal.querySelector('.image__content')
const rating = modal.querySelector('.rate')
const date = modal.querySelector('.release-date')
const title = modal.querySelector('.modal__title')
const genres = modal.querySelector('.genres-list')
const description = modal.querySelector('.description')
const againBtn = modal.querySelector('#againBtn')
const exitBtn = modal.querySelector('#exitBtn')
const movieId = modal.querySelector('.movie-id')

export const message = document.querySelector('.message')

export const messageText = message.querySelector('.message-text')
export const messageHide = message.querySelector('.manyBtn')

let id = 0

let requests = {
    "with_genres": document.getElementById('genre'),
    "release_date.gte": document.getElementById('year'),
    "with_runtime.lte": document.getElementById('duration'),
    "vote_average.gte": document.getElementById('rating')
}

let movies = []

export let cardItems = {
    modal,
    img,
    rating,
    date,
    title,
    genres,
    description,
    againBtn,
    exitBtn,
    addBtn,
    movieId
}

//random elem from array
function randomPage() {
    const page = Math.floor(Math.random()*150);
    return page
}

searchBtn.addEventListener('click', startRandom)
againBtn.addEventListener('click', changeFilm)
favBlock.addEventListener('click', getClickedId)

exitBtn.onclick = () => {
    cardItems["modal"].classList.add('hide')
    message.classList.add('hide')
}

messageHide.onclick = () => {
    message.classList.add('hide')
}

function startRandom(event) {
    event.preventDefault()
    
    processData()
}

function processData() {
    let url = createRequest(getSelects(requests))

    sendRequest(url, randomPage())
        .then(data => {
            movies = data
            if (movies.length) {
                makeCard(movies, 0)
                console.log(movies)
                cardItems["modal"].classList.remove('hide')
                addBtn.onclick = () => {
                    giveLike()
                    addToLocalStorage(movies[0])
                }
            }
            else {
                messageText.innerHTML = `Кажется, по вашему запросу ничего не нашлось. Нажмите еще раз или поменяйте фильтры`
                message.classList.remove('hide')
            }
        }) 
}

function changeFilm() {
    id++
    if (id < movies.length) {
        makeCard(movies, id)
        addBtn.onclick = () => {
            addBtn.classList.add('unclickable', 'liked')
            addToLocalStorage(movies[id])
        }          
    }
    else { 
        id = 0
        processData()
    } 
}

favBtn.addEventListener( 'click', () => {
    if(favMenu.classList.contains('fav-active')) {
        favMenu.classList.remove('fav-active')
        setTimeout(() => {
            favBtn.classList.remove('active')
        }, 600)
    } else {
        renderSavedList(takeMoviesFromLocalStorage())

        favMenu.classList.add('fav-active')
        favBtn.classList.add('active')

        //закрытие меню при нажатии извне
        document.addEventListener('click', event => {
            if(!event.target.closest('.favourites')) {
                if(!event.target.closest('.fav-movie')) {
                    favMenu.classList.remove('fav-active')
                    setTimeout(() => {
                        favBtn.classList.remove('active')
                    }, 600)
                }
            }
        })
    }
})

function renderSavedList(movies) {
    let html = movies.map(toCard).join('')
    favBlock.innerHTML = html
}

function getClickedId(event) {
    if (event.target.closest('.removeBtn')) {
        let movie = event.target.closest('.fav-movie')
        let id = Number(movie.querySelector('.fav-id').textContent)
                
        removeFromLiked(id)

        if(id == Number(document.querySelector('.movie-id').textContent)) {
            removeLike()
        }
    }
}

function removeFromLiked(id) {
    let all = takeMoviesFromLocalStorage()
    all = all.filter(movie => movie.id != id)
    refreshStorage(all)
    renderSavedList(takeMoviesFromLocalStorage())
}

function removeLike() {
    addBtn.classList.remove('unclickable', 'liked')
}

function giveLike() {
    addBtn.classList.add('unclickable', 'liked')

}






