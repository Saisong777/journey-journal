import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";

// --- User existence cache (avoids a DB hit on every API request) ---
const userExistenceCache = new Map<string, { exists: boolean; expiresAt: number }>();
const USER_CACHE_TTL = 300_000; // 5 minutes

// --- User role cache (avoids repeated getUserRole DB queries) ---
const userRoleCache = new Map<string, { role: any; expiresAt: number }>();
const USER_ROLE_CACHE_TTL = 60_000; // 1 minute

// --- Weather cache ---
const weatherCache = new Map<string, { data: unknown; ts: number }>();
const WEATHER_CACHE_TTL = 600_000; // 10 minutes

// --- Destination geocoding table ---
const DESTINATION_COORDS: Array<{ keywords: string[]; lat: number; lon: number }> = [
  { keywords: ["以色列", "israel"], lat: 31.7683, lon: 35.2137 },
  { keywords: ["土耳其", "turkey"], lat: 39.9334, lon: 32.8597 },
  { keywords: ["日本", "japan"], lat: 35.6762, lon: 139.6503 },
  { keywords: ["希臘", "greece"], lat: 37.9838, lon: 23.7275 },
  { keywords: ["埃及", "egypt"], lat: 30.0444, lon: 31.2357 },
  { keywords: ["約旦", "jordan"], lat: 31.9539, lon: 35.9106 },
  { keywords: ["義大利", "italy"], lat: 41.9028, lon: 12.4964 },
];

function resolveDestinationCoords(destination: string): { lat: number; lon: number } {
  const dest = destination.toLowerCase();
  for (const entry of DESTINATION_COORDS) {
    if (entry.keywords.some((kw) => dest.includes(kw))) {
      return { lat: entry.lat, lon: entry.lon };
    }
  }
  return { lat: 31.7683, lon: 35.2137 }; // default: Israel
}

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});
import crypto from "crypto";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { insertTripSchema, insertGroupSchema, insertJournalEntrySchema, insertDevotionalEntrySchema, insertDevotionalCourseSchema } from "@shared/schema";

// --- Input validation schemas for endpoints that were missing validation ---
const updateProfileSchema = z.object({
  name: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().optional().nullable(),
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(30).optional(),
  dietaryRestrictions: z.string().max(500).optional(),
  medicalNotes: z.string().max(500).optional(),
  groupId: z.string().uuid().optional().nullable(),
});

const updateTripSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  destination: z.string().max(200).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  coverImageUrl: z.string().optional().nullable(),
  specialRemarks: z.string().optional().nullable(),
  bibleLibraryEnabled: z.boolean().optional(),
});

const adminUpdateUserSchema = z.object({
  name: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
});
import { tokenStore, generateToken, createAuthToken } from "./tokenStore";

const BOOK_ABBREVIATIONS: Record<string, string> = {
  "創": "創世記", "出": "出埃及記", "利": "利未記", "民": "民數記", "申": "申命記",
  "書": "約書亞記", "士": "士師記", "得": "路得記",
  "撒上": "撒母耳記上", "撒下": "撒母耳記下", "王上": "列王紀上", "王下": "列王紀下",
  "代上": "歷代志上", "代下": "歷代志下", "拉": "以斯拉記", "尼": "尼希米記", "斯": "以斯帖記",
  "伯": "約伯記", "詩": "詩篇", "箴": "箴言", "傳": "傳道書", "歌": "雅歌",
  "賽": "以賽亞書", "耶": "耶利米書", "哀": "耶利米哀歌", "結": "以西結書", "但": "但以理書",
  "何": "何西阿書", "珥": "約珥書", "摩": "阿摩司書", "俄": "俄巴底亞書", "拿": "約拿書",
  "彌": "彌迦書", "鴻": "那鴻書", "哈": "哈巴谷書", "番": "西番雅書", "該": "哈該書",
  "亞": "撒迦利亞書", "瑪": "瑪拉基書",
  "太": "馬太福音", "可": "馬可福音", "路": "路加福音", "約": "約翰福音", "徒": "使徒行傳",
  "羅": "羅馬書", "林前": "哥林多前書", "林後": "哥林多後書", "加": "加拉太書",
  "弗": "以弗所書", "腓": "腓立比書", "西": "歌羅西書",
  "帖前": "帖撒羅尼迦前書", "帖後": "帖撒羅尼迦後書",
  "提前": "提摩太前書", "提後": "提摩太後書", "多": "提多書", "門": "腓利門書",
  "來": "希伯來書", "雅": "雅各書",
  "彼前": "彼得前書", "彼後": "彼得後書",
  "約壹": "約翰一書", "約貳": "約翰二書", "約參": "約翰三書",
  "猶": "猶大書", "啟": "啟示錄",
};

function resolveBookName(name: string): string {
  if (BOOK_ABBREVIATIONS[name]) return BOOK_ABBREVIATIONS[name];
  return name;
}

type ScriptureRange = { bookName: string; chapter: number; verseStart?: number; verseEnd?: number };

