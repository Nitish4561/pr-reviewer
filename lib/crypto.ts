import crypto from "crypto";

const SECRET = process.env.ENCRYPTION_SECRET!;

export function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(SECRET, "hex"),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  return {
    iv: iv.toString("hex"),
    content: encrypted.toString("hex"),
    tag: cipher.getAuthTag().toString("hex"),
  };
}

export function decrypt(hash: any) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(SECRET, "hex"),
    Buffer.from(hash.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(hash.tag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(hash.content, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString();
}
