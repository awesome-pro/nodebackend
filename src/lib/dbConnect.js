import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
console.log(process.env.MONGODB_URI);

if (!process.env.MONGODB_URI) {
    console.error("MongoDB URI is missing. Please check .env file");
    process.exit(1);
}

const connection = {};

async function dbConnect() {
    if (connection.isConnected) {
        console.log("Already connected to the database :)");
        return;
    }

  try {
      const db = await mongoose.connect(process.env.MONGODB_URI, {});
      connection.isConnected = db.connections[0].readyState;
      console.log("DB Connected successfully :)");
  } catch (error) {
    console.log("Error connecting to the database: ", error);
    process.exit(1);
  }
    
}

export default dbConnect;
