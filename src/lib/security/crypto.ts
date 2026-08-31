import CryptoJS from "crypto-js";

const DEFAULT_SALT = process.env.NEXT_PUBLIC_CLIENT_SALT || "siaptka_secure_offline_salt_key_2026";

/**
 * Computes a salted SHA-256 hash for an answer option to prevent DevTools inspection
 */
export function computeAnswerHash(soalId: string, optionVal: string, salt: string = DEFAULT_SALT): string {
  const payload = `${soalId}:${optionVal.trim().toUpperCase()}:${salt}`;
  return CryptoJS.SHA256(payload).toString(CryptoJS.enc.Hex);
}

/**
 * Verifies if the selected option matches the salted hash
 */
export function verifySingleChoice(soalId: string, selectedOption: string, expectedHashOrKey: string, salt: string = DEFAULT_SALT): boolean {
  // If stored as hash
  const computed = computeAnswerHash(soalId, selectedOption, salt);
  if (computed === expectedHashOrKey) return true;
  // If stored as plain key (backward compatibility / direct check)
  return selectedOption.trim().toUpperCase() === expectedHashOrKey.trim().toUpperCase();
}

/**
 * Verifies multiple choice multiple answer (MCMA)
 */
export function verifyMcma(soalId: string, selectedOptions: string[], expectedKeyOrJson: string | string[], salt: string = DEFAULT_SALT): boolean {
  let expectedArray: string[] = [];
  if (Array.isArray(expectedKeyOrJson)) {
    expectedArray = expectedKeyOrJson;
  } else {
    try {
      expectedArray = JSON.parse(expectedKeyOrJson);
    } catch {
      expectedArray = [expectedKeyOrJson];
    }
  }

  const sortedUser = [...selectedOptions].map(o => o.trim().toUpperCase()).sort();
  const sortedExpected = [...expectedArray].map(o => o.trim().toUpperCase()).sort();

  if (sortedUser.length !== sortedExpected.length) return false;
  return sortedUser.every((val, idx) => val === sortedExpected[idx]);
}

/**
 * Verifies PGK Kategori matrix
 */
export function verifyPgkKategori(
  soalId: string,
  userChoices: { id: number; answer: string }[],
  expectedKeyOrJson: string | { id: number; answer: string }[]
): { isAllCorrect: boolean; score: number } {
  let expectedArray: { id: number; answer: string }[] = [];
  if (Array.isArray(expectedKeyOrJson)) {
    expectedArray = expectedKeyOrJson;
  } else {
    try {
      expectedArray = JSON.parse(expectedKeyOrJson);
    } catch {
      expectedArray = [];
    }
  }

  if (expectedArray.length === 0) return { isAllCorrect: false, score: 0 };

  let correctCount = 0;
  for (const exp of expectedArray) {
    const userAns = userChoices.find(u => u.id === exp.id);
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
export function encryptExplanation(plainText: string, secretKey: string = DEFAULT_SALT): string {
  return CryptoJS.AES.encrypt(plainText, secretKey).toString();
}

/**
 * AES Decryption for Pembahasan payload
 */
export function decryptExplanation(cipherText: string, secretKey: string = DEFAULT_SALT): string {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || plainTextFallback(cipherText);
  } catch {
    return plainTextFallback(cipherText);
  }
}

function plainTextFallback(text: string): string {
  return text;
}