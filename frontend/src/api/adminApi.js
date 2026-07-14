import API from "./axios";

// Auth
export const loginAdmin = (data) => API.post("/auth/login", data);
export const registerAdmin = (data) => API.post("/auth/register", data);
export const logoutAdmin = () => API.post("/auth/logout");
export const getProfile = () => API.get("/auth/me");
export const updateProfile = (data) => API.put("/auth/me", data);

// Dashboard
export const getDashboard = () => API.get("/dashboard");
export const getDashboardSummary = () => API.get("/dashboard/summary");

// Stations
export const getStations = (params) => API.get("/stations", { params });
export const getStation = (id) => API.get(`/stations/${id}`);
export const createStation = (data) => API.post("/stations", data);
export const updateStation = (id, data) => API.put(`/stations/${id}`, data);
export const deleteStation = (id) => API.delete(`/stations/${id}`);

// Alerts
export const getAlerts = () => API.get("/alert");
export const getAlert = (id) => API.get(`/alert/${id}`);
export const createAlert = (data) => API.post("/alert", data);
export const updateAlert = (id, data) => API.put(`/alert/${id}`, data);
export const deleteAlert = (id) => API.delete(`/alert/${id}`);
export const broadcastAlert = (data) => API.post("/alert/broadcast", data);

// Hotspots
export const getHotspots = (params) => API.get("/hotspot", { params });
export const getHotspot = (id) => API.get(`/hotspot/${id}`);
export const createHotspot = (data) => API.post("/hotspot", data);
export const updateHotspot = (id, data) => API.put(`/hotspot/${id}`, data);
export const deleteHotspot = (id) => API.delete(`/hotspot/${id}`);
export const getCriticalHotspots = () => API.get("/hotspot/critical");

// Assignments
export const getAssignments = () => API.get("/assignment");
export const getAssignment = (id) => API.get(`/assignment/${id}`);
export const createAssignment = (data) => API.post("/assignment", data);
export const updateAssignment = (id, data) => API.put(`/assignment/${id}`, data);
export const deleteAssignment = (id) => API.delete(`/assignment/${id}`);
export const getOfficerAssignments = (officerId) => API.get(`/assignment/officer/${officerId}`);

// Notifications
export const getNotifications = (params) => API.get("/notification", { params });
export const markNotificationRead = (id) => API.put(`/notification/${id}/read`);
export const markAllNotificationsRead = () => API.put("/notification/read-all");
export const createNotification = (data) => API.post("/notification", data);
export const deleteNotification = (id) => API.delete(`/notification/${id}`);

// Officers
export const getOfficers = (params) => API.get("/officers", { params });
export const getOfficer = (id) => API.get(`/officers/${id}`);
export const createOfficer = (data) => API.post("/officers", data);
export const updateOfficer = (id, data) => API.put(`/officers/${id}`, data);
export const deleteOfficer = (id) => API.delete(`/officers/${id}`);

// Predictions
export const getPredictions = () => API.get("/predictions");
export const getPrediction = (location) => API.get(`/predictions/${location}`);

// Reports
export const getReports = () => API.get("/reports");
export const getReport = (type) => API.get(`/reports/${type}`);
export const downloadReport = (type) => API.get(`/reports/${type}/download`, { responseType: 'blob' });
export const getDailyReport = () => API.get("/reports/daily");
export const getWeeklyReport = () => API.get("/reports/weekly");
export const getMonthlyReport = () => API.get("/reports/monthly");
export const generateReport = (data) => API.post("/reports/generate", data);

// Sources
export const getSources = () => API.get("/sources");
export const getSource = (location) => API.get(`/sources/${location}`);

// Extras
export const getOfficersByZone = (city) => API.get(`/officers/zone/${city}`);
