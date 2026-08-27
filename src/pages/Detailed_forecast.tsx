import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa6";

type ForecastItem = {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: {
    id: number;
    description: string;
  }[];
  wind: {
    speed: number;
  };
  visibility: number;
  pop: number;
};

type WeatherData = {
  city: {
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
  };
  list: ForecastItem[];
  aqi: number;
};

const Detailed_forecast = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [iconIndex, setIconIndex] = useState(0);
  const { city } = useParams<{ city: string }>();

  const API_BASE_URL = "https://weather-app-za51.onrender.com";
  const loadingIcons = [
    "fa-solid fa-cloud-sun",
    "fa-solid fa-cloud-rain",
    "fa-solid fa-snowflake",
    "fa-solid fa-wind",
  ];

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setIconIndex((prevIndex) => (prevIndex + 1) % loadingIcons.length);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  useEffect(() => {
    const getWeather = async () => {
      setIsLoading(true);
      const url = `${API_BASE_URL}/forecast?city=${city}`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("City not found");
        }
        const data = await response.json();
        const aqi = await getAqi(data.city.coord.lat, data.city.coord.lon);
        setWeatherData({ ...data, aqi });
      } catch (error) {
        if (error instanceof Error) {
          alert(error.message);
        }
      } finally {
        setIsLoading(false);
      }
    };
    getWeather();
  }, [city]);

  const handleAqiColor = (aqiValue: number) => {
    if (aqiValue <= 1) return "#4ade80";
    if (aqiValue === 2) return "#facc15";
    if (aqiValue === 3) return "#fb923c";
    return "#ef4444";
  };

  const handleAQI = (value: number) => {
    const labels = ["Unknown", "Good", "Fair", "Moderate", "Poor", "Very Poor"];
    return labels[value] || "Good";
  };

  const getAqi = async (lat: number, lon: number) => {
    const url = `${API_BASE_URL}/api/AQI?lat=${lat}&lon=${lon}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.list[0].main.aqi;
    } catch (error) {
      return 1;
    }
  };

  if (isLoading) {
    return (
      <motion.div
        className="loading_screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <AnimatePresence>
          <motion.i
            key={loadingIcons[iconIndex]}
            className={loadingIcons[iconIndex]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            style={{ position: "absolute", fontSize: "3rem" }}
          ></motion.i>
        </AnimatePresence>
      </motion.div>
    );
  }

  if (weatherData) {
    const date = new Date(weatherData.list[0].dt * 1000);
    const day = date.toLocaleDateString("en-in", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });

    const processDailyData = () => {
      const dailyData: Record<string, number[]> = {};
      const dailyIcon: Record<string, number[]> = {};
      weatherData.list.forEach((i: ForecastItem) => {
        const dateStr = i.dt_txt.split(" ")[0];
        if (!dailyData[dateStr]) {
          dailyData[dateStr] = [];
          dailyIcon[dateStr] = [];
        }
        if (i.dt_txt.split(" ")[1] === "00:00:00" || dailyIcon[dateStr].length === 0) {
          dailyIcon[dateStr].push(i.weather[0].id);
        }
        dailyData[dateStr].push(i.main.temp);
      });
      return { dailyData, dailyIcon };
    };

    const { dailyData, dailyIcon } = processDailyData();

    const min_temp = (dateStr: string) => Math.min(...dailyData[dateStr]);
    const max_temp = (dateStr: string) => Math.max(...dailyData[dateStr]);
    const getDayName = (dateStr: string) => {
      const weekDay = new Date(dateStr);
      return weekDay.toLocaleDateString("en-us", { weekday: "long" });
    };

    const hourlyForecast: ForecastItem[] = weatherData.list.slice(1, 17);

    const getIcons = (conditionId: number) => {
      if (conditionId >= 200 && conditionId < 300) return "fa-solid fa-cloud-bolt";
      if (conditionId >= 300 && conditionId < 600) return "fa-solid fa-cloud-showers-heavy";
      if (conditionId >= 600 && conditionId < 700) return "fa-solid fa-snowflake";
      if (conditionId > 700 && conditionId < 800) return "fa-solid fa-smog";
      if (conditionId > 800 && conditionId < 805) return "fa-solid fa-cloud";
      if (conditionId === 800) return "fa-solid fa-circle";
      return "fa-solid fa-cloud";
    };

    return (
      <div className="forecast-detail-container">
        <div className="forecast-detail-header">
          <Link to="/" className="back-link">
            <FaArrowLeft /> Back to Dashboard
          </Link>
          <div className="forecast-detail-title">
            <h1>{weatherData.city.name}</h1>
            <p>{day}</p>
          </div>
        </div>

        <div className="forecast-hero-card">
          <div className="forecast-hero-text">
            <span className="forecast-hero-temp">
              {Math.round(hourlyForecast[0].main.temp)}°C
            </span>
            <p className="forecast-hero-desc">
              {weatherData.list[0].weather[0].description}
            </p>
            <div className="aqi-tag">
              AQI Status:{" "}
              <span style={{ color: handleAqiColor(weatherData.aqi), fontWeight: "bold" }}>
                {handleAQI(weatherData.aqi)}
              </span>
            </div>
          </div>
          <div className="forecast-hero-icon">
            <i className={getIcons(weatherData.list[0].weather[0].id)}></i>
          </div>
        </div>

        {/* Hourly Forecast */}
        <div className="forecast-section">
          <h3>Hourly Forecast</h3>
          <div className="hourly-forecast-row">
            {hourlyForecast.map((item) => (
              <div key={item.dt} className="hourly-forecast-card">
                <span className="hourly-time">
                  {item.dt_txt.split(" ")[1].substring(0, 5)}
                </span>
                <i className={`${getIcons(item.weather[0].id)} hourly-icon`}></i>
                <span className="hourly-temp">
                  {Math.round(item.main.temp)}°C
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Day Forecast */}
        <div className="forecast-section">
          <h3>5-Day Forecast</h3>
          <div className="multiday-list">
            {Object.keys(dailyData)
              .slice(1)
              .map((dateStr) => (
                <div key={dateStr} className="multiday-row">
                  <span className="multiday-day">{getDayName(dateStr)}</span>
                  <i className={`${getIcons(dailyIcon[dateStr]?.[0] || 800)} multiday-icon`}></i>
                  <span className="multiday-temps">
                    {Math.round(min_temp(dateStr))}° / {Math.round(max_temp(dateStr))}°
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Highlights Grid */}
        <div className="forecast-section">
          <h3>Today's Highlights</h3>
          <div className="highlights-grid">
            <div className="highlight-card">
              <p className="highlight-label">Feels Like</p>
              <p className="highlight-val">{Math.round(weatherData.list[0].main.feels_like)}°C</p>
            </div>
            <div className="highlight-card">
              <p className="highlight-label">Wind</p>
              <p className="highlight-val">{Math.round(weatherData.list[0].wind.speed * 3.6)} km/h</p>
            </div>
            <div className="highlight-card">
              <p className="highlight-label">Humidity</p>
              <p className="highlight-val">{weatherData.list[0].main.humidity}%</p>
            </div>
            <div className="highlight-card">
              <p className="highlight-label">Pressure</p>
              <p className="highlight-val">{weatherData.list[0].main.pressure} hpa</p>
            </div>
            <div className="highlight-card">
              <p className="highlight-label">Visibility</p>
              <p className="highlight-val">{(weatherData.list[0].visibility / 1000).toFixed(1)} km</p>
            </div>
            <div className="highlight-card">
              <p className="highlight-label">Precipitation</p>
              <p className="highlight-val">{Math.round(weatherData.list[0].pop * 100)}%</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Detailed_forecast;
