import { cardItems } from "./app";
import { getGenreName } from './selects';
import { takeMoviesFromLocalStorage } from "./storage";

const ids = [9007, 770635, 4347, 767, 672, 674, 12445, 671, 675, 673, 12444, 367412, 203833, 32985, 4935, 5227, 4951, 86825, 10229, 254003, 109774, 71, 64765, 64122, 14202, 324786, 43949, 597219, 115, 237791, 561, 26371, 111014, 201085, 514684, 9293, 272693, 43818, 147009, 413806, 270303, 398818, 416144, 633787, 835598, 31165, 57212, 11774, 278, 731021, 839033, 2454, 13, 205596, 425274, 425274, 413576, 21028, 11324, 207933, 654974, 1271, 1904, 37165, 49051, 122917, 121, 120, 122, 10140, 2454, 158, 57158, 411, 50646, 1267];

const IMG_URL = 'https://image.tmdb.org/t/p/original';

export function makeCard(movies, id) {
    cardItems['addBtn'].classList.remove('liked')
    addBtn.classList.remove('unclickable')

    cardItems['img'].src = `${IMG_URL}${movies[id]['poster_path']}`
    cardItems['description'].innerHTML = movies[id]['overview']
    cardItems['title'].innerHTML = movies[id]['title'] = checkZarya(movies[id])
    cardItems['date'].innerHTML = movies[id]['release_date']
    cardItems['rating'].innerHTML = '<i class="fa fa-star-o" aria-hidden="true"></i>' + movies[id]['vote_average']
    cardItems['movieId'].innerHTML = movies[id]['id']

    takeMoviesFromLocalStorage().forEach(movie => {
        if (movie.id == movies[id].id) {
            cardItems['addBtn'].classList.add('liked')
        }
    })

    cardItems['genres'].innerHTML = makeList(movies[id]['genre_ids'])

}

export function toCard(movie) {
    return `
        <div class="fav-movie">
            <div class="fav-info">
                <div class="fav-poster">
                    <img src="${IMG_URL}${movie['poster_path']}"></img>
                </div>
                <div class="fav-id">
                    ${movie.id}
                </div>
                <div class="fav-title">
                    ${
                        checkZarya(movie)
                    }
                </div>
                <div class="fav-data">
                    ${movie.vote_average}, ${movie.release_date}
                </div>
                <div class="fav-genres">
                    ${makeGenreArr(movie.genre_ids)}
                </div>
            </div>
            <div class="fav-review">
                ${movie.overview.length > 165 ? movie.overview.substring(0,164)+"..." : movie.overview
            }}
            </div>
            <button class="removeBtn btn mb-1 btn-success text-dark">Убрать из избранного</button>
        </div>
    `
}

function checkZarya(movie) {
    let arr = ids.filter(elem => movie.id == elem)
    console.log(arr)
    if(arr.length) {
        return movie.title + '  <i style="color: #ffc107" title="Одобрено Зарей!" class="fa fa-thumbs-up fa-1x" aria-hidden="true"></i>'
    }
    else {
        return movie.title
    }
}

function makeGenreArr(arr) {
    let genreArray = []
    arr.forEach(id => {
        genreArray.push(getGenreName(id))
    })
    return genreArray.join(', ')
}

function makeList(arr) {
    let genres = arr.map(id => getGenreName(id))
    genres = genres.filter(genre => genre != undefined)
        
    let html = genres.map(genre => `<li>${genre}</li>`).join('')
    return html
}








