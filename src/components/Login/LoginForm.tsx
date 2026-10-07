import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import {
  MAX_LOGIN_ATTEMPTS,
  clearSuccessfulLoginState,
  getGenericLoginErrorMessage,
  getLockStatus,
  registerFailedLoginAttempt,
} from "../../utils/loginState";

const getRoleRedirectPath = (user?: {
  roles?: string[];
}): string => {
  const roles = user?.roles ?? [];

  if (roles.includes("ADMIN")) return "/admin/dashboard";
  if (roles.includes("HR")) return "/hr/dashboard";
  if (roles.includes("INTERVIEWER")) return "/interviewer/dashboard";
  return "/dashboard";
};

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>(
    () => localStorage.getItem("rememberedEmail") ?? "",
  );
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(() =>
    Boolean(localStorage.getItem("rememberedEmail")),
  );
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lockVersion, setLockVersion] = useState<number>(0);
  const [lockStatus, setLockStatus] = useState(() => getLockStatus(email));

  useEffect(() => {
    const updateLockStatus = () => {
      setLockStatus(getLockStatus(email.trim()));
    };

    updateLockStatus();

    const intervalId = window.setInterval(updateLockStatus, 1000);
    return () => window.clearInterval(intervalId);
  }, [lockVersion, email]);

  const isLocked = lockStatus.isLocked;
  const lockTimeLeft = lockStatus.remainingSeconds;

  const formatTimeLeft = () => {
    const minutes = Math.floor(lockTimeLeft / 60);
    const seconds = lockTimeLeft % 60;
    return `${minutes} phút ${seconds} giây`;
  };

  const handleLoginSuccess = (
    token: string,
    user: { roles?: string[] },
  ) => {
    const normalizedEmail = email.trim();
    clearSuccessfulLoginState(normalizedEmail);
    setLockVersion((current) => current + 1);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    if (rememberMe) {
      localStorage.setItem("rememberedEmail", normalizedEmail);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    navigate(getRoleRedirectPath(user));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setEmailError("");
    setPasswordError("");
    setSubmitError("");

    const normalizedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let valid = true;

    if (!normalizedEmail) {
      setEmailError("Vui lòng nhập email công ty");
      valid = false;
    } else if (!emailRegex.test(normalizedEmail)) {
      setEmailError(
        "Email không hợp lệ. Vui lòng nhập đúng định dạng (vd: ten@congty.com)",
      );
      valid = false;
    }

    if (!password) {
      setPasswordError("Vui lòng nhập mật khẩu");
      valid = false;
    } else if (password.length < 8) {
      setPasswordError("Mật khẩu phải có độ dài tối thiểu từ 8 ký tự trở lên");
      valid = false;
    }

    if (!valid || isLocked) {
      return;
    }

    setIsLoading(true);

    try {
      const data = await authService.login(normalizedEmail, password);
      handleLoginSuccess(data.token, data.user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "LOGIN_REQUEST_FAILED";
      const typedError = error as Error & {
        fieldErrors?: Record<string, string[]>;
      };

      if (errorMessage === "VALIDATION_ERROR") {
        const emailFieldErrors = typedError.fieldErrors?.email ?? [];
        const passwordFieldErrors = typedError.fieldErrors?.password ?? [];

        if (emailFieldErrors[0]) {
          setEmailError(emailFieldErrors[0]);
        }

        if (passwordFieldErrors[0]) {
          setPasswordError(passwordFieldErrors[0]);
        }

        setSubmitError(
          "Dữ liệu đăng nhập không hợp lệ. Vui lòng kiểm tra lại.",
        );
        return;
      }

      if (errorMessage === "INVALID_CREDENTIALS") {
        const lockState = registerFailedLoginAttempt(normalizedEmail);
        setLockVersion((current) => current + 1);

        if (lockState.isLocked) {
          setSubmitError(
            "Tài khoản đã bị khóa tạm thời trong 15 phút. Vui lòng thử lại sau.",
          );
          return;
        }

        setSubmitError(getGenericLoginErrorMessage());
        return;
      }

      setSubmitError("Không thể đăng nhập lúc này. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 sm:p-12 border border-gray-100">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
          <span className="text-3xl">🔐</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
          Đăng nhập hệ thống
        </h2>
        <p className="text-gray-500 mt-2 text-sm">
          Vui lòng đăng nhập bằng tài khoản nội bộ
        </p>
      </div>

      {isLocked ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-2xl mb-6 text-center shadow-sm">
          <p className="font-semibold text-lg mb-1">
            Tài khoản bị khóa tạm thời!
          </p>
          <p className="text-sm opacity-90 mb-3">
            Bạn đã nhập sai quá {MAX_LOGIN_ATTEMPTS} lần.
          </p>
          <p className="text-sm">Vui lòng thử lại sau:</p>
          <p className="text-2xl font-bold mt-1 text-red-600 animate-pulse">
            {formatTimeLeft()}
          </p>
        </div>
      ) : (
        <>
          {submitError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email công ty
              </label>
              <input
                type="email"
                id="email"
                className={`w-full px-4 py-3 bg-gray-50 border ${emailError ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"} rounded-xl focus:ring-2 transition-all outline-none text-gray-800 placeholder-gray-400`}
                placeholder="nhansu@congty.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError("");
                  setSubmitError("");
                }}
              />
              {emailError && (
                <p className="text-red-500 text-xs font-medium mt-2 flex items-center">
                  <svg
                    className="w-3.5 h-3.5 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className={`w-full px-4 py-3 bg-gray-50 border ${passwordError ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"} rounded-xl focus:ring-2 transition-all outline-none text-gray-800 placeholder-gray-400 pr-12`}
                  placeholder="Nhập mật khẩu của bạn (Tối thiểu 8 ký tự)"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setPasswordError("");
                    setSubmitError("");
                  }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-gray-500 hover:text-indigo-600 focus:outline-none"
                  onClick={() => setShowPassword((current) => !current)}
                  tabIndex={-1}
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {passwordError && (
                <p className="text-red-500 text-xs font-medium mt-2 flex items-center">
                  <svg
                    className="w-3.5 h-3.5 mr-1 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
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
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Ghi nhớ phiên đăng nhập
              </label>
              <a
                href="#"
                className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                onClick={(event) => event.preventDefault()}
              >
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
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang xác thực...
                </span>
              ) : (
                "Đăng nhập hệ thống"
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
};
