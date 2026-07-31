import document from "document";
import { display } from "display";
import { vibration } from "haptics";
import * as fs from "fs";

// DOM Elements
let ball, scoreTxt, multiplierTxt, dropsTxt, dropZone, overlay, statusTxt, finalTxt, hiTxt;
let gameLoop = null;

// Game State
let isRoundOver = false;
let isFalling = false;       // true when ball is in motion
let score = 0;
let multiplier = 1;
let dropsLeft = 5;
let totalScore = 0;          // accumulated across all 5 drops
let ballX = 168, ballY = 30;
let vx = 0, vy = 0;

// Physics Constants
const GRAVITY = 0.3;
const FRICTION = 0.98;
const BOUNCE_DAMP = 0.6;
const BALL_RADIUS = 10;
const PEG_RADIUS = 8;

// Pre‑defined pegs
const pegs = [
  { x: 56, y: 100 }, { x: 112, y: 100 }, { x: 168, y: 100 },
  { x: 224, y: 100 }, { x: 280, y: 100 },
  { x: 84, y: 160 }, { x: 140, y: 160 }, { x: 196, y: 160 }, { x: 252, y: 160 },
  { x: 56, y: 220 }, { x: 112, y: 220 }, { x: 168, y: 220 },
  { x: 224, y: 220 }, { x: 280, y: 220 },
  { x: 84, y: 280 }, { x: 140, y: 280 }, { x: 196, y: 280 }, { x: 252, y: 280 }
];

// Buckets
const buckets = [
  { xMin: 10, xMax: 62, mult: 1 },
  { xMin: 70, xMax: 122, mult: 2 },
  { xMin: 130, xMax: 182, mult: 3 },
  { xMin: 190, xMax: 242, mult: 5 },
  { xMin: 250, xMax: 302, mult: 2 },
  { xMin: 310, xMax: 326, mult: 1 }
];

// High Score
const HIGH_SCORE_FILE = "neon_hiscore.txt";
let highScore = 0;

// Collision cooldown: prevent re‑hitting the same peg too quickly
let lastPegHit = -1;
let pegCooldown = 0;

export function initNeonApp() {
  ball = document.getElementById("neon-ball");
  scoreTxt = document.getElementById("neon-score");
  multiplierTxt = document.getElementById("neon-multiplier");
  dropsTxt = document.getElementById("neon-drops");
  dropZone = document.getElementById("neon-drop-zone");
  overlay = document.getElementById("neon-overlay");
  statusTxt = document.getElementById("neon-status");
  finalTxt = document.getElementById("neon-final");
  hiTxt = document.getElementById("neon-hi");

  // Load high score
  try {
    if (fs.existsSync(HIGH_SCORE_FILE)) {
      highScore = parseInt(fs.readFileSync(HIGH_SCORE_FILE, "ascii"), 10) || 0;
    }
  } catch(e) {}

  // Tap to aim & drop
  if (dropZone) {
    dropZone.onmousedown = (e) => {
      if (isRoundOver) {
        // Restart from overlay
        return;
      }
      if (!isFalling) {
        // Set horizontal position to tap X
        let newX = e.screenX;
        if (newX < BALL_RADIUS) newX = BALL_RADIUS;
        if (newX > 336 - BALL_RADIUS) newX = 336 - BALL_RADIUS;
        ballX = newX;
        // Release the ball
        isFalling = true;
        vx = 0;
        vy = 0;
        // Ensure ball is at top position
        ballY = 30;
        if (ball) {
          ball.cx = ballX;
          ball.cy = ballY;
        }
      }
    };
  }

  // Restart from overlay
  if (overlay) {
    overlay.onmousedown = () => {
      if (isRoundOver) resetGame();
    };
  }
}

export function startNeonApp() {
  display.autoOff = false;
  resetGame();
}

// ---------- KILL SWITCH ----------
export function stopNeonApp() {
  display.autoOff = true;
  isRoundOver = true;
  isFalling = false;
  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = null;
  }
  vibration.stop();
}

function resetGame() {
  // Reset for a fresh round
  totalScore = 0;
  dropsLeft = 5;
  score = 0;
  multiplier = 1;
  isRoundOver = false;
  isFalling = false;
  ballX = 168;
  ballY = 30;
  vx = 0;
  vy = 0;
  lastPegHit = -1;
  pegCooldown = 0;

  updateHUD();
  if (overlay) overlay.style.display = "none";
  if (ball) {
    ball.cx = ballX;
    ball.cy = ballY;
  }

  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameTick, 33);
}

