import { useState, useEffect } from "react";
import { getAlerts, broadcastAlert, deleteAlert } from "../../api/adminApi";
import { formatDateTime, getSeverityColor } from "../../utils/aqiHelpers";
import { FiAlertTriangle, FiRadio, FiTrash2, FiPlus } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useSearchParams } from "react-router-dom";

export default function AlertsManagement() {
    const { user } = useAuth();
    const { socket } = useSocket() || {};
    const [searchParams] = useSearchParams();
    const [alerts, setAlerts] = useState([]);
    const [activeTab, setActiveTab] = useState("LIVE");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: "", description: "", severity: "HIGH", targetArea: user?.role === "SUPER_ADMIN" ? "All Regions" : (user?.city || "All Regions"), durationHours: 24, advisories: []
    });

    const handleOpenModal = () => {
        setFormData({
            title: "", description: "", severity: "HIGH", 
            targetArea: user?.role === "SUPER_ADMIN" ? "All Regions" : (user?.city || "All Regions"), 
            durationHours: 24, advisories: []
        });
        setShowModal(true);
    };

    const advisoryOptions = [
        "Elderly & Seniors: Stay indoors and keep windows closed.",
        "Children & Schools: Suspend all outdoor physical activities.",
        "Respiratory/Asthma: Keep inhalers handy and avoid exertion.",
        "Outdoor Activities: Avoid morning walks and heavy exercises.",
        "Vehicle Restrictions: Carpooling recommended; avoid diesel vehicles."
    ];

    const toggleAdvisory = (adv) => {
        setFormData(prev => ({
            ...prev,
            advisories: prev.advisories.includes(adv) 
                ? prev.advisories.filter(a => a !== adv)
                : [...prev.advisories, adv]
        }));
    };

    const fetchAlerts = () => {
        getAlerts()
            .then(res => { setAlerts(res.data.alerts || []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { 
        fetchAlerts(); 
    }, []);

    useEffect(() => {
        if (!socket) return;
        
        const handleNewAlert = () => {
            fetchAlerts();
        };

        socket.on("emergencyAlert", handleNewAlert);
        return () => {
            socket.off("emergencyAlert", handleNewAlert);
        };
    }, [socket]);

    useEffect(() => {
        const broadcastCity = searchParams.get("broadcast");
        if (broadcastCity) {
            setFormData(prev => ({
                ...prev,
                targetArea: broadcastCity
            }));
            setShowModal(true);
        }
    }, [searchParams]);

    const handleBroadcast = async (e) => {
        e.preventDefault();
        try {
            await broadcastAlert({
                ...formData,
                expiresAt: new Date(Date.now() + formData.durationHours * 60 * 60 * 1000).toISOString()
            });
            setShowModal(false);
            setFormData({ title: "", description: "", severity: "HIGH", targetArea: "", durationHours: 24, advisories: [] });
            fetchAlerts();
            alert("Emergency alert broadcasted via WebSockets to all active clients in the target area.");
        } catch (err) {
            alert(err.response?.data?.message || "Broadcast failed");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Retract and delete this alert?")) {
            try {
                await deleteAlert(id);
                fetchAlerts();
            } catch (err) {
                alert("Delete failed");
            }
        }
    };

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1><FiAlertTriangle /> Public Safety Alerts</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Manage and broadcast emergency health advisories via WebSockets.</p>
                </div>
                <button className="btn btn-primary" onClick={handleOpenModal}>
                    <FiRadio style={{ marginRight: 8 }} /> Broadcast New Alert
                </button>
            </div>

            <div style={{ display: "flex", gap: 16, marginBottom: 24, borderBottom: "1px solid var(--border-glass)", paddingBottom: 16 }}>
                <button 
                    className={`btn ${activeTab === "LIVE" ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setActiveTab("LIVE")}
                >
                    Live Alerts
                </button>
                <button 
                    className={`btn ${activeTab === "EXPIRED" ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setActiveTab("EXPIRED")}
                >
                    Expired Alerts
                </button>
            </div>

            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 24 }}>
                {alerts.filter(alert => {
                    if (user?.role === "OFFICER" && alert.targetArea !== user?.city) return false;
                    return activeTab === "LIVE" ? new Date(alert.expiresAt) > new Date() : new Date(alert.expiresAt) <= new Date();
                }).map(alert => {
                    const isExpired = new Date(alert.expiresAt) < new Date();
                    const createdById = alert.createdBy?._id || alert.createdBy;
                    const canRetract = user.role === "SUPER_ADMIN" || createdById === user._id;
                    
                    return (
                        <div key={alert._id} className="glass-panel" style={{ padding: 24, position: "relative", borderTop: `4px solid ${getSeverityColor(alert.severity)}` }}>
                            {isExpired && (
                                <div style={{ position: "absolute", top: 12, right: 12, fontSize: "0.75rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: 4 }}>
                                    EXPIRED
                                </div>
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <span className="badge" style={{ background: `${getSeverityColor(alert.severity)}18`, color: getSeverityColor(alert.severity) }}>
                                    {alert.severity}
                                </span>
                                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{alert.targetArea}</span>
                            </div>
                            
                            <h3 style={{ margin: "0 0 12px 0", color: isExpired ? "var(--text-secondary)" : "#fff" }}>{alert.title}</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: 20 }}>
                                {alert.description}
                            </p>
                            
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                    <div>Issued: {formatDateTime(alert.createdAt)}</div>
                                    <div>By: {alert.createdBy?.name || "System"} ({alert.createdBy?.role === "SUPER_ADMIN" ? "Admin" : "Officer"})</div>
                                </div>
                                {canRetract && (
                                    <button className="btn btn-sm btn-outline" style={{ borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "6px 12px" }} onClick={() => handleDelete(alert._id)}>
                                        <FiTrash2 /> Retract
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h2 style={{ display: "flex", alignItems: "center", gap: 8, color: "#ef4444" }}><FiRadio /> Emergency Broadcast</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleBroadcast} className="modal-body">
                            <div className="alert-error" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: 12, borderRadius: 8, marginBottom: 20, fontSize: "0.9rem" }}>
                                <strong>Warning:</strong> This will instantly trigger push notifications and UI alerts on all active citizen portals in the targeted area.
                            </div>
                            
                            <div className="form-group">
                                <label>Alert Headline</label>
                                <input type="text" className="form-control" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Severe Smog Warning - Schools Closed" />
                            </div>
                            <div className="form-group">
                                <label>Detailed Description</label>
                                <textarea className="form-control" rows="4" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Provide clear instructions and health advisories..."></textarea>
                            </div>
                            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div className="form-group">
                                    <label>Severity Level</label>
                                    <select className="form-control" value={formData.severity} onChange={e => setFormData({ ...formData, severity: e.target.value })}>
                                        <option value="CRITICAL">CRITICAL (AQI &gt; 400)</option>
                                        <option value="HIGH">HIGH (AQI &gt; 300)</option>
                                        <option value="MEDIUM">MEDIUM (AQI &gt; 200)</option>
                                        <option value="LOW">LOW</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Target Area / City</label>
                                    <select 
                                        className="form-control" 
                                        value={formData.targetArea} 
                                        onChange={e => setFormData({ ...formData, targetArea: e.target.value })}
                                        disabled={user?.role !== "SUPER_ADMIN"}
                                        style={user?.role !== "SUPER_ADMIN" ? { opacity: 0.7, cursor: "not-allowed", backgroundColor: "rgba(255,255,255,0.05)" } : {}}
                                    >
                                        <option value="All Regions">All Regions</option>
                                        <option value="Bengaluru">Bengaluru</option>
                                        <option value="Delhi">Delhi</option>
                                        <option value="Mumbai">Mumbai</option>
                                        <option value="Chennai">Chennai</option>
                                        <option value="Kolkata">Kolkata</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: 16 }}>
                                <label style={{ marginBottom: 12, display: "block" }}>Specific Health Advisories</label>
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {advisoryOptions.map((adv, idx) => (
                                        <label key={idx} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                            <input 
                                                type="checkbox" 
                                                checked={formData.advisories.includes(adv)}
                                                onChange={() => toggleAdvisory(adv)}
                                                style={{ width: 16, height: 16 }}
                                            />
                                            {adv}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                                <div className="form-group">
                                    <label>Estimated Duration (Hours)</label>
                                    <input type="number" min="1" max="168" className="form-control" required value={formData.durationHours} onChange={e => setFormData({ ...formData, durationHours: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="modal-footer" style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ background: "#ef4444", borderColor: "#ef4444" }}>Broadcast Alert Now</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
