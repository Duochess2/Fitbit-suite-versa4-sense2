import document from "document";
import { initCalculatorApp } from "./calculatorApp";
import { initCookieClickerApp } from "./cookieClickerApp";
import { init2048App } from "./game2048App";
import { initFlappyBirdApp, stopFlappyBird } from "./flappyBirdApp";
import { initSnakeApp, stopSnakeApp } from "./snakeApp";
import { initPongApp, stopPongApp } from "./pongApp";
import { initChatApp } from "./chatApp";
import { initTotpApp, startTotpApp, stopTotpApp } from "./totpApp";
import { initNavApp, startNavApp, stopNavApp } from "./navApp";
import { initTttApp } from "./tictactoeApp";
import { initDinoApp, startDinoApp, stopDinoApp } from "./dinoApp";
import { initDunkApp, startDunkApp, stopDunkApp } from "./dunkApp";
import { initNotesApp } from "./notesApp";
import { initRhythmApp, startRhythmApp, stopRhythmApp } from "./rhythmApp";
import { initHopApp, startHopApp, stopHopApp } from "./hopApp";
import { initGolfApp, startGolfApp, stopGolfApp } from "./golfApp";
import { initSlicerApp, startSlicerApp, stopSlicerApp } from "./slicerApp";
import { initAbyssApp, startAbyssApp, stopAbyssApp } from "./abyssApp";
import { initNeonApp, startNeonApp, stopNeonApp } from "./neonDropApp";
import { initStackApp, startStackApp, stopStackApp } from "./stackApp";
import { initRacerApp, startRacerApp, stopRacerApp } from "./racerApp";
import { initRushApp, startRushApp, stopRushApp } from "./rushApp";

// View Elements
const pinAppView = document.getElementById("pin-app-view");
const mainMenuView = document.getElementById("main-menu-view");
const calcAppView = document.getElementById("calc-app-view");
const cookieAppView = document.getElementById("cookie-app-view");
const game2048AppView = document.getElementById("game2048-app-view");
const flappyAppView = document.getElementById("flappy-app-view");
const snakeAppView = document.getElementById("snake-app-view");
const pongAppView = document.getElementById("pong-app-view");
const chatAppView = document.getElementById("chat-app-view");
const authAppView = document.getElementById("auth-app-view");
const btnLaunchStore = document.getElementById("btn-launch-store");
const navAppView = document.getElementById("nav-app-view");
const btnLaunchNav = document.getElementById("btn-launch-nav");
const tttAppView = document.getElementById("ttt-app-view");
const btnLaunchTtt = document.getElementById("btn-launch-ttt");
const homeBtn = document.getElementById("global-home-btn");
const dinoAppView = document.getElementById("dino-app-view");
const btnLaunchDino = document.getElementById("btn-launch-dino");
const dunkAppView = document.getElementById("dunk-app-view");
const btnLaunchDunk = document.getElementById("btn-launch-dunk");
const notesAppView = document.getElementById("notes-app-view");
const btnLaunchNotes = document.getElementById("btn-launch-notes");
const rhythmAppView = document.getElementById("rhythm-app-view");
const btnLaunchRhythm = document.getElementById("btn-launch-rhythm");
const hopAppView = document.getElementById("hop-app-view");
const golfAppView = document.getElementById("golf-app-view");
const btnLaunchGolf = document.getElementById("btn-launch-golf");
const slicerAppView = document.getElementById("slicer-app-view");
const btnLaunchSlicer = document.getElementById("btn-launch-slicer");
const abyssAppView = document.getElementById("abyss-app-view");
const btnLaunchAbyss = document.getElementById("btn-launch-abyss");
const neonAppView = document.getElementById("neon-app-view");
const btnLaunchNeon = document.getElementById("btn-launch-neon");
const stackAppView = document.getElementById("stack-app-view");
const btnLaunchStack = document.getElementById("btn-launch-stack");
const racerAppView = document.getElementById("racer-app-view");
const btnLaunchRacer = document.getElementById("btn-launch-racer");
const rushAppView = document.getElementById("rush-app-view");
const btnLaunchRush = document.getElementById("btn-launch-rush");




const btnLaunchHop = document.getElementById("btn-launch-hop");


