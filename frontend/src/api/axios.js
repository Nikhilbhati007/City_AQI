import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:8000/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const isAdminRoute = window.location.pathname.startsWith("/admin");
            if (isAdminRoute && !window.location.pathname.includes("/login")) {
                window.location.href = "/admin/login";
            }
        }
        return Promise.reject(error);
    }
);

export default API;
