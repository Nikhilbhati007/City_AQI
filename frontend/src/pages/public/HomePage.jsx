import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPublicCities, getPublicActiveAlerts } from "../../api/publicApi";
import { getAqiColor, getAqiCategory, getAqiEmoji } from "../../utils/aqiHelpers";
import { FiWind, FiAlertTriangle, FiArrowRight, FiActivity, FiShield, FiHeart, FiMapPin, FiTrendingUp } from "react-icons/fi";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";

const aqiCategories = [
    { range: "0-50", label: "Good", color: "#10b981", desc: "Minimal impact" },
    { range: "51-100", label: "Satisfactory", color: "#84cc16", desc: "Minor breathing discomfort to sensitive people" },
    { range: "101-200", label: "Moderate", color: "#f59e0b", desc: "Breathing discomfort to people with lung/heart disease" },
    { range: "201-300", label: "Poor", color: "#f97316", desc: "Breathing discomfort on prolonged exposure" },
    { range: "301-400", label: "Very Poor", color: "#ef4444", desc: "Respiratory illness on prolonged exposure" },
    { range: "401-500", label: "Severe", color: "#a855f7", desc: "Affects healthy people, serious impact on sensitive" },
];

export default function HomePage() {
    const [cities, setCities] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getPublicCities().catch(() => ({ data: { cities: [] } })),
            getPublicActiveAlerts().catch(() => ({ data: { alerts: [] } })),
        ]).then(([citiesRes, alertsRes]) => {
            setCities(citiesRes.data.cities || []);
            setAlerts(alertsRes.data.alerts || []);
            setLoading(false);
        });
    }, []);

    const topPolluted = [...cities].sort((a, b) => b.avgAQI - a.avgAQI).slice(0, 6);

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-bg-effects">
                    <div className="hero-orb orb-1"></div>
                    <div className="hero-orb orb-2"></div>
                    <div className="hero-orb orb-3"></div>
                </div>
                <div className="hero-content">
                    <div className="hero-badge">🌍 AI-Powered Platform</div>
                    <h1 className="hero-title">
                        Urban Air Quality<br />
                        <span className="gradient-text">Intelligence Platform</span>
                    </h1>
                    <p className="hero-subtitle">
                        Real-time AQI monitoring, AI-based pollution source attribution, hyperlocal forecasting,
                        and health advisories for Indian cities. Empowering citizens and officials with actionable data.
                    </p>
                    <div className="hero-actions">
                        <Link to="/aqi" className="btn btn-primary">
                            <FiActivity size={18} /> Explore AQI Data <FiArrowRight size={16} />
                        </Link>
                        <Link to="/predictions" className="btn btn-secondary">
                            <FiTrendingUp size={18} /> View Predictions
                        </Link>
                    </div>
                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-value">{cities.length || "10+"}</span>
                            <span className="stat-label">Cities Monitored</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{cities.reduce((s, c) => s + c.stationCount, 0) || "50+"}</span>
                            <span className="stat-label">Active Stations</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">24/7</span>
                            <span className="stat-label">Live Monitoring</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">72h</span>
                            <span className="stat-label">Forecast Range</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Live Alerts */}
            {alerts.length > 0 && (
                <section className="section">
                    <h2 className="section-title"><FiAlertTriangle /> Live Alerts</h2>
                    <Swiper
                        modules={[Autoplay, Pagination]}
                        spaceBetween={20}
                        slidesPerView={1}
                        breakpoints={{
                            640: { slidesPerView: 2 },
                            1024: { slidesPerView: 3 },
                        }}
                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                        pagination={{ clickable: true }}
                        style={{ paddingBottom: '40px' }}
                    >
                        {alerts.map((alert, i) => (
                            <SwiperSlide key={i}>
                                <Link to={`/alerts?city=${alert.targetArea}`} className="alert-card glass-panel" style={{ display: 'block', textDecoration: 'none', cursor: 'pointer', borderLeft: `4px solid ${alert.severity === "CRITICAL" ? "#ef4444" : alert.severity === "HIGH" ? "#f97316" : "#f59e0b"}`, height: '100%', transition: "transform 0.2s" }} onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"} onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}>
                                    <div className="alert-severity" style={{ color: alert.severity === "CRITICAL" ? "#ef4444" : "#f97316" }}>
                                        ⚠ {alert.severity}
                                    </div>
                                    <h4>{alert.title}</h4>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "8px" }}>{alert.description}</p>
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{alert.targetArea}</span>
                                </Link>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </section>
            )}

            {/* Current AQI Overview */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title"><FiMapPin /> City Air Quality Overview</h2>
                    <Link to="/aqi" className="btn btn-outline btn-sm">View All Cities <FiArrowRight size={14} /></Link>
                </div>
                {loading ? (
                    <div className="page-loader"><div className="loader-spinner"></div></div>
                ) : (
                    <Swiper
                        modules={[Autoplay, EffectCoverflow, Pagination]}
                        effect="coverflow"
                        grabCursor={true}
                        centeredSlides={true}
                        slidesPerView={"auto"}
                        coverflowEffect={{
                            rotate: 15,
                            stretch: 0,
                            depth: 200,
                            modifier: 1,
                            slideShadows: false,
                        }}
                        autoplay={{ delay: 2500, disableOnInteraction: false, reverseDirection: true }}
                        pagination={{ clickable: true }}
                        style={{ paddingBottom: '50px', paddingTop: '20px' }}
                    >
                        {cities.slice(0, 8).map((city) => (
                            <SwiperSlide key={city.city} style={{ width: '300px' }}>
                                <Link to={`/city/${city.city}`} className="city-card glass-panel" style={{ display: 'block', height: '100%' }}>
                                    <div className="city-card-header">
                                        <h3>{city.city}</h3>
                                        <span className="aqi-emoji">{getAqiEmoji(city.avgAQI)}</span>
                                    </div>
                                    <div className="city-aqi-display" style={{ color: getAqiColor(city.avgAQI) }}>
                                        {city.avgAQI}
                                    </div>
                                    <div className="city-category" style={{ background: `${getAqiColor(city.avgAQI)}18`, color: getAqiColor(city.avgAQI) }}>
                                        {getAqiCategory(city.avgAQI)}
                                    </div>
                                    <div className="city-pollutants">
                                        <span>PM2.5: {city.avgPM25}</span>
                                        <span>PM10: {city.avgPM10}</span>
                                    </div>
                                    <div className="city-stations">{city.stationCount} stations</div>
                                </Link>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                )}
            </section>

            {/* Top Polluted Cities */}
            {topPolluted.length > 0 && (
                <section className="section">
                    <h2 className="section-title"><FiAlertTriangle /> Most Polluted Cities</h2>
                    <div className="polluted-list glass-panel">
                        {topPolluted.map((city, i) => (
                            <Link to={`/city/${city.city}`} key={city.city} className="polluted-item">
                                <div className="polluted-rank">#{i + 1}</div>
                                <div className="polluted-info">
                                    <span className="polluted-name">{city.city}</span>
                                    <span className="polluted-category" style={{ color: getAqiColor(city.avgAQI) }}>
                                        {getAqiCategory(city.avgAQI)}
                                    </span>
                                </div>
                                <div className="polluted-aqi" style={{ color: getAqiColor(city.avgAQI) }}>
                                    AQI {city.avgAQI}
                                </div>
                                <div className="polluted-bar">
                                    <div className="polluted-bar-fill" style={{ width: `${Math.min(100, city.avgAQI / 5)}%`, background: getAqiColor(city.avgAQI) }}></div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* AQI Categories */}
            <section className="section">
                <h2 className="section-title"><FiShield /> AQI Categories (CPCB India)</h2>
                <div className="categories-grid">
                    {aqiCategories.map((cat) => (
                        <div key={cat.label} className="category-card glass-panel" style={{ borderTop: `3px solid ${cat.color}` }}>
                            <div className="category-range" style={{ color: cat.color }}>{cat.range}</div>
                            <h4>{cat.label}</h4>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{cat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Health Recommendations */}
            <section className="section">
                <h2 className="section-title"><FiHeart /> Health Recommendations</h2>
                <div className="health-grid">
                    {[
                        { group: "Children", icon: "👶", tip: "Reduce outdoor play when AQI exceeds 200. Keep classrooms well-ventilated." },
                        { group: "Senior Citizens", icon: "👴", tip: "Avoid morning walks during high pollution. Use air purifiers indoors." },
                        { group: "Outdoor Workers", icon: "👷", tip: "Wear N95 masks when AQI > 150. Take regular indoor breaks." },
                        { group: "Asthma Patients", icon: "🫁", tip: "Keep rescue inhalers accessible. Consult doctors during high AQI days." },
                    ].map((item) => (
                        <div key={item.group} className="health-card glass-panel">
                            <span className="health-icon">{item.icon}</span>
                            <h4>{item.group}</h4>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{item.tip}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
