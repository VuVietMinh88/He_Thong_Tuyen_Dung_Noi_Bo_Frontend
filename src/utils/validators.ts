/**
 * Kiểm tra định dạng số điện thoại Việt Nam
 * Hỗ trợ bắt đầu bằng 0, 84 hoặc +84
 * Theo sau là các đầu số 3, 5, 7, 8, 9 và 8 chữ số
 */
export const validatePhoneVN = (phone: string): boolean => {
  const phoneRegex = /^(0|84|\+84)(3|5|7|8|9)[0-9]{8}$/;
  return phoneRegex.test(phone);
};