// App Launch Buttons
const btnLaunchCalc = document.getElementById("btn-launch-calc");
const btnLaunchCookie = document.getElementById("btn-launch-cookie");
const btnLaunch2048 = document.getElementById("btn-launch-2048");
const btnLaunchFlappy = document.getElementById("btn-launch-flappy");
const btnLaunchSnake = document.getElementById("btn-launch-snake");
const btnLaunchPong = document.getElementById("btn-launch-pong");
const btnLaunchChat = document.getElementById("btn-launch-chat");
const btnLaunchAuth = document.getElementById("btn-launch-auth");

function switchView(targetView) {
  stopFlappyBird();
  stopSnakeApp();
  stopPongApp();
  stopTotpApp();
  stopNavApp();
  stopDinoApp();
  stopDunkApp();
  stopRhythmApp();
  stopHopApp();
  stopGolfApp();
  try { stopSlicerApp(); } catch(e) {}
  try { stopAbyssApp(); } catch(e) {}
  try { stopStackApp(); } catch(e) {}
  try { stopRacerApp(); } catch(e) {}
  try { stopRushApp(); } catch(e) {}







  // Hide everything
  pinAppView.style.display = "none";
  mainMenuView.style.display = "none";
  if(calcAppView) calcAppView.style.display = "none";
  if(cookieAppView) cookieAppView.style.display = "none";
  if(game2048AppView) game2048AppView.style.display = "none";
  if(flappyAppView) flappyAppView.style.display = "none";
  if(snakeAppView) snakeAppView.style.display = "none";
  if(pongAppView) pongAppView.style.display = "none";
  if(chatAppView) chatAppView.style.display = "none";
  if(authAppView) authAppView.style.display = "none";
  if(navAppView) navAppView.style.display = "none";
  if(navAppView) navAppView.style.display = "none";
  if(tttAppView) tttAppView.style.display = "none";
  if(dinoAppView) dinoAppView.style.display = "none";
  if(dunkAppView) dunkAppView.style.display = "none";
  if(notesAppView) notesAppView.style.display = "none";
  if(rhythmAppView) rhythmAppView.style.display = "none";
  if (hopAppView) hopAppView.style.display = "none";
  if(golfAppView) golfAppView.style.display = "none";
  if(slicerAppView) slicerAppView.style.display = "none";
  if (abyssAppView) abyssAppView.style.display = "none";
  if (neonAppView) neonAppView.style.display = "none";
  if (stackAppView) stackAppView.style.display = "none";
  if (racerAppView) racerAppView.style.display = "none";
  if (rushAppView) rushAppView.style.display = "none";  






  // Show Target
  targetView.style.display = "inline";

  // Hide the back button if we are on the lock screen or main menu
  if (targetView === pinAppView || targetView === mainMenuView) {
    homeBtn.style.display = "none";
  } else {
    homeBtn.style.display = "inline";
  }

  if (targetView === authAppView) {
    startTotpApp();
  }
}

// ==========================================
// 🔒 SECURE PIN LOGIC
// ==========================================
const CORRECT_PIN = "0000";
let currentPin = "";
const pinDisplay = document.getElementById("pin-display");

function updatePinDisplay() {
  let displayStr = "";
  for (let i = 0; i < 4; i++) {
    if (i < currentPin.length) {
      displayStr += currentPin[i] + " ";
    } else {
      displayStr += "- ";
    }
  }
  pinDisplay.text = displayStr.trim();
}

function handlePinInput(val) {
  if (val === "back") {
    currentPin = currentPin.slice(0, -1);
  } else {
    if (currentPin.length < 4) {
      currentPin += val;
    }
  }

  updatePinDisplay();

  // Check PIN if 4 digits are entered
  if (currentPin.length === 4) {
    if (currentPin === CORRECT_PIN) {
      currentPin = ""; // Reset for the future
      updatePinDisplay();
      switchView(mainMenuView); // UNLOCK APP SUITE
    } else {
      // Failed attempt
      currentPin = "";
      pinDisplay.text = "ERR"; // Flash error
      setTimeout(updatePinDisplay, 500); // Allow immediate retry
    }
  }
}

// Wire up the Numpad
for (let i = 0; i <= 9; i++) {
  let btn = document.getElementById(`pin-btn-${i}`);
  if (btn) btn.onmousedown = () => handlePinInput(i.toString());
}
let btnBack = document.getElementById("pin-btn-back");
if (btnBack) btnBack.onmousedown = () => handlePinInput("back");

