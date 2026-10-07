import axios, { type InternalAxiosRequestConfig } from "axios";
import { tokenService } from "../services/token.service";

/**
 * Interface định nghĩa dữ liệu trả về khi gọi API làm mới (refresh) token
 */
interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Cấu hình axios client cơ bản để dùng chung cho toàn bộ dự án.
 * Tự động thêm baseURL và các cấu hình mặc định.
 */
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // Timeout sau 15 giây
});

// Biến cờ (flag) để kiểm tra xem quá trình refresh token có đang diễn ra hay không
let isRefreshing = false;

// Hàng đợi lưu các request bị lỗi 401 trong thời gian chờ refresh token
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

/**
 * Hàm xử lý hàng đợi các request sau khi làm mới token thành công hoặc thất bại.
 * @param error Lỗi trong quá trình làm mới token (nếu có)
 * @param token Access token mới (nếu làm mới thành công)
 */
const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    } else {
      promise.reject(new Error("Quá trình làm mới token không trả về access token mới."));
    }
  });
  failedQueue = [];
};

/**
 * Interceptor cho Request:
 * Tự động đính kèm access token (nếu có) vào header Authorization của mỗi request gửi đi.
 */
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenService.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

/**
 * Interceptor cho Response:
 * Bắt lỗi từ API trả về, đặc biệt xử lý lỗi 401 Unauthorized.
 */
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    // Lấy thông tin request ban đầu
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    // Nếu phát hiện mã lỗi 401 Unauthorized (token hết hạn hoặc không hợp lệ)
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // Bỏ qua nếu lỗi 401 xuất phát từ API đăng nhập hoặc làm mới token để tránh vòng lặp
      if (
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      // Nếu hệ thống đang trong quá trình refresh token, đưa request hiện tại vào hàng đợi
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          // Gọi lại request ban đầu với token mới
          return axiosClient(originalRequest);
        });
      }

      // Đánh dấu request này đã được thử lại (tránh bị lặp vô hạn)
      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenService.getRefreshToken();

      // Trường hợp không có refresh token trong hệ thống (đã đăng xuất hoặc bị xóa)
      if (!refreshToken) {
        processQueue(error);
        isRefreshing = false;
        
        // Xóa bỏ token và thông tin user hiện tại đang lưu trong localStorage
        tokenService.clearAll();
        
        // Điều hướng (redirect) người dùng về trang /login
        // Sử dụng window.location.href đảm bảo việc chuyển trang an toàn từ ngoài component React
        if (window.location.pathname !== '/login') {
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // Trường hợp có refresh token, tiến hành gọi API làm mới token
      try {
        const refreshResponse = await axios.post<RefreshTokenResponse>(
          `${axiosClient.defaults.baseURL}/auth/refresh`,
          { refreshToken },
        );
        const newAccessToken = refreshResponse.data.accessToken;
        const newRefreshToken = refreshResponse.data.refreshToken;

        // Cập nhật lại token mới vào localStorage
        tokenService.setAccessToken(newAccessToken);
        if (newRefreshToken) {
          tokenService.setRefreshToken(newRefreshToken);
        }

        // Thay đổi header của request ban đầu với token mới
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Thông báo cho các request trong hàng đợi biết token đã được làm mới
        processQueue(null, newAccessToken);
        
        // Thực hiện lại request ban đầu
        return axiosClient(originalRequest);
      } catch (refreshError: unknown) {
        // Lỗi khi làm mới token (VD: refresh token cũng đã hết hạn hoặc bị thu hồi)
        processQueue(refreshError);
        
        // Xóa bỏ token và thông tin user hiện tại đang lưu trong localStorage
        tokenService.clearAll();
        
        // Điều hướng (redirect) người dùng về trang /login
        if (window.location.pathname !== '/login') {
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        // Kết thúc quá trình refresh token
        isRefreshing = false;
      }
    }

    // Các lỗi khác (không phải 401) hoặc 401 không hợp lệ để retry thì reject
    return Promise.reject(error);
  },
);

export default axiosClient;
