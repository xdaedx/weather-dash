
class DailyWeather {
    constructor(temp, humidity, iconDescription) {
        this.temp = temp;
        this.humidity = humidity;
        this.icon = {
            description: iconDescription,
        }
    }

    setDate(openWeatherDate) {
        //date will convert the openWeather date to local time
        const convertedDate = new Date(openWeatherDate * 1000);
        this.date = `(${convertedDate.getMonth() + 1}/${convertedDate.getDate()}/${convertedDate.getFullYear()})`;
        return this;
    }
    setIconName(iconName, openWeatherDate) {

        this.icon.name = iconName.slice(0, iconName.length - 1) + this.generateIconEnding(openWeatherDate);
        return this;
    }
}

DailyWeather.prototype.generateIconEnding = function (openWeatherDate) {
    const hour = new Date(openWeatherDate * 1000).getHours();
    return (hour >= 0 && hour < 12) ? 'n' : 'd';
};


class CurrentWeather extends DailyWeather {
    constructor(temp, humidity, windSpeed, iconDescription) {
        super(temp, humidity, iconDescription);
        this.windSpeed = windSpeed;
    }

    //set uv index
    setUV(uvIndex) {
        this.uv = {
            index: uvIndex,
            color: this.generateUVIndexColor(uvIndex),
        }
        return this;
    }
}

//uv index color
CurrentWeather.prototype.generateUVIndexColor = function (uvIndex) {
    if (uvIndex <= 2) {
        return 'text-white bg-success';
    } else if (uvIndex <= 5) {
        return 'text-white bg-warning';
    } else if (uvIndex <= 7) {
        return 'text-white bg-danger';
    } else if (uvIndex <= 10) {
        return 'text-light bg-danger';
    } else if (uvIndex > 10) {
        return 'text-white bg-primary';
    }
};

//weather data
class WeatherData {
    constructor(cityName, lat, lon) {
        this.city = {
            name: cityName,
            lat: lat,
            lon: lon,
        }
        this.nextFiveDays = [];
    }

    //setters
    setCurrentDay(currentDay) {
        this.currentDay = currentDay;
    }

    //append to nextFiveDays
    appendToNextFiveDays(day) {
        this.nextFiveDays.push(day);
    }
}

//sets next 5 days
WeatherData.prototype.setOneCallInfo = function (dayList) {
    dayList.forEach(function (day, index) {
        if (index === 0) {
            this.currentDay.setUV(day.uvi);
        } else if (index <= 5) {
            let nextFiveDay = new DailyWeather(
                    day.temp.day,
                    day.humidity,
                    day.weather[0].description)
                .setDate(day.dt)
                .setIconName(day.weather[0].icon, day.dt);
            this.appendToNextFiveDays(nextFiveDay);
        }
    }, this);
    return this;
}

//Get and display information on page load
window.onload = function () {
    const lastSearchedCity = getLastSearchedCity();
    if (lastSearchedCity) {
        startGettingWeatherData(lastSearchedCity);
    } else {
        hideElement('curr-weather-row');
        hideElement('daily-weather-row');
    }
}

//Search button event listener
document.getElementById('search-city').addEventListener('submit', submitSearch);
//Search history event listener
document.getElementById('search-history').addEventListener('click', submitSearchHistoryEntry);


function submitSearchHistoryEntry(event) {
    event.preventDefault();

    if (event.target.matches('.search-entry')) {
        startGettingWeatherData(event.target.dataset.cityName);
    }
}

//when search submitted
function submitSearch(event) {
    event.preventDefault();
    resetSearchError();

    const userInput = getUserInput();

    if (userInput) {
        startGettingWeatherData(userInput);
    } else {
        document.getElementById('city-name').value = '';
        showSearchError('Please enter a city name');
    }
}

function getUserInput() {
    let userInput = document.getElementById('city-name').value;
    userInput = userInput.replace(/\s+/g, ' ');
    userInput = userInput.trim();
    return userInput;
}

//errors
function resetSearchError() {
    document.getElementById('city-name').classList.remove('border-danger');
    document.getElementById('error').textContent = '';
}

function showSearchError(message) {
    document.getElementById('city-name').classList.add('border-danger');
    document.getElementById('error').textContent = message;
}

//API KEY; get weather data... make sure to use &
const API_KEY = 'b8fed24ef97900ebf9d2de259c00d208';

function startGettingWeatherData(cityName) {
    // getFiveDayForecast(cityName, API_KEY);
    if (!isCurrentlyDisplayed(cityName)) {
        fetchData(getCurrentWeatherURL(cityName), processCurrentWeatherData);
    }
}

function fetchData(queryURL, nextAction) {
    fetch(queryURL)
        .then(function (response) {
            return response.json();
        }).then(nextAction);
}

