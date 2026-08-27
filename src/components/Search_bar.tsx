import type React from "react";
import { useState } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";

interface SearchBarProps {
  onSearch: (city: string) => void;
}

const Search_bar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [city, setCity] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      onSearch(city.trim());
      setCity("");
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-input-wrapper">
        <input
          type="text"
          placeholder="Search anything..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button type="submit" className="search-icon-btn" aria-label="Search">
          <FaMagnifyingGlass />
        </button>
      </form>
    </div>
  );
};

export default Search_bar;
