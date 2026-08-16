import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/errorHandler.js";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import userRoutes from "./routes/user.routes.js";
import aiRouter from "./routes/ai.js";

const app = express();

// ─── MIDDLEWARES ────────────────────────────────────────
// Allow the live Vercel frontend in production AND localhost in dev.
// (CORS_ORIGIN can be a comma-separated list, e.g. "https://x.vercel.app,http://localhost:5173")
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser tools (Postman) + listed origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// ─── ROOT ROUTE ─────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Finance Tracker API is running 🚀",
  });
});

// ─── HEALTH CHECK ──────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Finance Tracker API is running!",
    timestamp: new Date().toISOString(),
  });
});

// ─── API ROUTES ────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRouter);

// ─── 404 HANDLER ───────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── ERROR HANDLER (must be last) ──────────────────────
app.use(errorHandler);

export default app;