// ─────────────────────────────────────────────────────────────────────────────
// Environment Variables
// ─────────────────────────────────────────────────────────────────────────────
// Load .env FIRST – before any other module reads process.env.
// This ensures every imported module sees the correct config values.
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const todoRoutes = require("./routes/todoRoutes");
const errorHandler = require("./middleware/errorHandler");

// ─────────────────────────────────────────────────────────────────────────────
// App Initialisation
// ─────────────────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────────────────────────
// Global Middleware  (executed for every incoming request, in order)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CORS
 * Allows the React / Next.js frontend (or any other origin) to call the API.
 * In production, replace the wildcard with an explicit origin whitelist:
 *   origin: process.env.CLIENT_URL
 */
app.use(
    cors({
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

/**
 * Body Parser
 * Parses incoming requests with JSON payloads and exposes the result on req.body.
 * The 10 kb limit is a sensible default that guards against large payload attacks.
 */
app.use(express.json({ limit: "10kb" }));

/**
 * Request Logger
 * Lightweight inline logger so the development console shows every hit.
 * Swap for `morgan` or `pino-http` in a production/enterprise setup.
 */
app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}]  ${req.method.padEnd(7)} ${req.originalUrl}`);
    next();
});

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

/** Health-check endpoint – useful for load-balancer / uptime probes. */
app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        data: {
            uptime: `${Math.floor(process.uptime())}s`,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || "development",
        },
    });
});

/** Todo API routes – all prefixed with /api/todos */
app.use("/api/todos", todoRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// 404 – Unknown Route Handler
// ─────────────────────────────────────────────────────────────────────────────
// Placed AFTER all valid routes so it only fires when nothing matched.
// Creates a proper Error object and forwards it to the centralised error
// handler via next() rather than responding inline.
app.use((req, _res, next) => {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
});

// ─────────────────────────────────────────────────────────────────────────────
// Centralised Error Handler
// ─────────────────────────────────────────────────────────────────────────────
// MUST be last – Express identifies error-handling middleware by its 4-argument
// signature (err, req, res, next).
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────────────────────
// Database Connection + Server Bootstrap
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Connects to MongoDB, then starts the HTTP server only on success.
 * This "connect-then-listen" pattern prevents the server from accepting
 * requests when the database is unavailable, which avoids confusing errors.
 */
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            // These options are the recommended defaults for Mongoose 7+.
            // They suppress deprecation warnings and ensure stable connections.
            serverSelectionTimeoutMS: 5000, // Fail fast if replica set unreachable
            socketTimeoutMS: 45000,         // Close idle sockets after 45 s
        });

        console.log("✅ MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📋 Environment : ${process.env.NODE_ENV || "development"}`);
            console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error.message);
        // Exit with a non-zero code so process managers (PM2, Docker, k8s) know
        // the service failed to start and can restart / alert accordingly.
        process.exit(1);
    }
};

startServer();

// ─────────────────────────────────────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────────────────────────────────────
// Ensures in-flight requests and the DB connection are closed cleanly before
// the process exits (e.g. during a deployment rollover or CTRL+C in dev).
const shutdown = async (signal) => {
    console.log(`\n⚠️  ${signal} received – shutting down gracefully…`);
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
    process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
