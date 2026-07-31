import document from "document";
import { vibration } from "haptics";
import * as fs from "fs";

let scoreTxt, hiScoreTxt, msgTxt, hoopGroup, ballGroup, powerupEl, auraEl, gameOverGroup, controller, btnExit;
let gameLoop = null;

// Physics & Grid
const GRAVITY = 1.2;
const JUMP_FORCE = -12;
const BALL_X = 100;
const BALL_R = 15;

// State
let ballY = 160;
let ballVy = 0;
let score = 0;
let hiScore = 0;
let isGameOver = true;
let msgTimer = 0;
let gameSpeed = 5;
let hasShield = false;

// Hoop State
let hoop = {
  x: 350,
  y: 150,
  scored: false,
  perfect: true,
  hasPowerup: false,
  passedTop: false // NEW: Stops the bottom-scoring glitch!
};

export function initDunkApp(closeCallback) {
  scoreTxt = document.getElementById("dunk-score");
  hiScoreTxt = document.getElementById("dunk-hi-score");
  msgTxt = document.getElementById("dunk-msg");
  hoopGroup = document.getElementById("dunk-hoop-group");
  ballGroup = document.getElementById("dunk-ball-group");
  powerupEl = document.getElementById("dunk-powerup");
  auraEl = document.getElementById("dunk-aura");
  gameOverGroup = document.getElementById("dunk-game-over");
  controller = document.getElementById("dunk-controller");
  btnExit = document.getElementById("dunk-btn-exit");

  try {
    let saved = fs.readFileSync("dunkHiScore.txt", "utf-8");
    if (saved) hiScore = parseInt(saved, 10);
  } catch(e) {}
  hiScoreTxt.text = `HI ${hiScore}`;

  if (controller) {
    controller.onmousedown = () => {
      if (isGameOver) {
        resetGame();
      } else {
        ballVy = JUMP_FORCE; 
      }
    };
  }

  if (btnExit) btnExit.onclick = () => {
    stopDunkApp();
    if(closeCallback) closeCallback();
  };
}

export function startDunkApp() {
  resetGame();
}

export function stopDunkApp() {
  if (gameLoop) clearInterval(gameLoop);
  isGameOver = true;
}

function resetGame() {
  if (gameLoop) clearInterval(gameLoop);
  score = 0;
  gameSpeed = 5;
  ballY = 160;
  ballVy = 0;
  hasShield = false;
  isGameOver = false;
  msgTimer = 0;
  
  spawnHoop(350);
  
  gameOverGroup.style.display = "none";
  msgTxt.style.display = "none";
  scoreTxt.text = "0";
  
  gameLoop = setInterval(gameTick, 33);
}

function spawnHoop(startX) {
  hoop.x = startX;
  hoop.y = Math.floor(Math.random() * 140) + 100; 
  hoop.scored = false;
  hoop.perfect = true;
  hoop.passedTop = false; // Reset the glitch-check
  hoop.hasPowerup = (!hasShield && Math.random() < 0.25); 
}

function gameTick() {
  if (isGameOver) return;

  // 1. BALL PHYSICS
  ballVy += GRAVITY;
  ballY += ballVy;

  // 2. HOOP MOVEMENT
  hoop.x -= gameSpeed;
  if (hoop.x < -120) spawnHoop(336);

  // 3. LOGIC & COLLISIONS
  checkCollisions();

  // 4. SHIELD / MISS LOGIC
  // Floor check
  if (ballY > 320) {
    if (hasShield) useShield(JUMP_FORCE * 1.5); 
    else triggerGameOver();
  }

  // Missed the hoop completely (passed behind us)
  if (hoop.x + 90 < BALL_X - BALL_R && !hoop.scored) {
    if (hasShield) {
      useShield(JUMP_FORCE);
      hoop.scored = true; // Burn shield, get a free pass
    } else {
      triggerGameOver();
    }
  }

  // 5. GRAPHICS UPDATE
  ballGroup.groupTransform.translate.y = ballY;
  hoopGroup.groupTransform.translate.x = hoop.x;
  hoopGroup.groupTransform.translate.y = hoop.y;
  
  powerupEl.style.display = hoop.hasPowerup ? "inline" : "none";
  auraEl.style.display = hasShield ? "inline" : "none";

  if (msgTimer > 0) {
    msgTimer--;
    if (msgTimer === 0) msgTxt.style.display = "none";
  }
}

