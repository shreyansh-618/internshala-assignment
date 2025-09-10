import jwt from "jsonwebtoken";
import { getDB } from "../config/database.js";
import { ObjectId } from "mongodb";

export const authenticateToken = async (c, next) => {
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return c.json({ error: "Access token required" }, 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const db = getDB();
    const user = await db.collection("users").findOne({
      _id: new ObjectId(decoded.userId),
    });

    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }

    // Add user to context
    c.set("user", user);
    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json({ error: "Invalid or expired token" }, 401);
  }
};

export const optionalAuth = async (c, next) => {
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const db = getDB();
      const user = await db.collection("users").findOne({
        _id: new ObjectId(decoded.userId),
      });

      if (user) {
        c.set("user", user);
      }
    }

    await next();
  } catch (error) {
    // Continue without authentication
    await next();
  }
};
