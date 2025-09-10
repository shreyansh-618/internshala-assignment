import { z } from "zod";

// Common validation schemas
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

export const paginationSchema = z.object({
  page: z
    .string()
    .transform((val) => Number.parseInt(val) || 1)
    .refine((val) => val > 0, "Page must be greater than 0"),
  limit: z
    .string()
    .transform((val) => Number.parseInt(val) || 20)
    .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100"),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Validation middleware
export const validateBody = (schema) => {
  return async (c, next) => {
    try {
      const body = await c.req.json();
      const validatedData = schema.parse(body);
      c.set("validatedData", validatedData);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            success: false,
            message: "Validation failed",
            errors: error.errors,
          },
          400
        );
      }
      throw error;
    }
  };
};

export const validateQuery = (schema) => {
  return async (c, next) => {
    try {
      const query = c.req.query();
      const validatedQuery = schema.parse(query);
      c.set("validatedQuery", validatedQuery);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            success: false,
            message: "Invalid query parameters",
            errors: error.errors,
          },
          400
        );
      }
      throw error;
    }
  };
};
