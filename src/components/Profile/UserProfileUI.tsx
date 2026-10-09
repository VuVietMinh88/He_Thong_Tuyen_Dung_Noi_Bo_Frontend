import React, { useEffect, useState, type FormEvent } from "react";
import { mockUserProfile, type UserProfile } from "./mockProfile";
import {
  profileService,
  getApiErrorMessage,
} from "../../services/profileService";
import { useToast } from "../notifications/useToast";

export type { UserProfile };

export interface UserProfileUIProps {
  initialData?: UserProfile;
  onSave?: (updatedProfile: UserProfile) => void;
  onCancel?: () => void;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
}

/*
 * Regex kiểm tra số điện thoại Việt Nam:
 * - Cho phép tiền tố quốc tế (+84) hoặc số 0 nội địa ở đầu.
 * - Thuê bao di động 10 chữ số bắt đầu bằng các đầu mạng: 03, 05, 07, 08, 09.
 * - Thuê bao cố định 11 chữ số bắt đầu bằng đầu số: 02.
 */
const VIETNAM_PHONE_REGEX = /^(?:\+84|0)(?:[35789]\d{8}|2\d{9})$/;

export const UserProfileUI: React.FC<UserProfileUIProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const { notify } = useToast();

  const [profileData, setProfileData] = useState<UserProfile>(
    initialData ?? mockUserProfile,
  );

  const [fullName, setFullName] = useState<string>(
    initialData?.fullName ?? mockUserProfile.fullName,
  );
  const [phone, setPhone] = useState<string>(
    initialData?.phone ?? mockUserProfile.phone,
  );
  const [displayTitle, setDisplayTitle] = useState<string>(
    initialData?.displayTitle ?? mockUserProfile.displayTitle,
  );

  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);

  const loadProfile = React.useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await profileService.getProfile();
      const mapped: UserProfile = {
        id: data.id,
        email: data.email,
        fullName: data.fullName,
        phone: data.phone ?? "",
        displayTitle: data.displayTitle ?? "",
        departmentName: data.departmentName ?? "Chưa phân phòng ban",
        roles: data.roles ?? [],
        avatarUrl: data.hasAvatar
          ? `/api/v1/profile/avatar?t=${Date.now()}`
          : undefined,
      };

      setProfileData(mapped);
      setFullName(mapped.fullName);
      setPhone(mapped.phone);
      setDisplayTitle(mapped.displayTitle);
    } catch (err: unknown) {
      const message = getApiErrorMessage(
        err,
        "Không thể tải thông tin hồ sơ từ máy chủ.",
      );
      setApiError(message);
      if (!initialData) {
        setProfileData(mockUserProfile);
        setFullName(mockUserProfile.fullName);
        setPhone(mockUserProfile.phone);
        setDisplayTitle(mockUserProfile.displayTitle);
      }
    } finally {
      setIsLoading(false);
    }
  }, [initialData]);

  useEffect(() => {
    let isCancelled = false;

    if (!initialData) {
      profileService
        .getProfile()
        .then((data) => {
          if (isCancelled) return;
          const mapped: UserProfile = {
            id: data.id,
            email: data.email,
            fullName: data.fullName,
            phone: data.phone ?? "",
            displayTitle: data.displayTitle ?? "",
            departmentName: data.departmentName ?? "Chưa phân phòng ban",
            roles: data.roles ?? [],
            avatarUrl: data.hasAvatar
              ? `/api/v1/profile/avatar?t=${Date.now()}`
              : undefined,
          };

          setProfileData(mapped);
          setFullName(mapped.fullName);
          setPhone(mapped.phone);
          setDisplayTitle(mapped.displayTitle);
          setIsLoading(false);
        })
        .catch((err: unknown) => {
          if (isCancelled) return;
          const message = getApiErrorMessage(
            err,
            "Không thể tải thông tin hồ sơ từ máy chủ.",
          );
          setApiError(message);
          setProfileData(mockUserProfile);
          setFullName(mockUserProfile.fullName);
          setPhone(mockUserProfile.phone);
          setDisplayTitle(mockUserProfile.displayTitle);
          setIsLoading(false);
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [initialData]);

  const validateForm = (nameValue: string, phoneValue: string): FormErrors => {
    const newErrors: FormErrors = {};

    const trimmedName = nameValue.trim();
    if (!trimmedName) {
      newErrors.fullName = "Họ và tên là bắt buộc.";
    } else if (trimmedName.length > 255) {
      newErrors.fullName = "Họ và tên tối đa 255 ký tự.";
    }

    const trimmedPhone = phoneValue.trim();
    if (trimmedPhone && !VIETNAM_PHONE_REGEX.test(trimmedPhone)) {
      newErrors.phone =
        "Số điện thoại không đúng định dạng Việt Nam (VD: 0912345678 hoặc +84912345678).";
    }

    return newErrors;
  };

  const handleFullNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFullName(value);
    if (errors.fullName) {
      const nextErrors = validateForm(value, phone);
      setErrors((prev) => ({ ...prev, fullName: nextErrors.fullName }));
    }
  };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPhone(value);
    if (errors.phone) {
      const nextErrors = validateForm(fullName, value);
      setErrors((prev) => ({ ...prev, phone: nextErrors.phone }));
    }
  };

  const handleDisplayTitleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDisplayTitle(event.target.value);
  };

  const handleReset = () => {
    setFullName(profileData.fullName);
    setPhone(profileData.phone);
    setDisplayTitle(profileData.displayTitle);
    setErrors({});
    setApiError(null);
    setShowSuccessAlert(false);
    onCancel?.();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formValidationErrors = validateForm(fullName, phone);
    setErrors(formValidationErrors);

    if (Object.keys(formValidationErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    setApiError(null);

    try {
      const updated = await profileService.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        displayTitle: displayTitle.trim() || null,
      });

      const mapped: UserProfile = {
        ...profileData,
        fullName: updated.fullName,
        phone: updated.phone ?? "",
        displayTitle: updated.displayTitle ?? "",
        departmentName: updated.departmentName ?? profileData.departmentName,
        roles: updated.roles ?? profileData.roles,
        avatarUrl: updated.hasAvatar
          ? `/api/v1/profile/avatar?t=${Date.now()}`
          : profileData.avatarUrl,
      };

      setProfileData(mapped);
      setFullName(mapped.fullName);
      setPhone(mapped.phone);
      setDisplayTitle(mapped.displayTitle);
      setShowSuccessAlert(true);
      notify("Cập nhật thông tin hồ sơ thành công!", "success");
      onSave?.(mapped);

      window.setTimeout(() => {
        setShowSuccessAlert(false);
      }, 4000);
    } catch (err: unknown) {
      const message = getApiErrorMessage(
        err,
        "Không thể cập nhật hồ sơ cá nhân. Vui lòng thử lại.",
      );
      setApiError(message);
      notify(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const isFormInvalid =
    !fullName.trim() ||
    Boolean(errors.fullName) ||
    Boolean(errors.phone) ||
    isSaving;

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "U";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  if (isLoading) {
    return (
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 shadow-xs">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <span className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
            <span className="text-sm font-medium">
              Đang tải thông tin hồ sơ cá nhân...
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      {/* Khung tóm tắt định danh cá nhân và avatar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-700 text-2xl font-bold text-white shadow-md">
            {profileData.avatarUrl ? (
              <img
                alt={profileData.fullName}
                className="h-full w-full rounded-2xl object-cover"
                src={profileData.avatarUrl}
              />
            ) : (
              <span>{getInitials(profileData.fullName)}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 truncate">
                {profileData.fullName}
              </h1>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                Đang hoạt động
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {profileData.displayTitle || "Chưa thiết lập chức danh"}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                🏢 {profileData.departmentName}
              </span>
              {profileData.roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Thông báo lỗi khi gọi API từ server */}
      {apiError && (
        <div
          aria-live="assertive"
          className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-xs"
          role="alert"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">⚠️</span>
            <span>{apiError}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="text-xs font-semibold text-rose-700 underline hover:text-rose-900"
              onClick={loadProfile}
              type="button"
            >
              Thử lại
            </button>
            <button
              className="text-xs font-semibold text-rose-600 hover:text-rose-800"
              onClick={() => setApiError(null)}
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Thông báo cập nhật thành công dạng flash banner */}
      {showSuccessAlert && (
        <div
          aria-live="polite"
          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-xs"
          role="status"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">✅</span>
            <span>Đã lưu thành công thông tin hồ sơ của bạn lên máy chủ!</span>
          </div>
          <button
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            onClick={() => setShowSuccessAlert(false)}
            type="button"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Form chi tiết thông tin hồ sơ */}
      <form
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
        noValidate
        onSubmit={handleSubmit}
      >
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Thông tin chi tiết hồ sơ
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Xem thông tin hệ thống và cập nhật thông tin liên hệ của bạn.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Nhóm thông tin chỉ xem do hệ thống cấp */}
          <div className="space-y-5 md:border-r md:border-slate-100 md:pr-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Thông tin hệ thống (Chỉ xem)
            </h3>

            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="profile-email"
              >
                Email công ty
              </label>
              <div className="relative mt-1">
                <input
                  aria-readonly="true"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 shadow-xs cursor-not-allowed select-none"
                  disabled
                  id="profile-email"
                  readOnly
                  type="email"
                  value={profileData.email}
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
                  🔒
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Email được dùng làm tài khoản đăng nhập chính thức.
              </p>
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="profile-department"
              >
                Phòng ban
              </label>
              <div className="relative mt-1">
                <input
                  aria-readonly="true"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 shadow-xs cursor-not-allowed select-none"
                  disabled
                  id="profile-department"
                  readOnly
                  type="text"
                  value={profileData.departmentName}
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
                  🔒
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Phòng ban trực thuộc được phân công bởi Quản trị viên.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Vai trò hệ thống
              </label>
              <div className="mt-1 flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 shadow-xs">
                {profileData.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                  >
                    {role}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Quyền hạn truy cập và chức năng quản lý tài khoản.
              </p>
            </div>
          </div>

          {/* Nhóm thông tin cho phép người dùng thay đổi */}
          <div className="space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Thông tin cho phép cập nhật
            </h3>

            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="profile-full-name"
              >
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <input
                autoComplete="name"
                className={`mt-1 w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition ${
                  errors.fullName
                    ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    : "border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                }`}
                disabled={isSaving}
                id="profile-full-name"
                maxLength={255}
                onChange={handleFullNameChange}
                placeholder="Nhập họ và tên đầy đủ"
                required
                type="text"
                value={fullName}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs font-medium text-rose-600">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="profile-phone"
              >
                Số điện thoại
              </label>
              <input
                autoComplete="tel"
                className={`mt-1 w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition ${
                  errors.phone
                    ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    : "border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                }`}
                disabled={isSaving}
                id="profile-phone"
                maxLength={20}
                onChange={handlePhoneChange}
                placeholder="VD: 0912345678 hoặc +84912345678"
                type="tel"
                value={phone}
              />
              {errors.phone ? (
                <p className="mt-1 text-xs font-medium text-rose-600">
                  {errors.phone}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">
                  Di động 10 số (03/05/07/08/09), số cố định 11 số (02) hoặc có
                  +84.
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-semibold text-slate-700"
                htmlFor="profile-display-title"
              >
                Chức danh hiển thị
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                disabled={isSaving}
                id="profile-display-title"
                maxLength={120}
                onChange={handleDisplayTitleChange}
                placeholder="VD: Chuyên viên Tuyển dụng cấp cao"
                type="text"
                value={displayTitle}
              />
              <p className="mt-1 text-xs text-slate-400">
                Tối đa 120 ký tự hiển thị trên bảng thông tin và thông báo.
              </p>
            </div>
          </div>
        </div>

        {/* Khu vực nút bấm hành động */}
        <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
          <button
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
            disabled={isSaving}
            onClick={handleReset}
            type="button"
          >
            Hủy bỏ
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isFormInvalid}
            type="submit"
          >
            {isSaving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>Lưu thay đổi</span>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};

export default UserProfileUI;
