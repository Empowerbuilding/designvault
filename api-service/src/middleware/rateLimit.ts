import rateLimit from "express-rate-limit";

/** Global: 100 requests per minute per IP */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

/** AI endpoints: 10 requests per hour per IP */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "AI request limit reached. Try again later." },
});
