import document from "document";
import { vibration } from "haptics";
import { display } from "display";

let ballGroup, aimLine, strokesTxt, overlay, statusTxt, controller;
let gameLoop = null;

// Physics Constants
const BALL_R = 8;
const HOLE = { x: 280, y: 50, r: 10 };
const FRICTION = 0.95;   // Slows down over time like rolling on grass
const BOUNCE = 0.7;      // Energy lost when hitting a wall (70% bounce back)

// Physical Walls (Matches XML layout perfectly)
const walls = [
  {x: 0, y: 0, w: 336, h: 10},     // Top
  {x: 0, y: 326, w: 336, h: 10},   // Bottom
  {x: 0, y: 0, w: 10, h: 336},     // Left
  {x: 326, y: 0, w: 10, h: 336},   // Right
  {x: 130, y: 10, w: 20, h: 200},  // Inner vertical
  {x: 130, y: 210, w: 120, h: 20}  // Inner horizontal
];

// Game State
let isGameOver = false;
let state = "idle"; // "idle", "aiming", "rolling"
let ballX = 50, ballY = 280;
let vx = 0, vy = 0;
let startX = 0, startY = 0; // Finger drag start positions
let strokes = 0;

export function initGolfApp() {
  ballGroup = document.getElementById("golf-ball-group");
  aimLine = document.getElementById("golf-aim-line");
  strokesTxt = document.getElementById("golf-strokes");
  overlay = document.getElementById("golf-overlay");
  statusTxt = document.getElementById("golf-status");
  controller = document.getElementById("golf-controller");

  // 1. Slingshot Mechanics
  if (controller) {
    controller.onmousedown = (e) => {
      if (state !== "idle" || isGameOver) return;
      state = "aiming";
      startX = e.screenX;
      startY = e.screenY;
      
      // Pin start of trajectory line to ball
      aimLine.x1 = ballX;
      aimLine.y1 = ballY;
      aimLine.x2 = ballX;
      aimLine.y2 = ballY;
      aimLine.style.display = "inline";
    };

    controller.onmousemove = (e) => {
      if (state !== "aiming") return;
      
      // Calculate pull distance
      let dragX = e.screenX - startX;
      let dragY = e.screenY - startY;
      
      // Project the aiming line forward in the opposite direction you pulled!
      aimLine.x2 = ballX - dragX;
      aimLine.y2 = ballY - dragY;
    };

    controller.onmouseup = (e) => {
      if (state !== "aiming") return;
      aimLine.style.display = "none";
      
      let dragX = e.screenX - startX;
      let dragY = e.screenY - startY;
      
      // Too weak of a pull? Cancel shot.
      if (Math.abs(dragX) < 5 && Math.abs(dragY) < 5) {
        state = "idle";
        return; 
      }

      // LAUNCH THE BALL!
      vx = -dragX * 0.15; // Power multiplier
      vy = -dragY * 0.15;
      
      strokes++;
      strokesTxt.text = `Strokes: ${strokes}`;
      state = "rolling";
      vibration.start("nudge");
    };
  }

  // 2. Restart Engine
  if (overlay) {
    overlay.onmousedown = () => {
      if (isGameOver) resetGame();
    };
  }
}

export function startGolfApp() {
  display.autoOff = false; 
  resetGame();
}

export function stopGolfApp() {
  display.autoOff = true;
  isGameOver = true;
  if (gameLoop) clearInterval(gameLoop);
}

function resetGame() {
  ballX = 50; ballY = 280;
  vx = 0; vy = 0;
  strokes = 0;
  state = "idle";
  isGameOver = false;

  strokesTxt.text = "Strokes: 0";
  overlay.style.display = "none";
  ballGroup.groupTransform.translate.x = ballX;
  ballGroup.groupTransform.translate.y = ballY;

  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameTick, 33); // 30 Frames Per Second Physics Engine
}

function gameTick() {
  if (state !== "rolling") return;

  // 1. Apply velocity & friction
  ballX += vx;
  ballY += vy;
  vx *= FRICTION;
  vy *= FRICTION;

  // 2. AABB Wall Bouncing
  checkWallCollisions();

  // 3. Update Graphics
  ballGroup.groupTransform.translate.x = ballX;
  ballGroup.groupTransform.translate.y = ballY;

  // 4. Did we hit the hole?
  checkHole();

  // 5. Check if ball has completely stopped rolling
  if (Math.abs(vx) < 0.2 && Math.abs(vy) < 0.2) {
    vx = 0; vy = 0;
    state = "idle";
  }
}

function checkWallCollisions() {
  for (let i = 0; i < walls.length; i++) {
    let w = walls[i];
    
    // Find closest point on wall to ball
    let closestX = Math.max(w.x, Math.min(ballX, w.x + w.w));
    let closestY = Math.max(w.y, Math.min(ballY, w.y + w.h));
    
    let dx = ballX - closestX;
    let dy = ballY - closestY;
    let distSq = dx * dx + dy * dy;
    
    // OVERLAP DETECTED!
    if (distSq < BALL_R * BALL_R) {
      let dist = Math.sqrt(distSq) || 0.1;
      let overlap = BALL_R - dist;
      
      // Eject ball out of wall physically
      ballX += (dx / dist) * overlap;
      ballY += (dy / dist) * overlap;
      
      // Reverse velocity to bounce, and decay energy
      if (Math.abs(dx) > Math.abs(dy)) {
        vx = -vx * BOUNCE;
      } else {
        vy = -vy * BOUNCE;
      }
      playCustomBuzz("bump");
    }
  }
}

function checkHole() {
  let dx = ballX - HOLE.x;
  let dy = ballY - HOLE.y;
  let distSq = dx * dx + dy * dy;

  if (distSq < HOLE.r * HOLE.r) {
    let speedSq = vx * vx + vy * vy;
    
    if (speedSq > 35) {
      // Ball was moving too fast! It skims over the hole!
      playCustomBuzz("ping");
    } else {
      // Sink it!
      ballX = HOLE.x; 
      ballY = HOLE.y;
      vx = 0; 
      vy = 0;
      triggerWin();
    }
  }
}

function triggerWin() {
  state = "idle";
  isGameOver = true;
  clearInterval(gameLoop);
  
  if (strokes === 1) statusTxt.text = "HOLE IN ONE!";
  else if (strokes === 2) statusTxt.text = "BIRDIE!";
  else if (strokes === 3) statusTxt.text = "PAR!";
  else statusTxt.text = `+${strokes - 3} OVER PAR`;
  
  overlay.style.display = "inline";
  playCustomBuzz("confirmation");
}

function playCustomBuzz(profile) {
  vibration.start(profile);
  setTimeout(() => { vibration.stop(); }, 150);
}