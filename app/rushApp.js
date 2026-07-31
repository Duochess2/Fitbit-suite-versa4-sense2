import document from "document";
import { display } from "display";
import { Accelerometer } from "accelerometer";
import { vibration } from "haptics";
import * as fs from "fs";

const SCORE_FILE = "rush_hiscore.txt";

let scoreTxt, hiScoreTxt, commandTxt, timeBar, controller, overlay, finalTxt, failReasonTxt;
let gameLoop = null;
let accel = null;

// Game State
let isGameOver = true;
let score = 0;
let highScore = 0;

// Timing State
let maxTime = 1500; // Starts at 1.5 seconds
let timeLeft = 1500;
let lastTick = 0;

// Command Engine
const COMMANDS = ["TAP!", "HOLD!", "SWIPE LEFT!", "SWIPE RIGHT!", "TILT LEFT!", "TILT RIGHT!"];
let currentCommand = "";

// Touch Tracking
let isTouching = false;
let touchStartX = 0, touchStartY = 0;
let touchStartTime = 0;

export function initRushApp() {
  scoreTxt = document.getElementById("rush-score");
  hiScoreTxt = document.getElementById("rush-hi-score");
  commandTxt = document.getElementById("rush-command");
  timeBar = document.getElementById("rush-time-bar");
  controller = document.getElementById("rush-controller");
  overlay = document.getElementById("rush-overlay");
  finalTxt = document.getElementById("rush-final");
  failReasonTxt = document.getElementById("rush-fail-reason");

  loadHighScore();

  // HARDWARE SENSOR (Tilting)
  if (Accelerometer) {
    try {
      accel = new Accelerometer({ frequency: 30 });
      accel.addEventListener("reading", () => {
        if (isGameOver) return;
        // X-axis: Left tilt is negative, Right tilt is positive.
        // We use a high threshold (7) so it requires a deliberate physical flick!
        if (accel.x < -7) evaluateAction("TILT LEFT!");
        if (accel.x > 7) evaluateAction("TILT RIGHT!");
      });
    } catch(e) {}
  }

  // TOUCH SENSOR (Taps, Holds, Swipes)
  if (controller) {
    controller.onmousedown = (e) => {
      if (isGameOver) return;
      isTouching = true;
      touchStartX = e.screenX;
      touchStartY = e.screenY;
      touchStartTime = Date.now();
    };

    controller.onmouseup = (e) => {
      if (isGameOver || !isTouching) return;
      isTouching = false;
      
      let dx = e.screenX - touchStartX;
      let timeHeld = Date.now() - touchStartTime;

      if (Math.abs(dx) > 40) {
        // It's a horizontal swipe
        if (dx > 0) evaluateAction("SWIPE RIGHT!");
        else evaluateAction("SWIPE LEFT!");
      } else if (timeHeld < 300) {
        // Quick release without moving much -> TAP
        evaluateAction("TAP!");
      }
    };
  }

  // Restart tap
  if (overlay) {
    overlay.onmousedown = () => { if (isGameOver) resetGame(); };
  }
}

export function startRushApp() {
  display.autoOff = false;
  if (accel) accel.start();
  resetGame();
}

// ------------------------------------------
// THE LIFECYCLE KILL SWITCH
// ------------------------------------------
export function stopRushApp() {
  isGameOver = true;
  display.autoOff = true;
  if (accel) accel.stop();
  if (gameLoop) clearInterval(gameLoop);
  vibration.stop();
}

function resetGame() {
  isGameOver = false;
  score = 0;
  maxTime = 1500; 
  isTouching = false;
  
  loadHighScore();
  
  if (scoreTxt) scoreTxt.text = "0";
  if (hiScoreTxt) hiScoreTxt.text = `HI: ${highScore}`;
  if (overlay) overlay.style.display = "none";
  if (timeBar) {
    timeBar.width = 268; // 80% of 336 screen width
    timeBar.style.fill = "#FF9800"; // Reset to Orange
  }

  pickNextCommand();

  lastTick = Date.now();
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameTick, 33); // 30 FPS logic
}

function pickNextCommand() {
  // Randomly select a command, ensuring it doesn't repeat the exact same one
  let nextCmd = currentCommand;
  while (nextCmd === currentCommand) {
    nextCmd = COMMANDS[Math.floor(Math.random() * COMMANDS.length)];
  }
  
  currentCommand = nextCmd;
  if (commandTxt) commandTxt.text = currentCommand;

  // Reset the timer for this round
  timeLeft = maxTime;
  isTouching = false; 
}

function gameTick() {
  if (isGameOver) return;

  let now = Date.now();
  let delta = now - lastTick;
  lastTick = now;

  // Decrease Time
  timeLeft -= delta;

  // Update Timer Bar Graphics
  if (timeBar) {
    let pct = Math.max(0, timeLeft / maxTime);
    timeBar.width = Math.floor(268 * pct);
    
    // Turn bar red when time is critically low
    if (pct < 0.25) timeBar.style.fill = "#E74C3C";
    else timeBar.style.fill = "#FF9800";
  }

  // 1. Check Death by Timeout
  if (timeLeft <= 0) {
    triggerGameOver("TOO SLOW!");
    return;
  }

  // 2. Check "HOLD!" logic
  // If they have been holding the screen for more than 400ms without moving
  if (isTouching && (now - touchStartTime > 400)) {
    evaluateAction("HOLD!");
    isTouching = false; // Reset to prevent double-triggering
  }
}

// Check if the physical action matches what the screen is asking for
function evaluateAction(actionPerformed) {
  if (isGameOver) return;

  if (actionPerformed === currentCommand) {
    // SUCCESS!
    score++;
    if (scoreTxt) scoreTxt.text = score;
    
    // Speed up the game slightly every round! (Cap at insane 0.5 seconds)
    maxTime -= 30; 
    if (maxTime < 500) maxTime = 500; 

    vibration.start("confirmation"); // Triumphant buzz
    pickNextCommand();
  } else {
    // We ignore wrong inputs so the player isn't punished for an accidental micro-swipe.
    // They just have to keep trying to do the right input before the timer hits 0.
  }
}

function triggerGameOver(reason) {
  isGameOver = true;
  clearInterval(gameLoop);
  isTouching = false;
  
  vibration.start("nudge-max"); // Aggressive fail haptic
  setTimeout(() => { vibration.stop(); }, 400);

  if (score > highScore) {
    highScore = score;
    saveHighScore(highScore);
    reason = "NEW RECORD!";
  }

  if (failReasonTxt) failReasonTxt.text = reason;
  if (finalTxt) finalTxt.text = `Score: ${score}`;
  if (overlay) overlay.style.display = "inline";
}

// ----- FILE SYSTEM HIGH SCORE ENGINE -----
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