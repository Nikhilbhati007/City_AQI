import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiLock, FiMail, FiArrowLeft, FiUser, FiPhone, FiMapPin } from "react-icons/fi";
import { registerAdmin } from "../../api/adminApi";

export default function AdminRegister() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        city: "",
    });
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
            const data = { ...formData, role: "SUPER_ADMIN" }; // Registering as admin
            const res = await registerAdmin(data);
            if (res.data.success) {
                // Assuming success redirects to login
                navigate("/admin/login");
            } else {
                setError(res.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please check your inputs.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <Link to="/" className="btn btn-outline btn-sm" style={{ position: "absolute", top: 24, left: 24 }}>
                <FiArrowLeft /> Back to Portal
            </Link>
            
            <div className="login-container glass-panel" style={{ maxWidth: 500 }}>
                <div className="login-header">
                    <div className="logo-badge" style={{ marginBottom: 16 }}>CityAQI</div>
                    <h2>Authority Registration</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        Create a secure account for government officials.
                    </p>
                </div>

                {error && <div className="alert-error" style={{ marginBottom: 24 }}>{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        <div style={{ position: "relative" }}>
                            <FiUser style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input 
                                type="text" 
                                className="form-control" 
                                value={formData.name} 
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                                placeholder="Your Name"
                                style={{ paddingLeft: 40 }}
                                required 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <div style={{ position: "relative" }}>
                            <FiMail style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input 
                                type="email" 
                                className="form-control" 
                                value={formData.email} 
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                                placeholder="official@city.gov.in"
                                style={{ paddingLeft: 40 }}
                                required 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <div style={{ position: "relative" }}>
                            <FiPhone style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input 
                                type="text" 
                                className="form-control" 
                                value={formData.phone} 
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                                placeholder="+91 XXXXX XXXXX"
                                style={{ paddingLeft: 40 }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Zone / City</label>
                        <div style={{ position: "relative" }}>
                            <FiMapPin style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input 
                                type="text" 
                                className="form-control" 
                                value={formData.city} 
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                                placeholder="e.g., Bengaluru"
                                style={{ paddingLeft: 40 }}
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
                                value={formData.password} 
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                                placeholder="••••••••"
                                style={{ paddingLeft: 40 }}
                                required 
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ height: 48, fontSize: "1.05rem" }}>
                        {loading ? "Registering..." : "Create Account"}
                    </button>
                    
                    <div style={{ marginTop: 24, textAlign: "center" }}>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            Already have an account? <Link to="/admin/login" style={{ color: "var(--primary)" }}>Login</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
