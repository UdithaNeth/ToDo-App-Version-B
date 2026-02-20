import { useState } from "react";

const PRIORITY_META = {
    low: { label: "Low", emoji: "🟢", cls: "badge-low" },
    medium: { label: "Medium", emoji: "🟡", cls: "badge-medium" },
    high: { label: "High", emoji: "🔴", cls: "badge-high" },
};

/**
 * TodoItem
 * Renders a single todo card with:
 *  - Checkbox toggle for completion status
 *  - Inline edit mode for title, description, and priority
 *  - Priority badge
 *  - Delete button
 *
 * Props:
 *   todo             – the Todo document from the API
 *   onToggle(id)     – flip the `status` boolean
 *   onUpdate(id, data) – save edited fields
 *   onDelete(id)     – remove the todo
 */
export default function TodoItem({ todo, onToggle, onUpdate, onDelete }) {
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({
        title: todo.title,
        description: todo.description || "",
        priority: todo.priority,
    });

    const priority = PRIORITY_META[todo.priority] || PRIORITY_META.medium;

    const handleEditChange = (e) => {
        setEditData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = () => {
        if (editData.title.trim().length < 3) return;
        onUpdate(todo.id || todo._id, editData);
        setEditing(false);
    };

    const handleCancel = () => {
        setEditData({
            title: todo.title,
            description: todo.description || "",
            priority: todo.priority,
        });
        setEditing(false);
    };

    return (
        <div className={`todo-item ${todo.status ? "completed" : ""} priority-${todo.priority}`}>
            {/* ── Left – checkbox ── */}
            <button
                className={`check-btn ${todo.status ? "checked" : ""}`}
                onClick={() => onToggle(todo.id || todo._id)}
                aria-label={todo.status ? "Mark as incomplete" : "Mark as complete"}
                title={todo.status ? "Mark incomplete" : "Mark complete"}
            >
                {todo.status ? "✓" : ""}
            </button>

            {/* ── Centre – content / edit form ── */}
            <div className="todo-content">
                {editing ? (
                    <div className="edit-form">
                        <input
                            name="title"
                            value={editData.title}
                            onChange={handleEditChange}
                            className="edit-input"
                            placeholder="Title"
                        />
                        <textarea
                            name="description"
                            value={editData.description}
                            onChange={handleEditChange}
                            className="edit-textarea"
                            placeholder="Description (optional)"
                            rows={2}
                        />
                        <select
                            name="priority"
                            value={editData.priority}
                            onChange={handleEditChange}
                            className="edit-select"
                        >
                            <option value="low">🟢 Low</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="high">🔴 High</option>
                        </select>
                        <div className="edit-actions">
                            <button className="btn btn-save" onClick={handleSave}>  💾 Save   </button>
                            <button className="btn btn-cancel" onClick={handleCancel}>✕ Cancel</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className={`todo-title ${todo.status ? "strikethrough" : ""}`}>
                            {todo.title}
                        </p>
                        {todo.description && (
                            <p className="todo-description">{todo.description}</p>
                        )}
                        <span className={`priority-badge ${priority.cls}`}>
                            {priority.emoji} {priority.label}
                        </span>
                    </>
                )}
            </div>

            {/* ── Right – action buttons ── */}
            {!editing && (
                <div className="todo-actions">
                    <button
                        className="btn btn-edit"
                        onClick={() => setEditing(true)}
                        aria-label="Edit todo"
                        title="Edit"
                    >
                        ✏️
                    </button>
                    <button
                        className="btn btn-delete"
                        onClick={() => onDelete(todo.id || todo._id)}
                        aria-label="Delete todo"
                        title="Delete"
                    >
                        🗑️
                    </button>
                </div>
            )}
        </div>
    );
}
