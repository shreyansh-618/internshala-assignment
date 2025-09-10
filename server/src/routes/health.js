import { Hono } from "hono";
import { getDB } from "../config/database.js";

const health = new Hono();

// Basic health check
health.get("/", (c) => {
  return c.json({
    status: "healthy",
    message: "ShopEasy API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Database health check
health.get("/db", async (c) => {
  try {
    const db = getDB();

    // Test database connection
    await db.admin().ping();

    // Get collection stats
    const collections = await db.listCollections().toArray();
    const stats = {};

    for (const collection of collections) {
      const collectionStats = await db
        .collection(collection.name)
        .estimatedDocumentCount();
      stats[collection.name] = collectionStats;
    }

    return c.json({
      status: "healthy",
      message: "Database connection is working",
      database: {
        connected: true,
        collections: stats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    return c.json(
      {
        status: "unhealthy",
        message: "Database connection failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      503
    );
  }
});

// API endpoints health check
health.get("/endpoints", async (c) => {
  try {
    const db = getDB();

    // Test critical operations
    const tests = {
      products: false,
      users: false,
      cart: false,
    };

    try {
      await db.collection("products").findOne();
      tests.products = true;
    } catch (error) {
      console.error("Products collection test failed:", error);
    }

    try {
      await db.collection("users").findOne();
      tests.users = true;
    } catch (error) {
      console.error("Users collection test failed:", error);
    }

    try {
      await db.collection("cart").findOne();
      tests.cart = true;
    } catch (error) {
      console.error("Cart collection test failed:", error);
    }

    const allHealthy = Object.values(tests).every((test) => test);

    return c.json(
      {
        status: allHealthy ? "healthy" : "degraded",
        message: allHealthy
          ? "All endpoints are working"
          : "Some endpoints have issues",
        tests,
        timestamp: new Date().toISOString(),
      },
      allHealthy ? 200 : 503
    );
  } catch (error) {
    console.error("Endpoints health check failed:", error);
    return c.json(
      {
        status: "unhealthy",
        message: "Health check failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      503
    );
  }
});

export default health;
