
var recentCities = [];
var apikey = `appid=b8fed24ef97900ebf9d2de259c00d208`;

// Checks if localstorage exists
if (localStorage.getItem('recent')===null){
} else {
    recentCities = JSON.parse(localStorage.getItem('recent'))
}

// Checks to see if valid
var checkForecast = function(city){
    var newCity = city
    // function to check if zipcode
    function hasNumber(myString) {
        return /\d/.test(myString);
    }
    if(hasNumber(newCity)){
        newCity = `zip=${newCity},us`
    }else{
        newCity = `q=${newCity}`
    }
    var apiUrl = `https://api.openweathermap.org/data/2.5/weather?units=imperial&${newCity}&${apikey}`
    fetch(apiUrl)
    .then(function(response){
        if(response.ok){
            response.json().then(function(data){
                createConditions(data)
                createForecast(city)
                if (!recentCities.includes(city)){
                    checkRecent(city)
                }
            })
        } else{
            $('.forecast-container').fadeOut()
            document.querySelector('#city').setCustomValidity("Invalid City Name")
            document.querySelector('#city').reportValidity()
        }
    })
    .catch(function(error){
        console.log(error)
    })
}

// Creates Today's Forecast
var createConditions = function(data){
    // Clears Area
    $('#first-col').empty()
    $('#sec-col').empty()
    $('#conditions-info span').text(data.name)
    // First Column
    var weatherEl = $('<p>').text(data.weather[0].description)
    var weatherIconEl = $('<img>').attr('src', `https://openweathermap.org/img/w/${data.weather[0].icon}.png`)
    weatherEl.prepend(weatherIconEl)
    $('#first-col').append($('<p>').text('Today'), weatherEl)
    // Second Column
    var tempEl = $('<p>').text(`Temperature: ${data.main.temp} F`)
    var humidityEl = $('<p>').text(`Humidity: ${data.main.humidity}%`)
    var windEl = $('<p>').text(`Wind: ${data.wind.speed} Miles/HR`)
    $('#sec-col').append(tempEl, humidityEl, windEl, createUV(data))
    $('.forecast-container').fadeIn()
}

// Creates 5 day Forecasts
var createForecast = function(city){
    var apiUrl = `https://api.openweathermap.org/data/2.5/forecast?units=imperial&q=${city}&${apikey}`
    fetch(apiUrl)
    .then(function(response){
        if(response.ok){
            response.json().then(function(data){
                // Clears Area
                $('#forecast-info').empty()
                let i = 0
                for(let dayIndex = 0;dayIndex<5;dayIndex++){
                    // Converts day to String
                    var day = data.list[i].dt_txt
                        day = day.substring(0, 10)
                        day = new Date(`${day}T00:00:00`)
                        day = day.toString().substring(0, 15)
                    dayEl = $('<p>').text(day)
                    // Creates Icon
                    var weatherEl = $('<p>').text(data.list[i].weather[0].description)
                    var weatherIcon = $('<img>').attr('src', `https://openweathermap.org/img/w/${data.list[i].weather[0].icon}.png`)
                    weatherEl.prepend(weatherIcon)
                    // Creates Temp/Humidity
                    var tempEl = $('<p>').text(`Temperature: ${data.list[i].main.temp} F`)
                    var humidityEl = $('<p>').text(`Humidity: ${data.list[i].main.humidity}%`)
                    var containerEl = $('<div>').attr('class', 'card p-1')
                    containerEl.append(dayEl, weatherEl, tempEl, humidityEl)
                    $('#forecast-info').append(containerEl)
                    i += 8;
                }
            })
        }else{
            console.log(`ERROR`)
        }
    })
}

// Creates UV
var createUV = function(obj){
    var img = "https://www.epa.gov/sites/production/files/sunwise/images/uviscaleh_lg.gif"
    var lat = obj.coord.lat
    var lon = obj.coord.lon
    var containerEl = $('<div>').attr('class', 'd-flex flex-wrap justify-content-center')
    var imgEl = $('<img>').attr('src', img).attr('class', 'mw-100 text-center')
    var apiurl = `https://api.openweathermap.org/data/2.5/uvi/forecast?lat=${lat}&lon=${lon}&${apikey}`
    fetch(apiurl)
    .then(function(response){
        if (response.ok){
            response.json().then(function(data){
                var uvIndexLabelEl = $('<p>').text(`UV Index: `)
                var uv = data[0].value
                var uvIndexEl = $('<span>').text(`${uv}`)
                // check uv range
                if(uv<3){
                    uvIndexEl.addClass('low')
                } else if(uv<6){
                    uvIndexEl.addClass('mod')
                } else if(uv<=8){
                    uvIndexEl.addClass('high')
                } else if(uv<11){
                    uvIndexEl.addClass('very-high')
                } else {
                    uvIndexEl.addClass('extreme')
                }
                uvIndexLabelEl.append(uvIndexEl)
                containerEl.append(uvIndexLabelEl)
                containerEl.append(imgEl)
            })
        }
    })
    return containerEl
}

// Checks to see how to add new city to recent
var checkRecent = function(city){
    recentCities.push(city)
    if ($('.recent-cities li').length < 5){
        createRecent()
    } else {
        recentCities.shift()
        createRecent()
    }
}

// Creates all recent buttons
var createRecent = function(){
    $('.recent-cities').empty()
    for(let i = recentCities.length - 1; i >= 0; i--){
        var cityEl = $('<li>').attr('class', 'recent-city bg-dark text-light m-1 p-1').text(recentCities[i])
        $('.recent-cities').append(cityEl)
    }
    $('#recent-cities-title').fadeIn()
    localStorage.setItem('recent', JSON.stringify(recentCities))
}

// Search Button 
$('.city-form').on('submit', function(event){
    event.preventDefault()
    $('.forecast-container').hide()
    var city = $(this).find('#city').val().trim().toLowerCase()
    checkForecast(city)
    $('.city-form').trigger('reset')
})

// Recent City Buttons
$('.recent-cities').on('click', 'li', function(event){
    event.preventDefault()
    $('.forecast-container').hide()
    var city = $(this).text()
    checkForecast(city)
    $('.city-form').trigger('reset')
})

// Hides Right Column
$('.forecast-container').hide()
// Hides Recent Cities if empty
if (recentCities.length < 1){
    $('#recent-cities-title').hide()
} else {
    createRecent()
}