import { getDB } from "../config/database.js";
import { ObjectId } from "mongodb";

// Database utility functions
export class DatabaseUtils {
  static async findById(collection, id) {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid ObjectId");
    }

    const db = getDB();
    return await db.collection(collection).findOne({ _id: new ObjectId(id) });
  }

  static async findByIdAndUpdate(collection, id, update) {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid ObjectId");
    }

    const db = getDB();
    return await db
      .collection(collection)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...update, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
  }

  static async findByIdAndDelete(collection, id) {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid ObjectId");
    }

    const db = getDB();
    return await db
      .collection(collection)
      .findOneAndDelete({ _id: new ObjectId(id) });
  }

  static async createWithTimestamps(collection, data) {
    const db = getDB();
    const document = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return await db.collection(collection).insertOne(document);
  }

  static async paginate(collection, filter = {}, options = {}) {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;

    const db = getDB();
    const skip = (page - 1) * limit;

    const [documents, totalCount] = await Promise.all([
      db
        .collection(collection)
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection(collection).countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      documents,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit,
      },
    };
  }

  static async aggregate(collection, pipeline) {
    const db = getDB();
    return await db.collection(collection).aggregate(pipeline).toArray();
  }
}

// Product-specific database operations
export class ProductDB {
  static async findWithFilters(filters = {}) {
    const db = getDB();
    const pipeline = [];

    // Match stage
    const matchStage = {};

    if (filters.search) {
      matchStage.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
      ];
    }

    if (filters.category && filters.category !== "All") {
      matchStage.category = filters.category;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      matchStage.price = {};
      if (filters.minPrice !== undefined)
        matchStage.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined)
        matchStage.price.$lte = filters.maxPrice;
    }

    if (filters.inStock) {
      matchStage.inStock = true;
      matchStage.stockQuantity = { $gt: 0 };
    }

    pipeline.push({ $match: matchStage });

    // Sort stage
    const sortStage = {};
    if (filters.sortBy) {
      sortStage[filters.sortBy] = filters.sortOrder === "desc" ? -1 : 1;
    } else {
      sortStage.createdAt = -1;
    }
    pipeline.push({ $sort: sortStage });

    // Pagination
    if (filters.page && filters.limit) {
      const skip = (filters.page - 1) * filters.limit;
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: filters.limit });
    }

    return await db.collection("products").aggregate(pipeline).toArray();
  }

  static async getCategories() {
    const db = getDB();
    return await db.collection("products").distinct("category");
  }

  static async getPriceRange() {
    const db = getDB();
    const result = await db
      .collection("products")
      .aggregate([
        {
          $group: {
            _id: null,
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
          },
        },
      ])
      .toArray();

    return result[0] || { minPrice: 0, maxPrice: 1000 };
  }
}

// Cart-specific database operations
export class CartDB {
  static async getUserCart(userId) {
    const db = getDB();
    return await db
      .collection("cart")
      .aggregate([
        { $match: { userId: new ObjectId(userId) } },
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
          $addFields: {
            totalPrice: { $multiply: ["$quantity", "$product.price"] },
          },
        },
        { $sort: { addedAt: -1 } },
      ])
      .toArray();
  }

  static async addOrUpdateItem(userId, productId, quantity) {
    const db = getDB();

    const existingItem = await db.collection("cart").findOne({
      userId: new ObjectId(userId),
      productId: new ObjectId(productId),
    });

    if (existingItem) {
      return await db.collection("cart").findOneAndUpdate(
        { _id: existingItem._id },
        {
          $inc: { quantity: quantity },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: "after" }
      );
    } else {
      const cartItem = {
        userId: new ObjectId(userId),
        productId: new ObjectId(productId),
        quantity,
        addedAt: new Date(),
        updatedAt: new Date(),
      };
      return await db.collection("cart").insertOne(cartItem);
    }
  }

  static async removeItem(userId, cartItemId) {
    const db = getDB();
    return await db.collection("cart").deleteOne({
      _id: new ObjectId(cartItemId),
      userId: new ObjectId(userId),
    });
  }

  static async clearUserCart(userId) {
    const db = getDB();
    return await db.collection("cart").deleteMany({
      userId: new ObjectId(userId),
    });
  }
}
