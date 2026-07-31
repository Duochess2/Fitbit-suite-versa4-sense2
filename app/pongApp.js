import document from "document";

let gameLoop = null;
let isPlaying = false;

let s1 = 0, s2 = 0;
let ball = { x: 168, y: 168, dx: -5, dy: 3 };
let p1 = { y: 140, dy: 0 };
let p2 = { y: 140 }; // AI paddle

let ui = {};

export function initPongApp() {
  ui.ball = document.getElementById("pong-ball");
  ui.pad1 = document.getElementById("pong-pad-1");
  ui.pad2 = document.getElementById("pong-pad-2");
  ui.sc1 = document.getElementById("pong-score-p1");
  ui.sc2 = document.getElementById("pong-score-p2");
  ui.msg = document.getElementById("pong-msg");

  // Player controls
  document.getElementById("pong-touch-up").onmousedown = () => {
    if (!isPlaying) startGame();
    else p1.dy = -6; 
  };
  document.getElementById("pong-touch-up").onmouseup = () => p1.dy = 0;

  document.getElementById("pong-touch-down").onmousedown = () => {
    if (!isPlaying) startGame();
    else p1.dy = 6;
  };
  document.getElementById("pong-touch-down").onmouseup = () => p1.dy = 0;
}

export function stopPongApp() {
  if (gameLoop) clearInterval(gameLoop);
  isPlaying = false;
}

function startGame() {
  s1 = 0; s2 = 0;
  ui.sc1.text = s1; ui.sc2.text = s2;
  ui.msg.style.display = "none";
  resetBall();
  isPlaying = true;
  
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameTick, 33); // 30 FPS
}

function resetBall() {
  ball.x = 168; ball.y = 168;
  ball.dx = ball.dx > 0 ? -5 : 5; // Serve to loser
  ball.dy = (Math.random() > 0.5 ? 3 : -3);
}

function gameTick() {
  // Move Player
  p1.y += p1.dy;
  if (p1.y < 0) p1.y = 0;
  if (p1.y > 276) p1.y = 276; // 336 screen - 60 paddle height

  // Move AI (Follows ball loosely)
  if (ball.y < p2.y + 15) p2.y -= 4;
  if (ball.y > p2.y + 45) p2.y += 4;
  if (p2.y < 0) p2.y = 0;
  if (p2.y > 276) p2.y = 276;

  // Move Ball
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Ceiling/Floor Bounce
  if (ball.y <= 8 || ball.y >= 328) ball.dy *= -1;

  // Paddle 1 (Left) Bounce
  if (ball.x <= 28 && ball.y >= p1.y && ball.y <= p1.y + 60) {
    ball.dx = 5;
    ball.dy += p1.dy * 0.5; // Add spin
  }

  // Paddle 2 (Right) Bounce
  if (ball.x >= 308 && ball.y >= p2.y && ball.y <= p2.y + 60) {
    ball.dx = -5;
  }

  // Scoring
  if (ball.x < 0) { s2++; ui.sc2.text = s2; resetBall(); }
  if (ball.x > 336) { s1++; ui.sc1.text = s1; resetBall(); }

  // Draw
  ui.pad1.y = p1.y;
  ui.pad2.y = p2.y;
  ui.ball.cx = ball.x;
  ui.ball.cy = ball.y;
}