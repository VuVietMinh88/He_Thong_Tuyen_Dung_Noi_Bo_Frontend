export const PASSWORD_REGEX = /^(?=.*\p{L})(?=.*\d).{8,72}$/u;

export const isValidPassword = (password: string): boolean => {
  if (!PASSWORD_REGEX.test(password)) {
    return false;
  }

  return new TextEncoder().encode(password).length <= 72;
};
