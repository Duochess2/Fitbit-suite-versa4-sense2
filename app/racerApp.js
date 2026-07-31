import document from "document";
import { display } from "display";
import { vibration } from "haptics";

let scoreTxt, overlay, finalTxt, playerCar, controller;
let gameLoop = null;

// UI Elements Pools
let enemies = [];
let roadLines = [];

// Constants
const SCREEN_W = 336;
const SCREEN_H = 336;
const CAR_W = 40;
const CAR_H = 60;
const PLAYER_Y = 250; 

// Game State
let isGameOver = true;
let score = 0;
let speed = 6;
let playerX = 148;

export function initRacerApp() {
  scoreTxt = document.getElementById("racer-score");
  overlay = document.getElementById("racer-overlay");
  finalTxt = document.getElementById("racer-final");
  playerCar = document.getElementById("racer-player");
  controller = document.getElementById("racer-controller");

  // Load 5 enemies into object pool
  for (let i = 0; i < 5; i++) {
    enemies.push({
      el: document.getElementById(`racer-e-${i}`),
      x: 0, y: -100, active: false, passed: false
    });
  }

  // Load 6 road lines for speed illusion
  for (let i = 0; i < 6; i++) {
    let lineEl = document.getElementById(`racer-l-${i}`);
    roadLines.push({
      el: lineEl,
      y: (i % 3) * 150 
    });
  }

  // 1:1 DRAG STEERING
  if (controller) {
    controller.onmousemove = (e) => {
      if (isGameOver) return;
      // Center the car on the finger
      playerX = e.screenX - (CAR_W / 2); 
      
      // Keep car on screen
      if (playerX < 0) playerX = 0;
      if (playerX > SCREEN_W - CAR_W) playerX = SCREEN_W - CAR_W;
      
      if (playerCar) playerCar.x = playerX;
    };
  }

  if (overlay) {
    overlay.onmousedown = () => { if (isGameOver) resetGame(); };
  }
}

export function startRacerApp() {
  display.autoOff = false;
  resetGame();
}

// ------------------------------------------
// THE LIFECYCLE KILL SWITCH
// ------------------------------------------
export function stopRacerApp() {
  isGameOver = true;
  display.autoOff = true;
  if (gameLoop) clearInterval(gameLoop);
  vibration.stop();
}

function resetGame() {
  isGameOver = false;
  score = 0;
  speed = 6;
  playerX = 148;
  
  if (playerCar) playerCar.x = playerX;
  if (scoreTxt) scoreTxt.text = "0";
  if (overlay) overlay.style.display = "none";

  // Hide all enemies to start
  for (let i = 0; i < 5; i++) {
    enemies[i].active = false;
    enemies[i].y = -200;
    if (enemies[i].el) enemies[i].el.style.display = "none";
  }

  // Start the engine
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameTick, 33); // 30 FPS Smoothness
}

function gameTick() {
  if (isGameOver) return;

  // 1. Move Road Lines (Speed illusion!)
  for (let i = 0; i < roadLines.length; i++) {
    let line = roadLines[i];
    line.y += speed;
    if (line.y > SCREEN_H) line.y = -60; // Loop back to top
    if (line.el) line.el.y = line.y;
  }

  // 2. Spawn Enemies
  // 5% chance per frame to spawn an enemy if one is available
  if (Math.random() < 0.05) {
    spawnEnemy();
  }

  // 3. Move Enemies & Check Collisions
  for (let i = 0; i < 5; i++) {
    let e = enemies[i];
    if (e.active) {
      e.y += speed;

      // STRICT AABB HITBOX COLLISION
      // Does the player rect overlap the enemy rect?
      if (
        playerX < e.x + CAR_W - 5 &&   // Right edge of player > Left edge of enemy (with 5px forgiveness)
        playerX + CAR_W - 5 > e.x &&   // Left edge of player < Right edge of enemy
        PLAYER_Y < e.y + CAR_H - 5 &&  // Top of player > Bottom of enemy
        PLAYER_Y + CAR_H - 5 > e.y     // Bottom of player > Top of enemy
      ) {
        triggerGameOver();
        return;
      }

      // Did we successfully pass the enemy?
      if (e.y > PLAYER_Y + CAR_H && !e.passed) {
        e.passed = true;
        score += 10;
        if (scoreTxt) scoreTxt.text = score;
        
        // Every 50 points, speed up the highway!
        if (score % 50 === 0) {
          speed += 1.5;
          if (speed > 16) speed = 16; // Cap the max speed so it's physically possible
          vibration.start("nudge"); // Tiny rumble to signal speed up
        }
      }

      // Did enemy go off screen? Recycle it!
      if (e.y > SCREEN_H) {
        e.active = false;
        if (e.el) e.el.style.display = "none";
      } else {
        if (e.el) {
          e.el.y = e.y;
          e.el.x = e.x;
        }
      }
    }
  }
}

function spawnEnemy() {
  for (let i = 0; i < 5; i++) {
    let e = enemies[i];
    if (!e.active) {
      e.active = true;
      e.passed = false;
      // Spawn slightly off the top of the screen
      e.y = -80 - (Math.random() * 50); 
      
      // Random X lane (keep them fully on the screen)
      e.x = Math.floor(Math.random() * (SCREEN_W - CAR_W)); 
      
      if (e.el) e.el.style.display = "inline";
      break; 
    }
  }
}

function triggerGameOver() {
  isGameOver = true;
  clearInterval(gameLoop);
  
  // Big crash haptic feedback
  vibration.start("ring");
  setTimeout(() => { vibration.stop(); }, 400);

  if (finalTxt) finalTxt.text = `Score: ${score}`;
  if (overlay) overlay.style.display = "inline";
}