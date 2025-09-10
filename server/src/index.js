import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import healthRoutes from "./routes/health.js";

// Import database connection
import { connectDB } from "./config/database.js";

// Import middleware
import { globalErrorHandler } from "./middleware/errorHandler.js";
import { rateLimiter } from "./middleware/rateLimiter.js";

// Load environment variables
dotenv.config();

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000", // local dev
      "http://127.0.0.1:3000",
      process.env.FRONTEND_URL, // your deployed frontend
    ],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Rate limiting
app.use("*", rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));

// Health check route
app.get("/", (c) => {
  return c.json({
    message: "Intern API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      products: "/api/products",
      cart: "/api/cart",
    },
  });
});

// API Routes
app.route("/health", healthRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/products", productRoutes);
app.route("/api/cart", cartRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: "Route not found",
      error: `The requested endpoint ${c.req.path} does not exist`,
      timestamp: new Date().toISOString(),
    },
    404
  );
});

// Global error handler
app.onError(globalErrorHandler);

// Connect to database
connectDB()
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
  })
  .catch((error) => {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  });

// 🚀 Export for serverless (Render, Vercel, etc.)
export default app;
