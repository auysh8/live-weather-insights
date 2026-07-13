import React, { useEffect, useRef, useState } from "react";
import { FaHistory } from "react-icons/fa";

type SearchBarProps = {
  onSearch: (city: string) => void;
};

interface HistroyItems {
  _id: string;
  city: string;
}

const Search_bar = ({ onSearch }: SearchBarProps) => {
  const [isDropdown, setIsDropdown] = useState(false);
  const [history, setHistory] = useState<HistroyItems[]>([]);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const API_BASE_URL = "https://weather-app-za51.onrender.com";

  const fetchHistory = async (cityName = "") => {
    const token = localStorage.getItem("authToken");
    try {
      const safeQuery = encodeURIComponent(cityName);
      const response = await fetch(
        `${API_BASE_URL}/api/history?search=${safeQuery}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok) {
        throw new Error("Server error");
      }
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (cityName: string) => {
    const token = localStorage.getItem("authToken");
    const cleanName = cityName.trim();
    if (!cleanName) return;
    setQuery(cleanName);
    onSearch(cleanName);
    setIsDropdown(false);
    try {
      await fetch(`${API_BASE_URL}/api/history`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cityName: cleanName }),
      });
      fetchHistory();
    } catch (error) {
      console.error(error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch(query);
    }
  };

  return (
    <div className="bar">
      <div className="search_bar" ref={searchRef}>
        <i className="fa-solid fa-magnifying-glass"></i>{" "}
        <input
          id="search_input"
          type="text"
          placeholder="Enter city name"
          value={query}
          onFocus={() => setIsDropdown(true)}
          onChange={(event) => {
            const val = event.target.value;
            setQuery(val);
            setIsDropdown(true);
          }}
          onKeyDown={(event) => handleKeyDown(event)}
        />
        {isDropdown && history.length > 0 && (
          <div className="dropdown">
            {history.map((item) => (
              <div
                className="history"
                key={item._id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSearch(item.city);
                }}
              >
                <span className="recent_city">{item.city}</span>
                <FaHistory />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search_bar;
