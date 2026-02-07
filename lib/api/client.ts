import axios from "axios";

// ✅ اقرأ الـ env + نظّف آخر /
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_URL = RAW_API_URL.replace(/\/$/, "");

// ✅ Debug واضح: هل Next قرأ env ولا لأ؟
if (typeof window !== "undefined") {
  console.log("🌐 NEXT_PUBLIC_API_URL =", process.env.NEXT_PUBLIC_API_URL);
  console.log("🌐 Using API baseURL =", API_URL);
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000", 10),
});

// ✅ Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");

      // اطبع العنوان النهائي اللي عم يروح عليه الطلب
      const finalUrl = `${config.baseURL ?? ""}${config.url ?? ""}`;

      console.log(
        "📡 Request:",
        config.method?.toUpperCase(),
        finalUrl,
        "| Token:",
        token ? "✅ Present" : "❌ Missing"
      );

      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (typeof window !== "undefined") {
      console.log("✅ Response:", response.status, response.config?.url);
    }
    return response;
  },
  (error) => {
    if (typeof window !== "undefined") {
      const status = error.response?.status;
      const url = error.config?.url;
      console.log("❌ API Error:", status, url, error.message);

      // 401 فقط: امسح بيانات الدخول
      if (status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        document.cookie = "accessToken=; Max-Age=0; path=/;";
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
