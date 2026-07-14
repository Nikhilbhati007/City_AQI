import { useState, useEffect } from "react";
import { getDashboard } from "../../api/adminApi";
import { getAqiColor, getAqiCategory, getAqiEmoji } from "../../utils/aqiHelpers";
import { FiRadio, FiAlertTriangle, FiMapPin, FiClipboard, FiActivity, FiWind } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import AdminMonitoringPredictions from "./AdminMonitoringPredictions";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchDashboard = () => {
        getDashboard().then(res => {
            setData(res.data.dashboard);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.emit("joinAdmin");

        socket.on("stationUpdate", () => {
            fetchDashboard(); // Refresh on important events
        });
        
        socket.on("newAlert", () => fetchDashboard());
        socket.on("newHotspot", () => fetchDashboard());
        socket.on("newAssignment", () => fetchDashboard());

        return () => {
            socket.off("stationUpdate");
            socket.off("newAlert");
            socket.off("newHotspot");
            socket.off("newAssignment");
        };
    }, [socket]);

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;
    if (!data) return <div className="empty-state">Failed to load dashboard data</div>;

    const { stats, topStations, recentAlerts, recentHotspots, cityAQIData } = data;

    // RBAC Filtering for Officers
    const isOfficer = user?.role === "OFFICER";
    const officerCity = user?.city;

    const filteredCityData = isOfficer 
        ? cityAQIData.filter(c => c._id === officerCity)
        : cityAQIData;

    const filteredStations = isOfficer
        ? topStations.filter(s => s.city === officerCity)
        : topStations;

    let avgPM25 = 0, avgPM10 = 0, avgNO2 = 0, avgSO2 = 0, avgCO = 0, avgO3 = 0;
    if (isOfficer && filteredStations.length > 0) {
        avgPM25 = Math.round(filteredStations.reduce((acc, s) => acc + (s.PM25 || 0), 0) / filteredStations.length);
        avgPM10 = Math.round(filteredStations.reduce((acc, s) => acc + (s.PM10 || 0), 0) / filteredStations.length);
        avgNO2 = Math.round(filteredStations.reduce((acc, s) => acc + (s.NO2 || 0), 0) / filteredStations.length);
        avgSO2 = Math.round(filteredStations.reduce((acc, s) => acc + (s.SO2 || 0), 0) / filteredStations.length);
        avgCO = Math.round(filteredStations.reduce((acc, s) => acc + (s.CO || 0), 0) / filteredStations.length);
        avgO3 = Math.round(filteredStations.reduce((acc, s) => acc + (s.O3 || 0), 0) / filteredStations.length);
    }

    const getPollutantPercentage = (val, max) => Math.min(100, Math.max(0, (val / max) * 100));

    const filteredAlerts = isOfficer
        ? recentAlerts.filter(a => a.targetArea === officerCity)
        : recentAlerts;

    const filteredHotspots = isOfficer
        ? recentHotspots.filter(h => (h.city === officerCity) || (h.location && h.location.includes(officerCity)))
        : recentHotspots;

    return (
        <div className="dashboard-page">
            <div className="page-header" style={{ marginBottom: 32 }}>
                <h1>Admin Dashboard</h1>
                <p style={{ color: "var(--text-secondary)" }}>Real-time overview of urban air quality operations.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card glass-panel">
                    <div className="stat-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}><FiRadio /></div>
                    <div className="stat-details">
                        <span className="stat-label">Active Stations</span>
                        <span className="stat-value">{stats.activeStations} <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 400 }}>/ {stats.totalStations}</span></span>
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <div className="stat-icon" style={{ background: `${getAqiColor(stats.avgAQI)}20`, color: getAqiColor(stats.avgAQI) }}>{getAqiEmoji(stats.avgAQI)}</div>
                    <div className="stat-details">
                        <span className="stat-label">National Avg AQI</span>
                        <span className="stat-value" style={{ color: getAqiColor(stats.avgAQI) }}>{stats.avgAQI}</span>
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <div className="stat-icon" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}><FiAlertTriangle /></div>
                    <div className="stat-details">
                        <span className="stat-label">Critical Zones</span>
                        <span className="stat-value">{stats.criticalStations}</span>
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <div className="stat-icon" style={{ background: "rgba(249, 115, 22, 0.1)", color: "#f97316" }}><FiMapPin /></div>
                    <div className="stat-details">
                        <span className="stat-label">Active Hotspots</span>
                        <span className="stat-value">{stats.activeHotspots}</span>
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <div className="stat-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}><FiClipboard /></div>
                    <div className="stat-details">
                        <span className="stat-label">Pending Assignments</span>
                        <span className="stat-value">{stats.pendingAssignments}</span>
                    </div>
                </div>
            </div>

            {isOfficer ? (
                <div style={{ marginTop: 24 }}>
                    <AdminMonitoringPredictions embedded={true} />
                </div>
            ) : (
                <>
                    <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
                        <div className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
                            <h3 style={{ marginBottom: 24 }}><FiActivity style={{ marginRight: 8 }} /> City AQI Rankings</h3>
                            <div style={{ flex: 1, minHeight: 350 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={filteredCityData} margin={{ left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="_id" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                        <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                                        <Bar dataKey="avgAQI" name="Average AQI" radius={[4, 4, 0, 0]} maxBarSize={80}>
                                            {filteredCityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getAqiColor(entry.avgAQI)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: 24 }}>
                            <h3 style={{ marginBottom: 16 }}><FiAlertTriangle style={{ marginRight: 8 }} /> Recent Alerts</h3>
                            {filteredAlerts.length === 0 ? (
                                <p style={{ color: "var(--text-muted)" }}>No recent alerts.</p>
                            ) : (
                                <div className="feed-list">
                                    {filteredAlerts.map(alert => (
                                        <div key={alert._id} className="feed-item" style={{ borderLeft: `3px solid ${alert.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'}` }}>
                                            <h5 style={{ margin: "0 0 4px 0" }}>{alert.title}</h5>
                                            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>{alert.targetArea}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <h3 style={{ marginTop: 32, marginBottom: 16 }}><FiMapPin style={{ marginRight: 8 }} /> New Hotspots</h3>
                            {filteredHotspots.length === 0 ? (
                                <p style={{ color: "var(--text-muted)" }}>No recent hotspots.</p>
                            ) : (
                                <div className="feed-list">
                                    {filteredHotspots.map(hotspot => (
                                        <div key={hotspot._id} className="feed-item" style={{ borderLeft: `3px solid ${getAqiColor(hotspot.aqi)}` }}>
                                            <h5 style={{ margin: "0 0 4px 0" }}>{hotspot.name}</h5>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>{hotspot.location}</p>
                                                <span className="badge" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>AQI {hotspot.aqi}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="glass-panel" style={{ padding: 24 }}>
                        <h3 style={{ marginBottom: 16 }}>Highest AQI Stations</h3>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Station</th>
                                        <th>City</th>
                                        <th>AQI</th>
                                        <th>Category</th>
                                        <th>PM2.5</th>
                                        <th>PM10</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStations.map(station => (
                                        <tr key={station._id}>
                                            <td>{station.stationName}</td>
                                            <td>{station.city}</td>
                                            <td style={{ fontWeight: 700, color: getAqiColor(station.AQI) }}>{station.AQI}</td>
                                            <td><span className="badge" style={{ background: `${getAqiColor(station.AQI)}18`, color: getAqiColor(station.AQI) }}>{getAqiCategory(station.AQI)}</span></td>
                                            <td>{station.PM25}</td>
                                            <td>{station.PM10}</td>
                                            <td style={{ textAlign: "right" }}>
                                                <button className="btn btn-sm btn-outline" style={{ borderColor: "#ef4444", color: "#ef4444", marginRight: 8, padding: "4px 8px" }} onClick={() => navigate('/admin/hotspots')} title="Report Hotspot">
                                                    <FiAlertTriangle />
                                                </button>
                                                <button className="btn btn-sm btn-primary" style={{ padding: "4px 8px" }} onClick={() => navigate('/admin/alerts')} title="Send Alert">
                                                    <FiActivity />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
