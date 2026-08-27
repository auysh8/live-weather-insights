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
  FaSmog,
  FaRightFromBracket,
  FaXmark,
  FaDroplet
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
  wind: {
    speed: number;
  };
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

  // Active UI States
  const [activeTab, setActiveTab] = useState<"dashboard" | "saved" | "settings">("dashboard");
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSavedLocationsModal, setShowSavedLocationsModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [slotMetric, setSlotMetric] = useState<"temp" | "wind" | "humidity">("temp");

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
  const handleCurrentLocationSearch = () => {
    if (navigator.geolocation) {
      setAppIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const long = pos.coords.longitude;
          getCityName(lat, long);
        },
        () => {
          toast.info("Could not retrieve exact location. Falling back to default.");
          getWeather("London");
        }
      );
    } else {
      getWeather("London");
    }
  };

  useEffect(() => {
    handleCurrentLocationSearch();
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

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setShowUserMenu(false);
    setBookmarks([]);
    setBookmarkDataList([]);
    toast.info("Logged out successfully");
  };

  const formatTemp = (celsiusTemp: number) => {
    if (unit === "F") {
      const fahrenheit = Math.round((celsiusTemp * 9) / 5 + 32);
      return `${fahrenheit}°F`;
    }
    return `${Math.round(celsiusTemp)}°C`;
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

  // Extract temperature / metric curve slots (Morning, Afternoon, Evening, Night)
  const getDailyTimeSlots = () => {
    if (!forecastList || forecastList.length === 0) {
      const baseTemp = weatherData ? weatherData.main.temp : 20;
      const baseWind = weatherData ? weatherData.wind.speed : 5;
      const baseHum = weatherData ? weatherData.main.humidity : 60;

      if (slotMetric === "wind") {
        return [
          { label: "Morning", val: `${Math.round(baseWind)} m/s`, icon: <FaWind /> },
          { label: "Afternoon", val: `${Math.round(baseWind + 2)} m/s`, icon: <FaWind />, active: true },
          { label: "Evening", val: `${Math.round(baseWind + 1)} m/s`, icon: <FaWind /> },
          { label: "Night", val: `${Math.round(baseWind - 1)} m/s`, icon: <FaWind /> },
        ];
      }

      if (slotMetric === "humidity") {
        return [
          { label: "Morning", val: `${baseHum}%`, icon: <FaDroplet /> },
          { label: "Afternoon", val: `${Math.max(10, baseHum - 10)}%`, icon: <FaDroplet />, active: true },
          { label: "Evening", val: `${baseHum + 5}%`, icon: <FaDroplet /> },
          { label: "Night", val: `${baseHum + 10}%`, icon: <FaDroplet /> },
        ];
      }

      return [
        { label: "Morning", val: formatTemp(baseTemp - 2), icon: <FaCloudSun /> },
        { label: "Afternoon", val: formatTemp(baseTemp + 4), icon: <FaSun />, active: true },
        { label: "Evening", val: formatTemp(baseTemp + 1), icon: <FaCloudSun /> },
        { label: "Night", val: formatTemp(baseTemp - 4), icon: <FaCloud /> },
      ];
    }

    // Pick 4 forecast items across the day
    const morning = forecastList[1] || forecastList[0];
    const afternoon = forecastList[3] || forecastList[0];
    const evening = forecastList[5] || forecastList[0];
    const night = forecastList[7] || forecastList[0];

    if (slotMetric === "wind") {
      return [
        { label: "Morning", val: `${Math.round(morning.wind.speed)} m/s`, icon: <FaWind /> },
        { label: "Afternoon", val: `${Math.round(afternoon.wind.speed)} m/s`, icon: <FaWind />, active: true },
        { label: "Evening", val: `${Math.round(evening.wind.speed)} m/s`, icon: <FaWind /> },
        { label: "Night", val: `${Math.round(night.wind.speed)} m/s`, icon: <FaWind /> },
      ];
    }

    if (slotMetric === "humidity") {
      return [
        { label: "Morning", val: `${morning.main.humidity}%`, icon: <FaDroplet /> },
        { label: "Afternoon", val: `${afternoon.main.humidity}%`, icon: <FaDroplet />, active: true },
        { label: "Evening", val: `${evening.main.humidity}%`, icon: <FaDroplet /> },
        { label: "Night", val: `${night.main.humidity}%`, icon: <FaDroplet /> },
      ];
    }

    return [
      { label: "Morning", val: formatTemp(morning.main.temp), icon: getWeatherIcon(morning.weather[0].id) },
      { label: "Afternoon", val: formatTemp(afternoon.main.temp), icon: getWeatherIcon(afternoon.weather[0].id), active: true },
      { label: "Evening", val: formatTemp(evening.main.temp), icon: getWeatherIcon(evening.weather[0].id) },
      { label: "Night", val: formatTemp(night.main.temp), icon: getWeatherIcon(night.weather[0].id) },
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
        const minTemp = Math.min(...dayObj.temps);
        const maxTemp = Math.max(...dayObj.temps);
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
        <div className="sidebar-logo cursor-pointer" onClick={() => { setActiveTab("dashboard"); setShowSavedLocationsModal(false); setShowSettingsModal(false); }}>
          <div className="sidebar-logo-icon">
            <FaCloudSun />
          </div>
          <span>NGIJIK</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            title="Dashboard"
            onClick={() => {
              setActiveTab("dashboard");
              setShowSavedLocationsModal(false);
              setShowSettingsModal(false);
            }}
          >
            <FaBookmark />
          </button>
          <button
            className={`nav-item ${activeTab === "saved" ? "active" : ""}`}
            title="Saved Locations"
            onClick={() => {
              setActiveTab("saved");
              setShowSavedLocationsModal(true);
            }}
          >
            <FaCompass />
          </button>
          <button
            className="nav-item"
            title="Locate Me"
            onClick={handleCurrentLocationSearch}
          >
            <FaLocationDot />
          </button>
          <button
            className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
            title="Settings"
            onClick={() => {
              setActiveTab("settings");
              setShowSettingsModal(true);
            }}
          >
            <FaGear />
          </button>
        </nav>

        <div className="sidebar-footer relative">
          <button
            className="nav-item"
            onClick={() => {
              if (token) {
                setShowUserMenu(!showUserMenu);
              } else {
                onClick();
              }
            }}
            title="Account"
          >
            <i className="fa-solid fa-user"></i>
          </button>

          {/* User Popover */}
          <AnimatePresence>
            {showUserMenu && token && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute left-16 bottom-0 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-50"
              >
                <div className="text-sm font-bold text-slate-800 mb-1">Jack Grealish</div>
                <div className="text-xs text-slate-400 mb-3">jack@example.com</div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 text-red-500 hover:bg-red-50 p-2 rounded-lg text-xs font-semibold"
                >
                  <FaRightFromBracket /> Log Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Dashboard Workspace */}
      <main className="dashboard-main">
        {/* Header Bar */}
        <header className="dashboard-header">
          <div className="user-greeting">
            <div className="avatar-container cursor-pointer" onClick={() => !token && onClick()}>
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
            <button
              className="header-icon-btn"
              onClick={() => setShowNotificationModal(true)}
              title="Notifications"
            >
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
                  <div className="temp-val">{formatTemp(weatherData.main.temp)}</div>
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
              {/* Daily Temperature / Metrics Curve */}
              <div className="temp-curve-card">
                <div className="card-title-bar">
                  <h3>
                    {slotMetric === "temp" && "How's the temperature today?"}
                    {slotMetric === "wind" && "How's the wind speed today?"}
                    {slotMetric === "humidity" && "How's the humidity level today?"}
                  </h3>
                  <div className="temp-dots-nav">
                    <button
                      className={`temp-dot-btn ${slotMetric === "temp" ? "active" : ""}`}
                      onClick={() => setSlotMetric("temp")}
                      title="Temperature"
                    >
                      <FaSun />
                    </button>
                    <button
                      className={`temp-dot-btn ${slotMetric === "wind" ? "active" : ""}`}
                      onClick={() => setSlotMetric("wind")}
                      title="Wind Speed"
                    >
                      <FaWind />
                    </button>
                    <button
                      className={`temp-dot-btn ${slotMetric === "humidity" ? "active" : ""}`}
                      onClick={() => setSlotMetric("humidity")}
                      title="Humidity"
                    >
                      <FaDroplet />
                    </button>
                  </div>
                </div>

                <div className="temp-time-slots">
                  {dailySlots.map((slot, idx) => (
                    <div className="time-slot" key={idx}>
                      <div className={`time-slot-icon ${slot.active ? "highlight" : ""}`}>
                        {slot.icon}
                      </div>
                      <span className="time-slot-temp">{slot.val}</span>
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
                    {tomorrowData ? formatTemp(tomorrowData.main.temp) : formatTemp(weatherData.main.temp - 2)}
                  </div>
                  <div className="condition">
                    {tomorrowData ? tomorrowData.weather[0].main : "Rainy & Breezy"}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Saved Locations Modal / Drawer */}
        <AnimatePresence>
          {showSavedLocationsModal && (
            <motion.div
              className="mt-6 bg-white rounded-2xl p-5 shadow-lg border border-slate-100 relative"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg text-slate-800">Saved Locations</h4>
                <button
                  onClick={() => setShowSavedLocationsModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <FaXmark />
                </button>
              </div>

              {bookmarkDataList.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  No saved locations yet. Click the bookmark icon in the top header to save a city!
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {bookmarkDataList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 hover:bg-orange-50 border border-slate-100 rounded-xl flex justify-between items-center cursor-pointer transition-colors"
                      onClick={() => {
                        getWeather(item.name);
                        setShowSavedLocationsModal(false);
                      }}
                    >
                      <div>
                        <span className="font-bold text-slate-800 block text-sm">{item.name}</span>
                        <p className="text-xs text-slate-500 capitalize">{item.weather[0].description}</p>
                      </div>
                      <span className="text-lg font-bold text-orange-500">{formatTemp(item.main.temp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettingsModal && (
            <motion.div
              className="mt-6 bg-white rounded-2xl p-5 shadow-lg border border-slate-100 relative"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg text-slate-800">Settings</h4>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <FaXmark />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">Temperature Unit</div>
                  <div className="text-xs text-slate-400">Switch between Celsius (°C) and Fahrenheit (°F)</div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      unit === "C" ? "bg-white text-orange-500 shadow-sm" : "text-slate-500"
                    }`}
                    onClick={() => setUnit("C")}
                  >
                    °C
                  </button>
                  <button
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      unit === "F" ? "bg-white text-orange-500 shadow-sm" : "text-slate-500"
                    }`}
                    onClick={() => setUnit("F")}
                  >
                    °F
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications Modal */}
        <AnimatePresence>
          {showNotificationModal && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl border border-slate-100"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <FaBell className="text-orange-500" />
                    <h4 className="font-bold text-lg text-slate-800">Weather Alerts</h4>
                  </div>
                  <button
                    onClick={() => setShowNotificationModal(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <FaXmark />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-xs font-semibold text-orange-800">
                      Clear Sky Expected Today in {weatherData?.name || "your area"}
                    </p>
                    <p className="text-[11px] text-orange-600 mt-1">
                      No heavy precipitation predicted for the next 24 hours. Great day for outdoor activities!
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold text-slate-800">
                      Air Quality Alert: {getAqiLabel(weatherData?.aqi)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Air Quality Index is currently sitting at standard baseline levels.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
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
              <div className="panel-current-temp">{formatTemp(weatherData.main.temp)}</div>
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
                      <div className="pred-temp">
                        {formatTemp(item.maxTemp)} / {formatTemp(item.minTemp)}
                      </div>
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
