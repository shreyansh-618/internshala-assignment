import { connectDB, closeDB } from "../config/database.js";
import dotenv from "dotenv";

dotenv.config();

async function testConnection() {
  try {
    console.log("Testing MongoDB connection...");

    const db = await connectDB();
    console.log("Successfully connected to MongoDB");

    // Test basic operations
    console.log("Testing basic operations...");

    // Test collections
    const collections = await db.listCollections().toArray();
    console.log(
      `Found ${collections.length} collections:`,
      collections.map((c) => c.name)
    );

    // Test products collection
    const productCount = await db.collection("products").countDocuments();
    console.log(`Products in database: ${productCount}`);

    // Test users collection
    const userCount = await db.collection("users").countDocuments();
    console.log(`Users in database: ${userCount}`);

    // Test cart collection
    const cartCount = await db.collection("cart").countDocuments();
    console.log(`Cart items in database: ${cartCount}`);

    // Test aggregation
    const categories = await db.collection("products").distinct("category");
    console.log(`Product categories: ${categories.join(", ")}`);

    console.log("All database operations successful!");
  } catch (error) {
    console.error("Connection test failed:", error);
    process.exit(1);
  } finally {
    await closeDB();
    console.log("Connection closed");
  }
}

testConnection();
