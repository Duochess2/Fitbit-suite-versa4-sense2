import document from "document";
import { display } from "display";
import { vibration } from "haptics";

let scoreTxt, overlay, finalTxt, movingBlock, controller, flashEl;
let gameLoop = null;

// UI Constants
const SCREEN_W = 336;
const BLOCK_H = 20;
const BASE_Y = 320; // Y where base platform starts
const TOWER_BOTTOM_Y = BASE_Y - BLOCK_H; // Y of first placed block
const MAX_POOL = 8;
const MIN_WIDTH = 5;

// Game State
let isGameOver = true;
let score = 0;
let baseSpeed = 4;
let currSpeed = baseSpeed;

// Physical variables
let blockWidth = 140;
let movingX = 0;
let movingDir = 1; // 1 = Right, -1 = Left

// Logic variables for the underlying tower model
let poolIndex = 0; // Which pool rectangle to use next
let towerPositions = []; // Array of {x, w} of placed blocks
let visualPool = []; // Array of physical XML elements

export function initStackApp() {
  scoreTxt = document.getElementById("stack-score");
  overlay = document.getElementById("stack-overlay");
  finalTxt = document.getElementById("stack-final");
  movingBlock = document.getElementById("stack-moving");
  controller = document.getElementById("stack-controller");
  flashEl = document.getElementById("stack-flash");

  // Fill visual element pool
  for (let i = 0; i < MAX_POOL; i++) {
    visualPool.push(document.getElementById(`stack-t-${i}`));
  }

  // DROP BLOCK Input
  if (controller) {
    controller.onmousedown = () => { if (!isGameOver) dropBlock(); };
  }

  // Restart tap
  if (overlay) {
    overlay.onmousedown = () => { if (isGameOver) resetGame(); };
  }
}

export function startStackApp() {
  display.autoOff = false;
  resetGame();
}

// ------------------------------------------
// LIFECYCLE KILL SWITCH
// ------------------------------------------
export function stopStackApp() {
  isGameOver = true;
  display.autoOff = true;
  if (gameLoop) clearInterval(gameLoop);
  vibration.stop();
  resetFlash(); // kill flash animation if active
}

function resetGame() {
  isGameOver = false;
  score = 0;
  blockWidth = 140;
  movingX = 0;
  movingDir = 1;
  currSpeed = baseSpeed;
  
  if (scoreTxt) scoreTxt.text = "0";
  if (overlay) overlay.style.display = "none";
  resetFlash();

  // Reset tower model. Base level starts with full width at X=0
  towerPositions = [{ x: 0, w: SCREEN_W }]; 
  
  // Clean the visual pool
  for(let i=0; i<MAX_POOL; i++) {
    if(visualPool[i]) visualPool[i].style.display = "none";
  }
  poolIndex = 0;

  // Place First Block on Base visually
  placeFirstBlock();

  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameTick, 33); // 30 FPS Loop
}

function gameTick() {
  if (isGameOver) return;

  // Move current block horizontally
  movingX += currSpeed * movingDir;

  // Bounce off screen walls
  if (movingX + blockWidth > SCREEN_W) {
    movingX = SCREEN_W - blockWidth;
    movingDir = -1;
  } else if (movingX < 0) {
    movingX = 0;
    movingDir = 1;
  }

  // Update visual position
  if (movingBlock) {
    movingBlock.x = movingX;
  }
}

function placeFirstBlock() {
  // Visually setup the static 'base' block in the pool
  let el = visualPool[poolIndex];
  if(el) {
    el.x = 0;
    el.y = TOWER_BOTTOM_Y;
    el.width = SCREEN_W;
    el.style.display = "inline";
    
    // Add real physical dimensions to model (it's the 'ground' essentially)
    towerPositions.push({ x: 0, w: SCREEN_W });
    poolIndex++;
  }
  
  // Setup the next moving block
  setupMovingBlock();
}

function setupMovingBlock() {
  // Spawn next block above the tower top (e.g., at base height Y=100)
  movingX = 0;
  movingDir = 1;
  if(movingBlock) {
    movingBlock.x = movingX;
    movingBlock.y = 100;
    movingBlock.width = blockWidth;
    movingBlock.style.display = "inline";
  }
}

