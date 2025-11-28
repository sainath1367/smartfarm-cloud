// backend/database.js
'use strict';

// simple in-memory “database”
let readings = [];

function saveReading(reading) {
  readings.push(reading);
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
