import { motion } from "framer-motion";
import type React from "react";
import { FaWind } from "react-icons/fa6";


// FIX 1: Update the Type to match the Flat structure from Backend
type WeatherData = {
  id: number;
  name: string; // <--- Name is at the top, not inside 'city'
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
  };
  sys: {
    country: string;
  };
};

type WeatherCardProps = {
  data: WeatherData;
  onBookmark: (city: string) => void;
  isBookmark: boolean;
  aqi: number;
};

const Weather_card = ({
  data,
  onBookmark,
  isBookmark,
  aqi,
}: WeatherCardProps) => {
  if (!data) {
    return null;
  }

  // FIX 2: Read directly from data.name
  const cityName = data.name;
  const temp = Math.round(data.main.temp); // FIX 3: Read from data.main.temp
  const sky = data.weather[0].description; // FIX 4: Read from data.weather[0]

  const handleBookmark = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    onBookmark(cityName);
  };

  const handleAqiColor = (aqiValue: number) => {
    if (aqiValue <= 1) return "#4ade80"; // Green (Good)
    if (aqiValue == 2) return "#facc15"; // Yellow (Fair)
    if (aqiValue === 3) return "#fb923c"; // Orange (Moderate)
    return "#ef4444"; // Red (Poor)
  };

  const handleAQI = (value: number) => {
    const labels = ["Unknown", "Good", "Fair", "Moderate", "Poor", "Very Poor"];
    return labels[value];
  };

  const getIcons = (conditionId: number) => {
    if (conditionId >= 200 && conditionId < 300)
      return "fa-solid fa-cloud-bolt";
    if (conditionId >= 300 && conditionId < 600)
      return "fa-solid fa-cloud-showers-heavy";
    if (conditionId >= 600 && conditionId < 700) return "fa-solid fa-snowflake";
    if (conditionId > 700 && conditionId < 800) return "fa-solid fa-smog";
    if (conditionId > 800 && conditionId < 805) return "fa-solid fa-cloud";
    if (conditionId === 800) return "fa-solid fa-circle";
    return "fa-solid fa-cloud";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: { duration: 0.2, type: "tween" },
      }}
      whileHover={{
        scale: 1.03,
        transition: { duration: 0.2, type: "spring" },
      }}
      whileTap={{ scale: 0.98 }}
      className="weather_card"
      exit={{
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.4, type: "tween" },
      }}
    >
      <button className="save_button" onClick={handleBookmark}>
        <i
          className={
            isBookmark ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark"
          }
        ></i>
      </button>
      <div className="weather_details">
        <span className="cityname">{cityName}</span>
        <span className="temp">{temp}°C</span>
        <span className="sky">{sky} </span>
        <span className="pollution">
          <span>
            <FaWind color="black" />
          </span>
          <span style={{ color: "black" }}> AQI:</span>{" "}
          <span
            className="font-bold"
            style={{ color: handleAqiColor(aqi), fontWeight: "bold" }}
          >
            {handleAQI(aqi)}
          </span>
        </span>
      </div>

      <div className="weather_icon">
        {/* FIX 5: Ensure accessing the array correctly */}
        <i className={getIcons(data.weather[0].id)}></i>
      </div>
    </motion.div>
  );
};

export default Weather_card;
