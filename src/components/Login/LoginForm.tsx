import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, InvalidLoginResponseError } from '../../services/auth.service';
import { tokenService } from '../../services/token.service';
import { AxiosError } from 'axios';

const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;

const getStoredValue = (key: string): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStoredValue = (key: string, value: string): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem(key, value);
    return window.localStorage.getItem(key) === value;
  } catch {
    return false;
  }
};

const removeStoredValue = (key: string): void => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors so login still works in restricted browser environments.
  }
};

const getStoredNumber = (key: string, fallback = 0): number => {
  const value = Number.parseInt(getStoredValue(key) ?? '', 10);
  return Number.isFinite(value) ? value : fallback;
};

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>(() => getStoredValue('rememberedEmail') ?? '');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(() => Boolean(getStoredValue('rememberedEmail')));
  
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getInitialLockStatus = () => {
    const lockedUntil = getStoredNumber('lockUntil');
    if (lockedUntil > 0) {
      const timeRemaining = lockedUntil - Date.now();
      if (timeRemaining > 0) {
        return { isLocked: true, timeLeft: Math.ceil(timeRemaining / 1000) };
      }
      removeStoredValue('lockUntil');
      removeStoredValue('loginAttempts');
    }
    return { isLocked: false, timeLeft: 0 };
  };

  const [isLocked, setIsLocked] = useState<boolean>(() => getInitialLockStatus().isLocked);
  const [lockTimeLeft, setLockTimeLeft] = useState<number>(() => getInitialLockStatus().timeLeft);

  const checkLockStatus = useCallback(() => {
    const lockedUntil = getStoredNumber('lockUntil');
    if (lockedUntil > 0) {
      const timeRemaining = lockedUntil - Date.now();
      
      if (timeRemaining > 0) {
        setIsLocked(true);
        setLockTimeLeft(Math.ceil(timeRemaining / 1000));
      } else {
        setIsLocked(false);
        removeStoredValue('lockUntil');
        removeStoredValue('loginAttempts');
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkLockStatus();
    }, 1000);
    return () => clearInterval(interval);
  }, [checkLockStatus]);

  const handleLoginFail = () => {
    const currentAttempts = getStoredNumber('loginAttempts');
    const newAttempts = currentAttempts + 1;
    setStoredValue('loginAttempts', newAttempts.toString());

    if (newAttempts >= MAX_ATTEMPTS) {
      const lockUntil = Date.now() + LOCK_TIME_MS;
      setStoredValue('lockUntil', lockUntil.toString());
      checkLockStatus();
    }
  };

  const handleLoginSuccess = (role: string, accessToken: unknown) => {
    if (
      typeof accessToken !== 'string'
      || accessToken.trim().length === 0
      || accessToken.trim().toLowerCase() === 'undefined'
    ) {
      tokenService.removeToken();
      setPasswordError('Phiên đăng nhập không hợp lệ. Vui lòng thử lại.');
      return;
    }

    const normalizedToken = accessToken.trim();

    if (!tokenService.setToken(normalizedToken)) {
      setPasswordError('Không thể lưu phiên đăng nhập trên thiết bị này. Vui lòng bật bộ nhớ trình duyệt và thử lại.');
      return;
    }

    removeStoredValue('loginAttempts');
    removeStoredValue('lockUntil');

    if (rememberMe) {
      setStoredValue('rememberedEmail', email.trim());
    } else {
      removeStoredValue('rememberedEmail');
    }

    switch (role.trim().toLowerCase().replace(/^role_/, '')) {
      case 'admin': navigate('/admin/dashboard'); break;
      case 'hr_manager': navigate('/hr/dashboard'); break;
      case 'interviewer': navigate('/interviewer/dashboard'); break;
      default: navigate('/dashboard'); break;
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setEmailError('');
    setPasswordError('');

    let valid = true;

    const normalizedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail) {
      setEmailError('Vui lòng nhập email công ty');
      valid = false;
    } else if (!emailRegex.test(normalizedEmail)) {
      setEmailError('Email không hợp lệ. Vui lòng nhập đúng định dạng (vd: ten@congty.com)');
      valid = false;
    }

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('Mật khẩu phải có độ dài tối thiểu từ 8 ký tự trở lên');
      valid = false;
    }

    if (!valid || isLocked) return;

    setIsLoading(true);
    try {
      const data = await authService.login(normalizedEmail, password);
      handleLoginSuccess(data.user?.role ?? '', data.accessToken);
    } catch (error: unknown) {
      if (error instanceof InvalidLoginResponseError) {
        tokenService.removeToken();
        setPasswordError('Thông tin xác thực từ máy chủ không hợp lệ. Vui lòng thử lại sau.');
      } else if (error instanceof AxiosError && error.response?.status === 401) {
        handleLoginFail();
        
        const currentAttempts = getStoredNumber('loginAttempts');
        if (currentAttempts < MAX_ATTEMPTS) {
          setPasswordError(`Thông tin đăng nhập không chính xác. Bạn đã sai ${currentAttempts}/${MAX_ATTEMPTS} lần; sai ${MAX_ATTEMPTS} lần tài khoản sẽ bị khóa.`);
        }
      } else if (error instanceof AxiosError && error.code === 'ECONNABORTED') {
        setPasswordError('Máy chủ phản hồi quá thời gian chờ. Vui lòng kiểm tra Backend rồi thử lại.');
      } else if (error instanceof AxiosError && !error.response) {
        setPasswordError('Không kết nối được máy chủ. Vui lòng kiểm tra Backend, mạng và cấu hình CORS.');
      } else {
        setPasswordError('Hệ thống đang gặp sự cố. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeLeft = () => {
    const minutes = Math.floor(lockTimeLeft / 60);
    const seconds = lockTimeLeft % 60;
    return `${minutes} phút ${seconds} giây`;
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 sm:p-12 border border-gray-100">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
          <span className="text-3xl">🔐</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Đăng nhập hệ thống</h2>
        <p className="text-gray-500 mt-2 text-sm">Vui lòng đăng nhập bằng tài khoản nội bộ</p>
      </div>
      
      {isLocked ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-2xl mb-6 text-center shadow-sm">
          <p className="font-semibold text-lg mb-1">Tài khoản bị khóa tạm thời!</p>
          <p className="text-sm opacity-90 mb-3">Bạn đã nhập sai {MAX_ATTEMPTS} lần.</p>
          <p className="text-sm">Vui lòng thử lại sau:</p>
          <p className="text-2xl font-bold mt-1 text-red-600 animate-pulse">{formatTimeLeft()}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email công ty
            </label>
            <input 
              type="email" 
              id="email"
              autoComplete="email"
              className={`w-full px-4 py-3 bg-gray-50 border ${emailError ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'} rounded-xl focus:ring-2 transition-all outline-none text-gray-800 placeholder-gray-400`}
              placeholder="nhansu@congty.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
            />
            {emailError && (
              <p className="text-red-500 text-xs font-medium mt-2 flex items-center">
                <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                {emailError}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                id="password"
                autoComplete="current-password"
                className={`w-full px-4 py-3 bg-gray-50 border ${passwordError ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'} rounded-xl focus:ring-2 transition-all outline-none text-gray-800 placeholder-gray-400 pr-12`}
                placeholder="Nhập mật khẩu của bạn (Tối thiểu 8 ký tự)"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
              />
              <button 
                type="button" 
                className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-gray-500 hover:text-indigo-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            {passwordError && (
              <p className="text-red-500 text-xs font-medium mt-2 flex items-center">
                <svg className="w-3.5 h-3.5 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                {passwordError}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm pt-2">
            <label className="flex items-center text-gray-600 cursor-pointer hover:text-gray-800 transition-colors">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Ghi nhớ phiên đăng nhập
            </label>
            <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors" onClick={(e) => e.preventDefault()}>
              Quên mật khẩu?
            </a>
          </div>

          <button 
            type="submit" 
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || isLocked}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xác thực...
              </span>
            ) : 'Đăng nhập hệ thống'}
          </button>
        </form>
      )}
    </div>
  );
};
