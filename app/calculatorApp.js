import document from "document";

let displayElem;
let currentExpr = "0";

export function initCalculatorApp() {
  displayElem = document.getElementById("calc-display");

  // Added 0 and dot
  const keys = ["0","1","2","3","4","5","6","7","8","9","dot","add","sub","mul","div","c","del","eq"];
  keys.forEach((key) => {
    const btn = document.getElementById(`calc-btn-${key}`);
    if (btn) {
      btn.onclick = () => handleKey(key);
    }
  });
}

function handleKey(key) {
  if (key === "c") {
    currentExpr = "0";
  } else if (key === "del") {
    if (currentExpr.length > 1 && currentExpr !== "Error") {
      currentExpr = currentExpr.slice(0, -1);
    } else {
      currentExpr = "0";
    }
  } else if (key === "eq") {
    try {
      let sanitized = currentExpr.replace(/×/g, "*").replace(/÷/g, "/");
      let result = Function(`'use strict'; return (${sanitized})`)();
      // Round to prevent crazy decimals overflowing the screen
      currentExpr = String(Math.round(result * 10000) / 10000);
    } catch (e) {
      currentExpr = "Error";
    }
  } else {
    const ops = { add: "+", sub: "-", mul: "×", div: "÷", dot: "." };
    let charToAdd = ops[key] || key;

    if (currentExpr === "0" || currentExpr === "Error") {
      // If pressing a math operator first, keep the 0. Otherwise, replace it.
      if (["+", "-", "×", "÷", "."].indexOf(charToAdd) !== -1) {
        currentExpr += charToAdd;
      } else {
        currentExpr = charToAdd;
      }
    } else {
      currentExpr += charToAdd;
    }
  }
  displayElem.text = currentExpr;
}