import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPublicPredictions } from "../../api/publicApi";
import { getAqiColor, getAqiCategory } from "../../utils/aqiHelpers";
import { FiTrendingUp, FiMapPin, FiInfo } from "react-icons/fi";

const INDIAN_CITIES = [
    "Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", 
    "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow"
];

export default function PredictionsPage() {
    const [selectedCity, setSelectedCity] = useState("Delhi");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getPublicPredictions(selectedCity)
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(() => {
                setData(null);
                setLoading(false);
            });
    }, [selectedCity]);

    const renderForecastCards = () => {
        if (!data || !data.prediction || !data.prediction.forecasts) return null;

        const forecasts = Object.entries(data.prediction.forecasts);
        return (
            <div className="forecast-cards" style={{ marginTop: 24 }}>
                {forecasts.map(([horizon, f]) => (
                    <div key={horizon} className="forecast-card glass-panel" style={{ borderTop: `3px solid ${getAqiColor(f.predictedAQI)}` }}>
                        <div className="forecast-horizon">{horizon} Forecast</div>
                        <div className="forecast-aqi" style={{ color: getAqiColor(f.predictedAQI), fontSize: "2.5rem", fontWeight: 700 }}>
                            {f.predictedAQI}
                        </div>
                        <div className="forecast-category" style={{ color: getAqiColor(f.predictedAQI), fontWeight: 600 }}>
                            {f.category}
                        </div>
                        <div className="forecast-confidence" style={{ marginTop: 12 }}>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 4 }}>Model Confidence</div>
                            <div className="confidence-bar" style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
                                <div style={{ width: `${f.confidence}%`, height: "100%", background: "#3b82f6", borderRadius: 3 }}></div>
                            </div>
                            <div style={{ fontSize: "0.8rem", textAlign: "right", marginTop: 4 }}>{f.confidence}%</div>
                        </div>
                        <div style={{ marginTop: 12, padding: "8px", background: "rgba(0,0,0,0.2)", borderRadius: 6, fontSize: "0.85rem" }}>
                            Trend: <strong className={f.trend === "rising" ? "text-danger" : f.trend === "falling" ? "text-success" : ""}>
                                {f.trend.toUpperCase()}
                            </strong>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1><FiTrendingUp /> Multi-Horizon AQI Predictions</h1>
                <p style={{ color: "var(--text-secondary)" }}>
                    AI-powered air quality forecasts for the next 1h, 6h, 24h, 48h, and 72h.
                </p>
            </div>

            <div className="glass-panel" style={{ padding: 24, marginBottom: 32 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                    <FiMapPin size={20} className="text-primary" />
                    <h3 style={{ margin: 0 }}>Select City:</h3>
                    <div className="city-chips" style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
                        {INDIAN_CITIES.map(city => (
                            <button 
                                key={city}
                                className={`btn btn-sm ${selectedCity === city ? "btn-primary" : "btn-outline"}`}
                                onClick={() => setSelectedCity(city)}
                            >
                                {city}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="page-loader"><div className="loader-spinner"></div></div>
            ) : !data ? (
                <div className="empty-state glass-panel">
                    <p>Prediction data not currently available for {selectedCity}.</p>
                </div>
            ) : (
                <div>
                    <div className="glass-panel" style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <h2>Current AQI in {selectedCity}</h2>
                            <p style={{ color: "var(--text-secondary)" }}>Based on latest station readings</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "3rem", fontWeight: 700, color: getAqiColor(data.currentAQI) }}>
                                {data.currentAQI}
                            </div>
                            <div className="badge" style={{ background: `${getAqiColor(data.currentAQI)}20`, color: getAqiColor(data.currentAQI) }}>
                                {getAqiCategory(data.currentAQI)}
                            </div>
                        </div>
                    </div>

                    {renderForecastCards()}

                    <div className="glass-panel" style={{ padding: 24, marginTop: 32, display: "flex", gap: 16 }}>
                        <FiInfo size={24} style={{ color: "#3b82f6", flexShrink: 0 }} />
                        <div>
                            <h4 style={{ marginBottom: 8 }}>About these predictions</h4>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                                These forecasts are generated using advanced XGBoost machine learning models trained on historical 
                                CPCB and OpenAQ data. The system uses a multi-horizon approach, providing separate predictions for 
                                different timeframes. Note that confidence naturally decreases for longer-term predictions.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
