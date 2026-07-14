import { FiSettings, FiSave, FiServer, FiShield, FiBell } from "react-icons/fi";

export default function SettingsPage() {
    const handleSave = (e) => {
        e.preventDefault();
        alert("Settings saved successfully (Demo only)");
    };

    return (
        <div className="page-container" style={{ maxWidth: 800 }}>
            <div className="page-header">
                <h1><FiSettings /> System Settings</h1>
                <p style={{ color: "var(--text-secondary)" }}>Configure platform parameters and ML thresholds.</p>
            </div>

            <form onSubmit={handleSave}>
                <div className="glass-panel" style={{ padding: 24, marginBottom: 24 }}>
                    <h3 style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><FiServer /> API & Data Sources</h3>
                    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                            <label>OpenAQ API Key</label>
                            <input type="password" className="form-control" defaultValue="••••••••••••••••••••••••" />
                        </div>
                        <div className="form-group">
                            <label>Data Polling Interval (minutes)</label>
                            <input type="number" className="form-control" defaultValue={15} />
                        </div>
                        <div className="form-group">
                            <label>Data Retention Policy (days)</label>
                            <input type="number" className="form-control" defaultValue={365} />
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: 24, marginBottom: 24 }}>
                    <h3 style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><FiShield /> ML Thresholds & Triggers</h3>
                    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div className="form-group">
                            <label>Hotspot Anomaly Threshold (%)</label>
                            <input type="number" className="form-control" defaultValue={150} />
                            <small style={{ color: "var(--text-muted)", marginTop: 4, display: "block" }}>Alert if AQI &gt; city average by this %</small>
                        </div>
                        <div className="form-group">
                            <label>Auto-Assign Priority Threshold</label>
                            <select className="form-control" defaultValue="300">
                                <option value="200">AQI &gt; 200 (Poor)</option>
                                <option value="300">AQI &gt; 300 (Very Poor)</option>
                                <option value="400">AQI &gt; 400 (Severe)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: 24, marginBottom: 24 }}>
                    <h3 style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><FiBell /> Notifications</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <input type="checkbox" defaultChecked /> Send email summary of daily hotspots
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <input type="checkbox" defaultChecked /> Auto-broadcast "SEVERE" warnings to public portal
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <input type="checkbox" /> SMS alerts for offline monitoring stations
                        </label>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: "12px 24px" }}>
                    <FiSave style={{ marginRight: 8 }} /> Save Configuration
                </button>
            </form>
        </div>
    );
}