// ------------------------------------------
// CORE OVERLAP LOGIC (The "Stack" Math)
// ------------------------------------------
function dropBlock() {
  vibration.start("bump"); // Immediate haptic feedback for click

  // 1. Grab the block we are landing on (the last one in the tower array)
  let prev = towerPositions[towerPositions.length - 1];
  
  // Calculate difference between moving X and previous block X
  let deltaX = movingX - prev.x;
  let absDeltaX = Math.abs(deltaX);

  // 2. CHECK FAILURE: Totally missed the block below?
  if (absDeltaX >= prev.w) {
    // Died when falls off.
    triggerGameOver();
    return;
  }

  // 3. Perfect Landing Bonus
  if (absDeltaX < 4) { // Give a tiny 4px perfect tolerance
    deltaX = 0; // Snap to center
    score += 5; // Perfect bonus points
    vibration.start("confirmation"); // Double tap haptic
    playFlash();
  } else {
    // Settle for imperfect land
    score += 1;
  }
  
  // Update HUD
  if (scoreTxt) scoreTxt.text = score;

  // 4. SHRINK LOGIC: Apply "cut off" mechanic
  blockWidth -= absDeltaX; // New width is reduced by overlap error

  // Failure: block shrunk too small
  if (blockWidth < MIN_WIDTH) {
    triggerGameOver();
    return;
  }

  // Adjust X position of placed part so it aligns on top of overlap zone
  if (deltaX > 0) {
    movingX = prev.x + deltaX; 
  } else if (deltaX < 0) {
    // movingX remains current X (prev.x + negative delta)
  }
  
  // Update moving block visual for one frame before placing it
  if(movingBlock) {
    movingBlock.width = blockWidth;
    movingBlock.x = movingX;
  }

  // 5. Add to Tower Model
  towerPositions.push({ x: movingX, w: blockWidth });

  // 6. VISUAL POOL SHIFTING (Simulate visual descent)
  if (towerPositions.length > MAX_POOL + 2) {
    // If tower too high, visually shift the object pool DOWN by one level
    shiftVisualTowerDown();
  } else {
    // Tower is low, just add visual rectangle at correct Y level
    visualizePlacedBlock(TOWER_BOTTOM_Y - ((towerPositions.length - 2) * BLOCK_H));
  }
}

function visualizePlacedBlock(yLevel) {
  // Turn moving block visual off
  if(movingBlock) movingBlock.style.display = "none";
  
  // Use current pool index rectangle for visual
  let el = visualPool[poolIndex % MAX_POOL];
  if(el) {
    el.x = movingX;
    el.y = yLevel;
    el.width = blockWidth;
    el.style.display = "inline";
    poolIndex++;
  }
  
  difficultyScaling();
  setupMovingBlock(); // spawn next
}

// Map logical tower state to physical object pool, shifting everything down visually
function shiftVisualTowerDown() {
  if(movingBlock) movingBlock.style.display = "none";
  
  // Redraw entire visual pool based on latest physical tower data (offset to start at pool bottom)
  let physicalIndexStart = towerPositions.length - MAX_POOL;
  
  for(let i=0; i < MAX_POOL; i++) {
    let pBlock = towerPositions[physicalIndexStart + i];
    let vEl = visualPool[i]; // Keep index link simple, doesn't matter which color maps to which block

    if(vEl) {
      vEl.x = pBlock.x;
      // Visually stack from bottom-up based on physical model index
      vEl.y = TOWER_BOTTOM_Y - (i * BLOCK_H); 
      vEl.width = pBlock.w;
      vEl.style.display = "inline";
    }
  }
  
  difficultyScaling();
  setupMovingBlock();
}

function difficultyScaling() {
  // Every 5 successful stacks (Logical steps, minus the base platform and first auto-placed block)
  if ((towerPositions.length - 2) % 5 === 0) {
    currSpeed += 0.5; // Gradually increase speed
    // Cap speed for stability
    if(currSpeed > 9) currSpeed = 9; 
  }
}

// Visually flash screen on perfect drop
function playFlash() {
  if (flashEl) {
    flashEl.style.opacity = 0.5;
    setTimeout(resetFlash, 50);
  }
}

function resetFlash() {
  if (flashEl) flashEl.style.opacity = 0;
}

function triggerGameOver() {
  isGameOver = true;
  clearInterval(gameLoop);
  
  // Turn active layer off
  if(movingBlock) movingBlock.style.display = "none";
  
  // Red haptic pattern for failure
  vibration.start("ring");
  setTimeout(() => { vibration.stop(); }, 300);

  if (finalTxt) finalTxt.text = `Score: ${score}`;
  if (overlay) overlay.style.display = "inline";
}