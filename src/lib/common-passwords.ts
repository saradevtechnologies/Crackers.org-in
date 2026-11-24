/**
 * Passwords people pick most often (plus local favourites). Blocked when setting a password.
 * Compared case-insensitively. No uppercase/symbol rules: length + this list only.
 */
const LIST = [
  '12345678', '123456789', '1234567890', '12341234', '11111111', '00000000', '88888888', '87654321', '11223344', '12121212',
  '123123123', '1234512345', '01234567', '98765432', '99999999', '22222222', '55555555', '66666666', '77777777', '10203040',
  'password', 'password1', 'password12', 'password123', 'passw0rd', 'p@ssw0rd', 'p@ssword', 'password@123', 'pass1234', 'pass@123',
  'qwertyui', 'qwerty123', 'qwertyuiop', '1qaz2wsx', 'asdfghjk', 'asdf1234', 'zxcvbnm1', 'abcd1234', 'abc12345', 'abcdefgh',
  'iloveyou', 'iloveyou1', 'sunshine', 'princess', 'football', 'baseball', 'welcome1', 'welcome123', 'letmein1', 'trustno1',
  'superman', 'starwars', 'whatever', 'computer', 'internet', 'samsung1', 'india123', 'india@123', 'bharat123', 'jaihind1',
  'crackers', 'crackers1', 'crackers123', 'crackers@123', 'diwali123', 'diwali2024', 'diwali2025', 'diwali2026', 'happydiwali', 'deepavali',
  'sivakasi', 'sivakasi1', 'sivakasi123', 'fireworks', 'fireworks1', 'pattasu123', 'tamilnadu', 'chennai123', 'madurai123', 'admin123',
  'admin@123', 'administrator', 'changeme', 'changeme1', 'default1', 'secret123', 'test1234', 'testtest', 'master123', 'monkey123',
  'dragon123', 'ganesh123', 'murugan123', 'krishna123', 'balaji123', 'srinivas', 'lakshmi123', 'saibaba123', 'omnamah', 'jaishriram',
];

export const COMMON_PASSWORDS = new Set(LIST.map((p) => p.toLowerCase()));

export const MIN_PASSWORD = 8;

export function passwordProblems(pw: string) {
  return {
    tooShort: pw.length < MIN_PASSWORD,
    common: COMMON_PASSWORDS.has(pw.trim().toLowerCase()),
  };
}
