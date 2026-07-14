import { useState, useEffect } from "react";
import { getHotspots, updateHotspot, deleteHotspot, getOfficersByZone, createAssignment, createHotspot, getStations } from "../../api/adminApi";
import { getAqiColor, getSeverityColor, getStatusColor, formatDateTime } from "../../utils/aqiHelpers";
import { FiMapPin, FiAlertTriangle, FiUserPlus, FiCheckCircle, FiTrash2 } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function HotspotsManagement() {
    const { user } = useAuth();
    const [selectedCity, setSelectedCity] = useState("All");
    const [hotspots, setHotspots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedHotspot, setSelectedHotspot] = useState(null);
    const [officers, setOfficers] = useState([]);
    const [stations, setStations] = useState([]);
    const [assignForm, setAssignForm] = useState({ officerId: "", priority: "HIGH" });
    const [createForm, setCreateForm] = useState({ name: "", city: "", location: "", aqi: 0, severity: "HIGH", source: "INDUSTRY" });

    const fetchHotspots = () => {
        getHotspots()
            .then(res => { setHotspots(res.data.hotspots || []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { 
        fetchHotspots();
        getStations().then(res => setStations(res.data.stations || [])).catch(() => {});
    }, []);

    const handleAssignClick = async (hotspot) => {
        setSelectedHotspot(hotspot);
        const cityParts = hotspot.location.split(',');
        const city = cityParts[cityParts.length - 1].trim() || hotspot.location;
        try {
            const res = await getOfficersByZone(city);
            setOfficers(res.data.officers || []);
            setShowAssignModal(true);
        } catch {
            setOfficers([]);
            setShowAssignModal(true);
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        try {
            await createAssignment({
                officer: assignForm.officerId,
                hotspotId: selectedHotspot._id,
                priority: assignForm.priority
            });
            setShowAssignModal(false);
            setAssignForm({ officerId: "", priority: "HIGH" });
            fetchHotspots();
        } catch (err) {
            alert(err.response?.data?.message || "Assignment failed");
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!createForm.city || !createForm.location) return alert("Please provide city and location.");

            const payload = {
                ...createForm,
                location: `${createForm.location}, ${createForm.city}`,
                latitude: 28.6139, // Defaulting as requested
                longitude: 77.2090
            };
            
            await createHotspot(payload);
            setShowCreateModal(false);
            setCreateForm({ name: "", city: "", location: "", aqi: 0, severity: "HIGH", source: "INDUSTRY" });
            fetchHotspots();
        } catch (err) {
            alert(err.response?.data?.message || "Hotspot creation failed");
        }
    };

    const handleResolve = async (id) => {
        if (window.confirm("Mark this hotspot as resolved?")) {
            try {
                await updateHotspot(id, { status: "RESOLVED" });
                fetchHotspots();
            } catch (err) {
                alert("Update failed");
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this hotspot record?")) {
            try {
                await deleteHotspot(id);
                fetchHotspots();
            } catch (err) {
                alert("Delete failed");
            }
        }
    };

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    const availableCities = ["All", ...new Set(stations.map(s => s.city).filter(Boolean))];

    const filteredHotspots = hotspots.filter(h => {
        if (user?.role !== "SUPER_ADMIN" && !h.location.includes(user?.city)) return false;
        if (selectedCity === "All") return true;
        return h.location.includes(selectedCity);
    });

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1><FiMapPin /> Hotspots Management</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Identify pollution anomalies and assign ground officers for intervention.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <FiAlertTriangle /> Report Hotspot
                </button>
            </div>

            {user?.role === "SUPER_ADMIN" && availableCities.length > 1 && (
                <div className="glass-panel" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 24px", overflowX: "auto", whiteSpace: "nowrap", marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "white", fontWeight: "bold", fontSize: "1.1rem", marginRight: 8 }}>
                        <FiMapPin /> Select City:
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        {availableCities.map(city => {
                            const isActive = selectedCity === city;
                            return (
                                <button
                                    key={city}
                                    onClick={() => setSelectedCity(city)}
                                    style={{
                                        background: isActive ? "var(--primary)" : "rgba(255,255,255,0.05)",
                                        color: isActive ? "white" : "var(--text-secondary)",
                                        border: `1px solid ${isActive ? "var(--primary)" : "rgba(255,255,255,0.1)"}`,
                                        padding: "8px 20px",
                                        borderRadius: 8,
                                        cursor: "pointer",
                                        fontWeight: "600",
                                        transition: "all 0.2s",
                                        boxShadow: isActive ? "0 0 15px rgba(59, 130, 246, 0.4)" : "none"
                                    }}
                                >
                                    {city}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="glass-panel" style={{ padding: 24 }}>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Hotspot Name</th>
                                <th>Location</th>
                                <th>AQI</th>
                                <th>Severity</th>
                                <th>Likely Source</th>
                                <th>Status</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHotspots.map(h => (
                                <tr key={h._id}>
                                    <td><strong>{h.name}</strong><br/><span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{formatDateTime(h.createdAt)}</span></td>
                                    <td>{h.location}</td>
                                    <td style={{ fontWeight: 700, color: getAqiColor(h.aqi) }}>{h.aqi}</td>
                                    <td><span className="badge" style={{ background: `${getSeverityColor(h.severity)}18`, color: getSeverityColor(h.severity) }}>{h.severity}</span></td>
                                    <td>{h.source}</td>
                                    <td><span className="badge" style={{ background: `${getStatusColor(h.status)}18`, color: getStatusColor(h.status) }}>{h.status}</span></td>
                                    <td style={{ textAlign: "right" }}>
                                        {h.status !== "RESOLVED" && h.status !== "ASSIGNED" && (
                                            <button className="btn btn-sm btn-primary" style={{ marginRight: 8, padding: "4px 8px" }} onClick={() => handleAssignClick(h)}>
                                                <FiUserPlus /> Assign
                                            </button>
                                        )}
                                        {h.status !== "RESOLVED" && (
                                            <button className="btn btn-sm btn-outline" style={{ borderColor: "#10b981", color: "#10b981", marginRight: 8, padding: "4px 8px" }} onClick={() => handleResolve(h._id)}>
                                                <FiCheckCircle />
                                            </button>
                                        )}
                                        {user?.role === "SUPER_ADMIN" && (
                                            <button className="btn btn-sm btn-outline" style={{ borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "4px 8px" }} onClick={() => handleDelete(h._id)}>
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

            {showAssignModal && selectedHotspot && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h2>Assign Officer</h2>
                            <button className="close-btn" onClick={() => setShowAssignModal(false)}>×</button>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 8, marginBottom: 20 }}>
                            <h4 style={{ margin: "0 0 8px 0" }}>{selectedHotspot.name}</h4>
                            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>{selectedHotspot.location}</p>
                            <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                                <span className="badge">AQI {selectedHotspot.aqi}</span>
                                <span className="badge">Source: {selectedHotspot.source}</span>
                            </div>
                        </div>
                        <form onSubmit={handleAssignSubmit} className="modal-body">
                            <div className="form-group">
                                <label>Select Officer</label>
                                {officers.length > 0 ? (
                                    <select className="form-control" required value={assignForm.officerId} onChange={e => setAssignForm({ ...assignForm, officerId: e.target.value })}>
                                        <option value="">-- Choose available officer --</option>
                                        {officers.map(o => (
                                            <option key={o._id} value={o._id}>{o.name} ({o.city})</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="alert-error" style={{ padding: "12px", fontSize: "0.9rem" }}>
                                        No officers available in {selectedHotspot.location.split(',')[0]}. Please create an officer profile for this zone first.
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Priority Level</label>
                                <select className="form-control" value={assignForm.priority} onChange={e => setAssignForm({ ...assignForm, priority: e.target.value })}>
                                    <option value="CRITICAL">Critical (Immediate Dispatch)</option>
                                    <option value="HIGH">High (SLA: 2 hours)</option>
                                    <option value="MEDIUM">Medium (SLA: 12 hours)</option>
                                    <option value="LOW">Low (SLA: 24 hours)</option>
                                </select>
                            </div>
                            <div className="modal-footer" style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowAssignModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={!assignForm.officerId}>Confirm Assignment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h2>Report New Hotspot</h2>
                            <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="modal-body">
                            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                    <label>Hotspot / Region Name</label>
                                    <input type="text" className="form-control" required value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} placeholder="e.g. Okhla Industrial Area Phase 2" />
                                </div>
                                <div className="form-group">
                                    <label>City</label>
                                    <select className="form-control" required value={createForm.city} onChange={e => setCreateForm({ ...createForm, city: e.target.value })}>
                                        <option value="">-- Select City --</option>
                                        {availableCities.filter(c => c !== "All").map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Specific Location / Area</label>
                                    <input type="text" className="form-control" required value={createForm.location} onChange={e => setCreateForm({ ...createForm, location: e.target.value })} placeholder="e.g. Sector 12" />
                                </div>
                                <div className="form-group">
                                    <label>AQI Reading</label>
                                    <input type="number" className="form-control" required value={createForm.aqi} onChange={e => setCreateForm({ ...createForm, aqi: Number(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Severity</label>
                                    <select className="form-control" value={createForm.severity} onChange={e => setCreateForm({ ...createForm, severity: e.target.value })}>
                                        <option value="LOW">Low</option>
                                        <option value="MODERATE">Moderate</option>
                                        <option value="HIGH">High</option>
                                        <option value="VERY_HIGH">Very High</option>
                                        <option value="SEVERE">Severe</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                    <label>Suspected Source</label>
                                    <select className="form-control" value={createForm.source} onChange={e => setCreateForm({ ...createForm, source: e.target.value })}>
                                        <option value="INDUSTRY">Industrial Emissions</option>
                                        <option value="CONSTRUCTION">Construction Dust</option>
                                        <option value="TRAFFIC">Traffic Congestion</option>
                                        <option value="WASTE_BURNING">Waste Burning</option>
                                        <option value="MIXED">Mixed Sources</option>
                                        <option value="UNKNOWN">Unknown / Under Investigation</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer" style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Report Hotspot</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
