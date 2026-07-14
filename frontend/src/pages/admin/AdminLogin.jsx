import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiLock, FiMail, FiArrowLeft } from "react-icons/fi";

export default function AdminLogin() {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (user) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await login({ email, password });
            if (res.success) {
                navigate("/admin/dashboard");
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Please check credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <Link to="/" className="btn btn-outline btn-sm" style={{ position: "absolute", top: 24, left: 24 }}>
                <FiArrowLeft /> Back to Portal
            </Link>
            
            <div className="login-container glass-panel">
                <div className="login-header">
                    <div className="logo-badge" style={{ marginBottom: 16 }}>CityAQI</div>
                    <h2>Authority Portal</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        Secure access for government officials and environmental officers.
                    </p>
                </div>

                {error && <div className="alert-error" style={{ marginBottom: 24 }}>{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Email Address</label>
                        <div style={{ position: "relative" }}>
                            <FiMail style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input 
                                type="email" 
                                className="form-control" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder="official@city.gov.in"
                                style={{ paddingLeft: 40 }}
                                required 
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 32 }}>
                        <label>Password</label>
                        <div style={{ position: "relative" }}>
                            <FiLock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input 
                                type="password" 
                                className="form-control" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder="••••••••"
                                style={{ paddingLeft: 40 }}
                                required 
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ height: 48, fontSize: "1.05rem" }}>
                        {loading ? "Authenticating..." : "Secure Login"}
                    </button>
                </form>

                <div style={{ marginTop: 32, textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24 }}>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 8 }}>
                        Don't have an account? <Link to="/admin/register" style={{ color: "var(--primary)" }}>Register</Link>
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0 }}>
                        Restricted System. Unauthorized access is strictly prohibited.
                    </p>
                </div>
            </div>
        </div>
    );
}
