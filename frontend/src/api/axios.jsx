import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api/";

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach access token automatically
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Handle token refresh automatically
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refresh");
                const response = await axios.post(
                    `${API_BASE_URL}auth/refresh/`,
                    { refresh: refreshToken }
                );

                localStorage.setItem("access", response.data.access);

                originalRequest.headers.Authorization =
                    `Bearer ${response.data.access}`;

                return axiosInstance(originalRequest);
            } catch (err) {
                localStorage.clear();
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
