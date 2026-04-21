import crypto from 'crypto';
import { db } from '@/lib/db';

// Session expiration time: 24 hours
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

export interface SessionData {
  userId: string;
  username: string;
  nama: string;
  role: 'admin' | 'pegawai';
  pegawaiId: string | null;
  createdAt: number;
  expiresAt: number;
}

// Cookie name for session token
export const SESSION_COOKIE_NAME = 'tte_session_token';

/**
 * Hash a password using scrypt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto
    .scryptSync(password, salt, 64)
    .toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Verify a password against a stored hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derivedKey = crypto
    .scryptSync(password, salt, 64)
    .toString('hex');
  return crypto.timingSafeEqual(
    Buffer.from(derivedKey, 'hex'),
    Buffer.from(key, 'hex')
  );
}

/**
 * Create a new session in the database and return the session token
 */
export async function createSession(user: { id: string; username: string; nama: string; role: string; pegawaiId: string | null }): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_MS);

  try {
    await db.session.create({
      data: {
        token,
        userId: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role,
        pegawaiId: user.pegawaiId,
        expiresAt,
      },
    });
  } catch (dbError) {
    console.error('Failed to create session in database:', dbError);
    throw dbError;
  }

  // Clean up expired sessions
  await cleanupExpiredSessions();

  return token;
}

/**
 * Get session data from a token (database-backed)
 */
export async function getSession(token: string): Promise<SessionData | null> {
  const session = await db.session.findUnique({
    where: { token },
  });

  if (!session) return null;

  // Check if session has expired
  if (new Date() > session.expiresAt) {
    await db.session.delete({ where: { token } }).catch(() => {});
    return null;
  }

  return {
    userId: session.userId,
    username: session.username,
    nama: session.nama,
    role: session.role as 'admin' | 'pegawai',
    pegawaiId: session.pegawaiId,
    createdAt: session.createdAt.getTime(),
    expiresAt: session.expiresAt.getTime(),
  };
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(token: string): Promise<boolean> {
  try {
    await db.session.delete({ where: { token } });
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean up expired sessions from database
 */
async function cleanupExpiredSessions(): Promise<void> {
  try {
    await db.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  } catch {
    // Silently ignore
  }
}

/**
 * Get session token from request cookies
 */
export function getTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === SESSION_COOKIE_NAME && value) {
      return value;
    }
  }
  return null;
}

/**
 * Check if running in production (HTTPS)
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Create session cookie string for Set-Cookie header
 * In production (Vercel/HTTPS), we need the Secure flag
 */
export function createSessionCookie(token: string): string {
  const secure = isProduction() ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_EXPIRY_MS / 1000}; SameSite=Lax${secure}`;
}

/**
 * Create logout cookie string (expires immediately)
 */
export function createLogoutCookie(): string {
  const secure = isProduction() ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

/**
 * Check if request has a valid session
 */
export async function checkAuth(request: Request): Promise<{ session: SessionData; isAuthorized: boolean } | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const session = await getSession(token);
  if (!session) return null;
  return { session, isAuthorized: true };
}

/**
 * Require admin role for request
 */
export async function requireAdmin(request: Request): Promise<SessionData | null> {
  const result = await checkAuth(request);
  if (!result) return null;
  if (result.session.role !== 'admin') return null;
  return result.session;
}
