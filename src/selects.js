//коды для жанров
const genres = { 
    'Action': 28,
    'Adventure': 12,
    'Animation': 16,
    'Comedy': 35,
    'Crime': 80,
    'Documentary': 99,
    'Drama': 18,
    'Family': 10751,
    'Fantasy': 14,
    'History': 36,
    'Horror': 27,
    'Music': 10402,
    'Mystery': 9648,
    'Romance': 10749,
    'Science Fiction': 78,
    'TV Movie': 10770,
    'Thriller': 53,
    'War': 10752,
    'Western': 37
}

let selects = {
    "with_genres": 27,
    "release_date.gte": 2020,
    "with_runtime.lte": 90,
    "vote_average.gte": 8
}

export function getSelects(obj) {
    for (let key in obj) {
        let value = obj[key].options[obj[key].selectedIndex].text;
        if (obj[key].selectedIndex) {
            if (key == 'with_genres') {
                value = getGenreId(value)
                selects[key] = value
            }
            else {
                selects[key] = value
            }
        } 
        else {
            selects[key] = 0
        }
    }

    return selects;
}

function getGenreId(name) {
    for (let genre in genres) {
        if( genre == name) {
            return genres[genre]
        }
    }
}

export function createRequest(obj) {
    let url = ``
    for (let key in obj) {
        if (obj[key]) {
            url = url + `&${key}=${obj[key]}`
            console.log(url)
        }
    }
    return url;
}

export function getGenreName(id) {
    for (let genre in genres) {
        if( genres[genre] == id) {
            return genre
        }
    }
}









