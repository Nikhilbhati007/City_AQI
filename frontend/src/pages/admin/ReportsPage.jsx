import { useState, useEffect } from "react";
import { getReports, getReport, downloadReport } from "../../api/adminApi";
import { FiFileText, FiDownload, FiCalendar, FiMapPin, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { getAqiColor, getAqiCategory } from "../../utils/aqiHelpers";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAuth } from "../../context/AuthContext";

export default function ReportsPage() {
    const { user } = useAuth();
    const [availableReports, setAvailableReports] = useState([]);
    const [activeReportType, setActiveReportType] = useState("daily");
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getReports().then(res => {
            setAvailableReports(res.data.reports || []);
        });
    }, []);

    useEffect(() => {
        setLoading(true);
        getReport(activeReportType).then(res => {
            setReportData(res.data.report);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [activeReportType]);

    const handleDownload = async () => {
        try {
            const res = await downloadReport(activeReportType);
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `cityaqi_${activeReportType}_report.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } catch (err) {
            console.error("Download failed");
        }
    };

    // Filter for officer
    const filteredCityData = reportData?.cityData && user?.role === "OFFICER"
        ? reportData.cityData.filter(c => c.city === user.city)
        : reportData?.cityData;

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1><FiFileText /> Analytical Reports</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Aggregated compliance and environmental reports.</p>
                </div>
                <button className="btn btn-primary" onClick={handleDownload} disabled={!reportData}>
                    <FiDownload style={{ marginRight: 8 }} /> Download JSON
                </button>
            </div>

            <div className="tab-group" style={{ marginBottom: 24 }}>
                {availableReports.map(r => (
                    <button 
                        key={r.type} 
                        className={`tab-btn ${activeReportType === r.type ? "active" : ""}`}
                        onClick={() => setActiveReportType(r.type)}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="page-loader"><div className="loader-spinner"></div></div>
            ) : !reportData ? (
                <div className="empty-state glass-panel">Failed to load report data.</div>
            ) : (
                <div className="report-content">
                    <div className="glass-panel" style={{ padding: 24, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h2 style={{ margin: "0 0 8px 0", textTransform: "capitalize" }}>{activeReportType} Compliance Report</h2>
                            <div style={{ display: "flex", gap: 16, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                <span><FiCalendar style={{ marginRight: 4, display: "inline" }} /> 
                                    {reportData.period 
                                        ? (typeof reportData.period === "string" ? reportData.period : `${reportData.period.start} to ${reportData.period.end}`)
                                        : reportData.date}
                                </span>
                                <span>Generated: {new Date(reportData.generatedAt).toLocaleString()}</span>
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>National Average AQI</div>
                            <div style={{ fontSize: "2.5rem", fontWeight: 800, color: getAqiColor(reportData.summary.avgAQI), lineHeight: 1 }}>{reportData.summary.avgAQI}</div>
                        </div>
                    </div>

                    <div className="stats-grid" style={{ marginBottom: 24 }}>
                        <div className="stat-card glass-panel" style={{ padding: 20 }}>
                            <div className="stat-icon" style={{ color: "#3b82f6" }}><FiMapPin /></div>
                            <div className="stat-details">
                                <span className="stat-label">Hotspots Detected</span>
                                <span className="stat-value">{reportData.summary.activeHotspots || reportData.summary.newHotspots}</span>
                            </div>
                        </div>
                        <div className="stat-card glass-panel" style={{ padding: 20 }}>
                            <div className="stat-icon" style={{ color: "#ef4444" }}><FiAlertTriangle /></div>
                            <div className="stat-details">
                                <span className="stat-label">Alerts Issued</span>
                                <span className="stat-value">{reportData.summary.totalAlerts}</span>
                            </div>
                        </div>
                        <div className="stat-card glass-panel" style={{ padding: 20 }}>
                            <div className="stat-icon" style={{ color: "#f59e0b" }}><FiFileText /></div>
                            <div className="stat-details">
                                <span className="stat-label">Enforcement Tasks</span>
                                <span className="stat-value">{reportData.summary.totalAssignments}</span>
                            </div>
                        </div>
                        {reportData.summary.completionRate !== undefined && (
                            <div className="stat-card glass-panel" style={{ padding: 20 }}>
                                <div className="stat-icon" style={{ color: "#10b981" }}><FiCheckCircle /></div>
                                <div className="stat-details">
                                    <span className="stat-label">Task Completion</span>
                                    <span className="stat-value">{reportData.summary.completionRate}%</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {filteredCityData && (
                        <div className="glass-panel" style={{ padding: 24 }}>
                            <h3 style={{ marginBottom: 24 }}>City Performance Breakdown</h3>
                            
                            <div style={{ height: 350, marginBottom: 32 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={filteredCityData} margin={{ left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="city" stroke="#94a3b8" tick={{ fontSize: 12 }} />
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

                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>City</th>
                                            <th>Avg AQI</th>
                                            <th>Max AQI</th>
                                            <th>Category</th>
                                            <th>Stations Active</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCityData.map(c => (
                                            <tr key={c.city}>
                                                <td><strong>{c.city}</strong></td>
                                                <td style={{ color: getAqiColor(c.avgAQI), fontWeight: 600 }}>{c.avgAQI}</td>
                                                <td>{c.maxAQI}</td>
                                                <td><span className="badge" style={{ background: `${getAqiColor(c.avgAQI)}18`, color: getAqiColor(c.avgAQI) }}>{getAqiCategory(c.avgAQI)}</span></td>
                                                <td>{c.stations}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
