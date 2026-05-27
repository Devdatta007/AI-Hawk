import crypto from "crypto";

// Advanced custom secure Token issuer & session verifier for Full-Stack User Authentication
const SESSION_SECRET = process.env.SESSION_SECRET || "aihawk_career_secret_token_key_2026";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + SESSION_SECRET).digest("hex");
}

export function generateToken(userId: string, email: string): string {
  const payload = JSON.stringify({ userId, email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.alloc(32, SESSION_SECRET.slice(0, 32)), Buffer.alloc(16));
  let encrypted = cipher.update(payload, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.alloc(32, SESSION_SECRET.slice(0, 32)), Buffer.alloc(16));
    let decrypted = decipher.update(token, "base64", "utf8");
    decrypted += decipher.final("utf8");
    
    const data = JSON.parse(decrypted);
    if (data.exp && Date.now() > data.exp) {
      return null; // Token expired
    }
    return { userId: data.userId, email: data.email };
  } catch (err) {
    return null; // Invalid token
  }
}
