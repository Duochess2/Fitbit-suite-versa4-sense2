import document from "document";
import * as fs from "fs";

let gameLoop = null;
let isPlaying = false;
let birdY = 150;
let velocity = 0;
let score = 0;
let highScore = 0;

// Physics Tuners & File IO
const SAVE_FILE = "flappy_save.json";
const gravity = 1.2;
const jumpStrength = -11;
const speed = 5;
const gapSize = 130;
const screenWidth = 336;
const pipeWidth = 50;

let pipes = [];
let ui = {};

export function initFlappyBirdApp() {
  loadSaveData();

  ui.bird = document.getElementById("fb-bird");
  
  ui.pipeTop0Body = document.getElementById("fb-pipe-top-0-body");
  ui.pipeTop0Cap = document.getElementById("fb-pipe-top-0-cap");
  ui.pipeBot0Body = document.getElementById("fb-pipe-bot-0-body");
  ui.pipeBot0Cap = document.getElementById("fb-pipe-bot-0-cap");

  ui.pipeTop1Body = document.getElementById("fb-pipe-top-1-body");
  ui.pipeTop1Cap = document.getElementById("fb-pipe-top-1-cap");
  ui.pipeBot1Body = document.getElementById("fb-pipe-bot-1-body");
  ui.pipeBot1Cap = document.getElementById("fb-pipe-bot-1-cap");

  ui.score = document.getElementById("fb-score");
  ui.highScore = document.getElementById("fb-high-score");
  ui.msg = document.getElementById("fb-msg");

  // Show loaded high score
  ui.highScore.text = `Best: ${highScore}`;

  const touchZone = document.getElementById("fb-touch");

  touchZone.onmousedown = () => {
    if (!isPlaying) {
      startGame();
    } else {
      velocity = jumpStrength;
    }
  };
}

export function stopFlappyBird() {
  if (gameLoop) clearInterval(gameLoop);
  isPlaying = false;
}

// === Save / Load High Score ===
function loadSaveData() {
  try {
    if (fs.existsSync(SAVE_FILE)) {
      let data = fs.readFileSync(SAVE_FILE, "json");
      if (data && data.highScore) highScore = data.highScore;
    }
  } catch (e) {}
}

function saveScore() {
  try {
    fs.writeFileSync(SAVE_FILE, { highScore: highScore }, "json");
  } catch (e) {}
}

// === Core Game Loop ===
function startGame() {
  birdY = 150;
  velocity = 0;
  score = 0;
  
  pipes = [
    { x: screenWidth, gapTop: getRandomGap(), passed: false },
    { x: screenWidth + 200, gapTop: getRandomGap(), passed: false }
  ];
  
  ui.msg.style.display = "none";
  ui.score.text = score;
  ui.highScore.text = `Best: ${highScore}`;
  isPlaying = true;
  
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameTick, 33);
}

function getRandomGap() {
  return Math.floor(Math.random() * 110) + 20; 
}

function gameTick() {
  // Apply Gravity
  velocity += gravity;
  birdY += velocity;

  // Move Pipes
  pipes.forEach((p) => {
    p.x -= speed;
    
    // Reset pipe loop
    if (p.x < -pipeWidth) {
      p.x = screenWidth + (400 - screenWidth) - pipeWidth; 
      p.gapTop = getRandomGap();
      p.passed = false;
    }

    // Update Score & High Score
    if (!p.passed && p.x + pipeWidth < 50) {
      score++;
      ui.score.text = score;
      p.passed = true;
      
      if (score > highScore) {
        highScore = score;
        ui.highScore.text = `Best: ${highScore}`;
        saveScore();
      }
    }
    
    // Collision Detection
    let bRight = 50 + 32;
    let bLeft = 50 + 8;
    let bTop = birdY + 8;
    let bBot = birdY + 32;
    
    let pRight = p.x + pipeWidth;
    let pLeft = p.x;
    let pTopGap = p.gapTop;
    let pBotGap = p.gapTop + gapSize;

    if (bRight > pLeft && bLeft < pRight) {
      if (bTop < pTopGap || bBot > pBotGap) {
        gameOver();
      }
    }
  });

  // Check Floor/Ceiling collision
  if (birdY > 290 - 35 || birdY < -20) {
    gameOver();
  }

  drawFrame();
}

function gameOver() {
  isPlaying = false;
  clearInterval(gameLoop);
  ui.msg.text = "Game Over!";
  ui.msg.style.display = "inline";
}

// === Draw Graphics ===
function updatePipeUI(index, p) {
  const topBody = index === 0 ? ui.pipeTop0Body : ui.pipeTop1Body;
  const topCap = index === 0 ? ui.pipeTop0Cap : ui.pipeTop1Cap;
  const botBody = index === 0 ? ui.pipeBot0Body : ui.pipeBot1Body;
  const botCap = index === 0 ? ui.pipeBot0Cap : ui.pipeBot1Cap;

  // Top Pipe (Draws downward to the top of the gap)
  topCap.x = p.x;
  topCap.y = p.gapTop - 20;
  topBody.x = p.x + 3;
  topBody.height = p.gapTop - 20;

  // Bottom Pipe (Draws upward from the bottom of the gap)
  botCap.x = p.x;
  botCap.y = p.gapTop + gapSize;
  botBody.x = p.x + 3;
  botBody.y = p.gapTop + gapSize + 20;
  botBody.height = 290 - botBody.y;
}

function drawFrame() {
  ui.bird.y = birdY;
  updatePipeUI(0, pipes[0]);
  updatePipeUI(1, pipes[1]);
}