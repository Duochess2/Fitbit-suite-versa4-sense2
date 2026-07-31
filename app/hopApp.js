import document from "document";
import { vibration } from "haptics";
import { display } from "display";

let scoreTxt, feedbackTxt, ballGroup, ballVisual, ballShadow, ballGlow;
let controller, gameOverGroup, finalScoreTxt;
let gameLoop = null;

// Game State
let isGameOver = true;
let score = 0;
let ballX = 168;

// Difficulty Variables
let speed = 4;
let spawnRate = 45; // Frames between spawning tiles
let spawnTimer = 0;
let currentTileWidth = 80;

const HIT_Y = 260; // The line where the ball lands
const SPAWN_Y = -40;

let tiles = [];

export function initHopApp() {
  scoreTxt = document.getElementById("hop-score");
  feedbackTxt = document.getElementById("hop-feedback");
  ballGroup = document.getElementById("hop-ball-group");
  ballVisual = document.getElementById("hop-ball");
  ballShadow = document.getElementById("hop-shadow");
  ballGlow = document.getElementById("hop-glow");
  controller = document.getElementById("hop-controller");
  gameOverGroup = document.getElementById("hop-game-over");
  finalScoreTxt = document.getElementById("hop-final-score");

  for (let i = 0; i < 4; i++) {
    tiles.push({ el: document.getElementById(`hop-t-${i}`), active: false, x: 0, y: 0, scored: false });
  }

  // Dragging Controller
  if (controller) {
    controller.onmousemove = (e) => {
      if (isGameOver) return;
      ballX = e.screenX;
      if (ballX < 20) ballX = 20;
      if (ballX > 316) ballX = 316;
      ballGroup.groupTransform.translate.x = ballX;
    };
  }

  // Restart tap
  if (gameOverGroup) {
    gameOverGroup.onmousedown = () => { if (isGameOver) resetGame(); };
  }
}

export function startHopApp() {
  display.autoOff = false;
  resetGame();
}

export function stopHopApp() {
  display.autoOff = true;
  isGameOver = true;
  if (gameLoop) clearInterval(gameLoop);
}

function resetGame() {
  score = 0;
  speed = 4;
  spawnRate = 45;
  currentTileWidth = 80;
  spawnTimer = spawnRate; // Spawn immediately
  ballX = 168;
  ballGroup.groupTransform.translate.x = ballX;
  isGameOver = false;

  scoreTxt.text = "0";
  feedbackTxt.text = "";
  gameOverGroup.style.display = "none";

  for (let i = 0; i < tiles.length; i++) {
    tiles[i].active = false;
    tiles[i].el.style.display = "none";
  }

  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameTick, 33); // 30 FPS
}

function gameTick() {
  if (isGameOver) return;

  // 1. SPAWN TILES
  spawnTimer++;
  if (spawnTimer >= spawnRate) {
    spawnTile();
    spawnTimer = 0;
  }

  // 2. MOVE TILES AND CHECK COLLISIONS
  let nearestY = SPAWN_Y; // For animation tracking

  for (let i = 0; i < tiles.length; i++) {
    let t = tiles[i];
    if (t.active) {
      t.y += speed;
      t.el.y = t.y;

      // Track the closest tile that is approaching the landing zone
      if (t.y <= HIT_Y && t.y > nearestY) {
        nearestY = t.y;
      }

      // Did it reach the hit line?
      if (t.y >= HIT_Y && !t.scored) {
        t.scored = true;
        checkLanding(t);
      }

      // Recycle off-screen tiles
      if (t.y > 350) {
        t.active = false;
        t.el.style.display = "none";
      }
    }
  }

  // 3. ANIMATE THE HOP! 
  // We calculate how far the nearest tile is to the target line, and convert it to a Sine Wave!
  let spacing = speed * spawnRate;
  let hopProgress = 1 - ((HIT_Y - nearestY) / spacing);
  if (hopProgress < 0) hopProgress = 0;
  if (hopProgress > 1) hopProgress = 1;

  // The ball jumps 60px in the air at the peak of the hop
  let heightOffset = -Math.sin(hopProgress * Math.PI) * 60;
  ballVisual.cy = heightOffset;
  ballGlow.cy = heightOffset;
  
  // The shadow shrinks when the ball is high in the air
  ballShadow.rx = 15 - Math.sin(hopProgress * Math.PI) * 8;
}

function spawnTile() {
  let targetTile = null;
  for (let i = 0; i < tiles.length; i++) {
    if (!tiles[i].active) {
      targetTile = tiles[i];
      break;
    }
  }

  if (targetTile) {
    targetTile.active = true;
    targetTile.scored = false;
    targetTile.y = SPAWN_Y;
    
    // Keep it on screen
    let minX = 20;
    let maxX = 316 - currentTileWidth;
    targetTile.x = Math.floor(Math.random() * (maxX - minX)) + minX;
    
    targetTile.el.x = targetTile.x;
    targetTile.el.y = targetTile.y;
    targetTile.el.width = currentTileWidth;
    targetTile.el.style.display = "inline";
  }
}

function checkLanding(t) {
  let tileCenter = t.x + (currentTileWidth / 2);
  let dist = Math.abs(ballX - tileCenter);

  if (dist < (currentTileWidth / 4)) {
    // PERFECT LANDING! Dead center.
    score += 2;
    feedbackTxt.text = "PERFECT!";
    feedbackTxt.style.fill = "#00E676"; // Green
    playCustomBuzz("confirmation"); // Double tap buzz
    increaseDifficulty();
  } 
  else if (dist < (currentTileWidth / 2) + 15) { // 15 is ball radius
    // NORMAL HIT! You caught the edge.
    score += 1;
    feedbackTxt.text = "GOOD";
    feedbackTxt.style.fill = "#FFEB3B"; // Yellow
    playCustomBuzz("bump"); // Standard tap buzz
    increaseDifficulty();
  } 
  else {
    // MISSED THE TILE
    triggerGameOver();
  }

  scoreTxt.text = score;
}

// Gradually increase speed and shrink the tiles!
function increaseDifficulty() {
  if (score % 5 === 0) { // Every 5 points
    if (speed < 9) speed += 0.2;
    if (currentTileWidth > 40) currentTileWidth -= 2;
    
    // Keep the spatial gap between tiles exactly the same even as speed increases
    spawnRate = Math.floor(180 / speed); 
  }
}

// Our safe, shortened haptic function so it doesn't ring endlessly
function playCustomBuzz(profile) {
  vibration.start(profile);
  setTimeout(() => { vibration.stop(); }, 150);
}

function triggerGameOver() {
  isGameOver = true;
  clearInterval(gameLoop);
  playCustomBuzz("ring"); // Angry buzz for falling off
  
  finalScoreTxt.text = `Score: ${score}`;
  gameOverGroup.style.display = "inline";
}