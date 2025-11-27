// backend/server.js
'use strict';

const express = require('express');
const cors = require('cors');

// for optional weather API (node-fetch in CommonJS)
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const {
  saveReading,
  getAllReadings,
  getLatestReading,
} = require('./database');

const app = express();
const PORT = process.env.PORT || 5000; // good for Azure & local

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());

// ---------- Root route (quick health check) ----------
app.get('/', (req, res) => {
  res.send('SmartFarm backend is running ✅');
});

// ---------- Helper: basic irrigation logic (moisture only) ----------
function getIrrigationRecommendation(reading) {
  if (!reading) {
    return {
      action: 'NO_DATA',
      message: 'No sensor data available.',
    };
  }

  const moisture = Number(reading.moisture);
  let action;
  let message;

  if (moisture < 40) {
    action = 'PUMP_ON';
    message = `Low moisture (${moisture}%). Turn pump ON.`;
  } else if (moisture > 80) {
    action = 'PUMP_OFF';
    message = `High moisture (${moisture}%). Keep pump OFF.`;
  } else {
    action = 'KEEP';
    message = `Moisture normal (${moisture}%). No change.`;
  }

  return { action, message };
}

// ========== 1) Save sensor data ==========
app.post('/api/sensor', (req, res) => {
  try {
    const { moisture, temperature, humidity } = req.body;

    if (
      moisture === undefined ||
      temperature === undefined ||
      humidity === undefined
    ) {
      return res.status(400).json({
        error: 'moisture, temperature and humidity are required',
      });
    }

    const reading = {
      moisture: Number(moisture),
      temperature: Number(temperature),
      humidity: Number(humidity),
      createdAt: new Date().toISOString(),
    };

    const saved = saveReading(reading);
    console.log('✅ Saved reading:', saved);

    res.status(201).json({ message: 'Reading saved', reading: saved });
  } catch (err) {
    console.error('❌ Error saving reading:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== 2) Get latest reading ==========
app.get('/api/latest', (req, res) => {
  try {
    const latest = getLatestReading();
    if (!latest) {
      return res.status(404).json({ error: 'No data found' });
    }
    res.json(latest);
  } catch (err) {
    console.error('❌ Error fetching latest:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== 3) Get all readings (history) ==========
app.get('/api/history', (req, res) => {
  try {
    const all = getAllReadings();
    res.json(all);
  } catch (err) {
    console.error('❌ Error fetching history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== 4) Basic irrigation recommendation ==========
app.get('/api/recommendation', (req, res) => {
  try {
    const latest = getLatestReading();
    if (!latest) {
      return res.status(404).json({ error: 'No data found' });
    }

    const decision = getIrrigationRecommendation(latest);
    res.json({ latest, decision });
  } catch (err) {
    console.error('❌ Error getting recommendation:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========== 5) Advanced Smart Recommendation (Weather + Moisture) ==========
app.get('/api/smart-recommendation', async (req, res) => {
  try {
    const latest = getLatestReading();
    if (!latest) {
      return res.status(404).json({ error: 'No data found' });
    }

    const moisture = Number(latest.moisture);
    const temperature = Number(latest.temperature);

    // ===== Weather data (SIMULATED for now) =====
    // You can replace this with real API later.
    let weather = {
      description: 'clear sky',
      chanceOfRain: 10, // %
      forecastTemp: temperature, // same as sensor
    };

    /* 
    // Example (optional) real API call with OpenWeather (if you want later):
    const apiKey = 'YOUR_OPENWEATHER_API_KEY';
    const city = 'Delhi,IN';
    const resp = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );
    const w = await resp.json();
    weather = {
      description: w.weather[0].description,
      chanceOfRain: (w.rain && w.rain['1h']) ? 80 : 10,
      forecastTemp: w.main.temp,
    };
    */

    // ===== AI-style decision combining moisture + weather =====
    let action;
    let reason = [];

    // Moisture analysis
    if (moisture < 40) {
      reason.push(`Low soil moisture (${moisture}%).`);
    } else if (moisture > 80) {
      reason.push(`High soil moisture (${moisture}%).`);
    } else {
      reason.push(`Soil moisture normal (${moisture}%).`);
    }

    // Weather analysis
    if (weather.chanceOfRain >= 60) {
      reason.push(`High chance of rain (${weather.chanceOfRain}%).`);
    } else if (weather.forecastTemp >= 35) {
      reason.push(`High temperature forecast (${weather.forecastTemp}°C).`);
    } else {
      reason.push(`Weather normal (no extreme heat or heavy rain).`);
    }

    // Final decision rules
    if (moisture < 40 && weather.chanceOfRain < 40) {
      action = 'PUMP_ON';
    } else if (moisture < 40 && weather.chanceOfRain >= 40) {
      action = 'DELAY_IRRIGATION';
    } else if (
      moisture >= 40 &&
      moisture <= 80 &&
      weather.forecastTemp >= 35
    ) {
      action = 'LIGHT_IRRIGATION';
    } else if (moisture > 80 || weather.chanceOfRain >= 70) {
      action = 'PUMP_OFF';
    } else {
      action = 'KEEP';
    }

    res.json({
      latest,
      weather,
      action,
      explanation: reason,
    });
  } catch (err) {
    console.error('Error in smart recommendation:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`🚀 SmartFarm backend running on http://localhost:${PORT}`);
});
