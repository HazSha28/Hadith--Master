import { collection, addDoc } from "firebase/firestore";
import { db } from "./functions/src/firebase.js";

async function addTestHadith() {
  try {
    await addDoc(collection(db, "hadiths"), {
      text: "Actions are judged by intentions.",
      narrator: "Umar ibn Al-Khattab",
      source: "Bukhari & Muslim",
      addedOn: new Date()
    });
    console.log("✅ Test Hadith added successfully!");
  } catch (error) {
    console.error("❌ Error adding Hadith:", error);
  }
}

addTestHadith();
