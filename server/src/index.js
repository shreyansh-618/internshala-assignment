import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import healthRoutes from "./routes/health.js";

import { connectDB } from "./config/database.js";
import { globalErrorHandler } from "./middleware/errorHandler.js";
import { rateLimiter } from "./middleware/rateLimiter.js";

// Load env
dotenv.config();

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://internshala-assignment-r2lh.vercel.app/",
    ],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use("*", rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));

// Routes
app.get("/", (c) =>
  c.json({
    message: "Intern API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      products: "/api/products",
      cart: "/api/cart",
    },
  })
);

app.route("/health", healthRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/products", productRoutes);
app.route("/api/cart", cartRoutes);

app.notFound((c) =>
  c.json(
    {
      success: false,
      message: "Route not found",
      error: `The requested endpoint ${c.req.path} does not exist`,
      timestamp: new Date().toISOString(),
    },
    404
  )
);

app.onError(globalErrorHandler);

const port = process.env.PORT || 8000;

// ✅ Start server with hono adapter
connectDB()
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");

    serve({
      fetch: app.fetch,
      port,
    });

    console.log(`🚀 Server running on http://localhost:${port}`);
  })
  .catch((error) => {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  });

export default app;
