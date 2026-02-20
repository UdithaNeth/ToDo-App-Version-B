import { useState } from "react";

const INITIAL = { title: "", description: "", priority: "medium" };

/**
 * TodoForm
 * Controlled form for creating a new Todo.
 *
 * Props:
 *   onAdd(newTodoData) – called with the form payload when the user submits.
 *   loading            – disables submit while an async op is in progress.
 */
export default function TodoForm({ onAdd, loading }) {
    const [form, setForm] = useState(INITIAL);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (form.title.trim().length < 3) {
            setError("Title must be at least 3 characters.");
            return;
        }
        onAdd(form);
        setForm(INITIAL);
    };

    return (
        <form className="todo-form" onSubmit={handleSubmit} noValidate>
            <h2 className="form-title">✨ Add New Todo</h2>

            <div className="form-group">
                <label htmlFor="title">Title <span className="required">*</span></label>
                <input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="What needs to be done?"
                    value={form.title}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="off"
                />
                {error && <p className="field-error">{error}</p>}
            </div>

            <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    name="description"
                    placeholder="Add more details… (optional)"
                    value={form.description}
                    onChange={handleChange}
                    disabled={loading}
                    rows={3}
                />
            </div>

            <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                    id="priority"
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    disabled={loading}
                >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Adding…" : "＋ Add Todo"}
            </button>
        </form>
    );
}
