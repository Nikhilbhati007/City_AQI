import { useState, useEffect } from "react";
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from "../../api/adminApi";
import { formatDateTime, timeAgo } from "../../utils/aqiHelpers";
import { FiBell, FiCheckCircle, FiTrash2, FiInfo, FiAlertTriangle, FiMapPin, FiCheck } from "react-icons/fi";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL"); // ALL, UNREAD
    const { socket } = useSocket();
    const { user } = useAuth();

    const fetchNotifications = () => {
        const params = filter === "UNREAD" ? { isRead: false } : {};
        getNotifications(params)
            .then(res => { setNotifications(res.data.notifications || []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        setLoading(true);
        fetchNotifications();
    }, [filter]);

    useEffect(() => {
        if (!socket || !user) return;
        
        socket.emit("joinUser", user._id);
        
        const handleNewNotification = (notif) => {
            setNotifications(prev => [notif, ...prev]);
        };

        socket.on("newNotification", handleNewNotification);

        return () => {
            socket.off("newNotification", handleNewNotification);
        };
    }, [socket, user]);

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const getIcon = (title) => {
        const t = title.toLowerCase();
        if (t.includes("alert") || t.includes("critical")) return <FiAlertTriangle style={{ color: "#ef4444" }} />;
        if (t.includes("assignment") || t.includes("officer")) return <FiCheckCircle style={{ color: "#10b981" }} />;
        if (t.includes("hotspot")) return <FiMapPin style={{ color: "#f97316" }} />;
        return <FiInfo style={{ color: "#3b82f6" }} />;
    };

    if (loading) return <div className="page-loader"><div className="loader-spinner"></div></div>;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="page-container" style={{ maxWidth: 800, margin: "0 auto" }}>
            <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1><FiBell /> Inbox</h1>
                    <p style={{ color: "var(--text-secondary)" }}>System notifications and updates.</p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <div className="tab-group" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <button className={`tab-btn ${filter === "ALL" ? "active" : ""}`} onClick={() => setFilter("ALL")}>All</button>
                        <button className={`tab-btn ${filter === "UNREAD" ? "active" : ""}`} onClick={() => setFilter("UNREAD")}>
                            Unread {unreadCount > 0 && <span style={{ background: "#3b82f6", color: "#fff", padding: "2px 6px", borderRadius: 10, fontSize: "0.7rem", marginLeft: 4 }}>{unreadCount}</span>}
                        </button>
                    </div>
                    {unreadCount > 0 && (
                        <button className="btn btn-outline" onClick={handleMarkAllRead}>
                            <FiCheck /> Mark all read
                        </button>
                    )}
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="empty-state glass-panel">
                    <FiBell size={48} style={{ color: "var(--text-muted)", marginBottom: 16 }} />
                    <h3>No notifications</h3>
                    <p style={{ color: "var(--text-secondary)" }}>You're all caught up!</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {notifications.map(notif => (
                        <div key={notif._id} className={`glass-panel ${!notif.isRead ? "notification-unread" : ""}`} style={{ padding: 20, display: "flex", gap: 16, transition: "all 0.2s" }}>
                            <div style={{ marginTop: 4, background: "rgba(255,255,255,0.05)", padding: 12, borderRadius: "50%", height: "fit-content" }}>
                                {getIcon(notif.title)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <h4 style={{ margin: 0, fontWeight: !notif.isRead ? 700 : 500, color: !notif.isRead ? "#fff" : "var(--text-secondary)" }}>
                                        {notif.title}
                                    </h4>
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{timeAgo(notif.createdAt)}</span>
                                </div>
                                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                                    {notif.message}
                                </p>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                                {!notif.isRead && (
                                    <button className="btn btn-sm btn-outline" style={{ padding: "4px 8px" }} onClick={() => handleMarkRead(notif._id)} title="Mark as read">
                                        <FiCheck />
                                    </button>
                                )}
                                <button className="btn btn-sm btn-outline" style={{ borderColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "4px 8px" }} onClick={() => handleDelete(notif._id)} title="Delete">
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
