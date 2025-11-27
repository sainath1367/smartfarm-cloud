// backend/database.js
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

function initFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ readings: [] }, null, 2));
  }
}

function readFile() {
  initFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeFile(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function saveReading(reading) {
  const data = readFile();
  data.readings.push(reading);
  writeFile(data);
  return reading;
}

function getAllReadings() {
  const data = readFile();
  return data.readings || [];
}

function getLatestReading() {
  const all = getAllReadings();
  if (all.length === 0) return null;
  return all[all.length - 1];
}

module.exports = {
  saveReading,
  getAllReadings,
  getLatestReading,
};
