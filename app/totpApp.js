import document from "document";
import { display } from "display"; 
import { generateTOTP } from "./totp";

let codeText, timerBar, accountName;
let authInterval = null;

// ==========================================
// ⚠️ HARDCODE YOUR 2FA SECRET KEY HERE ⚠️
const MY_SECRET_KEY = ""; 
const MY_ACCOUNT = "GitHub";

// ⏱️ CALIBRATION TWEAK
// If your watch changes 5 seconds AFTER your phone, change this to 5.
// If your watch changes 5 seconds BEFORE your phone, change this to -5.
const TIME_OFFSET_SECONDS = 12; 
// ==========================================

export function initTotpApp() {
  codeText = document.getElementById("auth-code");
  timerBar = document.getElementById("auth-timer-bar");
  accountName = document.getElementById("auth-account-name");
}

export function startTotpApp() {
  accountName.text = MY_ACCOUNT;
  updateCode(); 
  
  if (authInterval) clearInterval(authInterval);
  authInterval = setInterval(updateCode, 1000);
  
  display.addEventListener("change", onDisplayChange);
}

export function stopTotpApp() {
  if (authInterval) clearInterval(authInterval);
  display.removeEventListener("change", onDisplayChange); 
}

function onDisplayChange() {
  if (display.on) {
    updateCode(); 
  }
}

function updateCode() {
  // Apply the calibration offset directly to the core time
  const epoch = Math.floor(new Date().getTime() / 1000) + TIME_OFFSET_SECONDS;
  const secondsRemaining = 30 - (epoch % 30);
  
  const MAX_WIDTH = 268; 
  timerBar.width = Math.floor((secondsRemaining / 30) * MAX_WIDTH);
  
  if (secondsRemaining <= 5) {
    timerBar.style.fill = "#E74C3C"; 
  } else {
    timerBar.style.fill = "#2ECC71"; 
  }

  // The math engine now uses our perfectly calibrated time
  const newCode = generateTOTP(MY_SECRET_KEY, epoch);
  
  if (newCode && newCode.length >= 6) {
     codeText.text = newCode.substring(0, 3) + " " + newCode.substring(3, 6);
  } else {
     codeText.text = "ERR OR";
  }
}