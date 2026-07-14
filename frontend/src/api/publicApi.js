import API from "./axios";

export const getPublicCities = () => API.get("/public/cities");
export const getPublicCityDetail = (city) => API.get(`/public/cities/${city}`);
export const getPublicCityHistory = (city) => API.get(`/public/cities/${city}/history`);
export const getPublicStations = (city) => API.get(`/public/stations${city ? `?city=${city}` : ""}`);
export const getPublicActiveAlerts = () => API.get("/public/alerts/active");
export const getPublicPredictions = (city) => API.get(`/public/predictions/${city}`);
export const getPublicCompare = (city1, city2) => API.get(`/public/compare?city1=${city1}&city2=${city2}`);
export const getPublicHealthAdvisory = () => API.get("/public/health-advisory");
