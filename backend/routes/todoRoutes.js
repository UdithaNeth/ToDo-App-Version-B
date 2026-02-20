const express = require("express");

const {
    createTodo,
    getAllTodos,
    getTodoById,
    updateTodo,
    deleteTodo,
} = require("../contollers/todoController");

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Validation Middleware Placeholders
// ─────────────────────────────────────────────────────────────────────────────
// These are thin pass-through stubs right now.
// Replace the `next()` body with your preferred validation library
// (e.g. express-validator, joi, zod) when you are ready to add
// request-body validation at the route layer.
// Schema-level validation already runs inside Mongoose, so the app is
// protected from bad data even without these middlewares implemented.

/**
 * Validates the request body before creating a new Todo.
 * Placeholder – add library-specific rules here.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateCreateTodo = (req, res, next) => {
    // TODO: implement with express-validator / joi / zod
    // Example with express-validator:
    //   body('title').trim().isLength({ min: 3 }).withMessage('...')
    next();
};

/**
 * Validates the request body before updating an existing Todo.
 * Placeholder – add library-specific rules here.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const validateUpdateTodo = (req, res, next) => {
    // TODO: implement with express-validator / joi / zod
    next();
};

// ─────────────────────────────────────────────────────────────────────────────
// Route Definitions
// ─────────────────────────────────────────────────────────────────────────────
//
//  HTTP Method | Path             | Controller     | Description
//  ─────────────────────────────────────────────────────────────
//  POST        | /api/todos       | createTodo     | Create a new todo
//  GET         | /api/todos       | getAllTodos     | Get all todos (with optional filters)
//  GET         | /api/todos/:id   | getTodoById    | Get a single todo by ID
//  PATCH       | /api/todos/:id   | updateTodo     | Partially update a todo
//  DELETE      | /api/todos/:id   | deleteTodo     | Permanently remove a todo

// ── Collection routes  (operate on the resource as a whole) ──────────────────
router
    .route("/")
    .post(validateCreateTodo, createTodo)   // POST   /api/todos
    .get(getAllTodos);                       // GET    /api/todos

// ── Instance routes  (operate on a single identified resource) ───────────────
router
    .route("/:id")
    .get(getTodoById)                       // GET    /api/todos/:id
    .patch(validateUpdateTodo, updateTodo)  // PATCH  /api/todos/:id
    .delete(deleteTodo);                    // DELETE /api/todos/:id

module.exports = router;
