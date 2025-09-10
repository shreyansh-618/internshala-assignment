import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let db = null;
let client = null;

export const connectDB = async () => {
  try {
    if (db) {
      return db;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    db = client.db(process.env.DB_NAME || "shopeasy");

    // Test the connection
    await db.admin().ping();

    return db;
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};

export const getDB = () => {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return db;
};

export const closeDB = async () => {
  if (client) {
    await client.close();
    db = null;
    client = null;
  }
};

process.on("SIGINT", async () => {
  console.log("\n Shutting down gracefully...");
  await closeDB();
  console.log("Database connection closed");
  process.exit(0);
});
