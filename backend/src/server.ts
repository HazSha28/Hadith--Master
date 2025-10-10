import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hadithmaster")
  .then(() => {
    console.log("MongoDB connected");
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch((err) => console.error(err));

  import cron from "node-cron";

cron.schedule("0 8 * * *", () => {
  console.log("📅 Sending daily Hadith update...");
  // (Later: integrate nodemailer or push notifications)
});
