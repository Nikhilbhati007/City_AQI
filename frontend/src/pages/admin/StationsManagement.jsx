import { useState, useEffect } from "react";
import { getStations, createStation, updateStation, deleteStation } from "../../api/adminApi";
import { FiPlus, FiEdit2, FiTrash2, FiRadio, FiMapPin } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function StationsManagement() {
    const { user } = useAuth();
    const [selectedCity, setSelectedCity] = useState("All");
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        stationName: "", city: "", location: "", AQI: 0, PM25: 0, PM10: 0, NO2: 0, SO2: 0, CO: 0, O3: 0, status: "ACTIVE"
    });
    const [editingId, setEditingId] = useState(null);

    const fetchStations = () => {
        getStations()
            .then(res => { setStations(res.data.stations || []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchStations(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateStation(editingId, formData);
            } else {
                await createStation(formData);
            }
            setShowModal(false);
            setFormData({ stationName: "", city: "", location: "", AQI: 0, PM25: 0, PM10: 0, NO2: 0, SO2: 0, CO: 0, O3: 0, status: "ACTIVE" });
            setEditingId(null);
            fetchStations();
        } catch (err) {
            alert(err.response?.data?.message || "Operation failed");
        }
    };

    const handleEdit = (station) => {
        setFormData({
            stationName: station.stationName, city: station.city, location: station.location,
            AQI: station.AQI, PM25: station.PM25, PM10: station.PM10, NO2: station.NO2,
            SO2: station.SO2, CO: station.CO, O3: station.O3, status: station.status
        });
        setEditingId(station._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this station?")) {
            try {
                await deleteStation(id);
                fetchStations();
            } catch (err) {
                alert("Delete failed");
            }
        }
    };

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    const availableCities = ["All", ...new Set(stations.map(s => s.city).filter(Boolean))];
    const filteredStations = stations.filter(s => {
        if (user?.role !== "SUPER_ADMIN") return s.city === user?.city;
        if (selectedCity === "All") return true;
        return s.city === selectedCity;
    });

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1><FiRadio /> Stations Management</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Manage monitoring hardware and configurations.</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingId(null); setShowModal(true); }}>
                    <FiPlus /> Add Station
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
                                <th>Name</th>
                                <th>City</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>AQI</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStations.map(s => (
                                <tr key={s._id}>
                                    <td>{s.stationName}</td>
                                    <td>{s.city}</td>
                                    <td>{s.location}</td>
                                    <td>
                                        <span className={`badge ${s.status === 'ACTIVE' ? 'bg-success text-success bg-opacity-10' : s.status === 'MAINTENANCE' ? 'bg-warning text-warning bg-opacity-10' : 'bg-danger text-danger bg-opacity-10'}`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td>{s.AQI}</td>
                                    <td style={{ textAlign: "right" }}>
                                        <button className="btn btn-sm btn-outline" style={{ marginRight: 8, padding: "4px 8px" }} onClick={() => handleEdit(s)}><FiEdit2 /></button>
                                        <button className="btn btn-sm btn-outline" style={{ borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "4px 8px" }} onClick={() => handleDelete(s._id)}><FiTrash2 /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel" style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h2>{editingId ? "Edit Station" : "Add Station"}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div className="form-group">
                                    <label>Station Name</label>
                                    <input type="text" className="form-control" required value={formData.stationName} onChange={e => setFormData({ ...formData, stationName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>City</label>
                                    <input type="text" className="form-control" required value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                    <label>Location / Area</label>
                                    <input type="text" className="form-control" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>AQI</label>
                                    <input type="number" className="form-control" required value={formData.AQI} onChange={e => setFormData({ ...formData, AQI: Number(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                        <option value="MAINTENANCE">Maintenance</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>PM2.5</label><input type="number" className="form-control" value={formData.PM25} onChange={e => setFormData({ ...formData, PM25: Number(e.target.value) })} /></div>
                                <div className="form-group"><label>PM10</label><input type="number" className="form-control" value={formData.PM10} onChange={e => setFormData({ ...formData, PM10: Number(e.target.value) })} /></div>
                                <div className="form-group"><label>NO2</label><input type="number" className="form-control" value={formData.NO2} onChange={e => setFormData({ ...formData, NO2: Number(e.target.value) })} /></div>
                                <div className="form-group"><label>SO2</label><input type="number" className="form-control" value={formData.SO2} onChange={e => setFormData({ ...formData, SO2: Number(e.target.value) })} /></div>
                            </div>
                            <div className="modal-footer" style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingId ? "Update" : "Save"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
