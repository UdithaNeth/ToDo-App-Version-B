// ─────────────────────────────────────────────────────────────────────────────
// Centralized Error Handler Middleware
// ─────────────────────────────────────────────────────────────────────────────
// Express recognises a middleware with exactly FOUR arguments (err, req, res, next)
// as an error-handling middleware.  It must be registered LAST in server.js,
// after all routes, so that any error passed to next(err) flows here.

/**
 * Normalises and responds to all errors that bubble up through the app.
 *
 * Differentiates between well-known Mongoose error types so the client
 * receives a meaningful HTTP status and message instead of a raw 500 every time.
 *
 * @param {Error}                      err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next  – required by Express signature; unused here
 */
const errorHandler = (err, req, res, _next) => {
    // Default to 500 unless a more specific status was attached to the error
    // by the code that threw it (e.g. createError(404, 'Not found')).
    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || "Internal Server Error";

    // ── Mongoose: document failed schema validation ───────────────────────────
    if (err.name === "ValidationError") {
        statusCode = 400;
        // Flatten the per-field error messages into one readable sentence.
        message = Object.values(err.errors)
            .map((e) => e.message)
            .join(". ");
    }

    // ── Mongoose: an invalid ObjectId was cast from a route param ─────────────
    // The controller's isValidObjectId guard should prevent this, but it is
    // still worth handling here as a safety-net.
    if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid value for field "${err.path}": ${err.value}`;
    }

    // ── MongoDB: duplicate key (unique index violation) ───────────────────────
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || "field";
        message = `Duplicate value for "${field}". Please use a different value.`;
    }

    // ── Stack trace: only log in non-production environments ─────────────────
    // Never expose implementation details to the client.
    if (process.env.NODE_ENV !== "production") {
        console.error("❌ [errorHandler]", err.stack || err);
    } else {
        // In production, log only the headline (no stack trace sent externally).
        console.error(`❌ [errorHandler] ${statusCode} – ${message}`);
    }

    res.status(statusCode).json({
        success: false,
        message,
        data: null,
        // Attach the stack in development only – helpful for debugging without
        // being a security risk in production.
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
};

module.exports = errorHandler;
