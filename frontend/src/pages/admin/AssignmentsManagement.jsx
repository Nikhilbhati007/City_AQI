import { useState, useEffect } from "react";
import { getAssignments, updateAssignment, deleteAssignment } from "../../api/adminApi";
import { getSeverityColor, getStatusColor, formatDateTime } from "../../utils/aqiHelpers";
import { FiClipboard, FiCheckCircle, FiClock, FiTrash2, FiPlayCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function AssignmentsManagement() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [summaryText, setSummaryText] = useState("");
    const [completingAssignmentId, setCompletingAssignmentId] = useState(null);
    const { user } = useAuth();

    const fetchAssignments = () => {
        getAssignments()
            .then(res => { setAssignments(res.data.assignments || []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchAssignments(); }, []);

    const handleUpdateStatus = async (id, status, summary = null) => {
        try {
            await updateAssignment(id, { status, ...(summary && { summary }) });
            fetchAssignments();
            if (showSummaryModal) setShowSummaryModal(false);
        } catch (err) {
            alert("Update failed");
        }
    };

    const handleCompleteClick = (id) => {
        setCompletingAssignmentId(id);
        setSummaryText("");
        setShowSummaryModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this assignment record?")) {
            try {
                await deleteAssignment(id);
                fetchAssignments();
            } catch (err) {
                alert("Delete failed");
            }
        }
    };

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1><FiClipboard /> Field Assignments</h1>
                <p style={{ color: "var(--text-secondary)" }}>Track and manage ground interventions and officer deployments.</p>
            </div>

            <div className="glass-panel" style={{ padding: 24 }}>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Hotspot</th>
                                <th>Assigned Officer</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Timeline</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.filter(a => user?.role === "SUPER_ADMIN" || a.officer?._id === user?._id).map(a => (
                                <tr key={a._id}>
                                    <td>
                                        <strong>{a.hotspotId?.name || "Unknown"}</strong><br/>
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{a.hotspotId?.location}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div className="user-avatar" style={{ width: 24, height: 24, fontSize: "0.7rem" }}>
                                                {a.officer?.name?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <div>{a.officer?.name || "Unknown"}</div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{a.officer?.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="badge" style={{ background: `${getSeverityColor(a.priority)}18`, color: getSeverityColor(a.priority) }}>{a.priority}</span></td>
                                    <td><span className="badge" style={{ background: `${getStatusColor(a.status)}18`, color: getStatusColor(a.status) }}>{a.status}</span></td>
                                    <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                        <div>Created: {formatDateTime(a.createdAt)}</div>
                                        {a.completedAt && <div>Completed: {formatDateTime(a.completedAt)}</div>}
                                        {a.summary && <div style={{ marginTop: 4, color: "#fff", background: "rgba(255,255,255,0.05)", padding: 4, borderRadius: 4 }}>Summary: {a.summary}</div>}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        {a.status === "PENDING" && (
                                            <button className="btn btn-sm btn-outline" style={{ borderColor: "#3b82f6", color: "#3b82f6", marginRight: 8, padding: "4px 8px" }} onClick={() => handleUpdateStatus(a._id, "IN_PROGRESS")} title="Start Work">
                                                <FiPlayCircle />
                                            </button>
                                        )}
                                        {a.status === "IN_PROGRESS" && (
                                            <button className="btn btn-sm btn-outline" style={{ borderColor: "#10b981", color: "#10b981", marginRight: 8, padding: "4px 8px" }} onClick={() => handleCompleteClick(a._id)} title="Mark Completed">
                                                <FiCheckCircle /> Submit
                                            </button>
                                        )}
                                        {a.status === "PENDING_VERIFICATION" && user?.role === "SUPER_ADMIN" && (
                                            <button className="btn btn-sm btn-outline" style={{ borderColor: "#10b981", color: "#10b981", marginRight: 8, padding: "4px 8px" }} onClick={() => handleUpdateStatus(a._id, "COMPLETED")} title="Verify">
                                                <FiCheckCircle /> Verify
                                            </button>
                                        )}
                                        {user?.role === "SUPER_ADMIN" && (
                                            <button className="btn btn-sm btn-outline" style={{ borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "4px 8px" }} onClick={() => handleDelete(a._id)}>
                                                <FiTrash2 />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showSummaryModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h2>Submit Completion Summary</h2>
                            <button className="close-btn" onClick={() => setShowSummaryModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Action Summary</label>
                                <textarea 
                                    className="form-control" 
                                    rows="4" 
                                    required 
                                    value={summaryText} 
                                    onChange={(e) => setSummaryText(e.target.value)} 
                                    placeholder="Briefly describe the intervention actions taken..." 
                                />
                            </div>
                            <div className="modal-footer" style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                <button className="btn btn-outline" onClick={() => setShowSummaryModal(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={() => handleUpdateStatus(completingAssignmentId, "PENDING_VERIFICATION", summaryText)} disabled={!summaryText.trim()}>
                                    Submit for Verification
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
