import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FiAlertTriangle, FiClock, FiMapPin, FiInfo, FiWind, FiFilter } from "react-icons/fi";
import { formatDateTime, getSeverityColor } from "../../utils/aqiHelpers";
import API from "../../api/axios";
import { io } from "socket.io-client";

export default function PublicAlertsPage() {
    const location = useLocation();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCity, setSelectedCity] = useState("All Regions");

    useEffect(() => {
        const cityParam = new URLSearchParams(location.search).get("city");
        if (cityParam) {
            setSelectedCity(cityParam);
        }
    }, [location.search]);

    useEffect(() => {
        const fetchAlerts = () => {
            API.get("/public/alerts")
                .then(res => {
                    if (res.data.success) {
                        setAlerts(res.data.alerts);
                    }
                })
                .catch(err => console.error("Failed to fetch public alerts", err))
                .finally(() => setLoading(false));
        };

        fetchAlerts();

        const socket = io("http://localhost:8000", { transports: ["websocket", "polling"] });

        socket.on("emergencyAlert", (data) => {
            // When a new alert comes in, we can either prepend it or refetch. Refetching is safer.
            fetchAlerts();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const citiesList = ["All Regions", "Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad", "Pune"];

    const getAdvisoryIcon = (advisory) => {
        if (advisory.includes("Elderly")) return "🧓";
        if (advisory.includes("Children")) return "🧒";
        if (advisory.includes("Respiratory") || advisory.includes("Asthma")) return "🫁";
        if (advisory.includes("Outdoor")) return "🏃";
        if (advisory.includes("Vehicle")) return "🚗";
        return "⚠️";
    };

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    const filteredAlerts = alerts.filter(a => {
        if (selectedCity === "All Regions") return true;
        return a.targetArea === selectedCity || a.targetArea === "All Regions";
    });

    const activeAlerts = filteredAlerts.filter(a => new Date(a.expiresAt) > new Date() && a.isActive);
    const pastAlerts = filteredAlerts.filter(a => new Date(a.expiresAt) <= new Date() || !a.isActive);

    return (
        <div className="page-container" style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div className="logo-badge" style={{ marginBottom: 16 }}>CityAQI Advisories</div>
                <h1 style={{ fontSize: "2.5rem", marginBottom: 16 }}>Public Safety & Health Alerts</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: 600, margin: "0 auto", marginBottom: 24 }}>
                    Stay informed about air quality emergencies and critical health advisories broadcasted by your local environmental officials.
                </p>

                <div className="glass-panel" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 24px", overflowX: "auto", whiteSpace: "nowrap", marginBottom: 32 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "white", fontWeight: "bold", fontSize: "1.1rem", marginRight: 8 }}>
                        <FiMapPin /> Select City:
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        {citiesList.map(city => {
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
            </div>

            <div style={{ marginBottom: 48 }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 10px #ef4444" }}></div>
                    Active Emergencies
                </h2>

                {activeAlerts.length === 0 ? (
                    <div className="glass-panel" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                        <FiWind size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <h3>No Active Alerts</h3>
                        <p>Air quality conditions are currently stable. No emergency broadcasts at this time.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        {activeAlerts.map(alert => (
                            <div key={alert._id} className="glass-panel" style={{
                                padding: 32,
                                borderLeft: `6px solid ${getSeverityColor(alert.severity)}`,
                                position: "relative",
                                overflow: "hidden"
                            }}>
                                <div style={{ position: "absolute", top: 0, right: 0, padding: "8px 16px", background: `${getSeverityColor(alert.severity)}22`, color: getSeverityColor(alert.severity), borderBottomLeftRadius: 16, fontWeight: "bold", fontSize: "0.85rem" }}>
                                    {alert.severity} SEVERITY
                                </div>

                                <h3 style={{ fontSize: "1.6rem", marginBottom: 16, color: "white", paddingRight: 100 }}>
                                    {alert.title}
                                </h3>

                                <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 24, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <FiClock color="var(--primary)" /> Broadcasted: {formatDateTime(alert.createdAt)}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <FiInfo color="var(--primary)" /> Duration: {alert.durationHours} Hours
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <FiMapPin color="var(--primary)" /> Affected Area: <strong style={{ color: "white" }}>{alert.targetArea}</strong>
                                    </div>
                                </div>

                                {alert.description && (
                                    <div style={{ background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 12, marginBottom: 24, lineHeight: 1.6, color: "var(--text-secondary)" }}>
                                        {alert.description}
                                    </div>
                                )}

                                {alert.advisories && alert.advisories.length > 0 && (
                                    <div>
                                        <h4 style={{ marginBottom: 16, color: "var(--text-secondary)", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                                            Specific Health Advisories
                                        </h4>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                                            {alert.advisories.map((advisory, idx) => (
                                                <div key={idx} style={{
                                                    background: "rgba(255,255,255,0.03)",
                                                    border: "1px solid rgba(255,255,255,0.05)",
                                                    padding: "16px",
                                                    borderRadius: 12,
                                                    display: "flex",
                                                    gap: 12,
                                                    alignItems: "flex-start"
                                                }}>
                                                    <span style={{ fontSize: "1.5rem" }}>{getAdvisoryIcon(advisory)}</span>
                                                    <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.4 }}>
                                                        {advisory}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {pastAlerts.length > 0 && (
                <div>
                    <h2 style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16, color: "var(--text-secondary)" }}>
                        <FiClock /> Historical Alerts
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {pastAlerts.map(alert => (
                            <div key={alert._id} className="glass-panel" style={{ padding: "20px 24px", opacity: 0.7, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                                <div>
                                    <h4 style={{ margin: "0 0 8px 0", color: "var(--text-muted)" }}>{alert.title}</h4>
                                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", gap: 16 }}>
                                        <span>Area: {alert.targetArea}</span>
                                        <span>Broadcasted: {formatDateTime(alert.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}>
                                    EXPIRED
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
