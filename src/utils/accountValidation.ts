export interface AccountProfileValues {
  fullName: string;
  phone: string;
  displayTitle: string;
}

export const normalizeAccountPhone = (value: string): string => {
  const phone = value.trim();
  return phone.startsWith('+84') ? `0${phone.slice(3)}` : phone;
};

export const validateAccountProfile = ({
  fullName,
  phone,
  displayTitle,
}: AccountProfileValues): string | null => {
  const normalizedName = fullName.trim();
  const normalizedPhone = normalizeAccountPhone(phone);
  const normalizedTitle = displayTitle.trim();

  if (!normalizedName) return 'Họ và tên không được để trống.';
  if (normalizedName.length > 255) return 'Họ và tên tối đa 255 ký tự.';
  if (
    normalizedPhone
    && (normalizedPhone.length > 20 || !/^(?:0[35789]\d{8}|02\d{9})$/.test(normalizedPhone))
  ) {
    return 'Số điện thoại phải đúng định dạng Việt Nam (10 hoặc 11 chữ số).';
  }
  if (normalizedTitle.length > 120) return 'Chức danh tối đa 120 ký tự.';
  return null;
};
