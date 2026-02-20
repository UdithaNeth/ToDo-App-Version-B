/**
 * FilterBar
 * Renders filter controls for status and priority.
 *
 * Props:
 *   filters           – { status: string, priority: string }
 *   onChange(key, val) – called when a filter changes
 *   total             – total number of todos matching current filter
 */
export default function FilterBar({ filters, onChange, total }) {
    return (
        <div className="filter-bar">
            <span className="filter-count">{total} todo{total !== 1 ? "s" : ""}</span>

            <div className="filter-group">
                <label htmlFor="filter-status">Status</label>
                <select
                    id="filter-status"
                    value={filters.status}
                    onChange={(e) => onChange("status", e.target.value)}
                >
                    <option value="">All</option>
                    <option value="false">Pending</option>
                    <option value="true">Completed</option>
                </select>
            </div>

            <div className="filter-group">
                <label htmlFor="filter-priority">Priority</label>
                <select
                    id="filter-priority"
                    value={filters.priority}
                    onChange={(e) => onChange("priority", e.target.value)}
                >
                    <option value="">All</option>
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                </select>
            </div>
        </div>
    );
}
