import document from "document";
import { display } from "display";
import { Accelerometer } from "accelerometer";
import { vibration } from "haptics";

let ball, scoreTxt, overlay, finalTxt;
let gameLoop = null;
let accel = null;

let isGameOver = true;
let score = 0;
let wallSpeed = 3.5;

let ballX = 168, ballY = 80;
let vx = 0; 
const BALL_R = 12;
const GAP_W = 85; 
const WALL_H = 15;
const SCREEN_W = 336;
const GRAVITY = 5; 

let walls = [];

export function initAbyssApp() {
  ball = document.getElementById("abyss-ball");
  scoreTxt = document.getElementById("abyss-score");
  overlay = document.getElementById("abyss-overlay");
  finalTxt = document.getElementById("abyss-final");

  for(let i = 0; i < 4; i++) {
    walls.push({
      y: 0,
      gapX: 0,
      passed: false,
      lEl: document.getElementById(`abyss-w-${i}-l`),
      rEl: document.getElementById(`abyss-w-${i}-r`)
    });
  }

  // HARDWARE SENSOR
  if (Accelerometer) {
    try {
      accel = new Accelerometer({ frequency: 30 });
      accel.addEventListener("reading", () => {
        if (isGameOver) return;
        // Map wrist tilt (X-axis) to velocity. 
        // Fitbit's X axis is negative when tilted left, positive right.
        vx = -(accel.x || 0) * 2.2; 
      });
    } catch(e) {}
  }

  if(overlay) {
    overlay.onmousedown = () => { if(isGameOver) resetGame(); };
  }
}

export function startAbyssApp() {
  display.autoOff = false;
  if(accel) accel.start();
  resetGame();
}

// ------------------------------------------
// THE KILL SWITCH REQUIREMENT
// ------------------------------------------
export function stopAbyssApp() {
  display.autoOff = true;
  isGameOver = true;
  if (accel) accel.stop(); 
  if (gameLoop) clearInterval(gameLoop);
  vibration.stop();
}

function resetGame() {
  score = 0;
  wallSpeed = 3.5;
  ballX = 168; 
  ballY = 80;
  vx = 0;
  isGameOver = false;
  
  if (scoreTxt) scoreTxt.text = "0";
  if (overlay) overlay.style.display = "none";

  // Space the 4 walls out vertically from the bottom of the screen
  for(let i = 0; i < 4; i++) {
    let w = walls[i];
    w.y = 336 + (i * 105);
    w.passed = false;
    w.gapX = Math.floor(Math.random() * (SCREEN_W - GAP_W - 40)) + 20;
    updateWallGraphics(w);
  }

  if(gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameTick, 33);
}

function gameTick() {
  if (isGameOver) return;

  // 1. Move Ball Horizontally (from Tilt)
  ballX += vx;
  if (ballX < BALL_R) ballX = BALL_R;
  if (ballX > SCREEN_W - BALL_R) ballX = SCREEN_W - BALL_R;

  // 2. Default Gravity (Fall down!)
  let targetY = ballY + GRAVITY;

  // 3. Move Walls & Check Collisions
  let standingOnWall = false;

  for(let i = 0; i < 4; i++) {
    let w = walls[i];
    w.y -= wallSpeed; // Wall scrolls UP

    // AABB Collision Math (Is ball overlapping this specific wall's Y level?)
    if (targetY + BALL_R >= w.y && ballY - BALL_R <= w.y + WALL_H) {
      // Is it hitting the solid parts instead of the gap?
      if (ballX - BALL_R < w.gapX || ballX + BALL_R > w.gapX + GAP_W) {
        // PUSH BALL UP!
        targetY = w.y - BALL_R; 
        standingOnWall = true;
      }
    }

    // Did the wall go off the top of the screen? Recycle it!
    if (w.y < -WALL_H) {
      w.y = 390; // Send back to bottom
      w.gapX = Math.floor(Math.random() * (SCREEN_W - GAP_W - 40)) + 20;
      w.passed = false;
    }

    // Did we pass a wall?
    if (w.y < targetY && !w.passed) {
      w.passed = true;
      score++;
      if(scoreTxt) scoreTxt.text = score;
      if (score % 5 === 0) wallSpeed += 0.3; // Speed up!
    }

    updateWallGraphics(w);
  }

  ballY = targetY;
  if (ballY > 320) ballY = 320; // Cap falling at bottom of screen

  // Update Ball Graphic
  if(ball) {
    ball.cx = ballX;
    ball.cy = ballY;
  }

  // 4. DEATH CHECK (Crushed against the top of the screen)
  if (ballY <= BALL_R + 5) {
    triggerGameOver();
  }
}

function updateWallGraphics(w) {
  if(w.lEl) {
    w.lEl.y = w.y;
    w.lEl.width = w.gapX;
  }
  if(w.rEl) {
    w.rEl.x = w.gapX + GAP_W;
    w.rEl.y = w.y;
    w.rEl.width = SCREEN_W - (w.gapX + GAP_W);
  }
}

function triggerGameOver() {
  isGameOver = true;
  clearInterval(gameLoop);
  
  if (finalTxt) finalTxt.text = `Score: ${score}`;
  if (overlay) overlay.style.display = "inline";
  
  vibration.start("ring");
  setTimeout(() => { vibration.stop(); }, 250);
}