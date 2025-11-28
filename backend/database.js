// backend/database.js
'use strict';

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

function loadFromFile() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const text = fs.readFileSync(DATA_FILE, 'utf8');
    if (!text.trim()) return [];
    return JSON.parse(text);
  } catch (err) {
    console.error('❌ Error reading data.json:', err);
    return [];
  }
}

function saveToFile(readings) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(readings, null, 2));
  } catch (err) {
    console.error('❌ Error writing data.json:', err);
  }
}

// In-memory cache
let readings = loadFromFile();

function saveReading(reading) {
  readings.push(reading);
  saveToFile(readings);
  return reading;
}

function getAllReadings() {
  return readings;
}

function getLatestReading() {
  return readings.length ? readings[readings.length - 1] : null;
}

module.exports = {
  saveReading,
  getAllReadings,
  getLatestReading,
};
