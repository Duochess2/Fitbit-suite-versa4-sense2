import { geolocation } from "geolocation";
import { vibration } from "haptics"; // FIXED: Correct Fitbit API import
import document from "document";
import * as fs from "fs";

let statusText, distText, arrow, btnMark, btnClear;
let watchId = null;
let targetCoords = null;
let currentCoords = null;

export function initNavApp() {
  statusText = document.getElementById("nav-status");
  distText = document.getElementById("nav-dist");
  arrow = document.getElementById("nav-arrow");
  btnMark = document.getElementById("nav-btn-mark");
  btnClear = document.getElementById("nav-btn-clear");

  try {
    let saved = fs.readFileSync("waypoint.json", "utf-8");
    if (saved) targetCoords = JSON.parse(saved);
  } catch(e) {}

  if (btnMark) {
    btnMark.addEventListener("mousedown", () => {
      vibration.start("bump"); // FIXED: Correct vibration command!
      if (currentCoords) {
        targetCoords = { lat: currentCoords.latitude, lon: currentCoords.longitude };
        fs.writeFileSync("waypoint.json", JSON.stringify(targetCoords), "utf-8");
        statusText.text = "Pin Dropped! 📍";
        updateDisplay();
      } else {
        statusText.text = "Need GPS first!"; 
      }
    });
  }

  if (btnClear) {
    btnClear.addEventListener("mousedown", () => {
      vibration.start("bump"); // FIXED: Correct vibration command!
      targetCoords = null;
      try { fs.unlinkSync("waypoint.json"); } catch(e) {}
      distText.text = "0m";
      statusText.text = "Pin Cleared.";
      if (arrow) arrow.groupTransform.rotate.angle = 0;
    });
  }
}

export function startNavApp() {
  statusText.text = "Acquiring GPS...";
  watchId = geolocation.watchPosition(locationSuccess, locationError, {
    enableHighAccuracy: true, 
    maximumAge: 0
  });
}

export function stopNavApp() {
  if (watchId !== null) {
    geolocation.clearWatch(watchId);
    watchId = null;
  }
}

function locationSuccess(position) {
  currentCoords = position.coords;
  statusText.text = "GPS Locked 🛰️";
  
  // FIXED: Correct vibration command!
  if (!targetCoords) vibration.start("confirmation"); 
  
  updateDisplay();
}

function locationError(error) {
  statusText.text = "GPS Error!";
}

function updateDisplay() {
  if (!targetCoords || !currentCoords) return;

  let dist = getDistance(currentCoords.latitude, currentCoords.longitude, targetCoords.lat, targetCoords.lon);
  
  if (dist > 1000) {
    distText.text = (dist / 1000).toFixed(2) + " km";
  } else {
    distText.text = Math.round(dist) + " m";
  }

  let bearing = getBearing(currentCoords.latitude, currentCoords.longitude, targetCoords.lat, targetCoords.lon);
  let heading = currentCoords.heading || 0;
  
  if (arrow) {
    arrow.groupTransform.rotate.angle = bearing - heading;
  }
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; 
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getBearing(lat1, lon1, lat2, lon2) {
  lat1 = lat1 * Math.PI/180;
  lat2 = lat2 * Math.PI/180;
  let dLon = (lon2-lon1) * Math.PI/180;
  let y = Math.sin(dLon) * Math.cos(lat2);
  let x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
  let brng = Math.atan2(y, x);
  return (brng * 180 / Math.PI + 360) % 360;
}