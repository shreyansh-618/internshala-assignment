import { Hono } from "hono";
import { getDB } from "../config/database.js";
import { ObjectId } from "mongodb";
import { z } from "zod";

const products = new Hono();

// Validation schemas
const productQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z
    .string()
    .transform((val) => (val ? Number.parseFloat(val) : undefined))
    .optional(),
  maxPrice: z
    .string()
    .transform((val) => (val ? Number.parseFloat(val) : undefined))
    .optional(),
  page: z
    .string()
    .transform((val) => Number.parseInt(val) || 1)
    .optional(),
  limit: z
    .string()
    .transform((val) => Number.parseInt(val) || 20)
    .optional(),
  sortBy: z.enum(["name", "price", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Get all products with filters
products.get("/", async (c) => {
  try {
    const query = c.req.query();
    const validatedQuery = productQuerySchema.parse(query);

    const db = getDB();
    const productsCollection = db.collection("products");

    // Build filter object
    const filter = {};

    if (validatedQuery.search) {
      filter.$or = [
        { name: { $regex: validatedQuery.search, $options: "i" } },
        { description: { $regex: validatedQuery.search, $options: "i" } },
      ];
    }

    if (validatedQuery.category && validatedQuery.category !== "All") {
      filter.category = validatedQuery.category;
    }

    if (
      validatedQuery.minPrice !== undefined ||
      validatedQuery.maxPrice !== undefined
    ) {
      filter.price = {};
      if (validatedQuery.minPrice !== undefined) {
        filter.price.$gte = validatedQuery.minPrice;
      }
      if (validatedQuery.maxPrice !== undefined) {
        filter.price.$lte = validatedQuery.maxPrice;
      }
    }

    // Build sort object
    const sort = {};
    if (validatedQuery.sortBy) {
      sort[validatedQuery.sortBy] =
        validatedQuery.sortOrder === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort by newest first
    }

    // Pagination
    const page = validatedQuery.page || 1;
    const limit = validatedQuery.limit || 20;
    const skip = (page - 1) * limit;

    // Get products with pagination
    const productsList = await productsCollection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalProducts = await productsCollection.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    // Get categories for filter options
    const categories = await productsCollection.distinct("category");

    return c.json({
      products: productsList,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      categories,
      filters: validatedQuery,
    });
  } catch (error) {
    console.error("Get products error:", error);

    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: "Invalid query parameters",
          details: error.errors,
        },
        400
      );
    }

    return c.json({ error: "Failed to fetch products" }, 500);
  }
});

// Get single product by ID
products.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    if (!ObjectId.isValid(id)) {
      return c.json({ error: "Invalid product ID" }, 400);
    }

    const db = getDB();
    const product = await db.collection("products").findOne({
      _id: new ObjectId(id),
    });

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    return c.json({ product });
  } catch (error) {
    console.error("Get product error:", error);
    return c.json({ error: "Failed to fetch product" }, 500);
  }
});

// Get product categories
products.get("/categories/list", async (c) => {
  try {
    const db = getDB();
    const categories = await db.collection("products").distinct("category");

    return c.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
});

export default products;
