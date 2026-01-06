import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const ivLength = 16;
const saltLength = 64;
const tagLength = 16;
const tagPosition = saltLength + ivLength;
const encryptedPosition = tagPosition + tagLength;

const getKey = (salt) => {
  return crypto.pbkdf2Sync(secretKey, salt, 100000, 32, 'sha512');
};

const encrypt = (text) => {
  if (!text) return null;

  const salt = crypto.randomBytes(saltLength);
  const iv = crypto.randomBytes(ivLength);
  const key = getKey(salt);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(text), 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
};

const decrypt = (encryptedText) => {
  if (!encryptedText) return null;

  try {
    const buffer = Buffer.from(encryptedText, 'base64');

    const salt = buffer.slice(0, saltLength);
    const iv = buffer.slice(saltLength, tagPosition);
    const tag = buffer.slice(tagPosition, encryptedPosition);
    const encrypted = buffer.slice(encryptedPosition);

    const key = getKey(salt);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

export { encrypt, decrypt, hashData, generateToken };
