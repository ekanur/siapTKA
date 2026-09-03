import CryptoJS from "crypto-js";

const DEFAULT_SALT = process.env.NEXT_PUBLIC_CLIENT_SALT || "siaptka_secure_offline_salt_key_2026";

/**
 * Checks if a string value is already encrypted (CryptoJS AES standard format)
 */
export function isEncrypted(val: string): boolean {
  if (!val || typeof val !== "string") return false;
  return val.startsWith("ENC:") || val.startsWith("U2FsdGVkX1");
}

/**
 * Encrypts an answer key for offline storage (IndexedDB) so students cannot read it in DevTools.
 * Uses AES-256 with a unique per-question salt key.
 */
export function encryptAnswerKey(plainKey: string, soalId: string, salt: string = DEFAULT_SALT): string {
  if (!plainKey) return "";
  if (isEncrypted(plainKey)) return plainKey;
  const secret = `${salt}::${soalId}`;
  const cipher = CryptoJS.AES.encrypt(plainKey, secret).toString();
  return `ENC:${cipher}`;
}

/**
 * Decrypts an encrypted answer key in-memory during offline evaluation.
 */
export function decryptAnswerKey(cipherKey: string, soalId: string, salt: string = DEFAULT_SALT): string {
  if (!cipherKey) return "";
  const rawCipher = cipherKey.startsWith("ENC:") ? cipherKey.slice(4) : cipherKey;
  if (!rawCipher.startsWith("U2FsdGVkX1")) {
    return cipherKey; // It's plaintext
  }
  try {
    const secret = `${salt}::${soalId}`;
    const bytes = CryptoJS.AES.decrypt(rawCipher, secret);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || cipherKey;
  } catch {
    return cipherKey;
  }
}

/**
 * Computes a salted SHA-256 hash for an answer option to prevent DevTools inspection
 */
export function computeAnswerHash(soalId: string, optionVal: string, salt: string = DEFAULT_SALT): string {
  const payload = `${soalId}:${optionVal.trim().toUpperCase()}:${salt}`;
  return CryptoJS.SHA256(payload).toString(CryptoJS.enc.Hex);
}

/**
 * Verifies if the selected option matches the answer key (supports Encrypted AES, SHA-256 hash, and Plaintext)
 */
export function verifySingleChoice(soalId: string, selectedOption: string, expectedHashOrKey: string, salt: string = DEFAULT_SALT): boolean {
  if (!selectedOption || !expectedHashOrKey) return false;

  // 1. If stored as encrypted AES ciphertext (or plaintext decrypted from it)
  const plainKey = decryptAnswerKey(expectedHashOrKey, soalId, salt);
  if (selectedOption.trim().toUpperCase() === plainKey.trim().toUpperCase()) return true;

  // 2. If stored as salted SHA-256 hash
  const computed = computeAnswerHash(soalId, selectedOption, salt);
  if (computed === expectedHashOrKey) return true;

  // 3. Fallback direct match
  return selectedOption.trim().toUpperCase() === expectedHashOrKey.trim().toUpperCase();
}

/**
 * Verifies multiple choice multiple answer (MCMA) with decrypted key support
 */
export function verifyMcma(soalId: string, selectedOptions: string[], expectedKeyOrJson: string | string[], salt: string = DEFAULT_SALT): boolean {
  let rawExpected = expectedKeyOrJson;
  if (typeof rawExpected === "string") {
    rawExpected = decryptAnswerKey(rawExpected, soalId, salt);
  }

  let expectedArray: string[] = [];
  if (Array.isArray(rawExpected)) {
    expectedArray = rawExpected;
  } else {
    try {
      expectedArray = JSON.parse(rawExpected);
    } catch {
      expectedArray = [String(rawExpected)];
    }
  }

  const sortedUser = [...selectedOptions].map((o) => o.trim().toUpperCase()).sort();
  const sortedExpected = [...expectedArray].map((o) => o.trim().toUpperCase()).sort();

  if (sortedUser.length !== sortedExpected.length) return false;
  return sortedUser.every((val, idx) => val === sortedExpected[idx]);
}

/**
 * Verifies PGK Kategori matrix with decrypted key support
 */
export function verifyPgkKategori(
  soalId: string,
  userChoices: { id: number; answer: string }[],
  expectedKeyOrJson: string | { id: number; answer: string }[],
  salt: string = DEFAULT_SALT
): { isAllCorrect: boolean; score: number } {
  let rawExpected = expectedKeyOrJson;
  if (typeof rawExpected === "string") {
    rawExpected = decryptAnswerKey(rawExpected, soalId, salt);
  }

  let expectedArray: { id: number; answer: string }[] = [];
  if (Array.isArray(rawExpected)) {
    expectedArray = rawExpected;
  } else {
    try {
      expectedArray = JSON.parse(rawExpected);
    } catch {
      expectedArray = [];
    }
  }

  if (expectedArray.length === 0) return { isAllCorrect: false, score: 0 };

  let correctCount = 0;
  for (const exp of expectedArray) {
    const userAns = userChoices.find((u) => u.id === exp.id);
    if (userAns && userAns.answer.trim().toLowerCase() === exp.answer.trim().toLowerCase()) {
      correctCount++;
    }
  }

  const score = Math.round((correctCount / expectedArray.length) * 100);
  return {
    isAllCorrect: correctCount === expectedArray.length,
    score,
  };
}

/**
 * AES Encryption for Pembahasan payload
 */
export function encryptExplanation(plainText: string, soalId?: string, secretKey: string = DEFAULT_SALT): string {
  if (!plainText) return "";
  if (isEncrypted(plainText)) return plainText;
  const secret = soalId ? `${secretKey}::${soalId}::exp` : secretKey;
  const cipher = CryptoJS.AES.encrypt(plainText, secret).toString();
  return `ENC:${cipher}`;
}

/**
 * AES Decryption for Pembahasan payload
 */
export function decryptExplanation(cipherText: string, soalId?: string, secretKey: string = DEFAULT_SALT): string {
  if (!cipherText) return "";
  const rawCipher = cipherText.startsWith("ENC:") ? cipherText.slice(4) : cipherText;
  if (!rawCipher.startsWith("U2FsdGVkX1")) {
    return cipherText;
  }
  try {
    const secret = soalId ? `${secretKey}::${soalId}::exp` : secretKey;
    const bytes = CryptoJS.AES.decrypt(rawCipher, secret);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || cipherText;
  } catch {
    try {
      const bytes = CryptoJS.AES.decrypt(rawCipher, secretKey);
      return bytes.toString(CryptoJS.enc.Utf8) || cipherText;
    } catch {
      return cipherText;
    }
  }
}