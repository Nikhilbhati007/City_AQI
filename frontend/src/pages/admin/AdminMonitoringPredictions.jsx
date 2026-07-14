import { useState, useEffect } from "react";
import { getStations, getPredictions } from "../../api/adminApi";
import { getAqiColor, getAqiCategory, formatDateTime } from "../../utils/aqiHelpers";
import { FiActivity, FiRadio, FiClock, FiMapPin, FiTrendingUp, FiInfo, FiWind } from "react-icons/fi";
import { useSocket } from "../../context/SocketContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const CITIES = ["Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad", "Pune"];

export default function AdminMonitoringPredictions({ embedded = false }) {
    const { user } = useAuth();
    const availableCities = user?.role === "OFFICER" && user?.city ? [user.city] : CITIES;
    const [selectedCity, setSelectedCity] = useState(user?.role === "OFFICER" && user?.city ? user.city : "Delhi");
    const [predictionDuration, setPredictionDuration] = useState("24h");
    const [stations, setStations] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getStations({ city: selectedCity }),
            getPredictions()
        ]).then(([stationsRes, predictionsRes]) => {
            setStations(stationsRes.data.stations || []);
            const preds = predictionsRes.data.predictions || [];
            const cityPred = preds.find(p => p.city === selectedCity);
            setPrediction(cityPred || null);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [selectedCity]);

    useEffect(() => {
        if (!socket) return;
        socket.emit("joinAdmin");
        const handleStationUpdate = (updatedStation) => {
            setStations(prev => {
                if (updatedStation.city === selectedCity) {
                    const exists = prev.find(s => s._id === updatedStation._id);
                    if (exists) {
                        return prev.map(s => s._id === updatedStation._id ? updatedStation : s);
                    } else {
                        return [...prev, updatedStation];
                    }
                }
                return prev;
            });
        };
        socket.on("stationUpdate", handleStationUpdate);
        return () => {
            socket.off("stationUpdate", handleStationUpdate);
        };
    }, [socket, selectedCity]);

    const formatChartData = (pred) => {
        if (!pred || !pred.forecasts) return [];
        const times = ["Now", "1h", "6h", "24h", "48h", "72h"];
        
        let limitIndex = times.length;
        if (predictionDuration === "6h") limitIndex = 3;
        else if (predictionDuration === "24h") limitIndex = 4;
        else if (predictionDuration === "48h") limitIndex = 5;

        const allData = [
            { time: "Now", AQI: pred.currentAQI },
            { time: "1h", AQI: pred.forecasts["1h"]?.predictedAQI },
            { time: "6h", AQI: pred.forecasts["6h"]?.predictedAQI },
            { time: "24h", AQI: pred.forecasts["24h"]?.predictedAQI },
            { time: "48h", AQI: pred.forecasts["48h"]?.predictedAQI },
            { time: "72h", AQI: pred.forecasts["72h"]?.predictedAQI },
        ];

        return allData.slice(0, limitIndex);
    };

    const chartData = formatChartData(prediction);
    const avgAqi = stations.length > 0 
        ? Math.round(stations.reduce((sum, s) => sum + s.AQI, 0) / stations.length) 
        : (prediction?.currentAQI || 0);

    const getPollutantPercentage = (val, max) => Math.min(100, Math.max(0, (val / max) * 100));

    // Calculate average pollutants for the city
    const avgPM25 = stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.PM25, 0) / stations.length) : 0;
    const avgPM10 = stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.PM10, 0) / stations.length) : 0;
    const avgNO2 = stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.NO2, 0) / stations.length) : 0;
    const avgSO2 = stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.SO2, 0) / stations.length) : 0;
    const avgCO = stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.CO, 0) / stations.length) : 0;
    const avgO3 = stations.length > 0 ? Math.round(stations.reduce((sum, s) => sum + s.O3, 0) / stations.length) : 0;

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    const content = (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* LEFT SIDE - LIVE MONITORING & POLLUTANTS */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div className="glass-panel" style={{ padding: 24, display: "flex", gap: 24, alignItems: "center" }}>
                        <div style={{ 
                            background: "rgba(0,0,0,0.3)", padding: 32, borderRadius: 16, textAlign: "center", 
                            minWidth: 180, display: "flex", flexDirection: "column", justifyContent: "center" 
                        }}>
                            <div style={{ fontSize: "4.5rem", fontWeight: 900, color: getAqiColor(avgAqi), lineHeight: 1, marginBottom: 12 }}>
                                {avgAqi}
                            </div>
                            <div style={{ 
                                background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: 8, 
                                color: getAqiColor(avgAqi), fontWeight: 700, fontSize: "1.1rem", marginBottom: 12
                            }}>
                                {getAqiCategory(avgAqi)}
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                Current Air Quality Index
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, color: "white" }}>
                                <FiWind /> Pollutant Levels
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {[
                                    { label: "PM2.5", value: avgPM25, max: 250, color: "#ef4444", unit: "µg/m³" },
                                    { label: "PM10", value: avgPM10, max: 400, color: "#f97316", unit: "µg/m³" },
                                    { label: "NO₂", value: avgNO2, max: 200, color: "#8b5cf6", unit: "µg/m³" },
                                    { label: "SO₂", value: avgSO2, max: 100, color: "#3b82f6", unit: "µg/m³" },
                                    { label: "CO", value: avgCO, max: 15, color: "#10b981", unit: "mg/m³" },
                                    { label: "O₃", value: avgO3, max: 150, color: "#eab308", unit: "µg/m³" }
                                ].map((pollutant, idx) => (
                                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                        <div style={{ width: 45, fontSize: "0.85rem", fontWeight: 600 }}>{pollutant.label}</div>
                                        <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", height: 8, borderRadius: 4, overflow: "hidden" }}>
                                            <div style={{ 
                                                width: `${getPollutantPercentage(pollutant.value, pollutant.max)}%`, 
                                                background: pollutant.color, 
                                                height: "100%", 
                                                borderRadius: 4 
                                            }}></div>
                                        </div>
                                        <div style={{ width: 70, textAlign: "right", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                            {pollutant.value} <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{pollutant.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <h3 style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", marginBottom: 8 }}>
                            <FiRadio /> Live Station Feeds ({stations.length})
                        </h3>
                        {stations.length === 0 ? (
                            <div className="glass-panel" style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
                                No active stations in {selectedCity}
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, maxHeight: 400, overflowY: "auto", paddingRight: 8 }}>
                                {stations.map(station => (
                                    <div key={station._id} className="glass-panel" style={{ padding: 16, borderLeft: `4px solid ${getAqiColor(station.AQI)}` }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{station.stationName}</div>
                                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                                                    <FiMapPin /> {station.location}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: getAqiColor(station.AQI) }}>{station.AQI}</div>
                                                <div style={{ fontSize: "0.75rem", color: getAqiColor(station.AQI) }}>{getAqiCategory(station.AQI)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE - PREDICTIONS */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div className="glass-panel" style={{ padding: 24, flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                            <h2 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                                <FiTrendingUp /> AQI Forecast
                            </h2>
                            <div style={{ display: "flex", gap: 8, background: "rgba(0,0,0,0.2)", padding: 4, borderRadius: 8 }}>
                                {["6h", "24h", "48h", "72h"].map(time => (
                                    <button 
                                        key={time}
                                        onClick={() => setPredictionDuration(time)}
                                        style={{
                                            background: predictionDuration === time ? "rgba(255,255,255,0.1)" : "transparent",
                                            color: predictionDuration === time ? "white" : "var(--text-secondary)",
                                            border: "none",
                                            padding: "6px 12px",
                                            borderRadius: 6,
                                            cursor: "pointer",
                                            fontSize: "0.85rem",
                                            fontWeight: 600,
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!prediction ? (
                            <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                                No prediction data available for {selectedCity}
                            </div>
                        ) : (
                            <>
                                <div style={{ height: 350, marginBottom: 32 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -25, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                                            <YAxis stroke="#6b7280" fontSize={12} />
                                            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                                            <Line type="monotone" dataKey="AQI" stroke="#3b82f6" strokeWidth={4} dot={{ r: 5, fill: "#3b82f6", strokeWidth: 0 }} activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                <div style={{ display: "flex", gap: 16, marginTop: "auto" }}>
                                    <div style={{ flex: 1, background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", padding: "16px", borderRadius: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
                                        <FiInfo size={24} style={{ flexShrink: 0 }} />
                                        <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5 }}>
                                            Predictions are generated using ML models assessing rolling averages and time-of-day.
                                        </p>
                                    </div>
                                    <button 
                                        className="btn btn-outline" 
                                        style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)", padding: "0 24px", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}
                                        onClick={() => navigate(`/admin/alerts?broadcast=${selectedCity}`)}
                                    >
                                        <FiRadio size={18} /> Broadcast Alert
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
    );

    if (embedded) {
        return content;
    }

    return (
        <div className="page-container" style={{ maxWidth: 1400, margin: "0 auto" }}>
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <h1><FiActivity /> Monitoring & Predictions</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Unified dashboard for live telemetry and AI forecasting.</p>
                </div>
            </div>

            <div className="glass-panel" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 24px", overflowX: "auto", whiteSpace: "nowrap", marginBottom: 32 }}>
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

            {content}
        </div>
    );
}
