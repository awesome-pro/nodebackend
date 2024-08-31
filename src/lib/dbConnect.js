import mongoose from "mongoose";

const connection = {};

async function dbConnect() {
    if (connection.isConnected) {
        console.log("Already connected to the database :)");
        return;
    }

  try {
      const db = await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://abhinandanverma551:abhi1234@cluster0.9n5cg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {});
      connection.isConnected = db.connections[0].readyState;
      console.log("DB Connected successfully :)");
  } catch (error) {
    console.log("Error connecting to the database: ", error);
    process.exit(1);
  }
    
}

export default dbConnect;
