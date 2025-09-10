import { Hono } from "hono";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDB } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";
import { z } from "zod";

const auth = new Hono();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(1, "Display name is required"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Register user
auth.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = registerSchema.parse(body);

    const db = getDB();
    const users = db.collection("users");

    // Check if user already exists
    const existingUser = await users.findOne({ email: validatedData.email });
    if (existingUser) {
      return c.json({ error: "User already exists with this email" }, 400);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(
      validatedData.password,
      saltRounds
    );

    // Create user
    const newUser = {
      email: validatedData.email,
      password: hashedPassword,
      displayName: validatedData.displayName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    // Generate token
    const token = generateToken(result.insertedId);

    // Return user data (without password)
    const userResponse = {
      _id: result.insertedId,
      email: newUser.email,
      displayName: newUser.displayName,
      createdAt: newUser.createdAt,
    };

    return c.json(
      {
        message: "User registered successfully",
        user: userResponse,
        token,
      },
      201
    );
  } catch (error) {
    console.error("Register error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        400
      );
    }

    return c.json({ error: "Registration failed" }, 500);
  }
});

// Login user
auth.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = loginSchema.parse(body);

    const db = getDB();
    const users = db.collection("users");

    // Find user
    const user = await users.findOne({ email: validatedData.email });
    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Check password
    const isValidPassword = await bcrypt.compare(
      validatedData.password,
      user.password
    );
    if (!isValidPassword) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    await users.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // Return user data (without password)
    const userResponse = {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
    };

    return c.json({
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        400
      );
    }

    return c.json({ error: "Login failed" }, 500);
  }
});

// Get current user profile
auth.get("/profile", authenticateToken, async (c) => {
  try {
    const user = c.get("user");

    const userResponse = {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };

    return c.json({ user: userResponse });
  } catch (error) {
    console.error("Profile error:", error);
    return c.json({ error: "Failed to get profile" }, 500);
  }
});

// Verify token
auth.get("/verify", authenticateToken, async (c) => {
  return c.json({ message: "Token is valid", valid: true });
});

export default auth;
