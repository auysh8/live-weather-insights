import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Search_bar from "../components/Search_bar";
import Weather_card from "../components/Weather_card";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { toast } from "react-toastify"; // <--- Don't forget this import!

// FIX 1: Update the type to match "Current Weather" API response
type WeatherData = {
  id: number; // ID is at the root
  name: string; // Name is at the root
  main: any; // Contains temp, humidity etc.
  weather: any[]; // Contains icon, description
  sys: {
    // Contains country code
    country: string;
  };
  wind: {
    speed: number;
    deg: number;
  };
  aqi: number;
};

interface HomepageProps {
  onClick : () => void;
}

const Homepage = ({ onClick }:HomepageProps) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookmarkDataList, setBookmarkDataList] = useState<WeatherData[]>([]);
  const API_BASE_URL = "https://weather-app-za51.onrender.com";
  const [appIsLoading, setAppIsLoading] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);
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

  useEffect(() => {
    const fetchBookmarks = async () => {
      setAppIsLoading(true);
      const myTimer = new Promise((resolve) => {
        setTimeout(resolve, 2000);
      });

      const url = `${API_BASE_URL}/api/bookmarks`;
      try {
        const apiPromise = fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const [response] = await Promise.all([apiPromise, myTimer]);
        const data = await response.json();
        const cityNames = data.map((item: any) => item.city);
        setBookmarks(cityNames);
      } catch (error) {
        console.error(error);
      } finally {
        setAppIsLoading(false);
      }
    };
    fetchBookmarks();
  }, [token]);

  useEffect(() => {
    const fetchBookmarkData = async () => {
      if (bookmarks.length === 0) {
        setBookmarkDataList([]); // Clear list if no bookmarks
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
      // Filter out failed requests (nulls)
      const validResults = results.filter(
        (data) => data !== null,
      ) as WeatherData[];

      // ---------------------------------------------------------
      // 🟢 THE FIX: Sort alphabetically to stop "Jumping"
      // ---------------------------------------------------------
      validResults.sort((a, b) => a.name.localeCompare(b.name));

      setBookmarkDataList(validResults);
    };

    fetchBookmarkData();
  }, [bookmarks]);

  const onSuccess = (pos: GeolocationPosition) => {
    const lat = pos.coords.latitude;
    const long = pos.coords.longitude;
    getCityName(lat, long);
  };

  const onFailure = (error: GeolocationPositionError) => {
    console.error(error.message);
    getWeather("Delhi");
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by the browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onFailure);
  }, []);

  const getCityName = async (lat: number, long: number) => {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${long}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      getWeather(data.city);
    } catch (error) {
      console.error(error);
    }
  };

  const getAqi = async (lat: number, lon: number) => {
    const url = `${API_BASE_URL}/api/AQI?lat=${lat}&lon=${lon}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.list[0].main.aqi;
    } catch (error) {
      console.error(error);
    }
  };

  const getWeather = async (city: string) => {
    const url = `${API_BASE_URL}/weather?city=${city}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("City not found");
      }
      const data = await response.json();
      const aqi = await getAqi(data.coord.lat, data.coord.lon);
      setWeatherData({ ...data, aqi });
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        toast.error("City not found! 🤷‍♂️");
      } else {
        toast.error("Server error. Try again later.");
      }
    }
  };

  const handleBookmark = async (city: string) => {
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
          setBookmarks((prev) => prev.filter((cityname) => cityname != city));
          setBookmarkDataList((prev) =>
            prev.filter((item) => item.name !== city),
          );
          toast.info("Bookmark removed");
        } else if (response.status === 401) {
          localStorage.removeItem("authToken");
          onClick();
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

          if (weatherData) {
            setBookmarkDataList((prev) => {
              const newList = [...prev, weatherData];
              return newList.sort((a, b) => a.name.localeCompare(b.name));
            });
          }
        } else if (response.status === 401) {
          localStorage.removeItem("authToken");
          onClick();
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (appIsLoading) {
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
            key={loadingIcons[iconIndex]} // A unique key is CRITICAL
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

  return (
    <div>
      <div className="homepage">
        <div className="heading">
          <span className="name">Weather Now</span>
          <span className="description">
            Your daily dose of weather, simplified
          </span>
        </div>

        <Search_bar onSearch={getWeather}/>

        <AnimatePresence mode="wait">
          {weatherData && (
            <motion.div
              key={weatherData.id} // The key change triggers the animation!
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Link to={`/forecast/${weatherData.name}`}>
                <Weather_card
                  data={weatherData}
                  aqi={weatherData.aqi}
                  onBookmark={() => handleBookmark(weatherData.name)}
                  isBookmark={bookmarks.includes(weatherData.name)}
                />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bookmark">
          {bookmarks.length > 0 && (
            <span className="bookmark_head">Bookmarks</span>
          )}

          <AnimatePresence>
            {bookmarks.length > 0 &&
              bookmarkDataList.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }} // Start invisible & lower
                  animate={{ opacity: 1, y: 0 }} // Fade in & slide up
                  exit={{ opacity: 0, y: -20 }} // Fade out & slide up
                  layout // This prop creates a smooth shuffle animation!
                >
                  <Link to={`/forecast/${item.name}`}>
                    <Weather_card
                      data={item}
                      aqi={item.aqi}
                      onBookmark={() => handleBookmark(item.name)}
                      isBookmark={bookmarks.includes(item.name)}
                    />
                  </Link>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
