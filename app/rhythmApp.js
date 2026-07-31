import document from "document";
import { vibration } from "haptics";
import { display } from "display";

let scoreTxt, comboTxt, livesTxt, overlay, statusTxt, touchZones;
let gameLoop = null;

let score = 0, combo = 0, lives = 5, isGameOver = true;
let speed = 4, spawnTimer = 0, spawnRate = 50; 

// THE STRICT HIT WINDOW
const HIT_TOP = 230;    
const HIT_BOTTOM = 285; 

const COLORS = ["#E74C3C", "#F1C40F", "#2ECC71", "#3498DB"];
const HAPTICS = ["ping", "bump", "confirmation", "nudge-max"]; 
const LANE_X = [12, 96, 180, 264]; 

let notes = [];

export function initRhythmApp() {
  scoreTxt = document.getElementById("rh-score");
  comboTxt = document.getElementById("rh-combo");
  livesTxt = document.getElementById("rh-lives");
  overlay = document.getElementById("rh-overlay");
  statusTxt = document.getElementById("rh-status");
  touchZones = document.getElementById("rh-touch-zones");

  for (let i = 0; i < 12; i++) {
    notes.push({ el: document.getElementById(`rh-n-${i}`), active: false, lane: 0, y: 0 });
  }

  for (let i = 0; i < 4; i++) {
    let col = document.getElementById(`rh-col-${i}`);
    if (col) col.onmousedown = () => tapLane(i);
  }

  if (overlay) overlay.onmousedown = () => {
    if (isGameOver) resetGame();
  };
}

export function startRhythmApp() {
  display.autoOff = false; 
}

export function stopRhythmApp() {
  display.autoOff = true;
  isGameOver = true;
  if (gameLoop) clearInterval(gameLoop);
}

function resetGame() {
  score = 0; combo = 0; lives = 5;
  speed = 4; spawnRate = 50; spawnTimer = 0;
  isGameOver = false;

  updateHUD();
  overlay.style.display = "none";
  statusTxt.style.display = "none";
  touchZones.style.display = "inline"; 

  notes.forEach(n => { n.active = false; if(n.el) n.el.style.display = "none"; });

  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameTick, 33);
}

function gameTick() {
  if (isGameOver) return;

  spawnTimer++;
  if (spawnTimer >= spawnRate) {
    spawnNote();
    spawnTimer = 0;
    if (spawnRate > 18) spawnRate -= 0.5;
    if (speed < 10) speed += 0.05;
  }

  notes.forEach(n => {
    if (n.active) {
      n.y += speed;
      
      // Note falls past the line
      if (n.y > HIT_BOTTOM) {
        n.active = false;
        n.el.style.display = "none";
        playErrorBuzz(); // FIX: Call our custom short buzz!
        loseLife();
      } else {
        n.el.y = n.y;
      }
    }
  });
}

function spawnNote() {
  let targetNote = null;
  for (let i = 0; i < notes.length; i++) {
    if (!notes[i].active) {
      targetNote = notes[i];
      break;
    }
  }

  if (targetNote) {
    targetNote.active = true;
    targetNote.lane = Math.floor(Math.random() * 4); 
    targetNote.y = -30;
    targetNote.el.style.fill = COLORS[targetNote.lane];
    targetNote.el.x = LANE_X[targetNote.lane];
    targetNote.el.y = targetNote.y;
    targetNote.el.style.display = "inline";
  }
}

function tapLane(laneIndex) {
  if (isGameOver) return;
  
  let target = null;
  let maxY = -999;
  
  notes.forEach(n => {
    if (n.active && n.lane === laneIndex && n.y > maxY) {
      maxY = n.y;
      target = n;
    }
  });

  if (target && target.y >= HIT_TOP && target.y <= HIT_BOTTOM) {
    // PERFECT HIT!
    target.active = false;
    target.el.style.display = "none";
    combo++;
    score += 10 + (combo * 5); 
    updateHUD();
    vibration.start(HAPTICS[target.lane]); 
    
  } else {
    // BAD TAP!
    if (target) {
      target.active = false;
      target.el.style.display = "none";
    }
    
    combo = 0;
    playErrorBuzz(); // FIX: Call our custom short buzz!
    loseLife(); 
  }
}

// FIX: Custom function to chop off the infinite ring vibration
function playErrorBuzz() {
  vibration.start("ring"); // Start the heavy alarm motor
  setTimeout(() => { 
    vibration.stop();      // Forcefully kill it 200 milliseconds later
  }, 200);
}

function loseLife() {
  combo = 0;
  lives--;
  updateHUD();
  if (lives <= 0) triggerGameOver();
}

function updateHUD() {
  scoreTxt.text = score;
  comboTxt.text = `Combo: ${combo}`;
  let hearts = "";
  for (let i = 0; i < lives; i++) hearts += "♥";
  livesTxt.text = hearts;
}

function triggerGameOver() {
  isGameOver = true;
  clearInterval(gameLoop);
  touchZones.style.display = "none";
  overlay.style.display = "inline";
  statusTxt.text = "GAME OVER";
  statusTxt.style.fill = "#E74C3C";
  statusTxt.style.display = "inline";
}