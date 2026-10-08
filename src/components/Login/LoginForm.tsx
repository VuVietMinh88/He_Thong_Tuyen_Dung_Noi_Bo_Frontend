import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  authService,
  InvalidLoginResponseError,
  LoginValidationError,
} from '../../services/auth.service';
import { tokenService } from '../../services/token.service';
import {
  MAX_LOGIN_ATTEMPTS,
  clearSuccessfulLoginState,
  getGenericLoginErrorMessage,
  getLockStatus,
  registerFailedLoginAttempt,
} from '../../utils/loginState';

const getRoleRedirectPath = (roles: string[]): string => {
  const normalizedRoles = roles.map((role) => role.trim().toUpperCase().replace(/^ROLE_/, ''));
  if (normalizedRoles.includes('ADMIN')) return '/admin/dashboard';
  if (normalizedRoles.includes('HR_MANAGER')) return '/hr/dashboard';
  if (normalizedRoles.includes('INTERVIEWER')) return '/interviewer/dashboard';
  return '/dashboard';
};

export const LoginForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => localStorage.getItem('rememberedEmail') ?? '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem('rememberedEmail')));
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockVersion, setLockVersion] = useState(0);
  const [lockStatus, setLockStatus] = useState(() => getLockStatus(email));

  useEffect(() => {
    const updateLockStatus = () => setLockStatus(getLockStatus(email.trim()));
    updateLockStatus();
    const intervalId = window.setInterval(updateLockStatus, 1000);
    return () => window.clearInterval(intervalId);
  }, [email, lockVersion]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError('');
    setPasswordError('');
    setSubmitError('');

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let isValid = true;

    if (!normalizedEmail) {
      setEmailError('Vui lòng nhập email công ty');
      isValid = false;
    } else if (!emailRegex.test(normalizedEmail)) {
      setEmailError('Email không hợp lệ. Vui lòng nhập đúng định dạng (vd: ten@congty.com)');
      isValid = false;
    }
    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Mật khẩu phải có độ dài tối thiểu từ 8 ký tự trở lên');
      isValid = false;
    }
    if (!isValid || lockStatus.isLocked) return;

    setIsLoading(true);
    try {
      const response = await authService.login(normalizedEmail, password);
      const tokensSaved = tokenService.saveTokens(response.accessToken, response.refreshToken);
      const userSaved = tokensSaved && tokenService.setUserData(response.user);
      if (!tokensSaved || !userSaved) {
        tokenService.clearAll();
        setSubmitError('Không thể lưu phiên đăng nhập trên thiết bị này. Vui lòng thử lại.');
        return;
      }

      clearSuccessfulLoginState(normalizedEmail);
      setLockVersion((version) => version + 1);
      if (rememberMe) localStorage.setItem('rememberedEmail', normalizedEmail);
      else localStorage.removeItem('rememberedEmail');
      navigate(getRoleRedirectPath(response.user.roles));
    } catch (error) {
      if (error instanceof InvalidLoginResponseError) {
        tokenService.clearAll();
        setSubmitError('Thông tin xác thực từ máy chủ không hợp lệ. Vui lòng thử lại sau.');
        return;
      }

      if (error instanceof LoginValidationError) {
        setEmailError(error.fieldErrors.email?.[0] ?? '');
        setPasswordError(error.fieldErrors.password?.[0] ?? '');
        setSubmitError('Dữ liệu đăng nhập không hợp lệ. Vui lòng kiểm tra lại.');
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'LOGIN_REQUEST_FAILED';
      if (errorMessage === 'INVALID_CREDENTIALS') {
        const lock = registerFailedLoginAttempt(normalizedEmail);
        setLockVersion((version) => version + 1);
        setSubmitError(
          lock.isLocked
            ? 'Tài khoản đã bị khóa tạm thời trong 15 phút. Vui lòng thử lại sau.'
            : getGenericLoginErrorMessage(),
        );
        return;
      }
      if (errorMessage === 'TOO_MANY_REQUESTS') {
        setSubmitError('Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.');
        return;
      }
      if (errorMessage === 'NETWORK_ERROR') {
        setSubmitError('Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối và thử lại.');
        return;
      }
      setSubmitError('Không thể đăng nhập lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const minutes = Math.floor(lockStatus.remainingSeconds / 60);
  const seconds = lockStatus.remainingSeconds % 60;

  return (
    <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-10 shadow-2xl sm:p-12">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
          <span className="text-3xl" aria-hidden="true">🔐</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-800">Đăng nhập hệ thống</h2>
        <p className="mt-2 text-sm text-gray-500">Vui lòng đăng nhập bằng tài khoản nội bộ</p>
      </div>

      {lockStatus.isLocked ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-center text-red-700">
          <p className="mb-1 text-lg font-semibold">Tài khoản bị khóa tạm thời!</p>
          <p className="mb-3 text-sm">Bạn đã nhập sai quá {MAX_LOGIN_ATTEMPTS} lần.</p>
          <p className="text-sm">Vui lòng thử lại sau:</p>
          <p className="mt-1 animate-pulse text-2xl font-bold text-red-600">{minutes} phút {seconds} giây</p>
        </div>
      ) : (
        <>
          {submitError && (
            <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">Email công ty</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-gray-800 outline-none transition-all focus:ring-2 ${
                  emailError ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                placeholder="nhansu@congty.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError('');
                  setSubmitError('');
                }}
                aria-invalid={Boolean(emailError)}
              />
              {emailError && <p className="mt-2 text-xs font-medium text-red-500">{emailError}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-700">Mật khẩu</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`w-full rounded-xl border bg-gray-50 px-4 py-3 pr-16 text-gray-800 outline-none transition-all focus:ring-2 ${
                    passwordError ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                  placeholder="Nhập mật khẩu của bạn (Tối thiểu 8 ký tự)"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setPasswordError('');
                    setSubmitError('');
                  }}
                  aria-invalid={Boolean(passwordError)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-gray-500 hover:text-indigo-600"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              {passwordError && <p className="mt-2 text-xs font-medium text-red-500">{passwordError}</p>}
            </div>

            <div className="flex items-center justify-between pt-2 text-sm">
              <label className="flex cursor-pointer items-center text-gray-600">
                <input
                  type="checkbox"
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Ghi nhớ email
              </label>
              <Link to="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70 disabled:transform-none"
              disabled={isLoading || lockStatus.isLocked}
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};
