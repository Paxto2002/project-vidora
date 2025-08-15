// src/app.js
import expres from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = expres();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true, // Allow cookies to be sent with requests
  })
);

app.use(express.json({ limit: "16kb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // Parse URL-encoded bodies
app.use(express.static("public")); // Parse cookies
app.use(cookieParser()); // Parse cookies
export default app;
