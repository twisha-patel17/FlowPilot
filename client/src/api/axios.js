import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeToRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const notifyRefreshSubscribers = (token) => {
  refreshSubscribers.forEach((callback) => {
    callback(token);
  });

  refreshSubscribers = [];
};

const clearRefreshSubscribers = () => {
  refreshSubscribers.forEach((callback) => {
    callback(null);
  });

  refreshSubscribers = [];
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }
    if (
      originalRequest.url?.includes(
        "/auth/refresh"
      )
    ) {
      localStorage.removeItem("token");

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeToRefresh((newToken) => {
          if (!newToken) {
            reject(error);
            return;
          }

          originalRequest.headers.Authorization =
            `Bearer ${newToken}`;

          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {},
        {
          withCredentials: true,
        }
      );

      const newAccessToken =
        response.data.accessToken;

      if (!newAccessToken) {
        throw new Error(
          "No access token returned from refresh"
        );
      }

      localStorage.setItem(
        "token",
        newAccessToken
      );

      isRefreshing = false;

      notifyRefreshSubscribers(
        newAccessToken
      );

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;

      clearRefreshSubscribers();

      localStorage.removeItem("token");

      return Promise.reject(refreshError);
    }
  }
);

export default api;