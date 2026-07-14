import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../api/adminApi";
import { FiUser, FiMail, FiPhone, FiMapPin, FiShield, FiSave } from "react-icons/fi";

export default function ProfilePage() {
    const { user, checkAuth } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");
        try {
            const data = { ...formData };
            if (!data.password) delete data.password;
            
            await updateProfile(data);
            await checkAuth(); // Refresh user data
            setMessage("Profile updated successfully.");
            setFormData(prev => ({ ...prev, password: "" }));
        } catch (err) {
            setError(err.response?.data?.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="page-container" style={{ maxWidth: 800 }}>
            <div className="page-header">
                <h1><FiUser /> My Profile</h1>
                <p style={{ color: "var(--text-secondary)" }}>Manage your account settings and personal information.</p>
            </div>

            <div className="grid" style={{ gridTemplateColumns: "1fr 2fr", gap: 24 }}>
                <div className="glass-panel" style={{ overflow: "hidden", height: "fit-content" }}>
                    <div style={{ height: 120, background: user.role === 'ADMIN' ? 'linear-gradient(135deg, #a855f7, #ec4899)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}></div>
                    <div style={{ padding: "0 24px 24px", textAlign: "center", position: "relative" }}>
                        <div className="user-avatar" style={{ 
                            width: 100, height: 100, fontSize: "2.5rem", 
                            margin: "-50px auto 16px auto", 
                            background: "var(--bg-secondary)", 
                            color: "white",
                            border: "4px solid var(--bg-glass)",
                            boxShadow: "var(--shadow-md)"
                        }}>
                            {user.name?.charAt(0) || "U"}
                        </div>
                        <h2 style={{ margin: "0 0 8px 0", fontSize: "1.8rem" }}>{user.name}</h2>
                        <span className={`badge ${user.role === 'ADMIN' ? 'bg-purple text-purple bg-opacity-10' : 'bg-blue text-blue bg-opacity-10'}`} style={{ color: user.role === 'ADMIN' ? '#a855f7' : '#3b82f6', marginBottom: 24, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: "0.85rem" }}>
                            {user.role === 'ADMIN' && <FiShield />}
                            {user.role}
                        </span>
                        
                        <div className="glass-card" style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 16, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ padding: 8, background: "rgba(255,255,255,0.05)", borderRadius: 8, color: "var(--primary)" }}><FiMail /></div> {user.email}</div>
                            {user.phone && <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ padding: 8, background: "rgba(255,255,255,0.05)", borderRadius: 8, color: "var(--success)" }}><FiPhone /></div> {user.phone}</div>}
                            {user.city && <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ padding: 8, background: "rgba(255,255,255,0.05)", borderRadius: 8, color: "var(--warning)" }}><FiMapPin /></div> Zone: <strong style={{color:"white"}}>{user.city}</strong></div>}
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: 24 }}>
                    <h3 style={{ marginBottom: 24 }}>Edit Details</h3>
                    {message && <div className="alert-success" style={{ marginBottom: 16, padding: 12, background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: 8 }}>{message}</div>}
                    {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" className="form-control" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input type="text" className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>New Password <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(leave blank to keep current)</span></label>
                            <input type="password" className="form-control" minLength={6} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                        
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: 24, padding: "14px", fontSize: "1rem" }}>
                            <FiSave style={{ marginRight: 8 }} /> {loading ? "Saving Profile Updates..." : "Save Changes"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
