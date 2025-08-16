// src/db/index.js
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

// This is the second approach and recommended
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGO_URI);
    console.log(
      `Connected to database: ${DB_NAME} !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // process is the reference to our current Node.js process/app
  }
};

export default connectDB;
