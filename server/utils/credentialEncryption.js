const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const getEncryptionKey = () => {
  const key = process.env.INTEGRATION_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "INTEGRATION_ENCRYPTION_KEY is not configured"
    );
  }

  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      "INTEGRATION_ENCRYPTION_KEY must be a 64-character hexadecimal string"
    );
  }

  const buffer = Buffer.from(key, "hex");

  if (buffer.length !== KEY_LENGTH) {
    throw new Error(
      "INTEGRATION_ENCRYPTION_KEY must represent exactly 32 bytes"
    );
  }

  return buffer;
};

const encryptCredentials = (credentials) => {
  const key = getEncryptionKey();

  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    iv
  );

  const plaintext = JSON.stringify(
    credentials || {}
  );

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

const decryptCredentials = (
  encryptedCredentials
) => {
  const key = getEncryptionKey();

  if (
    typeof encryptedCredentials !== "string"
  ) {
    throw new Error(
      "Invalid encrypted credentials"
    );
  }

  const parts =
    encryptedCredentials.split(":");

  if (parts.length !== 3) {
    throw new Error(
      "Invalid encrypted credentials format"
    );
  }

  const [
    ivHex,
    authTagHex,
    encryptedHex,
  ] = parts;

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(
    authTagHex,
    "hex"
  );
  const encrypted = Buffer.from(
    encryptedHex,
    "hex"
  );

  if (
    iv.length !== IV_LENGTH ||
    authTag.length !== AUTH_TAG_LENGTH ||
    encrypted.length === 0
  ) {
    throw new Error(
      "Invalid encrypted credentials"
    );
  }

  const decipher =
    crypto.createDecipheriv(
      ALGORITHM,
      key,
      iv
    );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return JSON.parse(
    decrypted.toString("utf8")
  );
};

module.exports = {
  encryptCredentials,
  decryptCredentials,
};