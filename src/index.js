// require("dotenv").config({ path: "../.env" });  // old way

import dotenv from "dotenv";
dotenv.config({ path: "../.env" }); // Load environment variables from .env file
import connectDB from "./db/index.js";

connectDB();

/*

This is one approach
import express from "express";
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}    `);
    app.on("error", (err) => {
      console.log("Error: ", err);
      throw err;
    });
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT || 3000}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
})();
*/
