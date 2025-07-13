const API_KEY = 'a8dbe838c502f29d0a5e4eaadb6472e3';

// DOM elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const weatherDisplay = document.getElementById('weatherDisplay');
const forecastDisplay = document.getElementById('forecastDisplay');
const errorDisplay = document.getElementById('error');
const recentCitiesDiv = document.getElementById('recentCities');
const cityDropdown = document.getElementById('cityDropdown');

let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

function updateRecentCitiesUI() {
  recentCitiesDiv.classList.toggle('hidden', recentCities.length === 0);
  cityDropdown.innerHTML = recentCities.map(city =>
    `<option value="${city}">${city}</option>`
  ).join('');
}

function addToRecentCities(city) {
  city = city.trim();
  if (!city || recentCities.includes(city)) return;
  recentCities.unshift(city);
  if (recentCities.length > 5) recentCities.pop();
  localStorage.setItem('recentCities', JSON.stringify(recentCities));
  updateRecentCitiesUI();
}

async function fetchWeather(city) {
  errorDisplay.classList.add('hidden');
  weatherDisplay.innerHTML = '';
  forecastDisplay.innerHTML = '';

  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

  try {
    const [wRes, fRes] = await Promise.all([fetch(weatherUrl), fetch(forecastUrl)]);

    if (!wRes.ok) throw new Error('Weather data error');
    if (!fRes.ok) throw new Error('Forecast data error');

    const weatherData = await wRes.json();
    const forecastData = await fRes.json();

    displayCurrentWeather(weatherData);
    displayForecast(forecastData);
    addToRecentCities(weatherData.name);

  } catch (err) {
    showError(err.message);
  }
}

async function fetchWeatherByCoords(lat, lon) {
  try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    const [wRes, fRes] = await Promise.all([fetch(weatherUrl), fetch(forecastUrl)]);
    if (!wRes.ok || !fRes.ok) throw new Error('Unable to fetch location-based weather.');

    const weatherData = await wRes.json();
    const forecastData = await fRes.json();

    displayCurrentWeather(weatherData);
    displayForecast(forecastData);
    addToRecentCities(weatherData.name);

  } catch (err) {
    showError(err.message);
  }
}

function displayCurrentWeather(d) {
  const iconUrl = `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`;
  weatherDisplay.innerHTML = `
    <h2 class="text-2xl font-semibold">${d.name}, ${d.sys.country}</h2>
    <img src="${iconUrl}" alt="${d.weather[0].description}" class="mx-auto"/>
    <p class="text-xl capitalize">${d.weather[0].description}</p>
    <p>Temp: <strong>${d.main.temp}°C</strong></p>
    <p>Humidity: <strong>${d.main.humidity}%</strong></p>
    <p>Wind: <strong>${d.wind.speed} m/s</strong></p>
  `;
}

function displayForecast(f) {
  const list = f.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 5);
  forecastDisplay.innerHTML = list.map(item => {
    const icon = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
    const dateStr = new Date(item.dt_txt).toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric'
    });
    return `
      <div class="bg-white bg-opacity-70 dark:bg-gray-800 dark:bg-opacity-60 p-4 rounded-lg text-center shadow">
        <p class="font-semibold text-blue-700 dark:text-blue-300 mb-2">${dateStr}</p>
        <img src="${icon}" class="w-12 h-12 mx-auto mb-2"/>
        <p class="text-lg font-bold text-gray-900 dark:text-white">${item.main.temp}°C</p>
        <p class="text-sm text-gray-800 dark:text-gray-300">Wind: ${item.wind.speed} m/s</p>
        <p class="text-sm text-gray-800 dark:text-gray-300">Humidity: ${item.main.humidity}%</p>
      </div>
    `;
  }).join('');
}

function showError(msg) {
  errorDisplay.textContent = msg;
  errorDisplay.classList.remove('hidden');
}

// Event listeners
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  city ? fetchWeather(city) : showError('Please enter a city name.');
});
cityInput.addEventListener('keydown', e => e.key === 'Enter' && searchBtn.click());
currentLocationBtn.addEventListener('click', () => {
  navigator.geolocation
    ? navigator.geolocation.getCurrentPosition(pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude), () => showError('Unable to retrieve your location.'))
    : showError('Geolocation not supported.');
});
cityDropdown.addEventListener('change', () => {
  cityInput.value = cityDropdown.value;
  fetchWeather(cityDropdown.value);
});

// Initialize
updateRecentCitiesUI();