function parseScriptureReference(ref: string): ScriptureRange | null {
  const trimmed = ref.trim();

  // Cross-chapter format: 書名 章:節-章:節 (e.g. 使徒行傳 13:51-14:5)
  const crossMatch = trimmed.match(/^(.+?)\s+(\d+):(\d+)\s*[-–]\s*(\d+):(\d+)$/)
    || trimmed.match(/^([^\d]+)(\d+):(\d+)\s*[-–]\s*(\d+):(\d+)$/);
  if (crossMatch) {
    const bookName = resolveBookName(crossMatch[1].trim());
    const chStart = parseInt(crossMatch[2], 10);
    const vStart = parseInt(crossMatch[3], 10);
    const chEnd = parseInt(crossMatch[4], 10);
    const vEnd = parseInt(crossMatch[5], 10);
    if (!isNaN(chStart) && !isNaN(chEnd)) {
      return { bookName, chapter: chStart, verseStart: vStart, verseEnd: vEnd, _crossChapter: { chEnd, vEnd } } as any;
    }
  }

  let match = trimmed.match(/^(.+?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?$/);
  if (!match) {
    match = trimmed.match(/^([^\d]+)(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?$/);
  }
  if (!match) return null;

  const rawBookName = match[1].trim();
  const bookName = resolveBookName(rawBookName);
  const chapter = parseInt(match[2], 10);
  const verseStart = match[3] ? parseInt(match[3], 10) : undefined;
  const verseEnd = match[4] ? parseInt(match[4], 10) : verseStart;

  if (isNaN(chapter)) return null;
  return { bookName, chapter, verseStart, verseEnd };
}

async function lookupParsedReference(parsed: ScriptureRange & { _crossChapter?: { chEnd: number; vEnd: number } }): Promise<{ number: number; text: string }[]> {
  const cross = (parsed as any)._crossChapter as { chEnd: number; vEnd: number } | undefined;
  if (cross) {
    // Cross-chapter: fetch from chStart:vStart to chEnd:vEnd
    const allVerses: { number: number; text: string }[] = [];
    for (let ch = parsed.chapter; ch <= cross.chEnd; ch++) {
      let verses;
      if (ch === parsed.chapter) {
        // First chapter: from verseStart to end of chapter
        const all = await storage.lookupBibleVerses(parsed.bookName, ch);
        verses = parsed.verseStart ? all.filter(v => v.verse >= parsed.verseStart!) : all;
      } else if (ch === cross.chEnd) {
        // Last chapter: from verse 1 to vEnd
        verses = await storage.lookupBibleVerses(parsed.bookName, ch, 1, cross.vEnd);
      } else {
        // Middle chapters: entire chapter
        verses = await storage.lookupBibleVerses(parsed.bookName, ch);
      }
      if (verses.length > 0) {
        allVerses.push({ number: 0, text: `── ${parsed.bookName} ${ch} ──` });
      }
      allVerses.push(...verses.map(v => ({ number: v.verse, text: v.text })));
    }
    return allVerses;
  }
  // Single chapter
  const verses = await storage.lookupBibleVerses(parsed.bookName, parsed.chapter, parsed.verseStart, parsed.verseEnd);
  return verses.map(v => ({ number: v.verse, text: v.text }));
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
    oauthState?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

async function extractUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const tokenData = await tokenStore.get(token);
    if (tokenData && tokenData.expiresAt > new Date()) {
      req.userId = tokenData.userId;
    }
  }

  if (!req.userId && req.session?.userId) {
    req.userId = req.session.userId;
  }

  if (req.userId) {
    try {
      const now = Date.now();
      const cached = userExistenceCache.get(req.userId);
      let userExists: boolean;

      if (cached && cached.expiresAt > now) {
        userExists = cached.exists;
      } else {
        const user = await storage.getUser(req.userId);
        userExists = !!user;
        userExistenceCache.set(req.userId, { exists: userExists, expiresAt: now + USER_CACHE_TTL });
      }

      if (!userExists) {
        console.log("[extractUser] stale userId detected:", req.userId, "- clearing auth state");
        userExistenceCache.delete(req.userId);
        req.userId = undefined;
        if (req.session?.userId) {
          req.session.userId = undefined;
          req.session.save(() => { });
        }
      }
    } catch (err) {
      console.error("[extractUser] error validating user:", err);
      req.userId = undefined;
    }
  }

  next();
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const hasAccess = await storage.hasAdminAccess(req.userId);
  if (!hasAccess) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

async function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const isSA = await storage.isSuperAdmin(req.userId);
  if (!isSA) {
    return res.status(403).json({ error: "Forbidden: Super Admin only" });
  }
  next();
}

async function getCachedUserRole(userId: string) {
  const now = Date.now();
  const cached = userRoleCache.get(userId);
  if (cached && cached.expiresAt > now) return cached.role;
  const role = await storage.getUserRole(userId);
  userRoleCache.set(userId, { role, expiresAt: now + USER_ROLE_CACHE_TTL });
  return role;
}

export function registerRoutes(app: Express) {
  // Apply extractUser middleware to all API routes
  app.use("/api", extractUser);

  // Google OAuth: initiate login
  // Use HMAC-signed state token instead of session to avoid mobile cookie issues
  const OAUTH_STATE_SECRET = process.env.SESSION_SECRET || "oauth-state-fallback";
  function signOAuthState(nonce: string): string {
    return crypto.createHmac("sha256", OAUTH_STATE_SECRET).update(nonce).digest("hex");
  }

  app.get("/api/login", (req, res) => {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: "Google OAuth not configured" });
    }

    const nonce = crypto.randomBytes(16).toString("hex");
    const sig = signOAuthState(nonce);
    const state = `${nonce}.${sig}`;

    const APP_URL = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${APP_URL}/api/auth/google/callback`;

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "online",
      prompt: "select_account",
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  // Google OAuth: callback
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code, state, error: oauthError } = req.query as Record<string, string>;
      const APP_URL = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;

      if (oauthError) {
        console.error("[google-oauth] error from Google:", oauthError);
        return res.redirect("/?error=oauth_denied");
      }

      // Verify HMAC-signed state (no session dependency)
      if (!state || !state.includes(".")) {
        console.error("[google-oauth] state mismatch - invalid format");
        return res.redirect("/?error=oauth_state_mismatch");
      }
      const [nonce, sig] = state.split(".");
      if (sig !== signOAuthState(nonce)) {
        console.error("[google-oauth] state mismatch - invalid signature");
        return res.redirect("/?error=oauth_state_mismatch");
      }

      const redirectUri = `${APP_URL}/api/auth/google/callback`;
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errBody = await tokenResponse.text();
        console.error("[google-oauth] token exchange failed:", errBody);
        return res.redirect("/?error=oauth_token_failed");
      }

      const tokenData = await tokenResponse.json() as { access_token: string };

      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userInfoResponse.ok) {
        console.error("[google-oauth] userinfo fetch failed");
        return res.redirect("/?error=oauth_userinfo_failed");
      }

      const googleUser = await userInfoResponse.json() as {
        id: string; email: string; name: string;
        given_name?: string; family_name?: string; picture?: string;
      };

      // Find or create user
      let user = await storage.getUserByGoogleId(googleUser.id);

      if (!user) {
        user = await storage.getUserByEmail(googleUser.email);

        if (user) {
          // Link Google account to existing user (single update)
          const linkData: Record<string, string> = { googleId: googleUser.id };
          if (!user.profileImageUrl && googleUser.picture) linkData.profileImageUrl = googleUser.picture;
          await storage.updateUser(user.id, linkData as any);
        } else {
          // Create new user
          user = await storage.createUser({
            email: googleUser.email,
            password: null,
            googleId: googleUser.id,
            firstName: googleUser.given_name || null,
            lastName: googleUser.family_name || null,
            profileImageUrl: googleUser.picture || null,
          } as any);

          await storage.createProfile({
            userId: user.id,
            name: googleUser.name || googleUser.email,
            email: googleUser.email,
            avatarUrl: googleUser.picture || null,
          });

          await storage.createUserRole({
            userId: user.id,
            tripId: null,
            role: "member",
          });
        }
      }

      // Set session and generate token
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await tokenStore.set(token, { userId: user.id, expiresAt });

      req.session.userId = user.id;
      req.session.save(() => {
        // Use hash fragment so the token is never sent to the server in logs
        res.redirect(`/#authToken=${token}`);
      });
    } catch (error) {
      console.error("[google-oauth] callback error:", error);
      res.redirect("/?error=oauth_failed");
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      const { email, password, name } = parsed.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ email, password: hashedPassword });

      await storage.createProfile({ userId: user.id, name, email });

      // Create user role without trip assignment - user must use invitation code to join a trip
      await storage.createUserRole({
        userId: user.id,
        tripId: null,
        role: "member",
      });

      // Generate auth token
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await tokenStore.set(token, { userId: user.id, expiresAt });

      // Regenerate session to prevent session fixation
      req.session.regenerate((err) => {
        if (err) console.error("Session regenerate error:", err);
        req.session.userId = user.id;
        req.session.save((err) => {
          if (err) console.error("Session save error:", err);
          res.json({ user: { id: user.id, email: user.email }, token });
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      const { email, password } = parsed.data;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.password) {
        return res.status(401).json({ error: "此帳號尚未設定密碼，請使用 Google 登入或重設密碼" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "帳號或密碼錯誤" });
      }

      // User must use invitation code to join a trip - no auto-assignment
      const userRole = await storage.getUserRole(user.id);
      if (!userRole) {
        // Create role without trip for legacy users who don't have a role yet
        await storage.createUserRole({
          userId: user.id,
          tripId: null,
          role: "member",
        });
      }

      // Generate auth token
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await tokenStore.set(token, { userId: user.id, expiresAt });

      // Regenerate session to prevent session fixation
      req.session.regenerate((err) => {
        if (err) console.error("Session regenerate error:", err);
        req.session.userId = user.id;
        req.session.save((err) => {
          if (err) console.error("Session save error:", err);
          res.json({ user: { id: user.id, email: user.email }, token });
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.patch("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      const { newPassword } = parsed.data;
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(req.userId!, { password: hashedPassword, tempPassword: null });
      res.json({ success: true });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "密碼修改失敗" });
    }
  });

  // Forgot password — send reset email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body as { email: string };
      if (!email) {
        return res.status(400).json({ error: "請輸入電子郵件" });
      }

      // Always return success to prevent email enumeration
      const user = await storage.getUserByEmail(email.trim().toLowerCase());
      if (!user) {
        return res.json({ success: true });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.updateUser(user.id, { resetToken, resetTokenExpiry } as any);

      const appUrl = process.env.APP_URL
        || (process.env.REPLIT_DOMAINS
          ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
          : `${req.protocol}://${req.get("host")}`);
      const resetUrl = `${appUrl}/auth/reset-password?token=${resetToken}`;

      const { getResendClient } = await import("./resend");
      const { client: resend, fromEmail } = await getResendClient();

      const profile = await storage.getProfile(user.id);
      const memberName = profile?.name || user.firstName || user.email;

      const { data: emailData, error: sendError } = await resend.emails.send({
        from: fromEmail || "Trip Companion <onboarding@resend.dev>",
        to: user.email,
        subject: "重設密碼 - 與神同行",
        html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fef7ed; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px; }
    .header { text-align: center; padding: 30px 0; }
    .logo { width: 80px; height: 80px; border-radius: 50%; background: #d97706; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold; }
    .title { font-size: 24px; color: #92400e; margin: 15px 0 5px; }
    .subtitle { color: #b45309; font-size: 14px; }
    .card { background: white; border-radius: 12px; padding: 30px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 15px; }
    .btn { display: inline-block; background: #d97706; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; font-size: 16px; }
    .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">T</div>
      <div class="title">與神同行</div>
      <div class="subtitle">Walking in His Love</div>
    </div>
    <div class="card">
      <div class="greeting">親愛的 ${memberName}，您好！</div>
      <p style="color: #4b5563; line-height: 1.6;">
        我們收到了您的密碼重設請求。請點擊下方按鈕來設定新密碼：
      </p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn" style="color: white;">重設密碼</a>
      </div>
      <p style="color: #9ca3af; font-size: 13px; margin-top: 20px; line-height: 1.5;">
        此連結將在 1 小時後失效。<br>
        如果您沒有要求重設密碼，請忽略這封郵件。
      </p>
    </div>
    <div class="footer">
      <p>享受一段與神同行的旅程！</p>
    </div>
  </div>
</body>
</html>`,
      });

      if (sendError) {
        console.error(`[forgot-password] send error for ${user.email}:`, sendError);
      } else {
        console.log(`[forgot-password] reset email sent to ${user.email}, id: ${emailData?.id}`);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("[forgot-password] error:", error);
      res.status(500).json({ error: "發送重設郵件失敗，請稍後再試" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body as { token: string; password: string };
      if (!token || !password) {
        return res.status(400).json({ error: "缺少必要參數" });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: "密碼至少需要 8 個字元" });
      }

      const user = await storage.getUserByResetToken(token);
      if (!user || !user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
        return res.status(400).json({ error: "重設連結已失效或無效，請重新申請" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateUser(user.id, {
        password: hashedPassword,
        tempPassword: null,
        resetToken: null,
        resetTokenExpiry: null,
      } as any);

      console.log(`[reset-password] password reset for ${user.email}`);
      res.json({ success: true });
    } catch (error) {
      console.error("[reset-password] error:", error);
      res.status(500).json({ error: "密碼重設失敗，請稍後再試" });
    }
  });

  app.get("/api/auth/needs-profile-setup", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ needsSetup: !!user.tempPassword });
    } catch (error) {
      console.error("Needs profile setup error:", error);
      res.status(500).json({ error: "Failed to check profile setup status" });
    }
  });

  app.get("/api/auth/session", async (req, res) => {
    if (!req.userId) {
      return res.json({ user: null });
    }
    const user = await storage.getUser(req.userId);
    if (!user) {
      if (req.session) {
        req.session.userId = undefined;
        req.session.save(() => { });
      }
      return res.json({ user: null });
    }
    res.json({ user: { id: user.id, email: user.email } });
  });

  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.getProfile(req.userId!);
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      const existing = await storage.getProfile(req.userId!);
      let result;
      if (existing) {
        result = await storage.updateProfile(req.userId!, parsed.data as any);
      } else {
        result = await storage.createProfile({ ...parsed.data, userId: req.userId! } as any);
      }
      res.json(result);
    } catch (error) {
      console.error("Failed to update profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  async function getCurrentTripForUser(userId: string) {
    const userRole = await storage.getUserRole(userId);
    if (!userRole || !userRole.tripId) return null;
    const trip = await storage.getTrip(userRole.tripId);
    if (!trip) return null;
    return { ...trip, userRole: userRole.role };
  }

  app.get("/api/trip", requireAuth, async (req, res) => {
    try {
      res.json(await getCurrentTripForUser(req.userId!));
    } catch (error) {
      console.error("Failed to get trip:", error);
      res.status(500).json({ error: "Failed to get trip" });
    }
  });

  app.get("/api/trips/current", requireAuth, async (req, res) => {
    try {
      const result = await getCurrentTripForUser(req.userId!);
      if (!result) return res.status(404).json({ error: "No active trip found" });
      res.json(result);
    } catch (error) {
      console.error("Failed to get current trip:", error);
      res.status(500).json({ error: "Failed to get current trip" });
    }
  });

  app.patch("/api/trips/:tripId/cover-image", requireAuth, async (req, res) => {
    try {
      const { tripId } = req.params;
      const { coverImageUrl } = req.body;
      if (!coverImageUrl || typeof coverImageUrl !== "string") {
        return res.status(400).json({ error: "coverImageUrl is required" });
      }
      const updated = await storage.updateTrip(tripId, { coverImageUrl } as any);
      if (!updated) {
        return res.status(404).json({ error: "Trip not found" });
      }
      res.json({ success: true, coverImageUrl: updated.coverImageUrl });
    } catch (error) {
      console.error("Failed to update cover image:", error);
      res.status(500).json({ error: "Failed to update cover image" });
    }
  });

  // Per-user summary cover image
  app.get("/api/my-summary-cover", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole) {
        return res.json({ summaryCoverUrl: null });
      }
      res.json({ summaryCoverUrl: userRole.summaryCoverUrl || null });
    } catch (error) {
      console.error("Failed to get summary cover:", error);
      res.status(500).json({ error: "Failed to get summary cover" });
    }
  });

  app.patch("/api/my-summary-cover", requireAuth, async (req, res) => {
    try {
      const { summaryCoverUrl } = req.body;
      if (!summaryCoverUrl || typeof summaryCoverUrl !== "string") {
        return res.status(400).json({ error: "summaryCoverUrl is required" });
      }
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole) {
        return res.status(404).json({ error: "User role not found" });
      }
      const updated = await storage.updateUserRoleSummaryCover(userRole.id, summaryCoverUrl);
      // Invalidate cache
      userRoleCache.delete(req.userId!);
      res.json({ success: true, summaryCoverUrl: updated?.summaryCoverUrl || null });
    } catch (error) {
      console.error("Failed to update summary cover:", error);
      res.status(500).json({ error: "Failed to update summary cover" });
    }
  });

  app.get("/api/weather", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole || !userRole.tripId) {
        return res.status(404).json({ error: "No active trip" });
      }
      const trip = await storage.getTrip(userRole.tripId);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const { lat, lon } = resolveDestinationCoords(trip.destination || "");
      const cacheKey = `${lat}_${lon}`;
      const now = Date.now();
      const cached = weatherCache.get(cacheKey);
      if (cached && now - cached.ts < WEATHER_CACHE_TTL) {
        return res.json(cached.data);
      }

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,uv_index&timezone=auto`;
      const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;

      const [weatherRes, aqRes] = await Promise.all([
        fetch(weatherUrl).then((r) => r.json()),
        fetch(aqUrl).then((r) => r.json()),
      ]);

      const temperature = (weatherRes as any)?.current?.temperature_2m ?? null;
      const humidity = (weatherRes as any)?.current?.relative_humidity_2m ?? null;
      const uvIndex = (weatherRes as any)?.current?.uv_index ?? null;
      const aqi = (aqRes as any)?.current?.us_aqi ?? null;

      const data = { temperature, humidity, uvIndex, aqi, destination: trip.destination, updatedAt: new Date().toISOString() };
      weatherCache.set(cacheKey, { data, ts: now });

      res.json(data);
    } catch (error) {
      console.error("Failed to fetch weather:", error);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  app.get("/api/members", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole) {
        return res.json([]);
      }
      const members = await storage.getMembers(userRole.tripId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to get members" });
    }
  });

  app.get("/api/groups", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole) {
        return res.json([]);
      }
      const groupList = await storage.getGroups(userRole.tripId);
      res.json(groupList);
    } catch (error) {
      res.status(500).json({ error: "Failed to get groups" });
    }
  });

  app.get("/api/journal-entries", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole) {
        return res.json([]);
      }
      const date = req.query.date as string | undefined;
      // Security: Only return user's own journal entries
      const entries = await storage.getJournalEntriesByUser(req.userId!, userRole.tripId, date);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to get journal entries" });
    }
  });

  app.post("/api/journal-entries", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole || !userRole.tripId) {
        return res.status(400).json({ error: "User not in a trip" });
      }

      const { title, content, location, photos, entryDate } = req.body;
      // Allow past dates; default to today if not provided
      const dateToUse = entryDate && /^\d{4}-\d{2}-\d{2}$/.test(entryDate)
        ? entryDate
        : new Date().toISOString().split("T")[0];
      const entry = await storage.createJournalEntry({
        userId: req.userId!,
        tripId: userRole.tripId,
        title: title || location || "無標題",
        content: content || "",
        location: location || "",
        entryDate: dateToUse,
      });

      if (photos && Array.isArray(photos) && photos.length > 0) {
        await storage.createJournalPhotos(
          photos.map((photo: string | { photoUrl: string; latitude?: number; longitude?: number }) => {
            const isObj = typeof photo === "object";
            return {
              journalEntryId: entry.id,
              photoUrl: isObj ? photo.photoUrl : photo,
              caption: null,
              latitude: isObj ? (photo.latitude ?? null) : null,
              longitude: isObj ? (photo.longitude ?? null) : null,
            };
          })
        );
      }

      res.json(entry);
    } catch (error) {
      console.error("Failed to create journal entry:", error);
      res.status(500).json({ error: "Failed to create journal entry" });
    }
  });

  app.patch("/api/journal-entries/:id", requireAuth, async (req, res) => {
      // S1: Verify ownership before update
      const existing = await storage.getJournalEntry(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Journal entry not found" });
      }
      if (existing.userId !== req.userId) {
        const isAdmin = await storage.hasAdminAccess(req.userId!);
        if (!isAdmin) {
          return res.status(403).json({ error: "You can only edit your own entries" });
        }
      }

    try {
      const { title, content, location, photos } = req.body;
      const entry = await storage.updateJournalEntry(req.params.id, {
        title,
        content,
        location,
      });

      if (photos && Array.isArray(photos)) {
        const existingPhotos = await storage.getJournalPhotos(req.params.id);
        const existingPaths = existingPhotos.map(p => p.photoUrl);
        const newPhotos = photos.map((p: string | { photoUrl: string; latitude?: number; longitude?: number }) =>
          typeof p === "object" ? p : { photoUrl: p, latitude: null, longitude: null }
        );
        const newPaths = newPhotos.map(p => p.photoUrl);

        const toDelete = existingPhotos.filter(p => !newPaths.includes(p.photoUrl));
        const toAdd = newPhotos.filter(p => !existingPaths.includes(p.photoUrl));

        await Promise.all([
          storage.deleteJournalPhotosByIds(toDelete.map(p => p.id)),
          storage.createJournalPhotos(toAdd.map(photo => ({
            journalEntryId: req.params.id,
            photoUrl: photo.photoUrl,
            caption: null,
            latitude: photo.latitude ?? null,
            longitude: photo.longitude ?? null,
          }))),
        ]);
      }

      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to update journal entry" });
    }
  });

  app.delete("/api/journal-entries/:id", requireAuth, async (req, res) => {
    try {
      // S1: Verify ownership before delete
      const existing = await storage.getJournalEntry(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Journal entry not found" });
      }
      if (existing.userId !== req.userId) {
        const isAdmin = await storage.hasAdminAccess(req.userId!);
        if (!isAdmin) {
          return res.status(403).json({ error: "You can only delete your own entries" });
        }
      }

      await storage.deleteJournalEntry(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete journal entry" });
    }
  });

  app.get("/api/devotional-entries", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole || !userRole.tripId) {
        return res.json([]);
      }
      const date = req.query.date as string | undefined;
      const entries = await storage.getDevotionalEntries(userRole.tripId, req.userId!, date);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to get devotional entries" });
    }
  });

  app.post("/api/devotional-entries", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole || !userRole.tripId) {
        return res.status(400).json({ error: "User not in a trip" });
      }

      const entryDate = req.body.entryDate || new Date().toISOString().split("T")[0];

      const entry = await storage.createDevotionalEntry({
        userId: req.userId!,
        tripId: userRole.tripId,
        scriptureReference: req.body.scriptureReference || "",
        reflection: req.body.reflection || "",
        prayer: req.body.prayer || "",
        entryDate,
      });
      res.json(entry);
    } catch (error) {
      console.error("Failed to create devotional entry:", error);
      res.status(500).json({ error: "Failed to create devotional entry" });
    }
  });

  app.patch("/api/devotional-entries/:id", requireAuth, async (req, res) => {
    try {
      // S1: Verify ownership before update
      const existing = await storage.getDevotionalEntry(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Devotional entry not found" });
      }
      if (existing.userId !== req.userId) {
        const isAdmin = await storage.hasAdminAccess(req.userId!);
        if (!isAdmin) {
          return res.status(403).json({ error: "You can only edit your own entries" });
        }
      }

      const { scriptureReference, reflection, prayer } = req.body;
      const updated = await storage.updateDevotionalEntry(req.params.id, {
        scriptureReference: scriptureReference || "",
        reflection: reflection || "",
        prayer: prayer || "",
        updatedAt: new Date()
      });
      res.json(updated);
    } catch (error) {
      console.error("Failed to update devotional entry:", error);
      res.status(500).json({ error: "Failed to update devotional entry" });
    }
  });

  app.delete("/api/devotional-entries/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getDevotionalEntry(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Devotional entry not found" });
      }
      if (existing.userId !== req.userId) {
        const isAdmin = await storage.hasAdminAccess(req.userId!);
        if (!isAdmin) {
          return res.status(403).json({ error: "You can only delete your own entries" });
        }
      }
      await storage.deleteDevotionalEntry(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete devotional entry:", error);
      res.status(500).json({ error: "Failed to delete devotional entry" });
    }
  });

  app.get("/api/evening-reflections", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole || !userRole.tripId) {
        return res.json(null);
      }
      const date = (req.query.date as string) || new Date().toISOString().split("T")[0];
      const reflection = await storage.getEveningReflection(req.userId!, userRole.tripId, date);
      res.json(reflection || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to get evening reflection" });
    }
  });

  app.get("/api/evening-reflections/all", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole || !userRole.tripId) {
        return res.json([]);
      }
      const reflections = await storage.getAllEveningReflections(req.userId!, userRole.tripId);
      res.json(reflections);
    } catch (error) {
      console.error("Failed to get all evening reflections:", error);
      res.status(500).json({ error: "Failed to get evening reflections" });
    }
  });

  app.post("/api/evening-reflections", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole || !userRole.tripId) {
        return res.status(400).json({ error: "User not in a trip" });
      }
      const entryDate = req.body.entryDate || new Date().toISOString().split("T")[0];
      const reflection = await storage.saveEveningReflection({
        userId: req.userId!,
        tripId: userRole.tripId,
        gratitude: req.body.gratitude || "",
        highlight: req.body.highlight || "",
        prayerForTomorrow: req.body.prayerForTomorrow || "",
        entryDate,
      });
      res.json(reflection);
    } catch (error) {
      console.error("Failed to save evening reflection:", error);
      res.status(500).json({ error: "Failed to save evening reflection" });
    }
  });

  app.delete("/api/evening-reflections/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteEveningReflection(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete evening reflection:", error);
      res.status(500).json({ error: "Failed to delete evening reflection" });
    }
  });

  app.get("/api/is-admin", requireAuth, async (req, res) => {
    try {
      const hasAccess = await storage.hasAdminAccess(req.userId!);
      const isSuperAdmin = await storage.isSuperAdmin(req.userId!);
      const platformRole = await storage.getPlatformRole(req.userId!);
      res.json({
        isAdmin: hasAccess,
        isSuperAdmin,
        platformRole: platformRole?.role || "member",
        permissions: platformRole?.permissions || null,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check admin status" });
    }
  });

  app.get("/api/admin/trips", requireAdmin, async (req, res) => {
    try {
      const tripList = await storage.getTrips();
      res.json(tripList);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trips" });
    }
  });

  app.get("/api/admin/trips/:id", requireAdmin, async (req, res) => {
    try {
      const trip = await storage.getTrip(req.params.id);
      if (!trip) return res.status(404).json({ error: "Trip not found" });
      res.json(trip);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trip" });
    }
  });

  app.post("/api/admin/trips", requireAdmin, async (req, res) => {
    try {
      const parsed = insertTripSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const trip = await storage.createTrip(parsed.data as any);
      res.json(trip);
    } catch (error) {
      res.status(500).json({ error: "Failed to create trip" });
    }
  });

  app.patch("/api/admin/trips/:id", requireAdmin, async (req, res) => {
    try {
      const parsed = updateTripSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      const updated = await storage.updateTrip(req.params.id, parsed.data as any);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update trip" });
    }
  });

  app.delete("/api/admin/trips/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTrip(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete trip" });
    }
  });

  // Trip Days (每日行程) routes
  app.get("/api/admin/trips/:tripId/days", requireAdmin, async (req, res) => {
    try {
      const days = await storage.getTripDays(req.params.tripId);
      res.json(days);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trip days" });
    }
  });

  app.post("/api/admin/trips/:tripId/days", requireAdmin, async (req, res) => {
    try {
      const tripDay = await storage.createTripDay({
        ...req.body,
        tripId: req.params.tripId,
      });
      res.json(tripDay);
    } catch (error) {
      res.status(500).json({ error: "Failed to create trip day" });
    }
  });

  app.patch("/api/admin/trip-days/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateTripDay(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update trip day" });
    }
  });

  app.delete("/api/admin/trip-days/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTripDay(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete trip day" });
    }
  });

  // Public trip days endpoint for members
  app.get("/api/trip-days", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole?.tripId) {
        return res.json([]);
      }
      const days = await storage.getTripDays(userRole.tripId);
      res.json(days);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trip days" });
    }
  });

  // Get today's trip day based on current date
  app.get("/api/trip-days/today", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole?.tripId) {
        return res.json(null);
      }
      const days = await storage.getTripDays(userRole.tripId);

      // Guard against empty days array
      if (!days || days.length === 0) {
        return res.json(null);
      }

      // Use local date (YYYY-MM-DD format) for comparison
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Find today's schedule
      const todaySchedule = days.find(d => d.date === today);
      if (todaySchedule) {
        return res.json({ ...todaySchedule, dayNumber: todaySchedule.dayNo });
      }

      // If trip hasn't started yet, return first day
      const trip = await storage.getTrip(userRole.tripId);
      if (trip && trip.startDate && today < trip.startDate) {
        const firstDay = days.find(d => d.dayNo === 1);
        return res.json(firstDay ? { ...firstDay, dayNumber: 1, isPreTrip: true } : null);
      }

      // If trip has ended, return last day
      if (trip && trip.endDate && today > trip.endDate) {
        const lastDay = days.reduce((max, d) => d.dayNo > max.dayNo ? d : max, days[0]);
        return res.json(lastDay ? { ...lastDay, dayNumber: lastDay.dayNo, isPostTrip: true } : null);
      }

      // Return first day as fallback
      const firstDay = days.find(d => d.dayNo === 1);
      res.json(firstDay ? { ...firstDay, dayNumber: 1 } : null);
    } catch (error) {
      res.status(500).json({ error: "Failed to get today's schedule" });
    }
  });

  // Get today's attractions for journal location selection
  app.get("/api/trip-days/today/attractions", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole?.tripId) {
        return res.json([]);
      }
      const days = await storage.getTripDays(userRole.tripId);

      if (!days || days.length === 0) {
        return res.json([]);
      }

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Find today's schedule
      let todaySchedule = days.find(d => d.date === today);

      // If trip hasn't started, use first day
      if (!todaySchedule) {
        const trip = await storage.getTrip(userRole.tripId);
        if (trip && trip.startDate && today < trip.startDate) {
          todaySchedule = days.find(d => d.dayNo === 1);
        }
      }

      // If trip has ended, use last day
      if (!todaySchedule) {
        const trip = await storage.getTrip(userRole.tripId);
        if (trip && trip.endDate && today > trip.endDate) {
          todaySchedule = days.reduce((max, d) => d.dayNo > max.dayNo ? d : max, days[0]);
        }
      }

      // Fallback to first day
      if (!todaySchedule) {
        todaySchedule = days.find(d => d.dayNo === 1);
      }

      if (!todaySchedule) {
        return res.json([]);
      }

      // Parse attractions from the attractions field or highlights as fallback
      const attractionsStr = todaySchedule.attractions || todaySchedule.highlights || "";
      const attractions = attractionsStr.split("/").map((a: string) => a.trim()).filter(Boolean);

      // Add "其他景點" as fallback option
      if (!attractions.includes("其他景點")) {
        attractions.push("其他景點");
      }

      res.json(attractions);
    } catch (error) {
      console.error("Error getting today's attractions:", error);
      res.status(500).json({ error: "Failed to get attractions" });
    }
  });

  app.get("/api/trip-days/attractions", requireAuth, async (req, res) => {
    try {
      const dateParam = req.query.date as string | undefined;
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole?.tripId) {
        return res.json([]);
      }
      const days = await storage.getTripDays(userRole.tripId);
      if (!days || days.length === 0) {
        return res.json([]);
      }

      let targetDay = dateParam ? days.find(d => d.date === dateParam) : null;

      if (!targetDay) {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        targetDay = days.find(d => d.date === today);
        if (!targetDay) {
          targetDay = days.find(d => d.dayNo === 1);
        }
      }

      if (!targetDay) {
        return res.json(["其他景點"]);
      }

      const attractionsStr = targetDay.attractions || targetDay.highlights || "";
      const attractions = attractionsStr.split("/").map((a: string) => a.trim()).filter(Boolean);
      if (!attractions.includes("其他景點")) {
        attractions.push("其他景點");
      }
      res.json(attractions);
    } catch (error) {
      console.error("Error getting attractions by date:", error);
      res.status(500).json({ error: "Failed to get attractions" });
    }
  });

  // ===== Attractions (景點詳情) routes =====

  // Admin: get all attractions for a trip
  app.get("/api/admin/trips/:tripId/attractions", requireAdmin, async (req, res) => {
    try {
      const rows = await storage.getAttractionsByTrip(req.params.tripId);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to get attractions" });
    }
  });

  // Admin: bulk import attractions (JSON array)
  app.post("/api/admin/trips/:tripId/attractions/import", requireAdmin, async (req, res) => {
    try {
      const tripId = req.params.tripId;
      const items: any[] = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Body must be a non-empty array" });
      }
      // Delete existing attractions for this trip first
      await storage.deleteAttractionsByTrip(tripId);
      const data = items.map((item) => ({
        tripId,
        dayNo: item.dayNo ?? item.day_no ?? 0,
        seq: item.seq ?? 0,
        nameZh: item.nameZh ?? item.name_zh ?? "",
        nameEn: item.nameEn ?? item.name_en ?? null,
        nameAlt: item.nameAlt ?? item.name_alt ?? null,
        country: item.country ?? null,
        date: item.date ?? null,
        modernLocation: item.modernLocation ?? item.modern_location ?? null,
        ancientToponym: item.ancientToponym ?? item.ancient_toponym ?? null,
        gps: item.gps ?? null,
        openingHours: item.openingHours ?? item.opening_hours ?? null,
        admission: item.admission ?? null,
        duration: item.duration ?? null,
        scriptureRefs: item.scriptureRefs ?? item.scripture_refs ?? null,
        bibleBooks: item.bibleBooks ?? item.bible_books ?? null,
        storySummary: item.storySummary ?? item.story_summary ?? null,
        keyFigures: item.keyFigures ?? item.key_figures ?? null,
        historicalEra: item.historicalEra ?? item.historical_era ?? null,
        theologicalSignificance: item.theologicalSignificance ?? item.theological_significance ?? null,
        lifeApplication: item.lifeApplication ?? item.life_application ?? null,
        discussionQuestions: item.discussionQuestions ?? item.discussion_questions ?? null,
        archaeologicalFindings: item.archaeologicalFindings ?? item.archaeological_findings ?? null,
        historicalStrata: item.historicalStrata ?? item.historical_strata ?? null,
        accuracyRating: item.accuracyRating ?? item.accuracy_rating ?? null,
        keyArtifacts: item.keyArtifacts ?? item.key_artifacts ?? null,
        tourRoutePosition: item.tourRoutePosition ?? item.tour_route_position ?? null,
        bestTime: item.bestTime ?? item.best_time ?? null,
        dressCode: item.dressCode ?? item.dress_code ?? null,
        photoRestrictions: item.photoRestrictions ?? item.photo_restrictions ?? null,
        crowdLevels: item.crowdLevels ?? item.crowd_levels ?? null,
        safetyNotes: item.safetyNotes ?? item.safety_notes ?? null,
        accessibility: item.accessibility ?? null,
        nearbyDining: item.nearbyDining ?? item.nearby_dining ?? null,
        accommodation: item.accommodation ?? null,
        nearbyBiblicalSites: item.nearbyBiblicalSites ?? item.nearby_biblical_sites ?? null,
        localProducts: item.localProducts ?? item.local_products ?? null,
        recommendationScore: item.recommendationScore ?? item.recommendation_score ?? null,
        physicalComment: item.physicalComment ?? item.physical_comment ?? null,
      }));
      const created = await storage.bulkCreateAttractions(data);
      res.json({ success: true, count: created.length });
    } catch (error) {
      console.error("Error importing attractions:", error);
      res.status(500).json({ error: "Failed to import attractions" });
    }
  });

  // Admin: update single attraction
  app.patch("/api/admin/attractions/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateAttraction(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update attraction" });
    }
  });

  // Admin: delete single attraction
  app.delete("/api/admin/attractions/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteAttraction(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete attraction" });
    }
  });

  // Member: get all attractions for current trip
  app.get("/api/attractions", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole?.tripId) return res.json([]);
      const rows = await storage.getAttractionsByTrip(userRole.tripId);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to get attractions" });
    }
  });

  // Member: get single attraction detail
  app.get("/api/attractions/:id", requireAuth, async (req, res) => {
    try {
      const row = await storage.getAttraction(req.params.id);
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    } catch (error) {
      res.status(500).json({ error: "Failed to get attraction" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 200, 500);
      const offset = parseInt(req.query.offset as string) || 0;
      const allUsers = await storage.getAllUsers({ limit, offset });
      const allProfiles = await storage.getAllProfiles();
      const allRoles = await storage.getAllUserRoles();
      const allPlatformRoles = await storage.getAllPlatformRoles();
      const allTrips = await storage.getTrips();

      const profileMap = new Map(allProfiles.map(p => [p.userId, p]));
      const platformRoleMap = new Map(allPlatformRoles.map(r => [r.userId, r]));
      const tripMap = new Map(allTrips.map(t => [t.id, t]));

      const userTripsMap = new Map<string, Array<{ tripId: string; title: string; role: string; roleId: string }>>();
      for (const r of allRoles) {
        if (r.tripId) {
          const trip = tripMap.get(r.tripId);
          if (!userTripsMap.has(r.userId)) userTripsMap.set(r.userId, []);
          userTripsMap.get(r.userId)!.push({
            tripId: r.tripId,
            title: trip?.title || "未知行程",
            role: r.role,
            roleId: r.id,
          });
        }
      }

      const result = allUsers.map(u => {
        const profile = profileMap.get(u.id);
        const pRole = platformRoleMap.get(u.id);
        return {
          id: u.id,
          email: u.email,
          name: profile?.name || u.firstName || "",
          phone: profile?.phone || "",
          tripCount: userTripsMap.get(u.id)?.length || 0,
          trips: userTripsMap.get(u.id) || [],
          hasOwnPassword: !u.tempPassword,
          createdAt: u.createdAt,
          platformRole: pRole?.role || "member",
          platformPermissions: pRole?.permissions || null,
        };
      });

      res.json(result);
    } catch (error) {
      console.error("[get-all-users] error:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  app.patch("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const parsed = adminUpdateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      const { name, phone, email } = parsed.data;

      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ error: "Email already in use" });
        }
        await storage.updateUser(userId, { email });
      }

      const profile = await storage.getProfile(userId);
      if (profile) {
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        await storage.updateProfile(userId, updateData);
      } else {
        await storage.createProfile({ userId, name: name || "", email: email || "", phone });
      }

      if (name) {
        await storage.updateUser(userId, { firstName: name });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[update-user] error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.deleteUser(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("[delete-user] error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.patch("/api/admin/users/:userId/platform-role", requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { role, permissions } = req.body;
      const validRoles = ["super_admin", "management", "guide", "vip", "member"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      if (role === "member") {
        await storage.deletePlatformRole(userId);
      } else {
        await storage.setPlatformRole(userId, role, permissions || null, req.userId!);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[set-platform-role] error:", error);
      res.status(500).json({ error: "Failed to set platform role" });
    }
  });

  app.post("/api/admin/users/:userId/trips", requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { tripId, role } = req.body;
      if (!tripId) return res.status(400).json({ error: "tripId is required" });

      const existingRoles = await storage.getAllUserRolesForUser(userId);
      const alreadyInTrip = existingRoles.find(r => r.tripId === tripId);
      if (alreadyInTrip) {
        return res.status(400).json({ error: "User already in this trip" });
      }

      await storage.createUserRole({ userId, tripId, role: role || "member" });
      res.json({ success: true });
    } catch (error) {
      console.error("[assign-trip] error:", error);
      res.status(500).json({ error: "Failed to assign trip" });
    }
  });

  app.delete("/api/admin/users/:userId/trips/:tripId", requireSuperAdmin, async (req, res) => {
    try {
      const { userId, tripId } = req.params;
      await storage.deleteUserRole(userId, tripId);
      res.json({ success: true });
    } catch (error) {
      console.error("[remove-from-trip] error:", error);
      res.status(500).json({ error: "Failed to remove from trip" });
    }
  });

  app.get("/api/admin/profiles", requireAdmin, async (req, res) => {
    try {
      const profileList = await storage.getAllProfiles();
      const allGroups = await storage.getAllGroups();
      const groupMap = new Map(allGroups.map((g) => [g.id, g]));

      const profilesWithGroups = profileList.map((p) => ({
        ...p,
        group: p.groupId ? groupMap.get(p.groupId) : null,
      }));
      res.json(profilesWithGroups);
    } catch (error) {
      res.status(500).json({ error: "Failed to get profiles" });
    }
  });

  app.get("/api/admin/user-roles", requireAdmin, async (req, res) => {
    try {
      const roles = await storage.getAllUserRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user roles" });
    }
  });

  app.post("/api/admin/user-roles", requireAdmin, async (req, res) => {
    try {
      const role = await storage.createUserRole(req.body);
      res.json(role);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user role" });
    }
  });

  app.delete("/api/admin/user-roles", requireAdmin, async (req, res) => {
    try {
      const { user_id, trip_id } = req.body;
      if (!user_id || !trip_id) {
        return res.status(400).json({ error: "userId and tripId are required" });
      }
      await storage.deleteUserRole(user_id, trip_id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user role" });
    }
  });

  app.get("/api/admin/groups", requireAdmin, async (req, res) => {
    try {
      const groupList = await storage.getAllGroups();
      const tripList = await storage.getTrips();
      const tripMap = new Map(tripList.map((t) => [t.id, t]));

      const groupsWithTrips = groupList.map((g) => ({
        ...g,
        trip: tripMap.get(g.tripId),
      }));
      res.json(groupsWithTrips);
    } catch (error) {
      res.status(500).json({ error: "Failed to get groups" });
    }
  });

  app.post("/api/admin/groups", requireAdmin, async (req, res) => {
    try {
      const group = await storage.createGroup(req.body);
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  app.patch("/api/admin/groups/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateGroup(req.params.id, req.body.name);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update group" });
    }
  });

  app.delete("/api/admin/groups/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteGroup(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete group" });
    }
  });

  app.patch("/api/admin/profiles/:id", requireAdmin, async (req, res) => {
    try {
      const profile = await storage.getAllProfiles();
      const target = profile.find((p) => p.id === req.params.id);
      if (!target) {
        return res.status(404).json({ error: "Profile not found" });
      }
      const updated = await storage.updateProfile(target.userId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/attraction-favorites", requireAuth, async (req, res) => {
    try {
      const favorites = await storage.getAttractionFavorites(req.userId!);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ error: "Failed to get favorites" });
    }
  });

  app.post("/api/attraction-favorites", requireAuth, async (req, res) => {
    try {
      const fav = await storage.addAttractionFavorite({
        userId: req.userId!,
        attractionId: req.body.attractionId,
      });
      res.json(fav);
    } catch (error) {
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/attraction-favorites/:attractionId", requireAuth, async (req, res) => {
    try {
      await storage.removeAttractionFavorite(req.userId!, req.params.attractionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  // Location endpoints
  app.get("/api/locations", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole?.tripId) {
        return res.json([]);
      }
      const locations = await storage.getLocationsByTrip(userRole.tripId);
      res.json(locations);
    } catch (error) {
      console.error("Failed to get locations:", error);
      res.status(500).json({ error: "Failed to get locations" });
    }
  });

  app.post("/api/locations", requireAuth, async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole?.tripId) {
        return res.status(400).json({ error: "No trip assigned" });
      }

      const location = await storage.updateUserLocation(req.userId!, userRole.tripId, latitude, longitude);
      res.json(location);
    } catch (error) {
      console.error("Failed to update location:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  app.get("/api/my-location", requireAuth, async (req, res) => {
    try {
      const location = await storage.getUserLocation(req.userId!);
      res.json(location || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to get location" });
    }
  });

  // Trip Notes Admin CRUD
  app.get("/api/admin/trip-notes", requireAdmin, async (req, res) => {
    try {
      const notes = await storage.getAllTripNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trip notes" });
    }
  });

  app.post("/api/admin/trip-notes", requireAdmin, async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "標題和內容不可為空" });
      }
      const note = await storage.createTripNote({ title, content });
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to create trip note" });
    }
  });

  app.patch("/api/admin/trip-notes/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateTripNote(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update trip note" });
    }
  });

  app.delete("/api/admin/trip-notes/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTripNote(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete trip note" });
    }
  });

  // Trip Note Assignments (per trip)
  app.get("/api/admin/trips/:tripId/notes", requireAdmin, async (req, res) => {
    try {
      const assignments = await storage.getTripNoteAssignments(req.params.tripId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trip note assignments" });
    }
  });

  app.post("/api/admin/trips/:tripId/notes", requireAdmin, async (req, res) => {
    try {
      const { noteId, sortOrder } = req.body;
      if (!noteId) {
        return res.status(400).json({ error: "noteId is required" });
      }
      const assignment = await storage.assignNoteToTrip(req.params.tripId, noteId, sortOrder || 0);
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ error: "Failed to assign note to trip" });
    }
  });

  app.delete("/api/admin/trips/:tripId/notes/:noteId", requireAdmin, async (req, res) => {
    try {
      await storage.removeNoteFromTrip(req.params.tripId, req.params.noteId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove note from trip" });
    }
  });

  // User-facing: get notes for current trip
  app.get("/api/bible/lookup", requireAuth, async (req, res) => {
    try {
      const ref = (req.query.ref as string || "").trim();
      if (!ref) {
        return res.status(400).json({ error: "Missing ref parameter" });
      }

      const refs = ref.split(/[；;]/).map(r => r.trim()).filter(r => r);
      const allVerses: { number: number; text: string; label?: string }[] = [];
      let firstBookName = "";
      let firstChapter = 0;

      for (const singleRef of refs) {
        const parsed = parseScriptureReference(singleRef);
        if (!parsed) continue;
        if (!firstBookName) {
          firstBookName = parsed.bookName;
          firstChapter = parsed.chapter;
        }
        const verses = await lookupParsedReference(parsed as any);
        if (refs.length > 1 && verses.length > 0) {
          allVerses.push({ number: 0, text: `── ${singleRef.trim()} ──` });
        }
        allVerses.push(...verses);
      }

      if (allVerses.length === 0) {
        return res.status(400).json({ error: "Invalid scripture reference format", reference: ref });
      }

      res.json({
        reference: ref,
        bookName: firstBookName,
        chapter: firstChapter,
        verses: allVerses,
      });
    } catch (error) {
      console.error("Bible lookup error:", error);
      res.status(500).json({ error: "Failed to lookup scripture" });
    }
  });

  app.get("/api/bible/books", requireAuth, async (req, res) => {
    try {
      const books = await storage.getBibleBooks();
      res.json(books);
    } catch (error) {
      res.status(500).json({ error: "Failed to get Bible books" });
    }
  });

  app.get("/api/trips/current/devotional-courses", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole?.tripId) {
        return res.json([]);
      }
      const courses = await storage.getDevotionalCourses(userRole.tripId);
      res.set("Cache-Control", "no-cache");
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to get devotional courses" });
    }
  });

  app.get("/api/trips/current/notes", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole?.tripId) {
        return res.json([]);
      }
      const notes = await storage.getNotesForTrip(userRole.tripId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trip notes" });
    }
  });

  // User-facing: get special remarks for current trip
  app.get("/api/trips/current/remarks", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole?.tripId) {
        return res.json({ specialRemarks: null });
      }
      const trip = await storage.getTrip(userRole.tripId);
      res.json({ specialRemarks: trip?.specialRemarks || null });
    } catch (error) {
      res.status(500).json({ error: "Failed to get trip remarks" });
    }
  });

  // Admin: update special remarks for a trip
  app.patch("/api/admin/trips/:tripId/remarks", requireAdmin, async (req, res) => {
    try {
      const { specialRemarks } = req.body;
      const updated = await storage.updateTrip(req.params.tripId, { specialRemarks: specialRemarks || null });
      res.json({ specialRemarks: updated?.specialRemarks || null });
    } catch (error) {
      res.status(500).json({ error: "Failed to update trip remarks" });
    }
  });

  // Devotional Courses Admin endpoints
  app.get("/api/admin/trips/:tripId/devotional-courses", requireAdmin, async (req, res) => {
    try {
      const courses = await storage.getDevotionalCourses(req.params.tripId);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch devotional courses" });
    }
  });

  app.post("/api/admin/trips/:tripId/devotional-courses", requireAdmin, async (req, res) => {
    try {
      const course = await storage.createDevotionalCourse({
        ...req.body,
        tripId: req.params.tripId,
      });
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to create devotional course" });
    }
  });

  app.patch("/api/admin/devotional-courses/:id", requireAdmin, async (req, res) => {
    try {
      const course = await storage.updateDevotionalCourse(req.params.id, req.body);
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to update devotional course" });
    }
  });

  app.post("/api/admin/trips/:tripId/devotional-courses/import", requireAdmin, async (req, res) => {
    try {
      const { courses, mode } = req.body;
      if (!Array.isArray(courses) || courses.length === 0) {
        return res.status(400).json({ error: "No courses to import" });
      }
      if (mode === "replace") {
        await storage.deleteDevotionalCoursesByTrip(req.params.tripId);
      }
      const created = await storage.createDevotionalCourses(
        courses.map((c: any) => ({
          tripId: req.params.tripId,
          dayNo: c.dayNo || null,
          title: c.title,
          place: c.place || null,
          scripture: c.scripture || null,
          reflection: c.reflection || null,
          action: c.action || null,
          prayer: c.prayer || null,
          lifeQuestion: c.lifeQuestion || null,
        }))
      );
      res.json({ imported: created.length, courses: created });
    } catch (error) {
      console.error("Failed to import devotional courses:", error);
      res.status(500).json({ error: "Failed to import devotional courses" });
    }
  });

  app.delete("/api/admin/devotional-courses/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteDevotionalCourse(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete devotional course" });
    }
  });

  // Trip Invitations Admin endpoints
  app.get("/api/admin/trip-invitations", requireAdmin, async (req, res) => {
    try {
      const invitations = await storage.getAllTripInvitations();
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trip invitations" });
    }
  });

  app.get("/api/admin/trips/:tripId/invitations", requireAdmin, async (req, res) => {
    try {
      const invitations = await storage.getTripInvitations(req.params.tripId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trip invitations" });
    }
  });

  app.post("/api/admin/trips/:tripId/invitations", requireAdmin, async (req, res) => {
    try {
      const { description, maxUses, expiresAt } = req.body;

      const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
      let code = "";
      let attempts = 0;
      while (attempts < 10) {
        code = "";
        const bytes = crypto.randomBytes(4);
        for (let i = 0; i < 4; i++) {
          code += chars[bytes[i] % chars.length];
        }
        const existing = await storage.getTripInvitationByCode(code);
        if (!existing) break;
        attempts++;
      }
      if (attempts >= 10) {
        return res.status(500).json({ error: "Failed to generate unique code" });
      }

      const invitation = await storage.createTripInvitation({
        tripId: req.params.tripId,
        code,
        description,
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      });
      res.json(invitation);
    } catch (error) {
      console.error("[create-invitation] error:", error);
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });

  app.patch("/api/admin/trip-invitations/:id", requireAdmin, async (req, res) => {
    try {
      const invitation = await storage.updateTripInvitation(req.params.id, req.body);
      res.json(invitation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update invitation" });
    }
  });

  app.delete("/api/admin/trip-invitations/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTripInvitation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete invitation" });
    }
  });

  // User verification endpoint - verify invitation code and join trip
  app.post("/api/verify-invitation", requireAuth, async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: "驗證碼不可為空" });
      }

      const invitation = await storage.getTripInvitationByCode(code.toUpperCase());
      if (!invitation) {
        return res.status(404).json({ error: "驗證碼無效" });
      }

      if (!invitation.isActive) {
        return res.status(400).json({ error: "此驗證碼已停用" });
      }

      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ error: "此驗證碼已過期" });
      }

      if (invitation.maxUses && invitation.usedCount >= invitation.maxUses) {
        return res.status(400).json({ error: "此驗證碼已達使用上限" });
      }

      // Check if user already has a role for this trip
      const existingRole = await getCachedUserRole(req.userId!);
      if (existingRole && existingRole.tripId === invitation.tripId) {
        return res.status(400).json({ error: "您已加入此旅程" });
      }

      // Update or create user role for this trip
      if (existingRole) {
        await storage.updateUserRoleTrip(existingRole.id, invitation.tripId);
      } else {
        await storage.createUserRole({
          userId: req.userId!,
          role: "member",
          tripId: invitation.tripId,
        });
      }

      // Increment used count
      await storage.incrementInvitationUsedCount(invitation.id);

      // Get the trip info to return
      const trip = await storage.getTrip(invitation.tripId);

      res.json({ success: true, trip, message: "成功加入旅程！" });
    } catch (error) {
      console.error("Failed to verify invitation:", error);
      res.status(500).json({ error: "驗證失敗，請稍後再試" });
    }
  });

  // CSV Import Members endpoint
  app.post("/api/admin/trips/:tripId/import-members", requireAdmin, async (req, res) => {
    try {
      const { tripId } = req.params;
      const { members } = req.body as { members: { name: string; email: string }[] };

      if (!members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ error: "請提供團員資料" });
      }

      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ error: "找不到此行程" });
      }

      const results: { name: string; email: string; tempPassword: string; userId: string; status: string }[] = [];

      for (const member of members) {
        const email = member.email?.trim().toLowerCase();
        const name = member.name?.trim();
        if (!email || !name) continue;

        try {
          let user = await storage.getUserByEmail(email);
          let actualTempPwd = "";

          if (user) {
            if (user.tempPassword) {
              const tempPwd = String(crypto.randomInt(1000, 10000));
              await storage.updateUser(user.id, { tempPassword: tempPwd });
              actualTempPwd = tempPwd;
            }
            const existingProfile = await storage.getProfile(user.id);
            if (!existingProfile) {
              await storage.createProfile({ userId: user.id, name, email });
            }
          } else {
            const tempPwd = String(crypto.randomInt(1000, 10000));
            const hashedPassword = await bcrypt.hash(tempPwd, 10);
            user = await storage.createUser({
              email,
              password: hashedPassword,
              tempPassword: tempPwd,
              firstName: name,
            });
            await storage.createProfile({ userId: user.id, name, email });
            actualTempPwd = tempPwd;
          }

          const existingRoles = await storage.getAllUserRolesForUser(user.id);
          const alreadyInTrip = existingRoles.some(r => r.tripId === tripId);
          if (!alreadyInTrip) {
            await storage.createUserRole({ userId: user.id, role: "member", tripId });
          }

          results.push({
            name,
            email,
            tempPassword: actualTempPwd,
            userId: user.id,
            status: alreadyInTrip ? "already_exists" : "created",
          });
        } catch (err: any) {
          console.error(`[import-members] error for ${email}:`, err);
          results.push({ name, email, tempPassword: "", userId: "", status: "error: " + err.message });
        }
      }

      res.json({ results, total: results.length });
    } catch (error) {
      console.error("[import-members] error:", error);
      res.status(500).json({ error: "匯入團員失敗" });
    }
  });

  // Send pre-trip notification emails via Resend
  app.post("/api/admin/trips/:tripId/send-notifications", requireAdmin, async (req, res) => {
    try {
      const { tripId } = req.params;
      const { userIds, invitationCode } = req.body as { userIds: string[]; invitationCode: string };

      if (!userIds || userIds.length === 0) {
        return res.status(400).json({ error: "請選擇團員" });
      }
      if (!invitationCode) {
        return res.status(400).json({ error: "請提供行程登入碼" });
      }

      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ error: "找不到此行程" });
      }

      const { getResendClient } = await import("./resend");
      const { client: resend, fromEmail } = await getResendClient();

      const usersData = await storage.getUsersByIds(userIds);
      const profilesData = await Promise.all(userIds.map(id => storage.getProfile(id)));
      const profileMap = new Map(profilesData.filter(Boolean).map(p => [p!.userId, p!]));

      const appUrl = process.env.APP_URL
        || (process.env.REPLIT_DOMAINS
          ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
          : "https://your-app.replit.app");

      const verifyUrl = `${appUrl}/verify-trip?code=${invitationCode}`;

      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}`;

      const sentResults: { email: string; status: string }[] = [];

      for (const user of usersData) {
        const profile = profileMap.get(user.id);
        const memberName = profile?.name || user.firstName || user.email;
        const hasTempPassword = !!user.tempPassword;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fef7ed; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 30px; }
    .header { text-align: center; padding: 30px 0; }
    .logo { width: 80px; height: 80px; border-radius: 50%; background: #d97706; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold; }
    .title { font-size: 24px; color: #92400e; margin: 15px 0 5px; }
    .subtitle { color: #b45309; font-size: 14px; }
    .card { background: white; border-radius: 12px; padding: 30px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 15px; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
    .info-label { color: #6b7280; font-size: 14px; }
    .info-value { color: #1f2937; font-weight: 600; font-size: 14px; }
    .code-box { background: #fffbeb; border: 2px solid #d97706; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .code-label { font-size: 13px; color: #92400e; margin-bottom: 8px; }
    .code-value { font-size: 32px; font-weight: bold; color: #d97706; letter-spacing: 6px; }
    .pwd-box { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .pwd-label { font-size: 13px; color: #166534; margin-bottom: 8px; }
    .pwd-value { font-size: 28px; font-weight: bold; color: #16a34a; letter-spacing: 4px; }
    .qr-section { text-align: center; margin: 25px 0; }
    .qr-label { font-size: 13px; color: #6b7280; margin-bottom: 10px; }
    .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
    .btn { display: inline-block; background: #d97706; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">T</div>
      <div class="title">與神同行</div>
      <div class="subtitle">Walking in His Love</div>
    </div>
    <div class="card">
      <div class="greeting">親愛的 ${memberName}，您好！</div>
      <p style="color: #4b5563; line-height: 1.6;">
        歡迎您加入 <strong>${trip.title}</strong>！我們非常期待與您一同踏上這段與神同行的旅程。
      </p>
      <p style="color: #4b5563; line-height: 1.6;">
        旅程日期：<strong>${trip.startDate} ~ ${trip.endDate}</strong><br>
        目的地：<strong>${trip.destination}</strong>
      </p>

      <div class="code-box">
        <div class="code-label">行程登入碼</div>
        <div class="code-value">${invitationCode}</div>
      </div>

      ${hasTempPassword ? `<div class="pwd-box">
        <div class="pwd-label">您的臨時密碼</div>
        <div class="pwd-value">${user.tempPassword}</div>
      </div>` : ''}

      <div class="qr-section">
        <div class="qr-label">掃描 QR Code 快速加入行程</div>
        <img src="${qrApiUrl}" alt="QR Code" width="200" height="200" style="border-radius: 8px;">
      </div>

      <div style="text-align: center;">
        <a href="${verifyUrl}" class="btn" style="color: white;">立即加入行程</a>
      </div>

      <p style="color: #6b7280; font-size: 13px; margin-top: 20px; line-height: 1.5;">
        登入步驟：<br>
        1. 點擊上方按鈕或掃描 QR Code<br>
        ${hasTempPassword
            ? `2. 使用您的 Email（${user.email}）與臨時密碼登入<br>
        3. 輸入行程登入碼加入旅程<br>
        4. 建議登入後至設定頁面更改密碼`
            : `2. 使用您的 Email（${user.email}）與原有密碼登入<br>
        3. 輸入行程登入碼加入旅程`}
      </p>
    </div>
    <div class="footer">
      <p>享受一段與神同行的旅程！</p>
      <p>Enjoy the journey of walking with God!</p>
    </div>
  </div>
</body>
</html>`;

        try {
          const { data, error: sendError } = await resend.emails.send({
            from: fromEmail || "Trip Companion <onboarding@resend.dev>",
            to: user.email,
            subject: `🌟 歡迎加入 ${trip.title} - 行前通知`,
            html: htmlContent,
          });
          if (sendError) {
            console.error(`[send-notification] failed for ${user.email}:`, sendError);
            sentResults.push({ email: user.email, status: "error: " + sendError.message });
          } else {
            console.log(`[send-notification] sent to ${user.email}, id: ${data?.id}`);
            sentResults.push({ email: user.email, status: "sent" });
          }
        } catch (emailErr: any) {
          console.error(`[send-notification] failed for ${user.email}:`, emailErr);
          sentResults.push({ email: user.email, status: "error: " + emailErr.message });
        }
      }

      res.json({ results: sentResults, total: sentResults.length });
    } catch (error) {
      console.error("[send-notifications] error:", error);
      res.status(500).json({ error: "發送通知失敗" });
    }
  });

  // Get members with temp passwords for a specific trip (admin only)
  app.get("/api/admin/trips/:tripId/members", requireAdmin, async (req, res) => {
    try {
      const { tripId } = req.params;
      const roles = await storage.getUserRoles(tripId);
      const userIds = roles.map(r => r.userId);
      const usersData = await storage.getUsersByIds(userIds);
      const profiles = await Promise.all(userIds.map(id => storage.getProfile(id)));

      const profileMap = new Map(profiles.filter(Boolean).map(p => [p!.userId, p!]));
      const roleMap = new Map(roles.map(r => [r.userId, r]));

      const members = usersData.map(u => {
        const profile = profileMap.get(u.id);
        const role = roleMap.get(u.id);
        return {
          userId: u.id,
          name: profile?.name || u.firstName || "",
          email: u.email,
          hasOwnPassword: !u.tempPassword,
          role: role?.role || "member",
          roleId: role?.id || null,
          phone: profile?.phone || "",
          groupId: profile?.groupId || null,
          profileId: profile?.id || null,
        };
      });

      res.json(members);
    } catch (error) {
      console.error("[get-trip-members] error:", error);
      res.status(500).json({ error: "Failed to get trip members" });
    }
  });

  app.patch("/api/admin/trips/:tripId/members/:userId", requireAdmin, async (req, res) => {
    try {
      const { tripId, userId } = req.params;
      const { role, groupId } = req.body;

      if (role) {
        const roles = await storage.getAllUserRolesForUser(userId);
        const tripRole = roles.find(r => r.tripId === tripId);
        if (tripRole) {
          await storage.updateUserRole(tripRole.id, role);
        }
      }

      if (groupId !== undefined) {
        await storage.updateProfile(userId, { groupId: groupId || null });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[update-trip-member] error:", error);
      res.status(500).json({ error: "Failed to update member" });
    }
  });

  app.delete("/api/admin/trips/:tripId/members/:userId", requireAdmin, async (req, res) => {
    try {
      const { tripId, userId } = req.params;
      await storage.deleteUserRole(userId, tripId);
      res.json({ success: true });
    } catch (error) {
      console.error("[delete-trip-member] error:", error);
      res.status(500).json({ error: "Failed to remove member" });
    }
  });

  // Check if user needs to verify (no trip assigned)
  app.get("/api/check-trip-status", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;
      console.log("[check-trip-status] userId:", userId);

      const user = await storage.getUser(userId);

      // Auto-grant super_admin to saisong@gmail.com
      if (user?.email === 'saisong@gmail.com') {
        const platformRole = await storage.getPlatformRole(userId);
        if (!platformRole || platformRole.role !== 'super_admin') {
          await storage.setPlatformRole(userId, 'super_admin', null, 'system');
          console.log(`[check-trip-status] Auto-granted super_admin to ${user.email}`);
        }
      }

      const userRole = await storage.getUserRole(userId);
      console.log("[check-trip-status] userRole:", JSON.stringify(userRole));

      if (userRole && userRole.tripId) {
        const trip = await storage.getTrip(userRole.tripId);
        return res.json({ needsVerification: false, trip });
      }

      const isAdmin = await storage.hasAdminAccess(userId);
      console.log("[check-trip-status] isAdmin:", isAdmin);
      if (isAdmin) {
        const allRoles = await storage.getAllUserRolesForUser(userId);
        const roleWithTrip = allRoles.find(r => r.tripId);
        if (roleWithTrip) {
          const trip = await storage.getTrip(roleWithTrip.tripId!);
          return res.json({ needsVerification: false, trip, isAdmin: true });
        }
        return res.json({ needsVerification: false, isAdmin: true });
      }

      return res.json({ needsVerification: true });
    } catch (error) {
      console.error("[check-trip-status] error:", error);
      res.status(500).json({ error: "Failed to check trip status" });
    }
  });

  // Help content
  app.get("/api/app-settings/help-content", requireAuth, async (_req, res) => {
    try {
      const content = await storage.getAppSetting("help_content");
      res.json({ content: content || "" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch help content" });
    }
  });

  app.patch("/api/admin/app-settings/help-content", requireAdmin, async (req, res) => {
    try {
      const { content } = req.body;
      await storage.setAppSetting("help_content", content || "");
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: "Failed to update help content" });
    }
  });

  app.get("/api/admin/app-settings/bible-library", requireAdmin, async (_req, res) => {
    try {
      const setting = await storage.getAppSetting("bible_library_enabled");
      res.json({ enabled: setting === "true" });
    } catch (error) {
      console.error("Error fetching bible library setting:", error);
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  app.patch("/api/admin/app-settings/bible-library", requireSuperAdmin, async (req, res) => {
    try {
      const { enabled } = req.body;
      await storage.setAppSetting("bible_library_enabled", enabled ? "true" : "false");
      res.json({ enabled });
    } catch (error) {
      console.error("Error updating bible library setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  app.patch("/api/admin/trips/:tripId/bible-library", requireAdmin, async (req, res) => {
    try {
      const { tripId } = req.params;
      const { enabled } = req.body;
      await storage.updateTripBibleLibrary(tripId, enabled);
      res.json({ enabled });
    } catch (error) {
      console.error("Error updating trip bible library:", error);
      res.status(500).json({ error: "Failed to update trip bible library" });
    }
  });

  app.get("/api/trips/current/bible-library-enabled", requireAuth, async (req, res) => {
    try {
      const userId = req.userId!;
      const userRole = await storage.getUserRole(userId);
      if (!userRole?.tripId) {
        return res.json({ enabled: false });
      }
      const trip = await storage.getTrip(userRole.tripId);
      if (!trip) {
        return res.json({ enabled: false });
      }
      const globalSetting = await storage.getAppSetting("bible_library_enabled");
      const globalEnabled = globalSetting === "true";
      const tripEnabled = !!trip.bibleLibraryEnabled;
      console.log("[bible-library] check enabled:", { globalEnabled, tripEnabled, tripBibleLibraryEnabled: trip.bibleLibraryEnabled });
      res.json({ enabled: globalEnabled && tripEnabled });
    } catch (error) {
      console.error("Error checking bible library enabled:", error);
      res.status(500).json({ error: "Failed to check bible library status" });
    }
  });

  app.get("/api/paul-journeys", requireAuth, async (_req, res) => {
    try {
      const journeys = await storage.getPaulJourneys();
      res.json(journeys);
    } catch (error) {
      console.error("Error fetching Paul's journeys:", error);
      res.status(500).json({ error: "Failed to fetch Paul's journeys" });
    }
  });

  // ===== Admin Attractions =====
  app.get("/api/admin/trips/:tripId/attractions", requireAdmin, async (req, res) => {
    try {
      const list = await storage.getAttractionsByTrip(req.params.tripId);
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attractions" });
    }
  });

  app.patch("/api/admin/attractions/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateAttraction(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Attraction not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update attraction" });
    }
  });

  app.delete("/api/admin/attractions/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteAttraction(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete attraction" });
    }
  });

  // ===== Member Attractions =====
  app.get("/api/attractions", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole || !userRole.tripId) return res.json([]);
      const list = await storage.getAttractionsByTrip(userRole.tripId);
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attractions" });
    }
  });

  app.get("/api/attractions/:id", requireAuth, async (req, res) => {
    try {
      const attraction = await storage.getAttraction(req.params.id);
      if (!attraction) return res.status(404).json({ error: "Not found" });
      res.json(attraction);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attraction" });
    }
  });

  // ===== Bible Library Modules (Admin) =====
  app.get("/api/admin/bible-library/modules", requireAdmin, async (_req, res) => {
    try {
      const modules = await storage.getBibleLibraryModules();
      res.json(modules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  app.post("/api/admin/bible-library/modules", requireAdmin, async (req, res) => {
    try {
      const module = await storage.createBibleLibraryModule(req.body);
      res.json(module);
    } catch (error) {
      res.status(500).json({ error: "Failed to create module" });
    }
  });

  app.patch("/api/admin/bible-library/modules/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateBibleLibraryModule(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Module not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update module" });
    }
  });

  app.delete("/api/admin/bible-library/modules/:id", requireAdmin, async (req, res) => {
    try {
      const module = await storage.getBibleLibraryModule(req.params.id);
      if (!module) return res.status(404).json({ error: "Module not found" });
      if (module.isBuiltin) return res.status(400).json({ error: "Cannot delete built-in module" });
      await storage.deleteBibleLibraryModule(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete module" });
    }
  });

  // Module items
  app.get("/api/admin/bible-library/modules/:moduleId/items", requireAdmin, async (req, res) => {
    try {
      const items = await storage.getBibleLibraryItems(req.params.moduleId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.post("/api/admin/bible-library/modules/:moduleId/items", requireAdmin, async (req, res) => {
    try {
      const item = await storage.createBibleLibraryItem({ ...req.body, moduleId: req.params.moduleId });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  app.patch("/api/admin/bible-library/items/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateBibleLibraryItem(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Item not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  app.delete("/api/admin/bible-library/items/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteBibleLibraryItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // Module-trip assignments
  app.get("/api/admin/bible-library/modules/:moduleId/trips", requireAdmin, async (req, res) => {
    try {
      const trips = await storage.getModuleTrips(req.params.moduleId);
      res.json(trips);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch module trips" });
    }
  });

  app.post("/api/admin/bible-library/modules/:moduleId/trips", requireAdmin, async (req, res) => {
    try {
      await storage.assignModuleToTrip(req.params.moduleId, req.body.tripId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to assign module to trip" });
    }
  });

  app.delete("/api/admin/bible-library/modules/:moduleId/trips/:tripId", requireAdmin, async (req, res) => {
    try {
      await storage.unassignModuleFromTrip(req.params.moduleId, req.params.tripId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unassign module from trip" });
    }
  });

  // ===== Bible Library Modules (Member) =====
  app.get("/api/bible-library/modules", requireAuth, async (req, res) => {
    try {
      const userRole = await getCachedUserRole(req.userId!);
      if (!userRole || !userRole.tripId) return res.json([]);
      const modules = await storage.getModulesForTrip(userRole.tripId);
      res.json(modules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  app.get("/api/bible-library/modules/:moduleId/items", requireAuth, async (req, res) => {
    try {
      const items = await storage.getBibleLibraryItems(req.params.moduleId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.get("/api/admin/trips-bible-library", requireAdmin, async (_req, res) => {
    try {
      const allTrips = await storage.getTrips();
      const result = allTrips.map(t => ({
        id: t.id,
        title: t.title,
        bibleLibraryEnabled: !!t.bibleLibraryEnabled,
      }));
      res.json(result);
    } catch (error) {
      console.error("Error fetching trips bible library:", error);
      res.status(500).json({ error: "Failed to fetch trips" });
    }
  });

  // Exchange rates API with server-side caching (30 min)
  let rateCache: { rates: Record<string, number>; timestamp: number } | null = null;
  const RATE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  app.get("/api/exchange-rates", requireAuth, async (_req, res) => {
    try {
      // Return cached if fresh
      if (rateCache && Date.now() - rateCache.timestamp < RATE_CACHE_TTL) {
        return res.json({
          rates: rateCache.rates,
          updatedAt: new Date(rateCache.timestamp).toISOString(),
        });
      }

      // Fetch fresh rates (base: TWD)
      const response = await fetch("https://open.er-api.com/v6/latest/TWD");
      if (!response.ok) {
        // If fetch fails but cache exists, return stale cache
        if (rateCache) {
          return res.json({
            rates: rateCache.rates,
            updatedAt: new Date(rateCache.timestamp).toISOString(),
            stale: true,
          });
        }
        throw new Error(`Exchange rate API returned ${response.status}`);
      }

      const data = await response.json();
      if (data.result !== "success" || !data.rates) {
        throw new Error("Invalid exchange rate response");
      }

      rateCache = { rates: data.rates, timestamp: Date.now() };

      res.json({
        rates: data.rates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      // Fallback hardcoded rates if API is unavailable
      const fallbackRates: Record<string, number> = {
        TWD: 1, USD: 0.031, ILS: 0.115, JOD: 0.022, EUR: 0.029,
        TRY: 1.17, GBP: 0.025, JPY: 4.69, KRW: 44.5, CNY: 0.225,
        HKD: 0.243, SGD: 0.042, THB: 1.08, AUD: 0.048, CAD: 0.044,
        CHF: 0.027, EGP: 1.56, MYR: 0.138,
      };
      res.json({
        rates: fallbackRates,
        updatedAt: null,
        fallback: true,
      });
    }
  });
}
