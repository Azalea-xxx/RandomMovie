import { URL } from "./app";
import { message, messageText } from "./app";
 
export function sendRequest(url, page) {
    return fetch(`${URL}${url}&page=${page}
    `)
    .then(response => {
        return response.json()
    })
    .then(data => {
        
        if (data.results.length) {
            
            return data.results.filter(movie => movie['overview'])
        }
         else {
            return firstPage(url)
        }
    })
    .catch(error => {
        alert(`По каким то причинам запрос не был отправлен. Проверь подключение к сети, лох: ${error}`)
    })
}

function firstPage(url) {
    return fetch(`${URL}${url}&page=1`)
    .then(response => {
        return response.json()
    })
    .then(data => {
        let movies = data.results.filter(movie => movie['overview'])
            messageText.innerHTML = `По вашему запросу нашлось фильмов: ${movies.length}. Кажется, стоит поменять фильтры`
            message.classList.remove('hide')
        return movies
    })
    .catch(error => {
        alert(`По каким то причинам запрос не был отправлен. Проверь подключение к сети, лох: ${error}`)
    })
}




