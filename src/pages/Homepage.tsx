import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Search_bar from "../components/Search_bar";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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
  FaDroplet,
  FaTrash,
  FaSliders,
  FaRotateRight,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa6";

type WeatherData = {
  id: number;
  name: string;
  timezone?: number;
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

// Typed Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 15 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

const Homepage = ({ onClick }: HomepageProps) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastList, setForecastList] = useState<ForecastItem[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookmarkDataList, setBookmarkDataList] = useState<WeatherData[]>([]);
  const [appIsLoading, setAppIsLoading] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);

  // Active View Tab State: 'dashboard' | 'saved' | 'locations' | 'settings'
  const [activeTab, setActiveTab] = useState<"dashboard" | "saved" | "locations" | "settings">("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [windUnit, setWindUnit] = useState<"ms" | "kmh">("ms");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
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
          toast.info("Could not retrieve exact location. Falling back to London.");
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

  const formatWind = (msSpeed: number) => {
    if (windUnit === "kmh") {
      return `${Math.round(msSpeed * 3.6)} km/h`;
    }
    return `${msSpeed.toFixed(1)} m/s`;
  };

  const getWeatherIcon = (conditionId: number) => {
    if (conditionId >= 200 && conditionId < 300) return <FaBolt className="icon-amber" />;
    if (conditionId >= 300 && conditionId < 600) return <FaCloudRain className="icon-blue" />;
    if (conditionId >= 600 && conditionId < 700) return <FaSnowflake className="icon-cyan" />;
    if (conditionId > 700 && conditionId < 800) return <FaSmog className="icon-gray" />;
    if (conditionId === 800) return <FaSun className="icon-amber" />;
    return <FaCloudSun className="icon-amber" />;
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

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "06:00 am";
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const getUviData = (weather: WeatherData) => {
    const temp = weather.main.temp;
    const isClear = weather.weather[0].main.toLowerCase().includes("clear");
    const uvi = Math.max(1, Math.min(12, Math.round((temp / 4) * (isClear ? 1.4 : 0.7))));
    let label = "Low";
    let desc = "Minimal risk from sun exposure.";
    if (uvi >= 3 && uvi <= 5) {
      label = "Moderate";
      desc = "Moderate risk of harm from unprotected sun exposure.";
    } else if (uvi >= 6 && uvi <= 7) {
      label = "High";
      desc = "High risk of harm from unprotected exposure. Wear sunscreen!";
    } else if (uvi >= 8) {
      label = "Very High";
      desc = "Very high risk of harm. Take extra precautions!";
    }
    return { uvi, label, desc };
  };

  const getAqiValue = (aqiNum?: number) => {
    if (!aqiNum) return 42;
    switch (aqiNum) {
      case 1: return 35;
      case 2: return 75;
      case 3: return 125;
      case 4: return 175;
      case 5: return 240;
      default: return 42;
    }
  };

  const getDailyTimeSlots = () => {
    let currentHour = new Date().getHours();
    if (weatherData && typeof weatherData.timezone === "number") {
      const utcMs = Date.now() + new Date().getTimezoneOffset() * 60000;
      const cityTime = new Date(utcMs + weatherData.timezone * 1000);
      currentHour = cityTime.getHours();
    }

    let activeSlotName = "Afternoon";
    if (currentHour >= 5 && currentHour < 12) activeSlotName = "Morning";
    else if (currentHour >= 12 && currentHour < 17) activeSlotName = "Afternoon";
    else if (currentHour >= 17 && currentHour < 21) activeSlotName = "Evening";
    else activeSlotName = "Night";

    if (!forecastList || forecastList.length === 0) {
      const baseTemp = weatherData ? weatherData.main.temp : 20;
      const baseWind = weatherData ? weatherData.wind.speed : 5;
      const baseHum = weatherData ? weatherData.main.humidity : 60;

      if (slotMetric === "wind") {
        return [
          { label: "Morning", val: formatWind(baseWind), icon: <FaWind />, active: activeSlotName === "Morning" },
          { label: "Afternoon", val: formatWind(Math.max(0, baseWind + 1.5)), icon: <FaWind />, active: activeSlotName === "Afternoon" },
          { label: "Evening", val: formatWind(Math.max(0, baseWind + 0.5)), icon: <FaWind />, active: activeSlotName === "Evening" },
          { label: "Night", val: formatWind(Math.max(0, baseWind - 1)), icon: <FaWind />, active: activeSlotName === "Night" },
        ];
      }

      if (slotMetric === "humidity") {
        return [
          { label: "Morning", val: `${baseHum}%`, icon: <FaDroplet />, active: activeSlotName === "Morning" },
          { label: "Afternoon", val: `${Math.max(10, baseHum - 5)}%`, icon: <FaDroplet />, active: activeSlotName === "Afternoon" },
          { label: "Evening", val: `${Math.min(100, baseHum + 5)}%`, icon: <FaDroplet />, active: activeSlotName === "Evening" },
          { label: "Night", val: `${Math.min(100, baseHum + 10)}%`, icon: <FaDroplet />, active: activeSlotName === "Night" },
        ];
      }

      return [
        { label: "Morning", val: formatTemp(baseTemp - 2), icon: <FaCloudSun />, active: activeSlotName === "Morning" },
        { label: "Afternoon", val: formatTemp(baseTemp + 3), icon: <FaSun />, active: activeSlotName === "Afternoon" },
        { label: "Evening", val: formatTemp(baseTemp + 1), icon: <FaCloudSun />, active: activeSlotName === "Evening" },
        { label: "Night", val: formatTemp(baseTemp - 3), icon: <FaCloud />, active: activeSlotName === "Night" },
      ];
    }

    const morning = forecastList[1] || forecastList[0];
    const afternoon = forecastList[3] || forecastList[0];
    const evening = forecastList[5] || forecastList[0];
    const night = forecastList[7] || forecastList[0];

    if (slotMetric === "wind") {
      return [
        { label: "Morning", val: formatWind(morning.wind.speed), icon: <FaWind />, active: activeSlotName === "Morning" },
        { label: "Afternoon", val: formatWind(afternoon.wind.speed), icon: <FaWind />, active: activeSlotName === "Afternoon" },
        { label: "Evening", val: formatWind(evening.wind.speed), icon: <FaWind />, active: activeSlotName === "Evening" },
        { label: "Night", val: formatWind(night.wind.speed), icon: <FaWind />, active: activeSlotName === "Night" },
      ];
    }

    if (slotMetric === "humidity") {
      return [
        { label: "Morning", val: `${morning.main.humidity}%`, icon: <FaDroplet />, active: activeSlotName === "Morning" },
        { label: "Afternoon", val: `${afternoon.main.humidity}%`, icon: <FaDroplet />, active: activeSlotName === "Afternoon" },
        { label: "Evening", val: `${evening.main.humidity}%`, icon: <FaDroplet />, active: activeSlotName === "Evening" },
        { label: "Night", val: `${night.main.humidity}%`, icon: <FaDroplet />, active: activeSlotName === "Night" },
      ];
    }

    return [
      { label: "Morning", val: formatTemp(morning.main.temp), icon: getWeatherIcon(morning.weather[0].id), active: activeSlotName === "Morning" },
      { label: "Afternoon", val: formatTemp(afternoon.main.temp), icon: getWeatherIcon(afternoon.weather[0].id), active: activeSlotName === "Afternoon" },
      { label: "Evening", val: formatTemp(evening.main.temp), icon: getWeatherIcon(evening.weather[0].id), active: activeSlotName === "Evening" },
      { label: "Night", val: formatTemp(night.main.temp), icon: getWeatherIcon(night.weather[0].id), active: activeSlotName === "Night" },
    ];
  };

  const getFiveDayForecast = () => {
    if (!forecastList || forecastList.length === 0) {
      // Dynamic fallback based on current date if forecast API hasn't returned
      const today = new Date();
      return [1, 2, 3, 4, 5].map((offset) => {
        const d = new Date(today);
        d.setDate(today.getDate() + offset);
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const baseTemp = weatherData ? weatherData.main.temp : 20;
        return {
          date: dateStr,
          condition: weatherData ? weatherData.weather[0].main : "Clear",
          minTemp: baseTemp - 3,
          maxTemp: baseTemp + 2,
          weatherId: weatherData ? weatherData.weather[0].id : 800,
        };
      });
    }

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
        <i className={`${loadingIcons[iconIndex]} fa-2x`}></i>
      </div>
    );
  }

  const dailySlots = getDailyTimeSlots();
  const fiveDayPrediction = getFiveDayForecast();
  const tomorrowData = forecastList.length >= 8 ? forecastList[8] : null;
  const uviInfo = weatherData ? getUviData(weatherData) : { uvi: 3, label: "Moderate", desc: "Moderate risk." };

  return (
    <div className="app-container">
      {/* Left Navigation Rail */}
      <aside className={`sidebar-rail ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-top">
          <motion.div
            className="sidebar-logo cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("dashboard")}
          >
            <div className="sidebar-logo-icon">
              <FaSun />
            </div>
            {!isSidebarCollapsed && (
              <span className="sidebar-logo-text">WEATHER INSIGHTS</span>
            )}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </motion.button>
        </div>

        <nav className="sidebar-nav">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            title="Dashboard"
            onClick={() => setActiveTab("dashboard")}
          >
            <FaBookmark />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`nav-item ${activeTab === "saved" ? "active" : ""}`}
            title="Saved Locations"
            onClick={() => setActiveTab("saved")}
          >
            <FaCompass />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`nav-item ${activeTab === "locations" ? "active" : ""}`}
            title="Current Location"
            onClick={() => {
              setActiveTab("locations");
              handleCurrentLocationSearch();
            }}
          >
            <FaLocationDot />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
            title="Settings"
            onClick={() => setActiveTab("settings")}
          >
            <FaGear />
          </motion.button>
        </nav>

        <div className="sidebar-footer" style={{ position: "relative" }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
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
          </motion.button>

          {/* User Popover */}
          <AnimatePresence>
            {showUserMenu && token && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="user-popover"
              >
                <div className="user-popover-name">Account User</div>
                <div className="user-popover-email">user@weather.app</div>
                <button onClick={handleLogout} className="user-popover-logout-btn">
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
          <Search_bar onSearch={(city) => {
            getWeather(city);
            setActiveTab("dashboard");
          }} />

          <div className="header-actions">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="header-icon-btn"
              onClick={() => handleBookmark(weatherData?.name || "")}
              title="Bookmark current location"
            >
              {weatherData && bookmarks.includes(weatherData.name) ? (
                <FaBookmark className="icon-orange" />
              ) : (
                <FaRegBookmark />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="header-icon-btn"
              onClick={() => setShowNotificationModal(true)}
              title="Notifications"
            >
              <FaBell />
            </motion.button>
          </div>
        </header>

        {/* Dynamic View Switcher with Framer Motion transitions */}
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && weatherData && (
            <motion.div
              key="dashboard-view"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
            >
              <div className="dashboard-grid">
                {/* Weather Hero Card */}
                <motion.div variants={cardItemVariants} className="weather-hero-card">
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
                </motion.div>

                {/* Air Quality Hero Card */}
                <motion.div variants={cardItemVariants} className="air-quality-card">
                  <div className="aqi-header">
                    <h3>Air Quality</h3>
                    <p>Main pollution : PM 2.5</p>
                  </div>

                  <div className="aqi-value-container">
                    <span className="aqi-number">{getAqiValue(weatherData.aqi)}</span>
                    <span className="aqi-status-pill">{getAqiLabel(weatherData.aqi).toUpperCase()}</span>
                  </div>

                  <div className="aqi-wind-info">
                    <FaWind className="inline mr-2" />
                    <span>Wind Speed: {formatWind(weatherData.wind.speed)}</span>
                  </div>

                  <div className="aqi-slider-box">
                    <div className="aqi-labels">
                      <span>Good</span>
                      <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{getAqiLabel(weatherData.aqi)}</span>
                      <span>Hazardous</span>
                    </div>
                    <div className="aqi-progress-bar">
                      <div className="aqi-progress-fill" style={{ width: getAqiWidth(weatherData.aqi) }}></div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Bottom Row Grid */}
              <div className="dashboard-bottom-grid">
                {/* Daily Temperature / Metrics Curve */}
                <motion.div variants={cardItemVariants} className="temp-curve-card">
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
                </motion.div>

                {/* Tomorrow Overview Card */}
                <motion.div variants={cardItemVariants} className="tomorrow-card">
                  <div>
                    <span className="tag">Tomorrow</span>
                    <h3>{weatherData.name}</h3>
                  </div>

                  <div className="tomorrow-temp">
                    <div className="val">
                      {tomorrowData ? formatTemp(tomorrowData.main.temp) : formatTemp(weatherData.main.temp - 2)}
                    </div>
                    <div className="condition">
                      {tomorrowData ? tomorrowData.weather[0].main : weatherData.weather[0].main}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* VIEW: Saved Locations */}
          {activeTab === "saved" && (
            <motion.div
              key="saved-view"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="view-panel-card"
            >
              <div className="view-header">
                <div>
                  <h2 className="view-header-title">Saved Locations</h2>
                  <p className="view-header-sub">Manage your bookmarked cities & quick forecast access</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab("dashboard")}
                  className="view-action-btn"
                >
                  Back to Dashboard
                </motion.button>
              </div>

              {bookmarkDataList.length === 0 ? (
                <div className="empty-saved-state">
                  <div className="empty-icon-wrapper">
                    <FaBookmark />
                  </div>
                  <h3>No Saved Locations Yet</h3>
                  <p>
                    Search for any city in the header search bar and tap the bookmark icon to save it here.
                  </p>
                </div>
              ) : (
                <div className="saved-locations-grid">
                  {bookmarkDataList.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={cardItemVariants}
                      whileHover={{ y: -4 }}
                      className="saved-card"
                      onClick={() => {
                        getWeather(item.name);
                        setActiveTab("dashboard");
                      }}
                    >
                      <div className="saved-card-header">
                        <div>
                          <h4>{item.name}</h4>
                          <span>{item.sys.country}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookmark(item.name);
                          }}
                          className="saved-card-trash-btn"
                          title="Remove bookmark"
                        >
                          <FaTrash />
                        </button>
                      </div>

                      <div className="saved-card-body">
                        <div>
                          <p className="saved-card-temp">{formatTemp(item.main.temp)}</p>
                          <p className="saved-card-desc">{item.weather[0].description}</p>
                        </div>
                        <div className="saved-card-details">
                          <p>Humidity: {item.main.humidity}%</p>
                          <p>Wind: {formatWind(item.wind.speed)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW: Location / Geolocation Overview */}
          {activeTab === "locations" && weatherData && (
            <motion.div
              key="locations-view"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="view-panel-card"
            >
              <div className="view-header">
                <div>
                  <h2 className="view-header-title">Current Location View</h2>
                  <p className="view-header-sub">Real-time GPS detected coordinates and weather</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCurrentLocationSearch}
                  className="view-action-btn btn-primary"
                >
                  <FaRotateRight /> Refresh Geolocation
                </motion.button>
              </div>

              <div className="location-view-grid">
                <motion.div variants={cardItemVariants} className="location-info-card">
                  <div className="location-card-title">
                    <div className="location-icon-badge">
                      <FaLocationDot />
                    </div>
                    <div>
                      <h3>{weatherData.name}</h3>
                      <p>Country Code: {weatherData.sys.country}</p>
                    </div>
                  </div>

                  <div className="location-table">
                    <div className="location-row">
                      <label>Latitude</label>
                      <span>{weatherData.coord?.lat || "N/A"}</span>
                    </div>
                    <div className="location-row">
                      <label>Longitude</label>
                      <span>{weatherData.coord?.lon || "N/A"}</span>
                    </div>
                    <div className="location-row">
                      <label>Current Temp</label>
                      <span className="icon-orange">{formatTemp(weatherData.main.temp)}</span>
                    </div>
                    <div className="location-row">
                      <label>Condition</label>
                      <span style={{ textTransform: "capitalize" }}>{weatherData.weather[0].description}</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={cardItemVariants} className="live-gps-card">
                  <div>
                    <span className="gps-badge">Live GPS Data</span>
                    <h3>{weatherData.name}</h3>
                    <p>{weatherData.weather[0].main} • Feels like {formatTemp(weatherData.main.feels_like)}</p>
                  </div>

                  <div className="gps-metrics-grid">
                    <div className="gps-metric">
                      <label>Wind Speed</label>
                      <p>{formatWind(weatherData.wind.speed)}</p>
                    </div>
                    <div className="gps-metric">
                      <label>Air Quality</label>
                      <p>{getAqiLabel(weatherData.aqi)}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* VIEW: Settings View */}
          {activeTab === "settings" && (
            <motion.div
              key="settings-view"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="view-panel-card"
            >
              <div className="view-header">
                <div>
                  <h2 className="view-header-title">Preferences & Settings</h2>
                  <p className="view-header-sub">Customize display units and app configuration</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab("dashboard")}
                  className="view-action-btn"
                >
                  Back to Dashboard
                </motion.button>
              </div>

              <div className="settings-list">
                {/* Temperature Unit Setting */}
                <motion.div variants={cardItemVariants} className="setting-item">
                  <div className="setting-item-left">
                    <div className="setting-icon-box orange">
                      <FaSliders />
                    </div>
                    <div>
                      <h4 className="setting-item-title">Temperature Unit</h4>
                      <p className="setting-item-sub">Choose between Celsius (°C) and Fahrenheit (°F)</p>
                    </div>
                  </div>

                  <div className="setting-toggle-group">
                    <button
                      className={`toggle-btn ${unit === "C" ? "active" : ""}`}
                      onClick={() => setUnit("C")}
                    >
                      °C
                    </button>
                    <button
                      className={`toggle-btn ${unit === "F" ? "active" : ""}`}
                      onClick={() => setUnit("F")}
                    >
                      °F
                    </button>
                  </div>
                </motion.div>

                {/* Wind Unit Setting */}
                <motion.div variants={cardItemVariants} className="setting-item">
                  <div className="setting-item-left">
                    <div className="setting-icon-box blue">
                      <FaWind />
                    </div>
                    <div>
                      <h4 className="setting-item-title">Wind Speed Unit</h4>
                      <p className="setting-item-sub">Choose between meters/second (m/s) and km/h</p>
                    </div>
                  </div>

                  <div className="setting-toggle-group">
                    <button
                      className={`toggle-btn ${windUnit === "ms" ? "active blue" : ""}`}
                      onClick={() => setWindUnit("ms")}
                    >
                      m/s
                    </button>
                    <button
                      className={`toggle-btn ${windUnit === "kmh" ? "active blue" : ""}`}
                      onClick={() => setWindUnit("kmh")}
                    >
                      km/h
                    </button>
                  </div>
                </motion.div>

                {/* Notifications Setting */}
                <motion.div variants={cardItemVariants} className="setting-item">
                  <div className="setting-item-left">
                    <div className="setting-icon-box amber">
                      <FaBell />
                    </div>
                    <div>
                      <h4 className="setting-item-title">Weather Alerts & Notifications</h4>
                      <p className="setting-item-sub">Enable real-time severe weather alert digests</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`switch-track ${notificationsEnabled ? "on" : "off"}`}
                  >
                    <motion.div
                      layout
                      className="switch-thumb"
                      animate={{ x: notificationsEnabled ? 22 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Notifications Modal */}
        <AnimatePresence>
          {showNotificationModal && (
            <div className="modal-overlay">
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="modal-card"
              >
                <div className="modal-header">
                  <div className="modal-title">
                    <FaBell className="icon-orange" />
                    <h4>Weather Alerts</h4>
                  </div>
                  <button
                    onClick={() => setShowNotificationModal(false)}
                    className="modal-close-btn"
                  >
                    <FaXmark />
                  </button>
                </div>

                <div className="modal-body">
                  <div className="alert-box alert-box-accent">
                    <h5>Clear Sky Expected Today in {weatherData?.name || "your area"}</h5>
                    <p>
                      No heavy precipitation predicted for the next 24 hours. Great day for outdoor activities!
                    </p>
                  </div>
                  <div className="alert-box alert-box-normal">
                    <h5>Air Quality Alert: {getAqiLabel(weatherData?.aqi)}</h5>
                    <p>
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
                <h2>{weatherData.weather[0].main}</h2>
                <p>
                  <FaLocationDot className="icon-orange" />
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
                <span className="uvi-val-text">{uviInfo.uvi} UVI</span>
                <span className="uvi-badge">{uviInfo.label}</span>
              </div>
              <p className="uvi-desc">{uviInfo.desc}</p>
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

                  <Link to={`/forecast/${weatherData.name}`} style={{ textDecoration: "none" }}>
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
