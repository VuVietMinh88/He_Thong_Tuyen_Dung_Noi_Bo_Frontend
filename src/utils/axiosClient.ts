import axios, { type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';
import { tokenService } from '../services/token.service';

/**
 * Cấu hình axios client cơ bản để dùng chung cho toàn bộ dự án.
 */
const normalizeApiBaseUrl = (baseUrl?: string): string => {
  const trimmed = (baseUrl ?? 'http://localhost:8080/api/v1').trim();
  if (!trimmed) return 'http://localhost:8080/api/v1';

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  if (withoutTrailingSlash.endsWith('/api/v1')) return withoutTrailingSlash;
  if (withoutTrailingSlash.endsWith('/api')) return `${withoutTrailingSlash}/v1`;

  return withoutTrailingSlash;
};

const axiosClient = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Tăng timeout cho các tác vụ lâu như tải file, lưu form
});

// Biến cờ (flag) kiểm soát trạng thái đang làm mới token (Refresh Token)
let isRefreshing = false;

// Hàng đợi lưu các Request bị lỗi 401 khi đang đợi refresh token
// Việc này giúp tránh reload trang và không mất dữ liệu form (AC 3)
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// AC 2: Request Interceptor - Tự động đính kèm Access Token vào Header
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if ('removeInvalidStoredTokens' in tokenService) {
      (tokenService as any).removeInvalidStoredTokens();
    }
    const isLoginRequest = /(?:^|\/)auth\/login\/?$/i.test(config.url ?? '');
    if (isLoginRequest) {
      if (config.headers && typeof config.headers.delete === 'function') {
        config.headers.delete('Authorization');
      } else if (config.headers) {
        delete config.headers['Authorization'];
      }
      return config;
    }

    const token = tokenService.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// AC 2 & 3: Response Interceptor - Xử lý thông minh khi hết hạn phiên (401)
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    // Mở rộng kiểu để hỗ trợ cờ retry tự tạo
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Nếu lỗi là 401 (Unauthorized) và request này chưa từng được thử lại
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      
      // Bỏ qua nếu lỗi 401 đến từ chính api đăng nhập hoặc api refresh (để tránh vòng lặp vô hạn)
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      // Nếu đang trong quá trình refresh token, đưa request hiện tại vào hàng chờ (Chống mất dữ liệu form)
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axiosClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      // Bật cờ retry và cờ refreshing
      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenService.getRefreshToken();
      
      // Nếu không có refresh token (Chưa từng lưu), đẩy về login
      if (!refreshToken) {
        if ('clearAll' in tokenService) (tokenService as any).clearAll();
        else if ('clearTokens' in tokenService) (tokenService as any).clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Gửi request lấy token mới (Sử dụng axios thuần để không chạy lại interceptor của axiosClient)
        const refreshResponse = await axios.post(`${axiosClient.defaults.baseURL}/auth/refresh`, {
          refreshToken
        });

        const newAccessToken = refreshResponse.data.accessToken;
        const newRefreshToken = refreshResponse.data.refreshToken; // Đề phòng Backend cấp đổi refresh token mới

        // Cập nhật lại kho lưu trữ (AC 1)
        tokenService.setAccessToken(newAccessToken);
        if (newRefreshToken) {
          tokenService.setRefreshToken(newRefreshToken);
        }

        // Cập nhật Authorization Header cho request gốc
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        // Giải phóng hàng đợi: Gọi lại toàn bộ các request bị treo trước đó với Token mới
        processQueue(null, newAccessToken);
        
        // Gửi lại request gốc bị lỗi
        return axiosClient(originalRequest);
        
      } catch (refreshError: any) {
        // Nếu Refresh Token cũng hết hạn hoặc bị thu hồi (Lỗi từ khối catch)
        processQueue(refreshError, null);
        if ('clearAll' in tokenService) (tokenService as any).clearAll();
        else if ('clearTokens' in tokenService) (tokenService as any).clearTokens();
        // Điều hướng mượt mà về trang đăng nhập mà không reload lại tài nguyên cục bộ
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        // Luôn trả cờ refreshing về false sau khi xong
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
