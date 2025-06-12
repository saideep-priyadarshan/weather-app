import WEATHER_API_KEY from "./apikey.js";

const backBtn = document.getElementById("back-btn");
const forecastContainer = document.getElementById("forecast-container");
const forecastCity = document.getElementById("forecast-city");
const errorMessage = document.getElementById("error-message");
const loading = document.getElementById("loading");

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const city = urlParams.get("city");

  if (city) {
    forecastCity.textContent = decodeURIComponent(city);
    fetchForecastData(city);
  } else {
    showError("No city specified");
  }

  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
});

async function fetchForecastData(city) {
  try {
    loading.classList.remove("hidden");
    errorMessage.classList.add("hidden");
    forecastContainer.classList.add("hidden");
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
        city
      )}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error("Error fetching forecast data");
    }
    const data = await response.json();
    displayForecastData(data);
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    showError(error.message);
  } finally {
    loading.classList.add("hidden");
  }
}

function displayForecastData(data) {
  forecastContainer.innerHTML = "";
  forecastCity.textContent = `${data.city.name}, ${data.city.country}`;
  const dailyForecasts = processDailyForecasts(data.list);

  dailyForecasts.forEach((day) => {
    const forecastCard = document.createElement("div");
    forecastCard.className = "forecast-card";
    const date = new Date(day.dt * 1000);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    forecastCard.innerHTML = `
            <div class="forecast-date">${dayName}<br>${formattedDate}</div>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${
              day.weather[0].icon
            }@2x.png" alt="${day.weather[0].description}">
            <div class="forecast-temp">${Math.round(day.main.temp)}°C</div>
            <div class="forecast-description">${
              day.weather[0].description
            }</div>
            <div class="forecast-details">
                <div class="forecast-detail">
                    <i class="fas fa-tint"></i>
                    <span>${day.main.humidity}%</span>
                </div>
                <div class="forecast-detail">
                    <i class="fas fa-wind"></i>
                    <span>${day.wind.speed} m/s</span>
                </div>
            </div>
        `;

    forecastContainer.appendChild(forecastCard);
  });
  forecastContainer.classList.remove("hidden");
}

function processDailyForecasts(forecastList) {
  const dailyForecasts = [];
  const daysMap = {};

  forecastList.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const day = date.toISOString().split("T")[0];

    if (!daysMap[day]) {
      daysMap[day] = [];
    }
    daysMap[day].push(item);
  });

  Object.keys(daysMap).forEach((day) => {
    const forecasts = daysMap[day];
    forecasts.sort((a, b) => {
      const timeA = new Date(a.dt * 1000).getHours();
      const timeB = new Date(b.dt * 1000).getHours();
      return Math.abs(timeA - 12) - Math.abs(timeB - 12);
    });
    dailyForecasts.push(forecasts[0]);
  });
  return dailyForecasts.slice(0, 5);
}

function showError(message) {
  errorMessage.querySelector("p").textContent =
    message || "An error occurred. Please try again.";
  errorMessage.classList.remove("hidden");
  forecastContainer.classList.add("hidden");
  loading.classList.add("hidden");
}
