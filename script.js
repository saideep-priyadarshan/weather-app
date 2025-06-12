import { WEATHER_API_KEY, MAPS_API_KEY } from "./apikey.js";

const citySearchInput = document.getElementById("city-search");
const searchBtn = document.getElementById("search-btn");
const weatherResult = document.getElementById("weather-result");
const errorMessage = document.getElementById("error-message");
const loading = document.getElementById("loading");
const cityNameEl = document.getElementById("city-name");
const weatherIconEl = document.getElementById("weather-icon");
const temperatureEl = document.getElementById("temperature");
const weatherDescEl = document.getElementById("weather-description");
const humidityEl = document.getElementById("humidity");
const windSpeedEl = document.getElementById("wind-speed");
const forecastBtn = document.getElementById("forecast-btn");
let map;
let lastSearchedCity = "";

document.addEventListener("DOMContentLoaded", () => {
  const debounce = (func, delay) => {
    let debounceTimer;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  };

  citySearchInput.addEventListener(
    "input",
    debounce(function () {
      if (this.value.trim().length > 2) {
      }
    }, 300)
  );

  const throttle = (func, limit) => {
    let inThrottle;
    return function () {
      const context = this;
      const args = arguments;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  };

  searchBtn.addEventListener("click", throttle(searchWeather, 1000));

  citySearchInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      searchWeather();
    }
  });

  forecastBtn.addEventListener("click", () => {
    if (lastSearchedCity) {
      window.location.href = `forecast.html?city=${encodeURIComponent(
        lastSearchedCity
      )}`;
    }
  });
});

function searchWeather() {
  const city = citySearchInput.value.trim();

  if (!city) {
    showError("Please enter a city name");
    return;
  }

  loading.classList.remove("hidden");
  weatherResult.classList.add("hidden");
  errorMessage.classList.add("hidden");
  fetchWeatherData(city);
}

async function fetchWeatherData(city) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error("City not found or error fetching data");
    }

    const data = await response.json();
    displayWeatherData(data);
    lastSearchedCity = city;
    loadGoogleMapsScript(data.coord.lat, data.coord.lon);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    showError(error.message);
  } finally {
    loading.classList.add("hidden");
  }
}

function displayWeatherData(data) {
  cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
  const iconCode = data.weather[0].icon;
  weatherIconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  weatherIconEl.alt = data.weather[0].description;
  temperatureEl.textContent = `${Math.round(data.main.temp)}°C`;
  weatherDescEl.textContent = data.weather[0].description;
  humidityEl.textContent = `Humidity: ${data.main.humidity}%`;
  windSpeedEl.textContent = `Wind: ${data.wind.speed} m/s`;
  weatherResult.classList.remove("hidden");
}

function loadGoogleMapsScript(lat, lon) {
  if (window.google && window.google.maps) {
    initMap(lat, lon);
    return;
  }

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&callback=initMapCallback`;
  script.async = true;
  script.defer = true;

  window.initMapCallback = function () {
    initMap(lat, lon);
  };
  document.body.appendChild(script);
}

function initMap(lat, lon) {
  const mapElement = document.getElementById("map");
  const position = { lat, lng: lon };

  map = new google.maps.Map(mapElement, {
    center: position,
    zoom: 12,
    styles: [
      {
        featureType: "all",
        elementType: "labels.text.fill",
        stylers: [{ color: "#7c93a3" }],
      },
      {
        featureType: "administrative",
        elementType: "geometry.fill",
        stylers: [{ visibility: "on" }],
      },
    ],
  });

  new google.maps.Marker({
    position: position,
    map: map,
    title: cityNameEl.textContent,
  });
}

function showError(message) {
  errorMessage.querySelector("p").textContent =
    message || "An error occurred. Please try again.";
  errorMessage.classList.remove("hidden");
  weatherResult.classList.add("hidden");
  loading.classList.add("hidden");
}
