import * as crypto from 'crypto';

// 환경 변수 검증 및 로컬 개발용 Fallback 키 매핑 (하네스 안전망 설계)
const ALGORITHM = 'aes-256-cbc';

// 32바이트 Key 획득
const rawKey = process.env.COMPLIANCE_CRYPTO_KEY || 'default_32bytes_secret_compliance_key_test_only!';
const KEY = crypto.createHash('sha256').update(rawKey).digest(); // SHA256을 통해 강제로 32바이트로 정규화

// 16바이트 IV 획득
const rawIv = process.env.COMPLIANCE_CRYPTO_IV || 'default_compliance_iv_vector';
const IV = crypto.createHash('md5').update(rawIv).digest(); // MD5를 통해 강제로 16바이트로 정규화

/**
 * 민감 정보를 안전하게 AES-256-CBC로 암호화합니다.
 */
export function encrypt(text: string): string {
  if (!text) return '';
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

/**
 * 암호화된 문자열을 복호화하여 원래의 텍스트로 복원합니다.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('❌ [Crypto 복호화 에러] 키/IV 불일치 혹은 데이터 훼손:', error);
    return '[DECRYPTION_ERROR]';
  }
}