function checkCollisions() {
  // A. TRACK BALL POSITION TO FIX GLITCH
  // The ball MUST go higher than the rim before it can score
  if (!hoop.passedTop && ballY < hoop.y && BALL_X > hoop.x - 20 && BALL_X < hoop.x + 110) {
    hoop.passedTop = true;
  }

  // B. POWERUP COLLISION (Expanded Grab Radius for forgiveness!)
  if (hoop.hasPowerup) {
    let px = hoop.x + 45;
    let py = hoop.y - 40;
    let dx = BALL_X - px;
    let dy = ballY - py;
    if (dx*dx + dy*dy <= 900) { // Massive 30px grab radius
      hasShield = true;
      hoop.hasPowerup = false;
      vibration.start("bump");
    }
  }

  // C. RIM COLLISIONS 
  // Lowered from 400 to 324 for softer, more forgiving hitboxes!
  let collisionDistSq = 324; 
  
  // Left Rim
  let ldx = BALL_X - hoop.x;
  let ldy = ballY - hoop.y;
  if (ldx*ldx + ldy*ldy <= collisionDistSq) {
    if (ballY > hoop.y + 2) ballVy = 6; // Hit from below -> Bounce DOWN
    else bounceOffRim();                // Hit from above -> Bounce UP
  }

  // Right Rim (Now at +90 width)
  let rdx = BALL_X - (hoop.x + 90);
  let rdy = ballY - hoop.y;
  if (rdx*rdx + rdy*rdy <= collisionDistSq) {
    if (ballY > hoop.y + 2) ballVy = 6; // Hit from below -> Bounce DOWN
    else bounceOffRim();                // Hit from above -> Bounce UP
  }

  // D. SCORING LOGIC
  // MUST have passed the top, MUST be falling, MUST be horizontally inside
  if (!hoop.scored && hoop.passedTop && ballVy > 0 && BALL_X > hoop.x && BALL_X < hoop.x + 90 && ballY > hoop.y) {
    hoop.scored = true;
    
    if (hoop.perfect) {
      score += 3;
      msgTxt.text = "PERFECT +3!";
      msgTxt.style.fill = "#F1C40F"; // Gold
      vibration.start("confirmation");
    } else {
      score += 1;
      msgTxt.text = "SWISH +1";
      msgTxt.style.fill = "white";
    }
    
    msgTxt.style.display = "inline";
    msgTimer = 30;
    scoreTxt.text = score;

    if (score % 15 === 0) gameSpeed += 0.5;
  }
}

function bounceOffRim() {
  hoop.perfect = false;
  ballVy = -6; 
  vibration.start("bump");
}

function useShield(bounceVelocity) {
  hasShield = false;
  ballVy = bounceVelocity;
  vibration.start("nudge");
  
  msgTxt.text = "SHIELD BROKEN!";
  msgTxt.style.fill = "#00FFFF";
  msgTxt.style.display = "inline";
  msgTimer = 30;
}

function triggerGameOver() {
  isGameOver = true;
  clearInterval(gameLoop);
  vibration.start("nudge");
  gameOverGroup.style.display = "inline";
  
  if (score > hiScore) {
    hiScore = score;
    hiScoreTxt.text = `HI ${hiScore}`;
    try { fs.writeFileSync("dunkHiScore.txt", String(hiScore), "utf-8"); } catch(e){}
  }
}