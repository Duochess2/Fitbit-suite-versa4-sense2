import document from "document";
import { display } from "display";
import { vibration } from "haptics";
import * as fs from "fs";

let timeTxt, scoreTxt, hiScoreTxt, blade, controller, overlay, statusTxt, finalScoreTxt;
let gameLoop = null;
let timerLoop = null;

const SCORE_FILE = "slicer_hiscore.txt";

let isGameOver = true;
let score = 0;
let highScore = 0;
let timeLeft = 30;

let isSwiping = false;
let lastX = -1, lastY = -1;
let currX = -1, currY = -1;
let bladeDecay = 0; 

let orbs = [];
const ORB_RADIUS = 22;
const GRAVITY = 0.4;

export function initSlicerApp() {
  timeTxt = document.getElementById("slicer-time");
  scoreTxt = document.getElementById("slicer-score");
  hiScoreTxt = document.getElementById("slicer-hi-score");
  blade = document.getElementById("slicer-blade");
  controller = document.getElementById("slicer-controller");
  overlay = document.getElementById("slicer-overlay");
  statusTxt = document.getElementById("slicer-status");
  finalScoreTxt = document.getElementById("slicer-final-score");

  for (let i = 0; i < 5; i++) {
    orbs.push({ el: document.getElementById(`slicer-o-${i}`), active: false, x: 0, y: 0, vx: 0, vy: 0 });
  }

  loadHighScore();

  if (controller) {
    controller.onmousedown = (e) => {
      if (isGameOver) return;
      isSwiping = true;
      lastX = e.screenX; lastY = e.screenY;
      currX = e.screenX; currY = e.screenY;
      bladeDecay = 5;
    };
    
    controller.onmousemove = (e) => {
      if (!isSwiping || isGameOver) return;
      lastX = currX; lastY = currY;
      currX = e.screenX; currY = e.screenY;
      bladeDecay = 5; 
      updateBladeVisual();
      checkSlices();
    };

    controller.onmouseup = () => {
      isSwiping = false;
      if (blade) blade.style.display = "none";
    };
  }

  if (overlay) {
    overlay.onmousedown = () => { if (isGameOver) resetGame(); };
  }
}

export function startSlicerApp() {
  display.autoOff = false;
  resetGame();
}

export function stopSlicerApp() {
  display.autoOff = true;
  isGameOver = true;
  isSwiping = false;
  if (gameLoop) clearInterval(gameLoop);
  if (timerLoop) clearInterval(timerLoop);
  vibration.stop();
}

function resetGame() {
  score = 0;
  timeLeft = 30;
  isGameOver = false;
  isSwiping = false;
  if (blade) blade.style.display = "none";

  loadHighScore();

  if (scoreTxt) scoreTxt.text = "0";
  if (timeTxt) timeTxt.text = "30s";
  if (hiScoreTxt) hiScoreTxt.text = `HI: ${highScore}`;
  if (overlay) overlay.style.display = "none";

  for (let i = 0; i < orbs.length; i++) {
    orbs[i].active = false;
    if (orbs[i].el) orbs[i].el.style.display = "none";
  }

  if (gameLoop) clearInterval(gameLoop);
  if (timerLoop) clearInterval(timerLoop);
  
  gameLoop = setInterval(gameTick, 33); 
  timerLoop = setInterval(timeTick, 1000); 
}

function timeTick() {
  if (isGameOver) return;
  timeLeft--;
  if (timeTxt) timeTxt.text = `${timeLeft}s`;

  if (timeLeft <= 0) triggerGameOver();
}

function gameTick() {
  if (isGameOver) return;

  if (isSwiping && bladeDecay > 0) {
    bladeDecay--;
    if (bladeDecay <= 0 && blade) blade.style.display = "none";
  }

  if (Math.random() < 0.05) spawnOrb();

  for (let i = 0; i < orbs.length; i++) {
    let o = orbs[i];
    if (o.active) {
      o.vy += GRAVITY;
      o.x += o.vx;
      o.y += o.vy;

      if (o.el) {
        o.el.cx = o.x;
        o.el.cy = o.y;
      }

      if (o.y > 360) {
        o.active = false;
        if (o.el) o.el.style.display = "none";
      }
    }
  }
}

function spawnOrb() {
  let target = null;
  for (let i = 0; i < orbs.length; i++) {
    if (!orbs[i].active) {
      target = orbs[i];
      break;
    }
  }

  if (target) {
    target.active = true;
    target.x = Math.floor(Math.random() * 250) + 40; 
    target.y = 350;
    
    target.vx = (168 - target.x) * 0.015 + (Math.random() * 2 - 1);
    target.vy = -(Math.random() * 4 + 11); 
    
    if (target.el) {
      target.el.cx = target.x;
      target.el.cy = target.y;
      target.el.style.display = "inline";
    }
  }
}

function updateBladeVisual() {
  if (blade) {
    blade.x1 = lastX;
    blade.y1 = lastY;
    blade.x2 = currX;
    blade.y2 = currY;
    blade.style.display = "inline";
  }
}

// Lag-proof Bounding Box Slicing
function checkSlices() {
  // 1. Calculate a massive "Net" over the entire swipe area
  let minX = Math.min(lastX, currX) - 45;
  let maxX = Math.max(lastX, currX) + 45;
  let minY = Math.min(lastY, currY) - 45;
  let maxY = Math.max(lastY, currY) + 45;

  for (let i = 0; i < orbs.length; i++) {
    let o = orbs[i];
    if (o.active) {
      // 2. If the orb is ANYWHERE inside that swipe zone, it gets destroyed instantly!
      if (o.x >= minX && o.x <= maxX && o.y >= minY && o.y <= maxY) {
        o.active = false;
        if (o.el) o.el.style.display = "none";
        
        score += 10;
        if (scoreTxt) scoreTxt.text = score;
        
        playCustomBuzz("ping"); 
      }
    }
  }
}
function triggerGameOver() {
  isGameOver = true;
  clearInterval(gameLoop);
  clearInterval(timerLoop);
  
  if (blade) blade.style.display = "none";

  if (score > highScore) {
    highScore = score;
    saveHighScore(highScore);
    if (statusTxt) statusTxt.text = "NEW HIGH SCORE!";
  } else {
    if (statusTxt) statusTxt.text = "TIME UP!";
  }

  if (finalScoreTxt) finalScoreTxt.text = `Score: ${score}`;
  if (overlay) overlay.style.display = "inline";
  
  playCustomBuzz("confirmation");
}

function playCustomBuzz(profile) {
  vibration.start(profile);
  setTimeout(() => { vibration.stop(); }, 150);
}

function loadHighScore() {
  try {
    if (fs.existsSync(SCORE_FILE)) {
      highScore = Number(fs.readFileSync(SCORE_FILE, "ascii"));
    } else {
      highScore = 0;
    }
  } catch (err) {
    highScore = 0;
  }
}

function saveHighScore(newScore) {
  try {
    fs.writeFileSync(SCORE_FILE, newScore.toString(), "ascii");
  } catch (err) {}
}