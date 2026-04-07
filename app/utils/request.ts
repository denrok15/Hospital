import axios, { type AxiosRequestConfig } from "axios";

export const request = axios.create({
  baseURL: "https://mis-api.kreosoft.space/api",
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const http = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const res = await request.get<T>(url, config);
    return res.data;
  },

  post: async <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const res = await request.post<T>(url, data, config);
    return res.data;
  },

  put: async <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const res = await request.put<T>(url, data, config);
    return res.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const res = await request.delete<T>(url, config);
    return res.data;
  },
};
