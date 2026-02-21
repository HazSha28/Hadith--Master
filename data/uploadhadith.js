import fs from "fs";
import path from "path";
import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json")
});

const db = admin.firestore();

const DATA_DIR = "./data/json";

const files = fs.readdirSync(DATA_DIR);

async function upload() {
  for (const file of files) {
    const bookData = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, file), "utf8")
    );

    const bookName = bookData.book;

    console.log(`📘 Uploading ${bookName}...`);

    for (const h of bookData.hadiths) {
      await db.collection("hadiths").add({
        book: bookName,
        hadithNumber: h.id,
        arabic: h.arabic,
        english: {
          text: h.english.text
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  console.log("🎉 ALL HADITHS UPLOADED SUCCESSFULLY");
}

upload();
