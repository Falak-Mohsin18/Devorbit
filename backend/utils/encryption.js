const crypto = require("crypto");

// 32-byte key derived from GITHUB_ENCRYPTION_KEY, JWT_SECRET, or fallback
const getEncryptionKey = () => {
  const secret =
    process.env.GITHUB_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    "devorbit-default-github-token-encryption-key-32b";

  return crypto.createHash("sha256").update(String(secret)).digest();
};

/**
 * Encrypt a plain-text access token using AES-256-GCM
 * @param {string} text - Token to encrypt
 * @returns {{ encrypted: string, iv: string, tag: string }}
 */
const encryptToken = (text) => {
  if (!text) return null;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(String(text), "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag,
  };
};

/**
 * Decrypt an AES-256-GCM encrypted token object
 * @param {{ encrypted: string, iv: string, tag: string }} encryptedObj
 * @returns {string|null}
 */
const decryptToken = (encryptedObj) => {
  if (
    !encryptedObj ||
    !encryptedObj.encrypted ||
    !encryptedObj.iv ||
    !encryptedObj.tag
  ) {
    return null;
  }

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(encryptedObj.iv, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(Buffer.from(encryptedObj.tag, "hex"));

    let decrypted = decipher.update(encryptedObj.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Token Decryption Error:", error.message);
    return null;
  }
};

/**
 * Generate a cryptographically signed OAuth state containing userId & timestamp
 * @param {string} userId - DevOrbit User ID
 * @param {object} extra - Optional additional metadata (e.g. redirectPath)
 * @returns {string} Base64url-encoded signed state
 */
const generateOAuthState = (userId, extra = {}) => {
  const payload = {
    userId: String(userId),
    timestamp: Date.now(),
    nonce: crypto.randomBytes(8).toString("hex"),
    ...extra,
  };

  const payloadString = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const key = getEncryptionKey();
  const signature = crypto
    .createHmac("sha256", key)
    .update(payloadString)
    .digest("base64url");

  return `${payloadString}.${signature}`;
};

/**
 * Verify OAuth state and return payload if valid and not expired (15-min TTL)
 * @param {string} state - Base64url state string
 * @param {number} maxAgeMs - Maximum valid age in milliseconds (default 15 minutes)
 * @returns {object|null}
 */
const verifyOAuthState = (state, maxAgeMs = 15 * 60 * 1000) => {
  if (!state || typeof state !== "string" || !state.includes(".")) {
    return null;
  }

  try {
    const [payloadString, signature] = state.split(".");
    const key = getEncryptionKey();
    const expectedSig = crypto
      .createHmac("sha256", key)
      .update(payloadString)
      .digest("base64url");

    // Constant-time comparison
    if (
      signature.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      console.warn("Invalid OAuth state signature");
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(payloadString, "base64url").toString("utf8")
    );

    // Check expiration
    if (Date.now() - payload.timestamp > maxAgeMs) {
      console.warn("OAuth state has expired");
      return null;
    }

    return payload;
  } catch (error) {
    console.error("OAuth state verification error:", error.message);
    return null;
  }
};

module.exports = {
  encryptToken,
  decryptToken,
  generateOAuthState,
  verifyOAuthState,
};
