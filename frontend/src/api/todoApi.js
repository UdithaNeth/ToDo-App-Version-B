import axios from "axios";

// ─────────────────────────────────────────────────────────────────────────────
// Axios Instance
// ─────────────────────────────────────────────────────────────────────────────
// Centralise the base URL so every API call automatically targets the backend.
// In production, Vite replaces import.meta.env.VITE_API_URL at build time.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    headers: { "Content-Type": "application/json" },
    timeout: 10000, // Fail fast after 10 s of no response
});

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch all todos. Supports optional ?status= and ?priority= query params. */
export const fetchTodos = (params = {}) => api.get("/todos", { params });

/** Fetch a single todo by ID. */
export const fetchTodoById = (id) => api.get(`/todos/${id}`);

/** Create a new todo. */
export const createTodo = (data) => api.post("/todos", data);

/** Partially update a todo. */
export const updateTodo = (id, data) => api.patch(`/todos/${id}`, data);

/** Permanently remove a todo. */
export const deleteTodo = (id) => api.delete(`/todos/${id}`);
