// sensors/esp32_smartfarm.ino
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid     = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

const char* serverUrl = "http://your-pc-ip:5000/api/sensor";

// Example pins
const int moisturePin = 34;  // analog
// (You can add real temp/humidity sensor code – here we fake values)

void setup() {
  Serial.begin(115200);
  delay(1000);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    int raw = analogRead(moisturePin);
    float moisturePercent = map(raw, 4095, 0, 0, 100);  // adjust for your sensor
    float temperature = 28.0; // dummy
    float humidity = 65.0;    // dummy

    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{";
    jsonPayload += "\"moisture\":" + String(moisturePercent, 1) + ",";
    jsonPayload += "\"temperature\":" + String(temperature, 1) + ",";
    jsonPayload += "\"humidity\":" + String(humidity, 1);
    jsonPayload += "}";

    int httpResponseCode = http.POST(jsonPayload);

    Serial.print("POST -> ");
    Serial.println(httpResponseCode);
    http.end();
  }

  delay(10000); // send every 10 seconds
}
