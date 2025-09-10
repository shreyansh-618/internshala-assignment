import { connectDB, closeDB } from "../config/database.js";
import dotenv from "dotenv";

dotenv.config();

const seedProducts = [
  {
    name: "Wireless Headphones",
    price: 79.99,
    category: "Electronics",
    description: "High-quality wireless headphones with noise cancellation",
    image: "/black-wireless-headphones.jpg",
    backgroundColor: "#fbbf24",
    inStock: true,
    stockQuantity: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Smart Watch",
    price: 199.99,
    category: "Electronics",
    description: "Feature-rich smartwatch with health tracking",
    image: "/modern-smartwatch.png",
    backgroundColor: "#d1d5db",
    inStock: true,
    stockQuantity: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Running Shoes",
    price: 129.99,
    category: "Sports",
    description: "Comfortable running shoes for all terrains",
    image: "/red-nike-running-shoes.jpg",
    backgroundColor: "#dc2626",
    inStock: true,
    stockQuantity: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Coffee Maker",
    price: 89.99,
    category: "Home & Kitchen",
    description: "Automatic coffee maker with programmable settings",
    image: "/modern-coffee-maker.png",
    backgroundColor: "#059669",
    inStock: true,
    stockQuantity: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Bluetooth Speaker",
    price: 49.99,
    category: "Electronics",
    description: "Portable speaker with excellent sound quality",
    image: "/portable-bluetooth-speaker.jpg",
    backgroundColor: "#7c3aed",
    inStock: true,
    stockQuantity: 40,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Yoga Mat",
    price: 29.99,
    category: "Sports",
    description: "Non-slip yoga mat for comfortable workouts",
    image: "/purple-yoga-mat.png",
    backgroundColor: "#ec4899",
    inStock: true,
    stockQuantity: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Laptop Bag",
    price: 39.99,
    category: "Accessories",
    description: "Durable laptop bag with multiple compartments",
    image: "/black-laptop-bag.jpg",
    backgroundColor: "#374151",
    inStock: true,
    stockQuantity: 35,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Kitchen Scale",
    price: 24.99,
    category: "Home & Kitchen",
    description: "Precise digital kitchen scale for cooking",
    image: "/digital-kitchen-scale.jpg",
    backgroundColor: "#0891b2",
    inStock: true,
    stockQuantity: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    const db = await connectDB();

    // Clear existing products
    await db.collection("products").deleteMany({});
    console.log("Cleared existing products");

    // Insert seed products
    const result = await db.collection("products").insertMany(seedProducts);
    console.log(`Inserted ${result.insertedCount} products`);

    // Create indexes for better performance
    await db
      .collection("products")
      .createIndex({ name: "text", description: "text" });
    await db.collection("products").createIndex({ category: 1 });
    await db.collection("products").createIndex({ price: 1 });
    await db.collection("products").createIndex({ createdAt: -1 });
    console.log("Created search and filter indexes");

    // Create indexes for users collection
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    console.log("Created user indexes");

    // Create indexes for cart collection
    await db
      .collection("cart")
      .createIndex({ userId: 1, productId: 1 }, { unique: true });
    await db.collection("cart").createIndex({ userId: 1 });
    console.log("Created cart indexes");

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await closeDB();
  }
}

// Run seeding
seedDatabase();
