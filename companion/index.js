import * as messaging from "messaging";
import { settingsStorage } from "settings";

const OPENROUTER_API_KEY = "YOUR_OPENROUTER_KEY"; 

// 1. Listen for you typing on your phone!
settingsStorage.addEventListener("change", (evt) => {
  if (!evt.newValue) return;

  // ROUTE A: AI Assistant
  if (evt.key === "customPrompt") {
    let promptData = JSON.parse(evt.newValue);
    if (promptData && promptData.name) {
      if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        messaging.peerSocket.send({ type: "aiResponse", text: "Thinking..." });
      }
      fetchOpenRouter(promptData.name);
    }
  }

  // ROUTE B: Phone Notes
  if (evt.key === "stored_notes") {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      messaging.peerSocket.send({ key: "stored_notes", val: evt.newValue });
    }
  }
});


// 2. Listen for the preset buttons tapped on the watch
messaging.peerSocket.addEventListener("message", (evt) => {
  if (evt.data && evt.data.command === "askAI") {
    fetchOpenRouter(evt.data.prompt);
  }
});

function fetchOpenRouter(prompt) {
  const url = "https://openrouter.ai/api/v1/chat/completions";
  
  const requestBody = {
    model: "google/gemma-4-26b-a4b-it:free", 
    messages: [{ role: "user", content: prompt }],
    max_tokens: 250 
  };

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://fitbit-app.local", 
      "X-Title": "Fitbit App Suite" 
    },
    body: JSON.stringify(requestBody)
  })
  .then(response => response.json())
  .then(data => {
    let reply = data.choices[0].message.content;
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      messaging.peerSocket.send({ type: "aiResponse", text: reply });
    }
  })
  .catch(err => {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      messaging.peerSocket.send({ type: "aiResponse", text: "Error connecting to API." });
    }
  });
}