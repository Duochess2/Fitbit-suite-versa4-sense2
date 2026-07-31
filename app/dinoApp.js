import document from "document";
import { vibration } from "haptics";
import * as fs from "fs";

let scoreTxt, hiScoreTxt, dinoStand, dinoDuck, gameOverGroup, controller, btnExit;
let obsEls = [];
let gameLoop = null;

// Physics Constants
const GROUND_Y = 240;
const GRAVITY = 1.6;
const JUMP_FORCE = 18;

// Game State
let dinoY = 0; // 0 is grounded
let dinoVy = 0;
let isDucking = false;
let score = 0;
let hiScore = 0;
let gameSpeed = 10;
let isGameOver = true;
let frameCount = 0;
let startTouchY = 0;

let obstacles = [
  { id: 0, x: -100, y: 0, w: 20, h: 40, active: false }, // Cactus
  { id: 1, x: -100, y: 35, w: 35, h: 15, active: false } // Bird
];

// FIXED: Old-school string padding instead of .padStart()
function padScore(num) {
  return ("00000" + num).slice(-5);
}

export function initDinoApp(closeCallback) {
  scoreTxt = document.getElementById("dino-score");
  hiScoreTxt = document.getElementById("dino-hi-score");
  dinoStand = document.getElementById("dino-stand");
  dinoDuck = document.getElementById("dino-duck");
  gameOverGroup = document.getElementById("dino-game-over");
  controller = document.getElementById("dino-controller");
  btnExit = document.getElementById("dino-btn-exit");

  obsEls[0] = document.getElementById("dino-obs-0");
  obsEls[1] = document.getElementById("dino-obs-1");

  try {
    let saved = fs.readFileSync("dinoHiScore.txt", "utf-8");
    if (saved) hiScore = parseInt(saved, 10);
  } catch(e) {}
  hiScoreTxt.text = `HI ${padScore(hiScore)}`;

  if (controller) {
    controller.onmousedown = (e) => {
      if (isGameOver) {
        resetGame();
        return;
      }
      startTouchY = e.screenY;
      
      if (dinoY === 0) {
        dinoVy = JUMP_FORCE;
        isDucking = false;
        vibration.start("bump");
      }
    };

    controller.onmousemove = (e) => {
      if (isGameOver) return;
      if (e.screenY - startTouchY > 20) {
        isDucking = true;
        if (dinoY > 0 && dinoVy > 0) dinoVy = -5; // Fast-fall!
      }
    };

    controller.onmouseup = () => { isDucking = false; };
  }

  if (btnExit) btnExit.onclick = () => {
    stopDinoApp();
    if(closeCallback) closeCallback();
  };
}

export function startDinoApp() {
  resetGame();
}

export function stopDinoApp() {
  if (gameLoop) clearInterval(gameLoop);
  isGameOver = true;
}

function resetGame() {
  if (gameLoop) clearInterval(gameLoop);
  score = 0;
  gameSpeed = 10;
  dinoY = 0;
  dinoVy = 0;
  isDucking = false;
  frameCount = 0;
  isGameOver = false;
  
  for(let i=0; i<obstacles.length; i++) {
    obstacles[i].active = false;
    obstacles[i].x = -100;
  }
  
  gameOverGroup.style.display = "none";
  scoreTxt.text = "00000";
  
  gameLoop = setInterval(gameTick, 33);
}

function gameTick() {
  if (isGameOver) return;
  frameCount++;

  // 1. PHYSICS
  dinoVy -= GRAVITY;
  if (isDucking && dinoVy > 0) dinoVy -= GRAVITY; // Fall fast
  
  dinoY += dinoVy;
  if (dinoY <= 0) {
    dinoY = 0;
    dinoVy = 0;
  }

// 2. SCORE
  if (frameCount % 3 === 0) {
    score++;
    scoreTxt.text = padScore(score);
    
    // INCREASE DIFFICULTY FASTER:
    // Speeds up every 50 points instead of 100, and adds 0.8 speed instead of 0.4
    if (score % 50 === 0) {
      gameSpeed += 0.8; 
    }
  }

  // 3. OBSTACLES (FIXED: Using classic 'for' loop)
  let activeCount = 0;
  for(let i = 0; i < obstacles.length; i++) {
    if (obstacles[i].active) {
      obstacles[i].x -= gameSpeed;
      if (obstacles[i].x < -50) obstacles[i].active = false;
      activeCount++;
    }
  }

  if (activeCount < 2 && frameCount > 40) {
    if (Math.random() < 0.03) {
      let inactiveObs = null;
      for(let i=0; i<obstacles.length; i++) {
        if(!obstacles[i].active) { inactiveObs = obstacles[i]; break; }
      }
      
      if (inactiveObs) {
        let gapSafe = true;
        for(let i=0; i<obstacles.length; i++) {
          if(obstacles[i].active && obstacles[i].x > 150) gapSafe = false;
        }
        if (gapSafe) {
          inactiveObs.active = true;
          inactiveObs.x = 350; 
        }
      }
    }
  }

  checkCollisions();
  drawGraphics();
}

function checkCollisions() {
  // Hitbox depends on if we are standing or ducking
  let dx = 40; 
  let dy = dinoY;
  let dw = isDucking ? 58 : 38;
  let dh = isDucking ? 25 : 45;

  for(let i=0; i<obstacles.length; i++) {
    let obs = obstacles[i];
    if (!obs.active) continue;
    
    if (dx < obs.x + obs.w && dx + dw > obs.x &&
        dy < obs.y + obs.h && dy + dh > obs.y) {
      triggerGameOver();
    }
  }
}

function drawGraphics() {
  // Toggle the correct graphic and move it up/down
  if (isDucking) {
    dinoStand.style.display = "none";
    dinoDuck.style.display = "inline";
    dinoDuck.groupTransform.translate.y = GROUND_Y - dinoY - 25; 
  } else {
    dinoStand.style.display = "inline";
    dinoDuck.style.display = "none";
    dinoStand.groupTransform.translate.y = GROUND_Y - dinoY - 45; 
  }

  // Draw obstacles
  for(let i=0; i<obstacles.length; i++) {
    let obs = obstacles[i];
    let el = obsEls[i];
    if (obs.active) {
      el.style.display = "inline";
      el.x = obs.x;
      el.y = GROUND_Y - obs.y - obs.h;
    } else {
      el.style.display = "none";
    }
  }
}

function triggerGameOver() {
  isGameOver = true;
  clearInterval(gameLoop);
  vibration.start("nudge");
  gameOverGroup.style.display = "inline";
  
  if (score > hiScore) {
    hiScore = score;
    hiScoreTxt.text = `HI ${padScore(hiScore)}`;
    try { fs.writeFileSync("dinoHiScore.txt", String(hiScore), "utf-8"); } catch(e){}
  }
}