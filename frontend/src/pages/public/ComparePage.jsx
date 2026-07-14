import { useState, useEffect } from "react";
import { getPublicCities, getPublicCompare } from "../../api/publicApi";
import { getAqiColor, getAqiCategory } from "../../utils/aqiHelpers";
import { FiLayers, FiMapPin, FiWind } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ComparePage() {
    const [cities, setCities] = useState([]);
    const [city1, setCity1] = useState("");
    const [city2, setCity2] = useState("");
    const [comparisonData, setComparisonData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        getPublicCities().then(res => {
            const cityList = res.data.cities || [];
            setCities(cityList);
            if (cityList.length >= 2) {
                setCity1(cityList[0].city);
                setCity2(cityList[1].city);
            }
        });
    }, []);

    const handleCompare = async () => {
        if (!city1 || !city2) return;
        if (city1 === city2) {
            setError("Please select two different cities to compare.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await getPublicCompare(city1, city2);
            setComparisonData(res.data.comparison);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch comparison data.");
        } finally {
            setLoading(false);
        }
    };

    const renderChart = () => {
        if (!comparisonData) return null;
        const d1 = comparisonData.city1;
        const d2 = comparisonData.city2;

        const data = [
            { name: "AQI", [d1.city]: d1.avgAQI, [d2.city]: d2.avgAQI },
            { name: "PM2.5", [d1.city]: d1.pollutants.PM25, [d2.city]: d2.pollutants.PM25 },
            { name: "PM10", [d1.city]: d1.pollutants.PM10, [d2.city]: d2.pollutants.PM10 },
            { name: "NO2", [d1.city]: d1.pollutants.NO2, [d2.city]: d2.pollutants.NO2 },
            { name: "SO2", [d1.city]: d1.pollutants.SO2, [d2.city]: d2.pollutants.SO2 },
            { name: "CO", [d1.city]: d1.pollutants.CO, [d2.city]: d2.pollutants.CO },
        ];

        return (
            <div style={{ height: 400, marginTop: 32 }}>
                <ResponsiveContainer>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#cbd5e1" />
                        <YAxis stroke="#cbd5e1" />
                        <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                        <Legend />
                        <Bar dataKey={d1.city} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey={d2.city} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1><FiLayers /> Compare Cities</h1>
                <p style={{ color: "var(--text-secondary)" }}>Side-by-side air quality comparison between any two monitored cities.</p>
            </div>

            <div className="glass-panel" style={{ padding: 24, marginBottom: 32 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto", gap: 24, alignItems: "end" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>City 1</label>
                        <select className="form-control" value={city1} onChange={e => setCity1(e.target.value)}>
                            {cities.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                        </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 42 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>VS</div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>City 2</label>
                        <select className="form-control" value={city2} onChange={e => setCity2(e.target.value)}>
                            {cities.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={handleCompare} disabled={loading || cities.length < 2} style={{ height: 42 }}>
                        {loading ? "Comparing..." : "Compare"}
                    </button>
                </div>
                {error && <div className="alert-error" style={{ marginTop: 16 }}>{error}</div>}
            </div>

            {comparisonData && (
                <div className="comparison-results">
                    <div className="glass-panel" style={{ padding: 24, marginBottom: 24, textAlign: "center", background: "linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(245, 158, 11, 0.1))" }}>
                        <h3 style={{ marginBottom: 8 }}>Verdict</h3>
                        <p style={{ fontSize: "1.1rem" }}>{comparisonData.summary}</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                        {[comparisonData.city1, comparisonData.city2].map((cityData, index) => (
                            <div key={cityData.city} className="glass-panel" style={{ padding: 24, borderTop: `4px solid ${index === 0 ? "#3b82f6" : "#f59e0b"}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                    <h2><FiMapPin /> {cityData.city}</h2>
                                    <div className="badge" style={{ background: `${getAqiColor(cityData.avgAQI)}20`, color: getAqiColor(cityData.avgAQI), fontSize: "1.1rem" }}>
                                        {getAqiCategory(cityData.avgAQI)}
                                    </div>
                                </div>

                                <div style={{ textAlign: "center", marginBottom: 32 }}>
                                    <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1 }}>Average AQI</div>
                                    <div style={{ fontSize: "4rem", fontWeight: 800, color: getAqiColor(cityData.avgAQI), lineHeight: 1 }}>{cityData.avgAQI}</div>
                                </div>

                                <h4><FiWind /> Pollutants</h4>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                                    <div className="stat-box" style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                                        <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>PM2.5</div>
                                        <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{cityData.pollutants.PM25} <span style={{ fontSize: "0.75rem", fontWeight: 400 }}>µg/m³</span></div>
                                    </div>
                                    <div className="stat-box" style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                                        <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>PM10</div>
                                        <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{cityData.pollutants.PM10} <span style={{ fontSize: "0.75rem", fontWeight: 400 }}>µg/m³</span></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="glass-panel" style={{ padding: 24, marginTop: 24 }}>
                        <h3 style={{ marginBottom: 16 }}>Pollutant Comparison</h3>
                        {renderChart()}
                    </div>
                </div>
            )}
        </div>
    );
}