function processCurrentWeatherData(data) {
    if (data.cod != 200) {
        showSearchError('City not found');
    } else {
        const weatherData = new WeatherData(
            data.name,
            data.coord.lat,
            data.coord.lon);
        const currentDay = new CurrentWeather(
                data.main.temp,
                data.main.humidity,
                data.wind.speed,
                data.weather[0].description)
            .setDate(data.dt)
            .setIconName(data.weather[0].icon, data.dt);
        weatherData.setCurrentDay(currentDay);
        //next call to call api
        fetchData(getOneCallURL(data.coord.lat, data.coord.lon), function (data) {
            processOneCallData(data, weatherData);
        });
    }
}

function processOneCallData(data, weatherData) {
    const weatherObj = weatherData;
    weatherObj.setOneCallInfo(data.daily);

    displayInformation(weatherObj);
    saveLastSearchedCity(weatherObj.city.name);
}

//URL queries
function getCurrentWeatherURL(cityName) {
    return 'https://api.openweathermap.org/data/2.5/weather?' +
        `q=${cityName}` +
        '&units=imperial' +
        `&appid=${API_KEY}`;
}

function getOneCallURL(lat, lon) {
    return 'https://api.openweathermap.org/data/2.5/onecall?' +
        `lat=${lat}` +
        `&lon=${lon}` +
        '&units=imperial' +
        `&appid=${API_KEY}`;
}

//display functions
function displayInformation(weatherObj) {
    hideElement('start-text');
    setCityInfo(weatherObj.city.name);
    displayOverviewCard(weatherObj.currentDay, weatherObj.city.name);
    displayFiveDayForecast(weatherObj.nextFiveDays);
    displayNewSearchEntry(weatherObj.city.name);
}

function setCityInfo(cityName) {
    const cityInfo = document.getElementById('city-info');
    cityInfo.setAttribute('data-city', cityName);
}

function displayOverviewCard(currentDay, cityName) {
    const currentWeather = document.getElementById('current-weather');

    currentWeather.innerHTML =
        `<div class="card-body">
        <h2 class="d-inline-block mr-3">${cityName} ${currentDay.date}</h2>
        <img class="d-inline-block" src="https://openweathermap.org/img/wn/${currentDay.icon.name}@2x.png" alt="${currentDay.icon.description}">
        <p>Temperature: ${currentDay.temp} &#176;F</p>
        <p>Humidity: ${currentDay.humidity}&#37;</p>
        <p>Wind Speed: ${currentDay.windSpeed} MPH</p>
        <p>UV Index: <span id="current-uv-index" class="${currentDay.uv.color} py-1 px-2 rounded">${currentDay.uv.index}</span></p>
      </div>`;
    showElement('curr-weather-row');
}

function displayFiveDayForecast(dayList) {
    const fiveDayForecastCards = document.getElementById('five-day-forecast-cards');
    fiveDayForecastCards.innerHTML = '';
    for (day of dayList) {
        fiveDayForecastCards.innerHTML +=
            `<div class="col-lg">
          <div class="card bg-primary text-white">
            <div class="card-body d-flex flex-column justify-content-center align-items-center">
              <p class="h5">${day.date}</p>
              <img class="mb-3" src="https://openweathermap.org/img/wn/${day.icon.name}@2x.png" alt="${day.icon.description}">
              <p>Temp: ${day.temp} &#176;F</p>
              <p>Humidity: ${day.humidity}&#37;</p>
            </div>
          </div>
        </div>`;
    }
    showElement('daily-weather-row');
}

function displayNewSearchEntry(cityName) {
    const searchHistoryList = document.getElementById('search-history');

    if (!isExistingSearch(cityName, searchHistoryList)) {
        //add if duplicate not found
        searchHistoryList.innerHTML +=
            `<li class="list-group-item p-0">
      <button class="search-entry w-100 h-100 btn btn-link" data-city-name="${cityName}">${cityName}</button>
    </li>`;
    }
}

function hideElement(name) {
    document.getElementById(name).setAttribute('style', 'display: none!important');
}

function showElement(name) {
    document.getElementById(name).style.display = 'block';
}

// check condtions
function isExistingSearch(cityName, searchHistoryList) {
    const searchHistoryItems = searchHistoryList.children;
    //keep from adding duplicates
    for (item of searchHistoryItems) {
        console.log(item.firstElementChild.dataset.cityName);
        if (item.firstElementChild.dataset.cityName === cityName) {
            return true;
        }
    }
    return false;
}

function isCurrentlyDisplayed(cityName) {
    const currentDisplay = document.getElementById('city-info').dataset.city;
    return currentDisplay === cityName ? true : false;
}

// Local storage
function saveLastSearchedCity(cityName) {
    localStorage.setItem('lastSearchedCity', cityName);
}

function getLastSearchedCity() {
    return localStorage.getItem('lastSearchedCity');
}