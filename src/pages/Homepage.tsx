import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Search_bar from "../components/Search_bar";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaCompass,
  FaLocationDot,
  FaBookmark,
  FaRegBookmark,
  FaGear,
  FaBell,
  FaWind,
  FaSun,
  FaCloudSun,
  FaCloudRain,
  FaSnowflake,
  FaCloud,
  FaBolt,
  FaSmog
} from "react-icons/fa6";

type WeatherData = {
  id: number;
  name: string;
  coord?: {
    lat: number;
    lon: number;
  };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    temp_min: number;
    temp_max: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  sys: {
    country: string;
    sunrise?: number;
    sunset?: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  visibility: number;
  aqi?: number;
};

type ForecastItem = {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
    humidity: number;
  };
  weather: {
    id: number;
    description: string;
    main: string;
  }[];
};

interface HomepageProps {
  onClick: () => void;
}

const Homepage = ({ onClick }: HomepageProps) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastList, setForecastList] = useState<ForecastItem[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookmarkDataList, setBookmarkDataList] = useState<WeatherData[]>([]);
  const [appIsLoading, setAppIsLoading] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState(false);

  const API_BASE_URL = "https://weather-app-za51.onrender.com";
  const token = localStorage.getItem("authToken");

  const loadingIcons = [
    "fa-solid fa-cloud-sun",
    "fa-solid fa-cloud-rain",
    "fa-solid fa-snowflake",
    "fa-solid fa-wind",
  ];

  useEffect(() => {
    if (appIsLoading) {
      const interval = setInterval(() => {
        setIconIndex((prevIndex) => (prevIndex + 1) % loadingIcons.length);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [appIsLoading]);

  // Fetch user bookmarks
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!token) return;
      const url = `${API_BASE_URL}/api/bookmarks`;
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const cityNames = data.map((item: any) => item.city);
          setBookmarks(cityNames);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchBookmarks();
  }, [token]);

  // Fetch weather for bookmarks
  useEffect(() => {
    const fetchBookmarkData = async () => {
      if (bookmarks.length === 0) {
        setBookmarkDataList([]);
        return;
      }

      const promises = bookmarks.map(async (city: string) => {
        const url = `${API_BASE_URL}/weather?city=${city}`;
        try {
          const response = await fetch(url);
          if (!response.ok) return null;

          const data = await response.json();
          const aqi = await getAqi(data.coord.lat, data.coord.lon);
          return { ...data, aqi };
        } catch (error) {
          console.error(error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validResults = results.filter((data) => data !== null) as WeatherData[];
      validResults.sort((a, b) => a.name.localeCompare(b.name));
      setBookmarkDataList(validResults);
    };

    fetchBookmarkData();
  }, [bookmarks]);

  // Geolocation setup
  useEffect(() => {
    const onSuccess = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const long = pos.coords.longitude;
      getCityName(lat, long);
    };

    const onFailure = () => {
      getWeather("London");
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(onSuccess, onFailure);
    } else {
      getWeather("London");
    }
  }, []);

  const getCityName = async (lat: number, long: number) => {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${long}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      getWeather(data.city || "London");
    } catch (error) {
      getWeather("London");
    }
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

  const getWeather = async (city: string) => {
    setAppIsLoading(true);
    const url = `${API_BASE_URL}/weather?city=${city}`;
    const forecastUrl = `${API_BASE_URL}/forecast?city=${city}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("City not found");
      }
      const data = await response.json();
      const aqi = await getAqi(data.coord.lat, data.coord.lon);
      setWeatherData({ ...data, aqi });

      // Fetch forecast
      const fResponse = await fetch(forecastUrl);
      if (fResponse.ok) {
        const fData = await fResponse.json();
        setForecastList(fData.list || []);
      }
    } catch (error: any) {
      toast.error("City not found or server error.");
    } finally {
      setAppIsLoading(false);
    }
  };

  const handleBookmark = async (city: string) => {
    if (!token) {
      onClick();
      return;
    }

    const isBookmarked = bookmarks.includes(city);
    try {
      if (isBookmarked) {
        const response = await fetch(`${API_BASE_URL}/api/bookmarks/${city}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          setBookmarks((prev) => prev.filter((c) => c !== city));
          setBookmarkDataList((prev) => prev.filter((item) => item.name !== city));
          toast.info("Bookmark removed");
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ city: city }),
        });
        if (response.ok) {
          setBookmarks((prev) => [...prev, city]);
          toast.success("Bookmark added!");
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getWeatherIcon = (conditionId: number) => {
    if (conditionId >= 200 && conditionId < 300) return <FaBolt className="text-amber-500" />;
    if (conditionId >= 300 && conditionId < 600) return <FaCloudRain className="text-blue-500" />;
    if (conditionId >= 600 && conditionId < 700) return <FaSnowflake className="text-cyan-400" />;
    if (conditionId > 700 && conditionId < 800) return <FaSmog className="text-gray-400" />;
    if (conditionId === 800) return <FaSun className="text-amber-500" />;
    return <FaCloudSun className="text-amber-400" />;
  };

  const getAqiLabel = (aqiValue?: number) => {
    switch (aqiValue) {
      case 1:
        return "Good";
      case 2:
        return "Fair";
      case 3:
        return "Moderate";
      case 4:
        return "Poor";
      case 5:
        return "Hazardous";
      default:
        return "Standard";
    }
  };

  const getAqiWidth = (aqiValue?: number) => {
    switch (aqiValue) {
      case 1:
        return "20%";
      case 2:
        return "40%";
      case 3:
        return "60%";
      case 4:
        return "80%";
      case 5:
        return "100%";
      default:
        return "50%";
    }
  };

  // Format sunrise / sunset times
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "06:00 am";
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  // Extract temperature curve slots (Morning, Afternoon, Evening, Night)
  const getDailyTimeSlots = () => {
    if (!forecastList || forecastList.length === 0) {
      const baseTemp = weatherData ? Math.round(weatherData.main.temp) : 20;
      return [
        { label: "Morning", temp: baseTemp - 2, icon: <FaCloudSun /> },
        { label: "Afternoon", temp: baseTemp + 4, icon: <FaSun />, active: true },
        { label: "Evening", temp: baseTemp + 1, icon: <FaCloudSun /> },
        { label: "Night", temp: baseTemp - 4, icon: <FaCloud /> },
      ];
    }

    // Pick 4 forecast items across the day
    const morning = forecastList[1] || forecastList[0];
    const afternoon = forecastList[3] || forecastList[0];
    const evening = forecastList[5] || forecastList[0];
    const night = forecastList[7] || forecastList[0];

    return [
      { label: "Morning", temp: Math.round(morning.main.temp), icon: getWeatherIcon(morning.weather[0].id) },
      { label: "Afternoon", temp: Math.round(afternoon.main.temp), icon: getWeatherIcon(afternoon.weather[0].id), active: true },
      { label: "Evening", temp: Math.round(evening.main.temp), icon: getWeatherIcon(evening.weather[0].id) },
      { label: "Night", temp: Math.round(night.main.temp), icon: getWeatherIcon(night.weather[0].id) },
    ];
  };

  // Extract 5-day forecast
  const getFiveDayForecast = () => {
    if (!forecastList || forecastList.length === 0) return [];

    const dailyMap: { [key: string]: { temps: number[]; weather: any; date: string } } = {};

    forecastList.forEach((item) => {
      const dateStr = item.dt_txt.split(" ")[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = {
          temps: [],
          weather: item.weather[0],
          date: new Date(item.dt * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        };
      }
      dailyMap[dateStr].temps.push(item.main.temp);
    });

    return Object.keys(dailyMap)
      .slice(1, 6)
      .map((key) => {
        const dayObj = dailyMap[key];
        const minTemp = Math.round(Math.min(...dayObj.temps));
        const maxTemp = Math.round(Math.max(...dayObj.temps));
        return {
          date: dayObj.date,
          condition: dayObj.weather.main,
          minTemp,
          maxTemp,
          weatherId: dayObj.weather.id,
        };
      });
  };

  if (appIsLoading) {
    return (
      <div className="loading_screen">
        <i className={`${loadingIcons[iconIndex]} text-4xl animate-bounce`}></i>
      </div>
    );
  }

  const dailySlots = getDailyTimeSlots();
  const fiveDayPrediction = getFiveDayForecast();
  const tomorrowData = forecastList.length >= 8 ? forecastList[8] : null;

  return (
    <div className="app-container">
      {/* Left Navigation Rail */}
      <aside className="sidebar-rail">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <FaCloudSun />
          </div>
          <span>NGIJIK</span>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active" title="Dashboard">
            <FaBookmark />
          </button>
          <button className="nav-item" title="Compass / Discover" onClick={() => setShowBookmarksDrawer(!showBookmarksDrawer)}>
            <FaCompass />
          </button>
          <button className="nav-item" title="Locations">
            <FaLocationDot />
          </button>
          <button className="nav-item" title="Settings">
            <FaGear />
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={onClick} title="Account">
            <i className="fa-solid fa-user"></i>
          </button>
        </div>
      </aside>

      {/* Main Dashboard Workspace */}
      <main className="dashboard-main">
        {/* Header Bar */}
        <header className="dashboard-header">
          <div className="user-greeting">
            <div className="avatar-container">
              <span>👤</span>
            </div>
            <div className="greeting-text">
              <p>Hello,</p>
              <h2>{token ? "Jack Grealish" : "Guest Explorer"}</h2>
            </div>
          </div>

          <Search_bar onSearch={getWeather} />

          <div className="header-actions">
            <button
              className="header-icon-btn"
              onClick={() => handleBookmark(weatherData?.name || "")}
              title="Bookmark current location"
            >
              {weatherData && bookmarks.includes(weatherData.name) ? (
                <FaBookmark className="text-orange-500" />
              ) : (
                <FaRegBookmark />
              )}
            </button>
            <button className="header-icon-btn" title="Notifications">
              <FaBell />
            </button>
          </div>
        </header>

        {/* Dashboard Grid Content */}
        {weatherData && (
          <>
            <div className="dashboard-grid">
              {/* Weather Hero Card */}
              <div className="weather-hero-card">
                <div className="weather-hero-header">
                  <div className="weather-hero-title">
                    <h3>Weather</h3>
                    <p>What's the weather today?</p>
                  </div>
                </div>

                <div className="weather-hero-temp">
                  <div className="temp-val">{Math.round(weatherData.main.temp)}°C</div>
                  <div className="weather-desc">{weatherData.weather[0].description}</div>
                </div>

                <div className="weather-hero-badges">
                  <div className="hero-badge">
                    <span className="badge-label">Pressure</span>
                    <span className="badge-value">{weatherData.main.pressure}mb</span>
                  </div>
                  <div className="hero-badge highlight-green">
                    <span className="badge-label">Visibility</span>
                    <span className="badge-value">{(weatherData.visibility / 1000).toFixed(1)} km</span>
                  </div>
                  <div className="hero-badge highlight-blue">
                    <span className="badge-label">Humidity</span>
                    <span className="badge-value">{weatherData.main.humidity}%</span>
                  </div>
                </div>
              </div>

              {/* Air Quality Hero Card */}
              <div className="air-quality-card">
                <div className="aqi-header">
                  <h3>Air Quality</h3>
                  <p>Main pollution : PM 2.5</p>
                </div>

                <div className="aqi-value-container">
                  <span className="aqi-number">{weatherData.aqi ? weatherData.aqi * 78 : 390}</span>
                  <span className="aqi-status-pill">{getAqiLabel(weatherData.aqi).toUpperCase()}</span>
                </div>

                <div className="aqi-wind-info">
                  <FaWind className="inline mr-2" />
                  <span>Wind Speed: {weatherData.wind.speed} m/s</span>
                </div>

                <div className="aqi-slider-box">
                  <div className="aqi-labels">
                    <span>Good</span>
                    <span className="font-bold text-slate-800">{getAqiLabel(weatherData.aqi)}</span>
                    <span>Hazardous</span>
                  </div>
                  <div className="aqi-progress-bar">
                    <div className="aqi-progress-fill" style={{ width: getAqiWidth(weatherData.aqi) }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row Grid */}
            <div className="dashboard-bottom-grid">
              {/* Daily Temperature Curve */}
              <div className="temp-curve-card">
                <div className="card-title-bar">
                  <h3>How's the temperature today?</h3>
                  <div className="temp-dots-nav">
                    <button className="temp-dot-btn active"><FaSun /></button>
                    <button className="temp-dot-btn"><FaCloudSun /></button>
                    <button className="temp-dot-btn"><FaWind /></button>
                  </div>
                </div>

                <div className="temp-time-slots">
                  {dailySlots.map((slot, idx) => (
                    <div className="time-slot" key={idx}>
                      <div className={`time-slot-icon ${slot.active ? "highlight" : ""}`}>
                        {slot.icon}
                      </div>
                      <span className="time-slot-temp">{slot.temp}°</span>
                      <span className="time-slot-label">{slot.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tomorrow Overview Card */}
              <div className="tomorrow-card">
                <div>
                  <span className="tag">Tomorrow</span>
                  <h3>{weatherData.name}</h3>
                </div>

                <div className="tomorrow-temp">
                  <div className="val">
                    {tomorrowData ? `${Math.round(tomorrowData.main.temp)}°C` : `${Math.round(weatherData.main.temp - 2)}°C`}
                  </div>
                  <div className="condition">
                    {tomorrowData ? tomorrowData.weather[0].main : "Rainy & Breezy"}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Bookmarks Overlay Drawer if triggered */}
        <AnimatePresence>
          {showBookmarksDrawer && (
            <motion.div
              className="mt-6 bg-white rounded-2xl p-4 shadow-md"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h4 className="font-bold text-lg mb-3">Saved Locations</h4>
              {bookmarkDataList.length === 0 ? (
                <p className="text-sm text-gray-500">No bookmarks added yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {bookmarkDataList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 rounded-xl flex justify-between items-center cursor-pointer hover:bg-orange-50"
                      onClick={() => getWeather(item.name)}
                    >
                      <div>
                        <span className="font-bold text-slate-800">{item.name}</span>
                        <p className="text-xs text-gray-500">{item.weather[0].description}</p>
                      </div>
                      <span className="text-xl font-bold text-orange-500">{Math.round(item.main.temp)}°C</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Right Side Weather Details Panel */}
      <aside className="dashboard-right-panel">
        {weatherData && (
          <>
            <div className="panel-header">
              <div className="location-info">
                <h2>Sun</h2>
                <p>
                  <FaLocationDot className="text-orange-500" />
                  {weatherData.name}, {weatherData.sys.country}
                </p>
              </div>
              <div className="panel-current-temp">{Math.round(weatherData.main.temp)}°C</div>
            </div>

            {/* Sun Position Arc */}
            <div className="sun-tracker-card">
              <div className="sun-arc-container">
                <svg className="sun-arc-svg" viewBox="0 0 180 90">
                  <path
                    d="M 10 80 A 80 80 0 0 1 170 80"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="3"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M 10 80 A 80 80 0 0 1 120 20"
                    fill="none"
                    stroke="#FF7A00"
                    strokeWidth="3"
                  />
                  <circle cx="120" cy="20" r="7" fill="#FF7A00" />
                </svg>
              </div>
              <div className="sun-times">
                <span>
                  Sunset
                  <strong>{formatTime(weatherData.sys.sunset)}</strong>
                </span>
                <span className="text-right">
                  Sunrise
                  <strong>{formatTime(weatherData.sys.sunrise)}</strong>
                </span>
              </div>
            </div>

            {/* UVI Card */}
            <div className="uvi-card">
              <div className="uvi-header">
                <FaSun className="uvi-header-icon" />
                <span className="uvi-val-text">20 UVI</span>
                <span className="uvi-badge">Moderate</span>
              </div>
              <p className="uvi-desc">Moderate risk of harm from unprotected sun exposure.</p>
            </div>

            {/* Weather Prediction List */}
            <div className="prediction-section">
              <h4 className="prediction-title">Weather Prediction</h4>
              <div className="prediction-list">
                {fiveDayPrediction.length > 0 ? (
                  fiveDayPrediction.map((item, idx) => (
                    <div className="prediction-item" key={idx}>
                      <div className="pred-date-info">
                        <div className="pred-icon">{getWeatherIcon(item.weatherId)}</div>
                        <div className="pred-date-text">
                          <h5>{item.date}</h5>
                          <p>{item.condition}</p>
                        </div>
                      </div>
                      <div className="pred-temp">{item.maxTemp}° / {item.minTemp}°</div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="prediction-item">
                      <div className="pred-date-info">
                        <FaCloud className="pred-icon text-blue-400" />
                        <div className="pred-date-text">
                          <h5>November 10</h5>
                          <p>Cloudy</p>
                        </div>
                      </div>
                      <div className="pred-temp">26° / 19°</div>
                    </div>
                    <div className="prediction-item">
                      <div className="pred-date-info">
                        <FaSun className="pred-icon text-amber-500" />
                        <div className="pred-date-text">
                          <h5>November 11</h5>
                          <p>Bright</p>
                        </div>
                      </div>
                      <div className="pred-temp">26° / 20°</div>
                    </div>
                  </>
                )}
              </div>

              <Link to={`/forecast/${weatherData.name}`}>
                <button className="next-days-btn">Next 5 Days Detailed Forecast</button>
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
};

export default Homepage;
