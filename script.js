class Weather {
    selectors = {
        root: '[data-js-weather]',
        searchCityForm: '[data-js-weather-search-city-form]',
        searchCityInput: '[data-js-weather-search-city-input]',
        error: '[data-js-weather-error]',
        errorMessage: '[data-js-weather-error-message]',
        animationWrapper: '[data-js-weather-animation-wrapper]',
        locationName: '[data-js-weather-location-name]',
        locationDate: '[data-js-weather-location-date]',
        icon: '[data-js-weather-icon]',
        temperature: '[data-js-weather-temperature]',
        condition: '[data-js-weather-condition]',
        humidity: '[data-js-weather-humidity]',
        wind: '[data-js-weather-wind]',
        forecast: '[data-js-weather-forecast]',
    }

    stateClasses = {
        isLoad: 'is-load',
        isVisible: 'is-visible',
    }

    weatherCodes = {
        0: 'clear',
        1: 'cloudy',
        2: 'cloudy',
        3: 'cloudy',
        45: 'foggy',
        48: 'foggy',
        51: 'drizzle',
        53: 'drizzle',
        55: 'drizzle',
        56: 'drizzle',
        57: 'drizzle',
        61: 'rain',
        63: 'rain',
        65: 'rain',
        66: 'rain',
        67: 'rain',
        71: 'snow',
        73: 'snow',
        75: 'snow',
        77: 'snow',
        80: 'rain',
        81: 'rain',
        82: 'rain',
        85: 'snow',
        86: 'snow',
        95: 'thunderstorm',
        96: 'thunderstorm',
        99: 'thunderstorm',
    }

    weatherConditions = {
        'clear': {
            icon: 'sun.svg',
            description: 'Sunny'
        },
        'cloudy': {
            icon: 'partly-cloudy.svg',
            description: 'Cloudy',
        },
        'foggy': {
            icon: 'foggy.svg',
            description: 'Fog',
        },
        'drizzle': {
            icon: 'rain.svg',
            description: 'Drizzle',
        },
        'rain': {
            icon: 'rain.svg',
            description: 'Rain',
        },
        'snow': {
            icon: 'snow.svg',
            description: 'Snow',
        },
        'thunderstorm': {
            icon: 'thunderstorm.svg',
            description: 'Thunderstorm',
        },
    }

    constructor() {
        this.rootElement = document.querySelector(this.selectors.root)
        this.searchCityFormElement = this.rootElement.querySelector(this.selectors.searchCityForm)
        this.searchCityInputElement = this.rootElement.querySelector(this.selectors.searchCityInput)
        this.errorElement = this.rootElement.querySelector(this.selectors.error)
        this.errorMessageElement = this.rootElement.querySelector(this.selectors.errorMessage)
        this.animationWrapperElement = this.rootElement.querySelector(this.selectors.animationWrapper)
        this.locationNameElement = this.rootElement.querySelector(this.selectors.locationName)
        this.locationDateElement = this.rootElement.querySelector(this.selectors.locationDate)
        this.iconElement = this.rootElement.querySelector(this.selectors.icon)
        this.temperatureElement = this.rootElement.querySelector(this.selectors.temperature)
        this.conditionElement = this.rootElement.querySelector(this.selectors.condition)
        this.humidityElement = this.rootElement.querySelector(this.selectors.humidity)
        this.windElement = this.rootElement.querySelector(this.selectors.wind)
        this.forecastElement = this.rootElement.querySelector(this.selectors.forecast)
        this.bindEvents()
    }

    updateUI(location, weather) {
        this.rootElement.classList.add(this.stateClasses.isLoad)
        this.animationWrapperElement.classList.add(this.stateClasses.isVisible)

        const {
            current: currentForecastWeather,
            daily: dailyForecastWeather,
        } = weather

        const {
            relative_humidity_2m: currentHumidity,
            temperature_2m: currentTemperature,
            time: currentDate,
            weather_code: currentWeatherCode,
            wind_speed_10m: currentWind,
        } = currentForecastWeather

        this.setTextContent(this.locationNameElement, location.name)
        this.locationDateElement.dateTime = currentDate.split('T')[0]
        this.setTextContent(this.locationDateElement, this.getFormattedDate(currentDate, {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
        }))

        const currentWeatherCodeKey = this.weatherCodes[currentWeatherCode]
        const currentWeatherCondition = this.weatherConditions[currentWeatherCodeKey]
        const {
            icon,
            description
        } = currentWeatherCondition

        this.iconElement.src = `./assets/icons/${icon}`
        this.iconElement.alt = description
        this.setTextContent(this.temperatureElement, `${Math.round(currentTemperature)} °C`)
        this.setTextContent(this.conditionElement, description)

        this.setTextContent(this.humidityElement, `${currentHumidity} %`)
        this.setTextContent(this.windElement, `${currentWind} Km/h`)

        const forecastWeather = dailyForecastWeather.time.map((date, index) => {
            return {
                date,
                temperature: dailyForecastWeather.temperature_2m_max[index],
                weatherCode: dailyForecastWeather.weather_code[index],
            }
        }).slice(1)

        this.forecastElement.innerHTML = forecastWeather.map(({date, temperature, weatherCode}) => {
            const dateOptions = {
                day: '2-digit',
                month: 'short',
            }

            const forecastWeatherCodeKey = this.weatherCodes[weatherCode]
            const forecastWeatherCondition = this.weatherConditions[forecastWeatherCodeKey]
            const {
                icon,
                description,
            } = forecastWeatherCondition

           return `
            <li class="weather__forecast-item">
                <time class="weather__forecast-date" datetime="${date}">${this.getFormattedDate(date, dateOptions)}</time>
                <img src="./assets/icons/${icon}" alt="${description}" class="weather__forecast-icon" width="32"
                     height="32">
                <span class="weather__forecast-temperature">${Math.round(temperature)} °C</span>
            </li>
           `
        }).join('')
    }

    async geocodeLocation(location) {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`)

        if (!response.ok) {
            throw new Error(`Failed to fetch coordinates ${response.status}`)
        }

        const locationData = await response.json()

        if (locationData.results?.length === 0) {
            throw new Error('Location not found')
        }

        return locationData.results[0]
    }

    async getWeatherData(location) {
        const { latitude, longitude } = location

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=auto&daily=weather_code,temperature_2m_max&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`)

        if (!response.ok) {
            throw new Error(`Failed to fetch weather data ${response.status}`)
        }

        return response.json()
    }

    setTextContent(element, value) {
        element.textContent = value
    }

    getFormattedDate(date, options = {}) {
        const parsedDate = new Date(date)

        return parsedDate.toLocaleString('en-US', options)
    }

    resetForm() {
        this.searchCityInputElement.value = ''
        this.searchCityInputElement.blur()
    }

    showError(errorMessage) {
        this.rootElement.classList.add(this.stateClasses.isLoad)
        this.errorElement.classList.add(this.stateClasses.isVisible)
        this.animationWrapperElement.classList.remove(this.stateClasses.isVisible)
        this.setTextContent(this.errorMessageElement, errorMessage)
    }

    hideError() {
        this.errorElement.classList.remove(this.stateClasses.isVisible)
        this.animationWrapperElement.classList.remove(this.stateClasses.isVisible)
        this.errorMessageElement.textContent = ''
    }

    onSearchCityFormSubmit = async (event) => {
        event.preventDefault()

        const locationName = this.searchCityInputElement.value.trim()

        if (!locationName) {
            return
        }

        try {
            const location = await this.geocodeLocation(locationName)

            const weather = await this.getWeatherData(location)

            this.hideError()
            this.updateUI(location, weather)
            this.resetForm()
        } catch (error) {
            console.error(error)

            if (error.message === "Location not found") {
                this.showError('Location not found. Please check enter.')

                return
            }

            this.showError('Something went wrong. Please try again later')
        }
    }

    bindEvents() {
        this.searchCityFormElement.addEventListener('submit', this.onSearchCityFormSubmit)
    }
}

new Weather()