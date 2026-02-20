import { useState, useEffect, useCallback } from "react";
import {
  fetchTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "./api/todoApi";
import TodoForm from "./components/TodoForm";
import TodoItem from "./components/TodoItem";
import FilterBar from "./components/FilterBar";
import "./App.css";

// ─────────────────────────────────────────────────────────────────────────────
// App  –  Root component and state hub
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [todos, setTodos] = useState([]);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);   // fetch in-flight
  const [saving, setSaving] = useState(false);   // create / update / delete
  const [error, setError] = useState("");       // top-level error banner

  // ── Filter state ────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({ status: "", priority: "" });

  // ─────────────────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Loads todos from the backend, passing the current filter values as query
   * params.  Wrapped in useCallback so it can be passed to child components
   * without causing unnecessary re-renders.
   */
  const loadTodos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Build params object – omit empty strings so the backend sees clean params.
      const params = {};
      if (filters.status !== "") params.status = filters.status;
      if (filters.priority !== "") params.priority = filters.priority;

      const { data } = await fetchTodos(params);
      setTodos(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load todos. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Re-fetch whenever the filters change.
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // ─────────────────────────────────────────────────────────────────────────
  // Filter Handler
  // ─────────────────────────────────────────────────────────────────────────
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Create
  // ─────────────────────────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    setSaving(true);
    setError("");
    try {
      const { data } = await createTodo(formData);
      // Prepend so the new todo appears at the top without a full refetch.
      setTodos((prev) => [data.data, ...prev]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create todo.");
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Toggle (flip status boolean)
  // ─────────────────────────────────────────────────────────────────────────
  const handleToggle = async (id) => {
    // Optimistic UI – flip locally first for instant feedback.
    const original = todos.find((t) => (t.id || t._id) === id);
    setTodos((prev) =>
      prev.map((t) =>
        (t.id || t._id) === id ? { ...t, status: !t.status } : t
      )
    );
    try {
      await updateTodo(id, { status: !original.status });
    } catch (err) {
      // Rollback on failure.
      setTodos((prev) =>
        prev.map((t) =>
          (t.id || t._id) === id ? { ...t, status: original.status } : t
        )
      );
      setError(err.response?.data?.message || "Failed to update status.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Update (title / description / priority)
  // ─────────────────────────────────────────────────────────────────────────
  const handleUpdate = async (id, updatedFields) => {
    setSaving(true);
    setError("");
    try {
      const { data } = await updateTodo(id, updatedFields);
      setTodos((prev) =>
        prev.map((t) => ((t.id || t._id) === id ? data.data : t))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update todo.");
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    // Optimistic removal for snappy UX.
    const backup = todos;
    setTodos((prev) => prev.filter((t) => (t.id || t._id) !== id));
    try {
      await deleteTodo(id);
    } catch (err) {
      setTodos(backup);
      setError(err.response?.data?.message || "Failed to delete todo.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Derived stats for the summary strip
  // ─────────────────────────────────────────────────────────────────────────
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.status).length;
  const pendingCount = totalCount - completedCount;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-inner">
          <h1 className="app-title">📝 TodoFlow</h1>
          <p className="app-subtitle">Stay organised, stay productive</p>
        </div>
      </header>

      <main className="app-main">
        {/* ── Stats Strip ── */}
        <div className="stats-strip">
          <div className="stat-card">
            <span className="stat-number">{totalCount}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card pending">
            <span className="stat-number">{pendingCount}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-card done">
            <span className="stat-number">{completedCount}</span>
            <span className="stat-label">Done</span>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="error-banner" role="alert">
            <span>⚠️ {error}</span>
            <button className="dismiss-btn" onClick={() => setError("")}>✕</button>
          </div>
        )}

        {/* ── Two-column layout: form | list ── */}
        <div className="layout">
          {/* Left – Create form */}
          <aside className="panel panel-form">
            <TodoForm onAdd={handleAdd} loading={saving} />
          </aside>

          {/* Right – Filter + todo list */}
          <section className="panel panel-list">
            <FilterBar
              filters={filters}
              onChange={handleFilterChange}
              total={totalCount}
            />

            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading todos…</p>
              </div>
            ) : todos.length === 0 ? (
              <div className="empty-state">
                <p className="empty-emoji">🎉</p>
                <p className="empty-text">No todos here!</p>
                <p className="empty-hint">Add your first one using the form.</p>
              </div>
            ) : (
              <ul className="todo-list" aria-label="Todo list">
                {todos.map((todo) => (
                  <li key={todo.id || todo._id}>
                    <TodoItem
                      todo={todo}
                      onToggle={handleToggle}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with React + Express + MongoDB</p>
      </footer>
    </div>
  );
}
