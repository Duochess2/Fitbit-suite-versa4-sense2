import document from "document";
import * as fs from "fs";
import * as messaging from "messaging";
import { vibration } from "haptics";

let notesContent, btnExit;

export function initNotesApp(closeCallback) {
  notesContent = document.getElementById("notes-content");
  btnExit = document.getElementById("notes-btn-exit");

  // Load from hard drive on boot
  try {
    let saved = fs.readFileSync("myNotes.txt", "utf-8");
    if (saved) notesContent.text = saved;
  } catch(e) {}

  // Listen for live Bluetooth injections from the phone!
  messaging.peerSocket.addEventListener("message", (evt) => {
    if (evt.data && evt.data.key === "stored_notes") {
      let newText = evt.data.val;
      
      // Fitbit wraps settings data in a JSON object. We have to unpack it cleanly.
      try {
        let parsed = JSON.parse(newText);
        if (parsed && parsed.name) newText = parsed.name;
      } catch(e) {}
      
      // Inject to screen and save!
      notesContent.text = newText;
      vibration.start("confirmation"); // Buzz wrist on success!
      
      try { fs.writeFileSync("myNotes.txt", newText, "utf-8"); } catch(e){}
    }
  });

  if (btnExit) btnExit.onclick = () => {
    if(closeCallback) closeCallback();
  };
}