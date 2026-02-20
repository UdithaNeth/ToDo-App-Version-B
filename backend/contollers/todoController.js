const mongoose = require("mongoose");
const Todo = require("../models/Todo");

// ─────────────────────────────────────────────────────────────────────────────
// Helper Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a standardised JSON body that every endpoint returns.
 *
 * @param {boolean} success  - Whether the operation succeeded.
 * @param {string}  message  - Human-readable description of the outcome.
 * @param {*}       [data]   - Payload to include; omit or pass null for errors.
 * @returns {{ success: boolean, message: string, data: * }}
 */
const response = (success, message, data = null) => ({ success, message, data });

/**
 * Validates that `id` is a well-formed MongoDB ObjectId.
 * Prevents Mongoose from throwing a CastError on obviously invalid strings.
 *
 * @param {string} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATE  –  POST /api/todos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new Todo document.
 *
 * Accepts { title, description, status, priority } from the request body.
 * `createdAt` and `updatedAt` are managed automatically by the schema.
 *
 * @route   POST /api/todos
 * @access  Public
 */
const createTodo = async (req, res) => {
    try {
        const { title, description, status, priority } = req.body;

        // Mongoose schema-level validation runs here; any validation error is
        // caught below and returned as a 400 with the validator message.
        const todo = await Todo.create({ title, description, status, priority });

        return res
            .status(201)
            .json(response(true, "Todo created successfully", todo));
    } catch (error) {
        // ValidationError is thrown by Mongoose when schema constraints are violated
        // (e.g. missing required field, enum mismatch, minlength).
        if (error.name === "ValidationError") {
            // Flatten all field-level messages into one readable string.
            const messages = Object.values(error.errors).map((e) => e.message);
            return res
                .status(400)
                .json(response(false, messages.join(". "), null));
        }

        console.error("[createTodo]", error);
        return res
            .status(500)
            .json(response(false, "Server error while creating todo", null));
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. READ ALL  –  GET /api/todos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves all Todo documents.
 *
 * Supports optional query-string filtering:
 *   ?status=true|false   – filter by completion state
 *   ?priority=low|medium|high – filter by priority
 *
 * Results are returned newest-first so the most recent todos appear at the top.
 *
 * @route   GET /api/todos
 * @access  Public
 */
const getAllTodos = async (req, res) => {
    try {
        const filter = {};

        // Only apply filters when the query param is actually present so that
        // omitting them returns every todo rather than an empty set.
        if (req.query.status !== undefined) {
            // Convert the string "true"/"false" to the Boolean the schema stores.
            filter.status = req.query.status === "true";
        }

        if (req.query.priority !== undefined) {
            filter.priority = req.query.priority;
        }

        const todos = await Todo.find(filter).sort({ createdAt: -1 });

        return res
            .status(200)
            .json(
                response(true, `${todos.length} todo(s) retrieved successfully`, todos)
            );
    } catch (error) {
        console.error("[getAllTodos]", error);
        return res
            .status(500)
            .json(response(false, "Server error while retrieving todos", null));
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. READ ONE  –  GET /api/todos/:id
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves a single Todo by its MongoDB ObjectId.
 *
 * Returns 400 for a malformed id so the client knows it sent a bad value,
 * and 404 when the id is valid but no document exists.
 *
 * @route   GET /api/todos/:id
 * @access  Public
 */
const getTodoById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res
                .status(400)
                .json(response(false, `"${id}" is not a valid Todo ID`, null));
        }

        const todo = await Todo.findById(id);

        if (!todo) {
            return res
                .status(404)
                .json(response(false, "Todo not found", null));
        }

        return res
            .status(200)
            .json(response(true, "Todo retrieved successfully", todo));
    } catch (error) {
        console.error("[getTodoById]", error);
        return res
            .status(500)
            .json(response(false, "Server error while retrieving todo", null));
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. UPDATE  –  PATCH /api/todos/:id
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Partially updates an existing Todo.
 *
 * Uses PATCH semantics – only the fields included in the request body are
 * changed; all other fields retain their current values.
 *
 * Key Mongoose options used:
 *   new:            true  – return the updated document, not the pre-update one.
 *   runValidators:  true  – re-run schema validators on the changed fields.
 *
 * @route   PATCH /api/todos/:id
 * @access  Public
 */
const updateTodo = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res
                .status(400)
                .json(response(false, `"${id}" is not a valid Todo ID`, null));
        }

        // Whitelist the fields callers are allowed to update.
        // This prevents accidental or malicious overwrite of system fields like
        // createdAt or _id by simply ignoring anything not in this list.
        const { title, description, status, priority } = req.body;
        const updates = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (status !== undefined) updates.status = status;
        if (priority !== undefined) updates.priority = priority;

        if (Object.keys(updates).length === 0) {
            return res
                .status(400)
                .json(response(false, "No valid fields provided for update", null));
        }

        const todo = await Todo.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!todo) {
            return res
                .status(404)
                .json(response(false, "Todo not found", null));
        }

        return res
            .status(200)
            .json(response(true, "Todo updated successfully", todo));
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res
                .status(400)
                .json(response(false, messages.join(". "), null));
        }

        console.error("[updateTodo]", error);
        return res
            .status(500)
            .json(response(false, "Server error while updating todo", null));
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. DELETE  –  DELETE /api/todos/:id
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Permanently removes a Todo document from the database.
 *
 * Returns 204 No Content on success – the client already knows what was
 * deleted (it sent the id), so there is nothing useful to return in the body.
 *
 * @route   DELETE /api/todos/:id
 * @access  Public
 */
const deleteTodo = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res
                .status(400)
                .json(response(false, `"${id}" is not a valid Todo ID`, null));
        }

        const todo = await Todo.findByIdAndDelete(id);

        if (!todo) {
            return res
                .status(404)
                .json(response(false, "Todo not found", null));
        }

        // 204 means "success, no body". Some clients expect a JSON body even on
        // delete; swap to 200 + the response helper if your frontend needs it.
        return res.status(204).send();
    } catch (error) {
        console.error("[deleteTodo]", error);
        return res
            .status(500)
            .json(response(false, "Server error while deleting todo", null));
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
    createTodo,
    getAllTodos,
    getTodoById,
    updateTodo,
    deleteTodo,
};