// ==========================================
// UI CLICK LISTENERS
// ==========================================
if(btnLaunchCalc) btnLaunchCalc.onclick = () => switchView(calcAppView);
if(btnLaunchCookie) btnLaunchCookie.onclick = () => switchView(cookieAppView);
if(btnLaunch2048) btnLaunch2048.onclick = () => switchView(game2048AppView);
if(btnLaunchFlappy) btnLaunchFlappy.onclick = () => switchView(flappyAppView);
if(btnLaunchSnake) btnLaunchSnake.onclick = () => switchView(snakeAppView);
if(btnLaunchPong) btnLaunchPong.onclick = () => switchView(pongAppView);
if(btnLaunchChat) btnLaunchChat.onclick = () => switchView(chatAppView);
if(btnLaunchAuth) btnLaunchAuth.onclick = () => switchView(authAppView);
if(btnLaunchNav) btnLaunchNav.onclick = () => {
  switchView(navAppView);
  startNavApp(); // Turn on GPS!
};
if(btnLaunchTtt) btnLaunchTtt.onclick = () => {
  switchView(tttAppView);
};
if(btnLaunchDino) btnLaunchDino.onclick = () => {
  switchView(dinoAppView);
  startDinoApp();
};
if(btnLaunchDunk) btnLaunchDunk.onclick = () => {
  switchView(dunkAppView);
  startDunkApp();
};
if (btnLaunchNotes) {
  btnLaunchNotes.onclick = () => {
    switchView(notesAppView);
  };
}
if (btnLaunchRhythm) {
  btnLaunchRhythm.onclick = () => {
    switchView(rhythmAppView);
    startRhythmApp();
  };
}
if (btnLaunchHop) {
  btnLaunchHop.onclick = () => {
    switchView(hopAppView);
    startHopApp();
  };
}
if (btnLaunchGolf) {
  btnLaunchGolf.onclick = () => {
    switchView(golfAppView);
    startGolfApp();
  };
}
if (btnLaunchSlicer) {
  btnLaunchSlicer.onclick = () => {
    switchView(slicerAppView);
    startSlicerApp();
  };
}
if (btnLaunchAbyss) {
  btnLaunchAbyss.onclick = () => {
    switchView(abyssAppView);
    startAbyssApp();
  };
}
if (btnLaunchNeon) {
  btnLaunchNeon.onclick = () => {
    switchView(neonAppView);
    startNeonApp();
  };
}

if (btnLaunchStack) {
  btnLaunchStack.onclick = () => {
    switchView(stackAppView);
    startStackApp();
  };
}
if (btnLaunchRacer) {
  btnLaunchRacer.onclick = () => {
    switchView(racerAppView);
    startRacerApp();
  };
}

if (btnLaunchRush) {
  btnLaunchRush.onclick = () => {
    switchView(rushAppView);
    startRushApp();
  };
}

homeBtn.onclick = () => switchView(mainMenuView);

// Boot Engines
try { initCalculatorApp(); } catch(e){}
try { initCookieClickerApp(); } catch(e){}
try { init2048App(); } catch(e){}
try { initFlappyBirdApp(); } catch(e){}
try { initSnakeApp(); } catch(e){}
try { initPongApp(); } catch(e){}
try { initChatApp(); } catch(e){}
try { initTotpApp(); } catch(e){}
try { initNavApp(); } catch(e){}
try { initTttApp(); } catch(e){}
try { 
  initDinoApp(() => { switchView(mainMenuView); }); 
} catch(e){}
try { 
  initDunkApp(() => { switchView(mainMenuView); }); 
} catch(e){}
try { 
  initNotesApp(() => { switchView(mainMenuView); }); 
} catch(e){}
try { initRhythmApp(); } catch(e){}
try { initHopApp(); } catch(e){}
try { initGolfApp(); } catch(e){}
try { initSlicerApp(); } catch(e){}
try { initAbyssApp(); } catch(e){}
try { initNeonApp(); } catch(e) {}
try { initStackApp(); } catch(e){}
try { initRacerApp(); } catch(e){}
try { initRushApp(); } catch(e){}



// Boot directly into the lock screen
switchView(pinAppView);