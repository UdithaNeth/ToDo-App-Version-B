const mongoose = require("mongoose");

/**
 * Todo Schema
 * Defines the shape and validation rules for a single Todo document in MongoDB.
 */
const todoSchema = new mongoose.Schema(
    {
        // ── Title ──────────────────────────────────────────────────────────────────
        // Required string; leading/trailing whitespace is stripped automatically.
        // Minimum length of 3 ensures the title is meaningful, not just a stray character.
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            minlength: [3, "Title must be at least 3 characters long"],
        },

        // ── Description ────────────────────────────────────────────────────────────
        // Optional free-text field for additional context.
        // No minlength enforced so that short clarifying notes are still valid.
        description: {
            type: String,
            trim: true,
            default: "",
        },

        // ── Status ─────────────────────────────────────────────────────────────────
        // Boolean flag representing completion state.
        // Defaults to false (not done) so every new todo starts as pending.
        status: {
            type: Boolean,
            default: false,
        },

        // ── Priority ───────────────────────────────────────────────────────────────
        // Restricted to three levels via an enum so the API surface stays consistent
        // and prevents arbitrary strings from entering the database.
        // Defaults to "medium" which is the most common starting priority.
        priority: {
            type: String,
            enum: {
                values: ["low", "medium", "high"],
                message: 'Priority must be one of "low", "medium", or "high"',
            },
            default: "medium",
        },

        // ── CreatedAt ──────────────────────────────────────────────────────────────
        // Explicit timestamp for the moment the todo was created.
        // Stored as a native Date so it can be compared and sorted easily.
        // Mongoose's built-in `timestamps` option is intentionally NOT used here so
        // that createdAt is part of the public schema contract and easy to expose
        // via the API without field-selection boilerplate.
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        // Automatically manage `createdAt` and `updatedAt` via Mongoose timestamps.
        // `createdAt` from the field above takes precedence; `updatedAt` is added
        // as a free bonus to track the last modification time.
        timestamps: { createdAt: false, updatedAt: true },

        // Strip the internal __v versioning key from JSON responses so clients
        // receive clean payloads without Mongoose implementation details.
        toJSON: {
            versionKey: false,
            transform(_doc, ret) {
                // Rename _id → id for a more REST-friendly response shape.
                ret.id = ret._id;
                delete ret._id;
                return ret;
            },
        },
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Index on `status` to speed up queries that filter by completion state.
todoSchema.index({ status: 1 });

// Compound index on `priority` + `createdAt` to support listing todos sorted
// by urgency and recency without a collection scan.
todoSchema.index({ priority: 1, createdAt: -1 });

// ── Model ─────────────────────────────────────────────────────────────────────
// Mongoose pluralises "Todo" → "todos" automatically as the collection name.
const Todo = mongoose.model("Todo", todoSchema);

module.exports = Todo;
