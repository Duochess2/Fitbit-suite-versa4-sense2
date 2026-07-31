import document from "document";

let gameLoop = null;
let isPlaying = false;
let score = 0;

const gridSize = 15;
const gridX = 18; // Start offset
const gridY = 36;
const maxLen = 30;

let snake = [];
let dir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };
let food = { x: 0, y: 0 };

let ui = {};
let bodyRects = [];

export function initSnakeApp() {
  ui.score = document.getElementById("snk-score");
  ui.msg = document.getElementById("snk-msg");
  ui.food = document.getElementById("snk-food");
  
  for (let i = 0; i < maxLen; i++) {
    bodyRects.push(document.getElementById(`sb-${i}`));
  }

  document.getElementById("snk-up").onmousedown = () => { if (dir.y === 0) nextDir = {x: 0, y: -1}; };
  document.getElementById("snk-down").onmousedown = () => { if (dir.y === 0) nextDir = {x: 0, y: 1}; };
  document.getElementById("snk-left").onmousedown = () => { if (dir.x === 0) nextDir = {x: -1, y: 0}; };
  document.getElementById("snk-right").onmousedown = () => { if (dir.x === 0) nextDir = {x: 1, y: 0}; };
  document.getElementById("snk-start").onmousedown = () => { if (!isPlaying) startGame(); };
}

export function stopSnakeApp() {
  if (gameLoop) clearInterval(gameLoop);
  isPlaying = false;
}

function startGame() {
  score = 0;
  snake = [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  
  ui.msg.style.display = "none";
  ui.food.style.display = "inline";
  ui.score.text = `Score: ${score}`;
  
  placeFood();
  isPlaying = true;
  
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameTick, 200); // 5 moves per second
}

function placeFood() {
  food.x = Math.floor(Math.random() * 20); // 300px / 15px = 20 grid slots
  food.y = Math.floor(Math.random() * 20);
  ui.food.x = gridX + (food.x * gridSize);
  ui.food.y = gridY + (food.y * gridSize);
}

function gameTick() {
  dir = nextDir;
  let head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  // Wall Collision
  if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) return gameOver();

  // Self Collision
  for (let i = 0; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) return gameOver();
  }

  snake.unshift(head); // Add new head

  // Check Food
  if (head.x === food.x && head.y === food.y) {
    score++;
    ui.score.text = `Score: ${score}`;
    if (snake.length > maxLen) snake.pop(); // Cap at max RAM length
    placeFood();
  } else {
    snake.pop(); // Remove tail
  }

  drawSnake();
}

function drawSnake() {
  for (let i = 0; i < maxLen; i++) {
    if (i < snake.length) {
      bodyRects[i].style.display = "inline";
      bodyRects[i].x = gridX + (snake[i].x * gridSize);
      bodyRects[i].y = gridY + (snake[i].y * gridSize);
    } else {
      bodyRects[i].style.display = "none";
    }
  }
}

function gameOver() {
  stopSnakeApp();
  ui.msg.text = "Game Over!";
  ui.msg.style.display = "inline";
}