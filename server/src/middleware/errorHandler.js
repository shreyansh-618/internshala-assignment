import { ZodError } from "zod";

export const globalErrorHandler = async (err, c) => {
  console.error("Global error:", err);

  // Zod validation errors
  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        message: "Validation failed",
        errors: err.errors.map((error) => ({
          field: error.path.join("."),
          message: error.message,
        })),
        timestamp: new Date().toISOString(),
      },
      400
    );
  }

  // MongoDB errors
  if (err.name === "MongoError" || err.name === "MongoServerError") {
    if (err.code === 11000) {
      return c.json(
        {
          success: false,
          message: "Duplicate entry found",
          error: "Resource already exists",
          timestamp: new Date().toISOString(),
        },
        409
      );
    }

    return c.json(
      {
        success: false,
        message: "Database error",
        error:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Database operation failed",
        timestamp: new Date().toISOString(),
      },
      500
    );
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return c.json(
      {
        success: false,
        message: "Invalid token",
        error: "Authentication failed",
        timestamp: new Date().toISOString(),
      },
      401
    );
  }

  if (err.name === "TokenExpiredError") {
    return c.json(
      {
        success: false,
        message: "Token expired",
        error: "Please login again",
        timestamp: new Date().toISOString(),
      },
      401
    );
  }

  // Default error
  return c.json(
    {
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
      timestamp: new Date().toISOString(),
    },
    500
  );
};

export const asyncHandler = (fn) => {
  return async (c, next) => {
    try {
      await fn(c, next);
    } catch (error) {
      await globalErrorHandler(error, c);
    }
  };
};
