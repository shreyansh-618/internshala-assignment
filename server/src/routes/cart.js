import { Hono } from "hono";
import { getDB } from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";
import { ObjectId } from "mongodb";
import { z } from "zod";

const cart = new Hono();

// Validation schemas
const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").optional(),
});

const updateCartSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

// Get user's cart
cart.get("/", authenticateToken, async (c) => {
  try {
    const user = c.get("user");
    const db = getDB();

    // Get cart items with product details
    const cartItems = await db
      .collection("cart")
      .aggregate([
        { $match: { userId: user._id } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            _id: 1,
            quantity: 1,
            addedAt: 1,
            product: 1,
            totalPrice: { $multiply: ["$quantity", "$product.price"] },
          },
        },
        { $sort: { addedAt: -1 } },
      ])
      .toArray();

    // Calculate cart totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return c.json({
      cartItems,
      summary: {
        itemCount,
        subtotal: Number.parseFloat(subtotal.toFixed(2)),
        tax: Number.parseFloat((subtotal * 0.08).toFixed(2)),
        total: Number.parseFloat((subtotal * 1.08).toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return c.json({ error: "Failed to fetch cart" }, 500);
  }
});

// Add item to cart
cart.post("/add", authenticateToken, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const validatedData = addToCartSchema.parse(body);

    if (!ObjectId.isValid(validatedData.productId)) {
      return c.json({ error: "Invalid product ID" }, 400);
    }

    const db = getDB();

    // Check if product exists
    const product = await db.collection("products").findOne({
      _id: new ObjectId(validatedData.productId),
    });

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    // Check if item already in cart
    const existingCartItem = await db.collection("cart").findOne({
      userId: user._id,
      productId: new ObjectId(validatedData.productId),
    });

    const quantity = validatedData.quantity || 1;

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity;
      await db.collection("cart").updateOne(
        { _id: existingCartItem._id },
        {
          $set: {
            quantity: newQuantity,
            updatedAt: new Date(),
          },
        }
      );

      return c.json({
        message: "Cart updated successfully",
        quantity: newQuantity,
      });
    } else {
      // Add new item
      const cartItem = {
        userId: user._id,
        productId: new ObjectId(validatedData.productId),
        quantity,
        addedAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("cart").insertOne(cartItem);

      return c.json(
        {
          message: "Item added to cart successfully",
          quantity,
        },
        201
      );
    }
  } catch (error) {
    console.error("Add to cart error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        400
      );
    }

    return c.json({ error: "Failed to add item to cart" }, 500);
  }
});

// Update cart item quantity
cart.put("/:id", authenticateToken, async (c) => {
  try {
    const user = c.get("user");
    const cartItemId = c.req.param("id");
    const body = await c.req.json();
    const validatedData = updateCartSchema.parse(body);

    if (!ObjectId.isValid(cartItemId)) {
      return c.json({ error: "Invalid cart item ID" }, 400);
    }

    const db = getDB();

    const result = await db.collection("cart").updateOne(
      {
        _id: new ObjectId(cartItemId),
        userId: user._id,
      },
      {
        $set: {
          quantity: validatedData.quantity,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return c.json({ error: "Cart item not found" }, 404);
    }

    return c.json({ message: "Cart item updated successfully" });
  } catch (error) {
    console.error("Update cart error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        400
      );
    }

    return c.json({ error: "Failed to update cart item" }, 500);
  }
});

// Remove item from cart
cart.delete("/:id", authenticateToken, async (c) => {
  try {
    const user = c.get("user");
    const cartItemId = c.req.param("id");

    if (!ObjectId.isValid(cartItemId)) {
      return c.json({ error: "Invalid cart item ID" }, 400);
    }

    const db = getDB();

    const result = await db.collection("cart").deleteOne({
      _id: new ObjectId(cartItemId),
      userId: user._id,
    });

    if (result.deletedCount === 0) {
      return c.json({ error: "Cart item not found" }, 404);
    }

    return c.json({ message: "Item removed from cart successfully" });
  } catch (error) {
    console.error("Remove from cart error:", error);
    return c.json({ error: "Failed to remove item from cart" }, 500);
  }
});

// Clear entire cart
cart.delete("/", authenticateToken, async (c) => {
  try {
    const user = c.get("user");
    const db = getDB();

    await db.collection("cart").deleteMany({ userId: user._id });

    return c.json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Clear cart error:", error);
    return c.json({ error: "Failed to clear cart" }, 500);
  }
});

export default cart;
