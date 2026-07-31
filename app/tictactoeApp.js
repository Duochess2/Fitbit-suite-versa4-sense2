import document from "document";
import { vibration } from "haptics";

let statusTxt, menuGroup, gameGroup, btn1P, btn2P, btnReset;
let cells = [];
let cellTxts = [];

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let isVsBot = false;
let gameActive = false;

const winConditions = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export function initTttApp() {
  statusTxt = document.getElementById("ttt-status");
  menuGroup = document.getElementById("ttt-menu-group");
  gameGroup = document.getElementById("ttt-game-group");
  btn1P = document.getElementById("ttt-btn-1p");
  btn2P = document.getElementById("ttt-btn-2p");
  btnReset = document.getElementById("ttt-btn-reset");

  for (let i = 0; i < 9; i++) {
    cells.push(document.getElementById(`ttt-cell-${i}`));
    cellTxts.push(document.getElementById(`ttt-txt-${i}`));
    
    // Tap a grid square
    cells[i].onclick = () => handleCellClick(i);
  }

  if(btn1P) btn1P.onclick = () => startGame(true);
  if(btn2P) btn2P.onclick = () => startGame(false);
  if(btnReset) btnReset.onclick = () => showMenu();
}

function startGame(botMode) {
  vibration.start("bump");
  isVsBot = botMode;
  board = ["", "", "", "", "", "", "", "", ""];
  currentPlayer = "X";
  gameActive = true;

  for (let i = 0; i < 9; i++) {
    cellTxts[i].text = "";
    cellTxts[i].style.fill = "white";
  }

  menuGroup.style.display = "none";
  gameGroup.style.display = "inline";
  statusTxt.text = "Player X Turn";
}

function showMenu() {
  vibration.start("bump");
  gameGroup.style.display = "none";
  menuGroup.style.display = "inline";
  statusTxt.text = "Select Mode";
}

function handleCellClick(index) {
  if (!gameActive || board[index] !== "") return;
  
  vibration.start("bump");
  makeMove(index, currentPlayer);
  checkWin();

  if (gameActive && isVsBot && currentPlayer === "O") {
    // Bot takes a small delay so it feels natural
    setTimeout(botTurn, 400); 
  }
}

function makeMove(index, player) {
  board[index] = player;
  cellTxts[index].text = player;
  cellTxts[index].style.fill = player === "X" ? "#3498DB" : "#E74C3C"; // X is Blue, O is Red
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  if(gameActive) statusTxt.text = `Player ${currentPlayer} Turn`;
}

function botTurn() {
  if (!gameActive) return;
  
  // Find all empty squares
  let emptyCells = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === "") emptyCells.push(i);
  }

  if (emptyCells.length > 0) {
    // Pick a random empty square
    let randomIdx = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    makeMove(randomIdx, "O");
    checkWin();
  }
}

function checkWin() {
  let roundWon = false;
  
  for (let i = 0; i < winConditions.length; i++) {
    const [a, b, c] = winConditions[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      roundWon = true;
      break;
    }
  }

  if (roundWon) {
    let winner = currentPlayer === "X" ? "O" : "X"; 
    statusTxt.text = `${winner} WINS! 🎉`;
    vibration.start("confirmation");
    gameActive = false;
    return;
  }

  // FIXED: Using old-school indexOf instead of modern includes!
  if (board.indexOf("") === -1) {
    statusTxt.text = "DRAW! 🤝";
    gameActive = false;
  }
}