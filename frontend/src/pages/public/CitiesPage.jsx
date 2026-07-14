import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPublicCities } from "../../api/publicApi";
import { getAqiColor, getAqiCategory, getAqiEmoji } from "../../utils/aqiHelpers";
import { FiSearch, FiMapPin } from "react-icons/fi";

export default function CitiesPage() {
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        getPublicCities()
            .then((res) => { setCities(res.data.cities || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const filtered = cities.filter(c => c.city.toLowerCase().includes(search.toLowerCase()));

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1><FiMapPin /> Air Quality Index — All Cities</h1>
                <p style={{ color: "var(--text-secondary)" }}>Click on any city to view detailed air quality data, forecasts, and health advisories.</p>
            </div>
            <div className="search-bar glass-panel">
                <FiSearch size={18} />
                <input type="text" placeholder="Search cities..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {filtered.length === 0 ? (
                <div className="empty-state glass-panel"><p>No cities found matching "{search}"</p></div>
            ) : (
                <div className="cities-grid">
                    {filtered.map((city) => (
                        <Link to={`/city/${city.city}`} key={city.city} className="city-card glass-panel">
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
                                <span>PM2.5: {city.avgPM25} µg/m³</span>
                                <span>PM10: {city.avgPM10} µg/m³</span>
                            </div>
                            <div className="city-pollutants" style={{ marginTop: 4 }}>
                                <span>NO₂: {city.avgNO2}</span>
                                <span>SO₂: {city.avgSO2}</span>
                                <span>CO: {city.avgCO}</span>
                                <span>O₃: {city.avgO3}</span>
                            </div>
                            <div className="city-stations">{city.stationCount} monitoring stations</div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