function gameTick() {
  if (isRoundOver) return;
  if (!isFalling) return; // wait for tap

  // 1. Gravity
  vy += GRAVITY;

  // 2. Apply velocity
  ballX += vx;
  ballY += vy;

  // 3. Wall collisions
  if (ballX < BALL_RADIUS) {
    ballX = BALL_RADIUS;
    vx = -vx * 0.5;
  } else if (ballX > 336 - BALL_RADIUS) {
    ballX = 336 - BALL_RADIUS;
    vx = -vx * 0.5;
  }

  // 4. Peg collisions with cooldown
  if (pegCooldown > 0) pegCooldown--;
  for (let i = 0; i < pegs.length; i++) {
    if (i === lastPegHit && pegCooldown > 0) continue; // skip recent hit
    const p = pegs[i];
    const dx = ballX - p.x;
    const dy = ballY - p.y;
    const distSq = dx*dx + dy*dy;
    const threshold = BALL_RADIUS + PEG_RADIUS;
    if (distSq < threshold * threshold) {
      // Collision!
      const dist = Math.sqrt(distSq) || 0.001;
      const overlap = threshold - dist;
      // Push ball out
      ballX += (dx / dist) * (overlap + 0.5);
      ballY += (dy / dist) * (overlap + 0.5);
      // Reflect velocity with damping
      const nx = dx / dist;
      const ny = dy / dist;
      const dot = vx * nx + vy * ny;
      if (dot < 0) {
        vx -= 2 * dot * nx * BOUNCE_DAMP;
        vy -= 2 * dot * ny * BOUNCE_DAMP;
        // Add random perturbation
        vx += (Math.random() - 0.5) * 0.3;
        vy += (Math.random() - 0.5) * 0.3;
        // Haptic feedback
        playCustomBuzz("bump");
        // Small score bonus
        score += Math.floor(Math.random() * 3) + 1;
        updateHUD();
        // Set cooldown for this peg
        lastPegHit = i;
        pegCooldown = 3; // frames to ignore
      }
    }
  }

  // 5. Check if reached buckets
  if (ballY > 320 && ballY < 340) {
    let earned = 100;
    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i];
      if (ballX >= b.xMin && ballX <= b.xMax) {
        multiplier = b.mult;
        earned = 100 * b.mult;
        break;
      }
    }
    totalScore += earned;
    // Also add any bounce bonus already in `score`
    totalScore += score;
    // End this drop
    dropsLeft--;
    if (dropsLeft > 0) {
      // Reset ball to top, wait for next tap
      isFalling = false;
      ballX = 168;
      ballY = 30;
      vx = 0;
      vy = 0;
      score = 0;
      multiplier = 1;
      if (ball) {
        ball.cx = ballX;
        ball.cy = ballY;
      }
      updateHUD();
      playCustomBuzz("confirmation");
    } else {
      // Round complete
      triggerRoundEnd();
    }
    return;
  }

  // 6. Off screen safety
  if (ballY > 350) {
    // Lose this drop
    dropsLeft--;
    if (dropsLeft <= 0) triggerRoundEnd();
    else {
      isFalling = false;
      ballX = 168;
      ballY = 30;
      vx = 0;
      vy = 0;
      score = 0;
      multiplier = 1;
      if (ball) {
        ball.cx = ballX;
        ball.cy = ballY;
      }
      updateHUD();
    }
    return;
  }

  // Update ball graphic
  if (ball) {
    ball.cx = ballX;
    ball.cy = ballY;
  }

  // Friction
  vx *= FRICTION;
  vy *= FRICTION;
  if (Math.abs(vx) < 0.01) vx = 0;
  if (Math.abs(vy) < 0.01) vy = 0;
}

function updateHUD() {
  if (scoreTxt) scoreTxt.text = totalScore + score; // show running total
  if (multiplierTxt) multiplierTxt.text = "x" + multiplier;
  if (dropsTxt) dropsTxt.text = "Drops: " + dropsLeft;
}

function triggerRoundEnd() {
  isRoundOver = true;
  isFalling = false;
  clearInterval(gameLoop);
  gameLoop = null;

  // Update high score
  if (totalScore > highScore) {
    highScore = totalScore;
    try {
      fs.writeFileSync(HIGH_SCORE_FILE, String(highScore), "ascii");
    } catch(e) {}
  }

  if (statusTxt) statusTxt.text = totalScore >= highScore ? "NEW BEST!" : "ROUND OVER";
  if (finalTxt) finalTxt.text = totalScore;
  if (hiTxt) hiTxt.text = "BEST: " + highScore;
  if (overlay) overlay.style.display = "inline";

  playCustomBuzz("confirmation");
}

function playCustomBuzz(profile) {
  vibration.start(profile);
  setTimeout(() => { vibration.stop(); }, 120);
}