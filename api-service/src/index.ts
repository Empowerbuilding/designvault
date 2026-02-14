import express from "express";
import cors from "cors";
import helmet from "helmet";
import { globalLimiter } from "./middleware/rateLimit.js";
import { log } from "./lib/logger.js";
import plansRouter from "./routes/plans.js";
import aiRouter from "./routes/ai.js";
import sessionsRouter from "./routes/sessions.js";
import leadsRouter from "./routes/leads.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// ── Parse allowed origins ───────────────────────────────────

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// ── Middleware ───────────────────────────────────────────────

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(globalLimiter);

// ── Health check ────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ──────────────────────────────────────────────────

app.use("/api/plans", plansRouter);
app.use("/api", aiRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/save-design", leadsRouter);

// ── 404 handler ─────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Error handler ───────────────────────────────────────────

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    log("UNHANDLED_ERROR", { error: err.message, stack: err.stack });
    res.status(500).json({ error: "Internal server error" });
  }
);

// ── Start ───────────────────────────────────────────────────

app.listen(PORT, () => {
  log("SERVER_START", { port: PORT, origins: allowedOrigins });
});

export default app;
