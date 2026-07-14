import { FiInfo, FiShield, FiCpu, FiGlobe, FiDatabase } from "react-icons/fi";

export default function AboutPage() {
    return (
        <div className="page-container" style={{ maxWidth: 900, margin: "0 auto" }}>
            <div className="page-header" style={{ textAlign: "center", marginBottom: 48 }}>
                <div className="logo-badge" style={{ margin: "0 auto 16px auto", fontSize: "1.5rem", padding: "12px 24px" }}>CityAQI</div>
                <h1>About The Platform</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: 600, margin: "16px auto 0" }}>
                    An AI-Powered Urban Air Quality Intelligence Platform for Smart City Intervention.
                </p>
            </div>

            <div className="glass-panel" style={{ padding: 32, marginBottom: 32 }}>
                <h2><FiInfo style={{ marginRight: 12, color: "var(--primary)" }} /> The Problem</h2>
                <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "var(--text-secondary)", marginTop: 16 }}>
                    India has over 900 air quality monitoring stations, generating vast amounts of data daily. However, a recent CAG audit found that only 31% of cities with monitoring data have any actual response protocol tied to it. The data exists, but the intelligence layer needed to act on it is missing. City administrations often operate reactively rather than proactively.
                </p>
            </div>

            <div className="glass-panel" style={{ padding: 32, marginBottom: 32 }}>
                <h2><FiShield style={{ marginRight: 12, color: "var(--primary)" }} /> Our Solution</h2>
                <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "var(--text-secondary)", marginTop: 16 }}>
                    CityAQI bridges the gap between raw monitoring data and actionable city intervention. It is a comprehensive platform designed for both citizens and government officials.
                </p>
                <ul style={{ marginTop: 24, paddingLeft: 24, display: "flex", flexDirection: "column", gap: 16, color: "var(--text-secondary)" }}>
                    <li><strong>For Citizens:</strong> A transparent, real-time portal providing live AQI, reliable forecasts, health advisories, and city comparisons.</li>
                    <li><strong>For Officials:</strong> A secure admin dashboard offering hotspot detection, automated source attribution, task assignment to officers on the ground, and real-time alerts.</li>
                </ul>
            </div>

            <h2 style={{ marginTop: 48, marginBottom: 24 }}>Core Technologies</h2>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 48 }}>
                <div className="glass-panel" style={{ padding: 24 }}>
                    <h3><FiCpu style={{ marginRight: 8 }} /> Advanced AI Models</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: 12, lineHeight: 1.6 }}>
                        Powered by custom XGBoost models for multi-horizon forecasting, KMeans clustering for unsupervised source attribution, and Isolation Forests for anomaly detection. No generic models.
                    </p>
                </div>
                <div className="glass-panel" style={{ padding: 24 }}>
                    <h3><FiGlobe style={{ marginRight: 8 }} /> Real-time Architecture</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: 12, lineHeight: 1.6 }}>
                        Built on a robust MERN stack (MongoDB, Express, React, Node.js) with WebSockets (Socket.IO) ensuring that critical alerts and assignments reach the right people instantly.
                    </p>
                </div>
                <div className="glass-panel" style={{ padding: 24 }}>
                    <h3><FiDatabase style={{ marginRight: 8 }} /> Verifiable Data</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: 12, lineHeight: 1.6 }}>
                        Our underlying data pipelines source genuine historical and live data from the OpenAQ v3 API, reflecting actual readings from Central Pollution Control Board (CPCB) stations across India.
                    </p>
                </div>
                <div className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", background: "rgba(59, 130, 246, 0.1)" }}>
                    <h3 style={{ marginBottom: 8 }}>Built for</h3>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        ET AI Hackathon 2026
                    </div>
                </div>
            </div>
        </div>
    );
}
