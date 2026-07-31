import document from "document";
import * as messaging from "messaging";

let keyboardView, historyView;
let inputPreview, historyText;
let typedText = "";
let lastKey = null;
let charIdx = 0;
let timeoutId = null;
let fullConversation = "Welcome! Type your prompt using the keyboard.";

const keyMap = {
  "1": [".", ",", "?", "!", "1"],
  "2": ["a", "b", "c", "2"],
  "3": ["d", "e", "f", "3"],
  "4": ["g", "h", "i", "4"],
  "5": ["j", "k", "l", "5"],
  "6": ["m", "n", "o", "6"],
  "7": ["p", "q", "r", "s", "7"],
  "8": ["t", "u", "v", "8"],
  "9": ["w", "x", "y", "z", "9"],
  "0": [" ", "0"]
};

export function initChatApp() {
  keyboardView = document.getElementById("chat-keyboard-view");
  historyView = document.getElementById("chat-history-view");
  inputPreview = document.getElementById("chat-input-preview");
  historyText = document.getElementById("chat-history-text");

  const keys = ["1","2","3","4","5","6","7","8","9","0","star","hash","send"];
  keys.forEach((k) => {
    let btn = document.getElementById(`chat-btn-${k}`);
    if (btn) {
      btn.onmousedown = () => handleButtonPress(k);
    }
  });

  // Navigation handlers
  document.getElementById("chat-btn-view-history").onmousedown = () => switchToHistory();
  document.getElementById("chat-btn-show-keyboard").onmousedown = () => switchToKeyboard();
  document.getElementById("chat-btn-new-chat").onmousedown = () => startNewChat();

  // Listen for AI responses from phone companion
  messaging.peerSocket.addEventListener("message", (evt) => {
    if (evt.data && evt.data.type === "aiResponse") {
      fullConversation += "\n\nAI: " + evt.data.text;
      historyText.text = fullConversation;
      switchToHistory(); // Automatically jump to scrollable response view
    }
  });
}

function switchToKeyboard() {
  keyboardView.style.display = "inline";
  historyView.style.display = "none";
}

function switchToHistory() {
  keyboardView.style.display = "none";
  historyView.style.display = "inline";
}

function startNewChat() {
  fullConversation = "Started a new chat session.";
  historyText.text = fullConversation;
  typedText = "";
  inputPreview.text = "Type below...";
  switchToKeyboard();
}

function handleButtonPress(k) {
  if (k !== lastKey && lastKey !== null) {
    commitCurrentChar();
  }

  if (k === "star") {
    commitCurrentChar();
    if (typedText.length > 0) {
      typedText = typedText.slice(0, -1);
    }
    updateDisplay();
  } 
  else if (k === "hash") {
    commitCurrentChar();
    lastKey = null;
    updateDisplay();
  } 
  else if (k === "send") {
    commitCurrentChar();
    if (typedText.trim().length > 0) {
      let userPrompt = typedText;
      typedText = ""; 
      updateDisplay();

      // Append prompt and set state to thinking
      fullConversation += "\n\nYou: " + userPrompt + "\nAI: Thinking...";
      historyText.text = fullConversation;
      
      // Hide keyboard so response view has maximum vertical room
      switchToHistory();

      if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        messaging.peerSocket.send({ command: "askAI", prompt: userPrompt });
      } else {
        fullConversation += "\n[Error: Phone disconnected]";
        historyText.text = fullConversation;
      }
    }
  } 
  else {
    let chars = keyMap[k];
    if (!chars) return;

    if (lastKey === k) {
      charIdx = (charIdx + 1) % chars.length;
    } else {
      commitCurrentChar();
      lastKey = k;
      charIdx = 0;
      typedText += chars[charIdx];
    }

    let base = typedText.slice(0, -1);
    typedText = base + chars[charIdx];
    updateDisplay();

    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      commitCurrentChar();
      lastKey = null;
      updateDisplay();
    }, 1000);
  }
}

function commitCurrentChar() {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  lastKey = null;
}

function updateDisplay() {
  inputPreview.text = typedText.length === 0 ? "Type below..." : typedText;
}