import document from "document";

let grid = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
let score = 0;
let touchStartX = 0;
let touchStartY = 0;

const tileColors = {
  0: "#CDC1B4", 2: "#EEE4DA", 4: "#EDE0C8", 8: "#F2B179", 16: "#F59563",
  32: "#F67C5F", 64: "#F65E3B", 128: "#EDCF72", 256: "#EDCC61",
  512: "#EDC850", 1024: "#EDC53F", 2048: "#EDC22E", 4096: "#3C3A32"
};

export function init2048App() {
  const surface = document.getElementById("g2048-touch-surface");

  surface.onmousedown = (e) => {
    touchStartX = e.screenX;
    touchStartY = e.screenY;
  };

  surface.onmouseup = (e) => {
    let diffX = e.screenX - touchStartX;
    let diffY = e.screenY - touchStartY;
    let moved = false;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 30) moved = moveRight();
      else if (diffX < -30) moved = moveLeft();
    } else {
      if (diffY > 30) moved = moveDown();
      else if (diffY < -30) moved = moveUp();
    }

    if (moved) {
      addRandomTile();
      drawBoard();
    }
  };

  resetGame();
}

function resetGame() {
  for (let i = 0; i < 16; i++) {
    grid[i] = 0;
  }
  score = 0;
  addRandomTile();
  addRandomTile();
  drawBoard();
}

function addRandomTile() {
  let emptySpots = [];
  for (let i = 0; i < 16; i++) {
    if (grid[i] === 0) emptySpots.push(i);
  }
  if (emptySpots.length > 0) {
    let randomSpot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
    grid[randomSpot] = Math.random() < 0.9 ? 2 : 4;
  }
}

function slideAndMerge(row) {
  let arr = row.filter(val => val !== 0);
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      score += arr[i];
      arr.splice(i + 1, 1);
    }
  }
  while (arr.length < 4) arr.push(0);
  return arr;
}

function moveLeft() {
  let moved = false;
  for (let i = 0; i < 16; i += 4) {
    let row = [grid[i], grid[i+1], grid[i+2], grid[i+3]];
    let newRow = slideAndMerge(row);
    for (let j = 0; j < 4; j++) {
      if (grid[i+j] !== newRow[j]) moved = true;
      grid[i+j] = newRow[j];
    }
  }
  return moved;
}

function moveRight() {
  let moved = false;
  for (let i = 0; i < 16; i += 4) {
    let row = [grid[i+3], grid[i+2], grid[i+1], grid[i]];
    let newRow = slideAndMerge(row);
    for (let j = 0; j < 4; j++) {
      if (grid[i + (3-j)] !== newRow[j]) moved = true;
      grid[i + (3-j)] = newRow[j];
    }
  }
  return moved;
}

function moveUp() {
  let moved = false;
  for (let i = 0; i < 4; i++) {
    let col = [grid[i], grid[i+4], grid[i+8], grid[i+12]];
    let newCol = slideAndMerge(col);
    for (let j = 0; j < 4; j++) {
      if (grid[i + j*4] !== newCol[j]) moved = true;
      grid[i + j*4] = newCol[j];
    }
  }
  return moved;
}

function moveDown() {
  let moved = false;
  for (let i = 0; i < 4; i++) {
    let col = [grid[i+12], grid[i+8], grid[i+4], grid[i]];
    let newCol = slideAndMerge(col);
    for (let j = 0; j < 4; j++) {
      if (grid[i + (3-j)*4] !== newCol[j]) moved = true;
      grid[i + (3-j)*4] = newCol[j];
    }
  }
  return moved;
}

function drawBoard() {
  for (let i = 0; i < 16; i++) {
    let bg = document.getElementById(`tbg-${i}`);
    let txt = document.getElementById(`ttxt-${i}`);
    
    let val = grid[i];
    bg.style.fill = tileColors[val] || tileColors[4096];
    txt.text = val === 0 ? "" : val;
    txt.style.fill = val <= 4 ? "#776E65" : "#F9F6F2";
  }
  document.getElementById("g2048-score").text = `Score: ${score}`;
}