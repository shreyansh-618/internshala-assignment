// Simple in-memory rate limiter
const requestCounts = new Map();

export const rateLimiter = (options = {}) => {
  const { windowMs = 15 * 60 * 1000, max = 100 } = options; // 15 minutes, 100 requests

  return async (c, next) => {
    const clientIP =
      c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [ip, requests] of requestCounts.entries()) {
      const filteredRequests = requests.filter(
        (timestamp) => timestamp > windowStart
      );
      if (filteredRequests.length === 0) {
        requestCounts.delete(ip);
      } else {
        requestCounts.set(ip, filteredRequests);
      }
    }

    // Get current requests for this IP
    const currentRequests = requestCounts.get(clientIP) || [];
    const recentRequests = currentRequests.filter(
      (timestamp) => timestamp > windowStart
    );

    if (recentRequests.length >= max) {
      return c.json(
        {
          success: false,
          message: "Too many requests",
          error: `Rate limit exceeded. Try again in ${Math.ceil(
            windowMs / 1000
          )} seconds.`,
          timestamp: new Date().toISOString(),
        },
        429
      );
    }

    // Add current request
    recentRequests.push(now);
    requestCounts.set(clientIP, recentRequests);

    // Add rate limit headers
    c.header("X-RateLimit-Limit", max.toString());
    c.header("X-RateLimit-Remaining", (max - recentRequests.length).toString());
    c.header("X-RateLimit-Reset", new Date(now + windowMs).toISOString());

    await next();
  };
};
