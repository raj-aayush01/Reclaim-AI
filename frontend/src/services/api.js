import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api";

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
        const responseData =
            error.response?.data || null;

        const message =
            responseData?.message ||
            error.message ||
            "An unexpected server error occurred";

        console.error("API Error:", message);

        const apiError = new Error(message);

        apiError.status =
            error.response?.status || null;

        apiError.responseData =
            responseData;

        return Promise.reject(apiError);
    }
);

export default api;