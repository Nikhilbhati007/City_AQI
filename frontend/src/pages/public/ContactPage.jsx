import { FiMail, FiMapPin, FiPhone, FiSend } from "react-icons/fi";

export default function ContactPage() {
    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Message sent successfully! (Demo only)");
    };

    return (
        <div className="page-container" style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div className="page-header" style={{ textAlign: "center", marginBottom: 48 }}>
                <h1>Contact Us</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
                    Have questions about the platform or need support? Reach out to our team.
                </p>
            </div>

            <div className="grid" style={{ gridTemplateColumns: "1fr 1.5fr", gap: 32 }}>
                <div className="contact-info" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div className="glass-panel" style={{ padding: 32 }}>
                        <h3 style={{ marginBottom: 24 }}>Get in Touch</h3>
                        
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
                            <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: 12, borderRadius: "50%", color: "#3b82f6" }}>
                                <FiMapPin size={24} />
                            </div>
                            <div>
                                <h4 style={{ margin: "0 0 4px 0" }}>Headquarters</h4>
                                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                                    Smart City Innovation Hub<br />
                                    New Delhi, India 110001
                                </p>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
                            <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: 12, borderRadius: "50%", color: "#3b82f6" }}>
                                <FiMail size={24} />
                            </div>
                            <div>
                                <h4 style={{ margin: "0 0 4px 0" }}>Email</h4>
                                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                                    support@cityaqi.in<br />
                                    gov.relations@cityaqi.in
                                </p>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                            <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: 12, borderRadius: "50%", color: "#3b82f6" }}>
                                <FiPhone size={24} />
                            </div>
                            <div>
                                <h4 style={{ margin: "0 0 4px 0" }}>Phone</h4>
                                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                                    1800-11-AQI (Toll Free)<br />
                                    +91 11 2345 6789
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: 32 }}>
                    <h3 style={{ marginBottom: 24 }}>Send a Message</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div className="form-group">
                                <label>First Name</label>
                                <input type="text" className="form-control" placeholder="John" required />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input type="text" className="form-control" placeholder="Doe" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" className="form-control" placeholder="john@example.com" required />
                        </div>
                        <div className="form-group">
                            <label>Subject</label>
                            <select className="form-control" required>
                                <option value="">Select a subject...</option>
                                <option value="general">General Inquiry</option>
                                <option value="support">Technical Support</option>
                                <option value="gov">Government Partnership</option>
                                <option value="api">API Access</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Message</label>
                            <textarea className="form-control" rows="5" placeholder="How can we help you?" required></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 16 }}>
                            <FiSend style={{ marginRight: 8 }} /> Send Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
