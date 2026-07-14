export const getAqiColor = (aqi) => {
    if (aqi <= 50) return "#10b981";
    if (aqi <= 100) return "#84cc16";
    if (aqi <= 200) return "#f59e0b";
    if (aqi <= 300) return "#f97316";
    if (aqi <= 400) return "#ef4444";
    return "#a855f7";
};

export const getAqiCategory = (aqi) => {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Satisfactory";
    if (aqi <= 200) return "Moderate";
    if (aqi <= 300) return "Poor";
    if (aqi <= 400) return "Very Poor";
    return "Severe";
};

export const getAqiBg = (aqi) => {
    const color = getAqiColor(aqi);
    return `${color}18`;
};

export const getAqiEmoji = (aqi) => {
    if (aqi <= 50) return "😊";
    if (aqi <= 100) return "🙂";
    if (aqi <= 200) return "😐";
    if (aqi <= 300) return "😷";
    if (aqi <= 400) return "🤢";
    return "☠️";
};

export const getSeverityColor = (severity) => {
    const map = {
        LOW: "#10b981",
        MODERATE: "#f59e0b",
        MEDIUM: "#f59e0b",
        HIGH: "#f97316",
        VERY_HIGH: "#ef4444",
        SEVERE: "#a855f7",
        CRITICAL: "#ef4444",
    };
    return map[severity] || "#6b7280";
};

export const getStatusColor = (status) => {
    const map = {
        ACTIVE: "#10b981",
        ASSIGNED: "#3b82f6",
        RESOLVED: "#6b7280",
        PENDING: "#f59e0b",
        IN_PROGRESS: "#3b82f6",
        COMPLETED: "#10b981",
        INACTIVE: "#6b7280",
        MAINTENANCE: "#f97316",
    };
    return map[status] || "#6b7280";
};

export const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

export const formatDateTime = (date) => {
    return new Date(date).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
};
