import axios from "axios";

export const TOKEN_KEY = "access_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach the JWT to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend rejects our token, tell the app to log the user out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginCall = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginCall) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(error);
  }
);

// Turns any API error into one readable message for the UI
export function getErrorMessage(error) {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail; // 400, 401, 404, 409
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(". "); // 422
  if (error.request && !error.response) {
    return "Cannot reach the server. Check that the backend is running.";
  }
  return "Something went wrong. Please try again.";
}

export default api;