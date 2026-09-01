import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json"
    },
    timeout: 90000
});

// Response interceptor for unified error parsing
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message =
            error.response?.data?.message ||
            error.message ||
            "An unexpected server error occurred";

        console.error("API Error:", message);
        return Promise.reject(new Error(message));
    }
);

export default api;
