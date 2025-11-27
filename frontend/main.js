/* ===========================================================
   SmartFarm Dashboard - Final main.js
   Features:
   ✔ Display latest sensor readings
   ✔ Moisture-based recommendation
   ✔ Weather + Soil Smart AI recommendation
   ✔ Live Sensor Graph (Moisture + Temp + Humidity)
   ✔ Pump ON/OFF markers + LIGHT_IRRIGATION/DELAY logic
   ✔ Auto refresh on reading submit
===========================================================*/

const API_BASE = "http://localhost:5000";  // ← Change later for Azure

//================ DOM ELEMENTS ===============
const moistureSpan = document.getElementById("moisture");
const tempSpan = document.getElementById("temperature");
const humiditySpan = document.getElementById("humidity");
const timeSpan = document.getElementById("timestamp");

// Basic AI recommendation UI
const actionSpan = document.getElementById("action");
const messageSpan = document.getElementById("message");

// Smart AI UI
const smartActionSpan = document.getElementById("smartAction");
const weatherNoteSpan = document.getElementById("weatherNote");
const smartReasonsList = document.getElementById("smartReasons");
const smartRecBtn = document.getElementById("getSmartRecommendation");

// History chart canvas
let farmChart;
const chartCanvas = document.getElementById("historyChart");

// Simulate input UI
const simForm = document.getElementById("simulateForm");
const simMoisture = document.getElementById("simMoisture");
const simTemp = document.getElementById("simTemp");
const simHumidity = document.getElementById("simHumidity");
const simResult = document.getElementById("simulateResult");


// ====================================================================
// 1) LOAD LATEST SENSOR DATA
// ====================================================================
async function loadLatest() {
  try {
    const res = await fetch(`${API_BASE}/api/latest`);
    const data = await res.json();

    if (!res.ok) {
      moistureSpan.textContent = "--";
      tempSpan.textContent = "--";
      humiditySpan.textContent = "--";
      timeSpan.textContent = "No data";
      return;
    }

    moistureSpan.textContent = data.moisture;
    tempSpan.textContent = data.temperature;
    humiditySpan.textContent = data.humidity;
    timeSpan.textContent = new Date(data.createdAt).toLocaleString();
  } catch (err) {
    console.error(err);
    timeSpan.textContent = "Connection Error";
  }
}


// ====================================================================
// 2) BASIC MOISTURE IRRIGATION RECOMMENDATION
// ====================================================================
async function loadRecommendation() {
  try {
    const res = await fetch(`${API_BASE}/api/recommendation`);
    const data = await res.json();

    if (!res.ok) {
      actionSpan.textContent = "--";
      messageSpan.textContent = data.error;
      return;
    }

    actionSpan.textContent = data.decision.action;
    messageSpan.textContent = data.decision.message;
  } catch (err) {
    console.error(err);
    messageSpan.textContent = "Error fetching recommendation";
  }
}


// ====================================================================
// 3) SMART AI (WEATHER + SOIL) RECOMMENDATION
// ====================================================================
async function loadSmartRecommendation() {
  try {
    const res = await fetch(`${API_BASE}/api/smart-recommendation`);
    const data = await res.json();

    if (!res.ok) {
      smartActionSpan.textContent = "--";
      weatherNoteSpan.textContent = "No weather / no data found";
      smartReasonsList.innerHTML = "";
      return;
    }

    smartActionSpan.textContent = data.action;
    weatherNoteSpan.textContent =
      `${data.weather.description} | Rain: ${data.weather.chanceOfRain}% | Temp: ${data.weather.forecastTemp}°C`;

    smartReasonsList.innerHTML = "";
    data.explanation.forEach(r => {
      const li = document.createElement("li");
      li.textContent = r;
      smartReasonsList.appendChild(li);
    });

  } catch (err) {
    console.error(err);
    weatherNoteSpan.textContent = "Smart AI Error";
  }
}


// ====================================================================
// 4) HISTORY GRAPH (Moisture + Temp + Humidity + Pump Markers)
// ====================================================================
async function loadHistoryAndChart() {

  const res = await fetch(`${API_BASE}/api/history`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return;

  const labels = data.map(r =>
    new Date(r.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})
  );

  const moisture = data.map(r => r.moisture);
  const temp = data.map(r => r.temperature);
  const humidity = data.map(r => r.humidity);

  // Pump Markers
  const onPoints = [];
  const offPoints = [];

  data.forEach((r, i) => {
    let action;
    if (r.moisture < 40) action = "PUMP_ON";
    else if (r.moisture > 80) action = "PUMP_OFF";

    if (action === "PUMP_ON") onPoints.push({ x: labels[i], y: r.moisture });
    if (action === "PUMP_OFF") offPoints.push({ x: labels[i], y: r.moisture });
  });

  if (farmChart) farmChart.destroy();

  farmChart = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Moisture %", data: moisture, borderWidth: 2, tension: 0.3 },
        { label: "Temperature °C", data: temp, borderWidth: 2, borderDash: [5,5], tension: 0.3, yAxisID: "y1" },
        { label: "Humidity %", data: humidity, borderWidth: 2, borderDash: [2,3], tension: 0.3 },
        { label: "Pump ON",  type:"scatter", data:onPoints, pointStyle:"triangle", pointRadius:6 },
        { label: "Pump OFF", type:"scatter", data:offPoints, pointStyle:"rectRot", pointRadius:6 }
      ]
    },
    options: {
      responsive:true,
      scales:{
        y:{ title:{display:true,text:"Moisture / Humidity"} },
        y1:{ position:"right", title:{display:true,text:"Temperature °C"}, grid:{drawOnChartArea:false}}
      }
    }
  });
}


// ====================================================================
// 5) SUBMIT SENSOR (SIMULATION)
// ====================================================================
simForm.addEventListener("submit", async e => {
  e.preventDefault();
  simResult.textContent = "Sending...";

  const payload = {
    moisture: simMoisture.value,
    temperature: simTemp.value,
    humidity: simHumidity.value
  };

  const res = await fetch(`${API_BASE}/api/sensor`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(payload)
  });

  const data=await res.json();
  simResult.textContent="✔ Saved Successfully";

  loadLatest();
  loadRecommendation();
  loadSmartRecommendation();
  loadHistoryAndChart();
});


// ====================================================================
// 6) AUTO LOAD ON PAGE OPEN
// ====================================================================
loadLatest();
loadRecommendation();
loadSmartRecommendation();
loadHistoryAndChart();

