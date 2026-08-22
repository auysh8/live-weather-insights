# Live Weather Insights

A modern full-stack weather forecasting and analytics web application built with React, TypeScript, Node.js, Express, and MongoDB. Powered by the OpenWeatherMap API, providing real-time conditions, dynamic hourly trends, 5-day forecasts, geolocation lookup, user authentication, search history, and persistent bookmarks.

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

---

## Deployments & Live Demo

- **Live Application (GitHub Pages):** [https://auysh8.github.io/live-weather-insights/](https://auysh8.github.io/live-weather-insights/)
- **Live Application (Vercel):** [https://live-weather-insights.vercel.app](https://live-weather-insights.vercel.app)
- **GitHub Repository:** [https://github.com/auysh8/weather-app](https://github.com/auysh8/weather-app)

---

## Visual Preview

| Homepage & Search | Detailed Forecast & Trends |
| :---: | :---: |
| ![Homepage](./screenshots/home.png) | ![Forecast Page](./screenshots/forecast.png) |

---

## Key Features

- **Real-Time Weather Metrics:** Instantly fetch temperature, wind speed, humidity, UV index, and weather conditions.
- **Hourly & 5-Day Forecasts:** In-depth breakdown with daily highs, lows, and visual weather trends.
- **City Search & Autocomplete:** Search for cities worldwide with fast autocomplete and dynamic lookup.
- **Browser Geolocation:** Automatically retrieve local weather based on device coordinates.
- **Personalized Bookmarks:** Save favorite cities to easily monitor conditions upon login.
- **Search History Tracking:** Securely stores recent user search queries for quick re-navigation.
- **User Authentication:** Registration and login workflows secured with JWT middleware.
- **Smooth Micro-Interactions:** Fluid modal animations and UI transitions using Framer Motion.

---

## Repository Structure

```text
live-weather-insights/
├── screenshots/
│   ├── forecast.png
│   └── home.png
├── server/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Bookmarks.js
│   │   ├── History.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── bookmarks.js
│   │   ├── history.js
│   │   └── weather.js
│   ├── index.js
│   └── package.json
├── src/
│   ├── components/
│   │   ├── Login_popup.module.css
│   │   ├── Login_popup.tsx
│   │   ├── Register_popup.module.css
│   │   ├── Register_popup.tsx
│   │   ├── Search_bar.tsx
│   │   └── Weather_card.tsx
│   ├── pages/
│   │   ├── Detailed_forecast.tsx
│   │   └── Homepage.tsx
│   ├── App.css
│   ├── App.tsx
│   ├── main.tsx
│   └── types.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React 18/19, TypeScript, CSS Modules, Framer Motion |
| **Routing** | React Router DOM (HashRouter) |
| **Backend** | Node.js, Express.js, REST API |
| **Database** | MongoDB (Mongoose schemas for Users, Bookmarks, History) |
| **Authentication** | JSON Web Tokens (JWT), custom auth middleware |
| **External API** | OpenWeatherMap API |
| **Deployment** | Vercel, GitHub Pages |

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- OpenWeatherMap API Key ([Get a free key](https://openweathermap.org/api))
- MongoDB connection string / MongoDB Atlas URI

### Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/auysh8/weather-app.git
   cd weather-app
   ```

2. **Install dependencies:**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Configure environment variables:**

   Create a `.env` file in the root directory:
   ```env
   VITE_OPENWEATHER_API_KEY=your_openweathermap_api_key
   ```

   Create a `.env` file in `server/`:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Start development servers:**

   - **Backend Server:**
     ```bash
     cd server
     npm start
     ```

   - **Frontend Client (in a separate terminal):**
     ```bash
     npm run dev
     ```

5. Open your browser and navigate to `http://localhost:5173`.

---

## Available Scripts

### Frontend Scripts (Root)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server |
| `npm run build` | Builds frontend production bundle into `dist` |
| `npm run preview` | Locally previews production build |
| `npm run deploy` | Builds and deploys to `gh-pages` branch |

### Backend Scripts (`server/`)

| Command | Description |
| :--- | :--- |
| `npm start` | Starts Express REST API server |

---

## License

This project is open-source and licensed under the MIT License.

---

## Author

**Pankaj Bhandari**
- GitHub: [https://github.com/auysh8](https://github.com/auysh8)
- LinkedIn: [https://linkedin.com/in/pankajbhandari2004](https://linkedin.com/in/pankajbhandari2004)
- Email: [pankajbhandari0714@gmail.com](mailto:pankajbhandari0714@gmail.com)
