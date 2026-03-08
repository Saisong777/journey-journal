import * as client from "openid-client";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import { createAuthToken } from "../../tokenStore";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
    pruneSessionInterval: 60 * 15,
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: true,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      maxAge: sessionTtl,
    },
  });
}

const oidcStateStore = new Map<string, { nonce: string; code_verifier: string; createdAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of oidcStateStore) {
    if (now - val.createdAt > 10 * 60 * 1000) {
      oidcStateStore.delete(key);
    }
  }
}, 60 * 1000);

async function upsertUser(claims: any) {
  return await authStorage.upsertReplitUser({
    replitId: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  if (!process.env.REPL_ID) {
    console.log("[Auth] REPL_ID not set, skipping Replit OIDC setup");
    return;
  }

  const config = await getOidcConfig();

  app.get("/api/login", async (req, res) => {
    try {
      const state = client.randomState();
      const nonce = client.randomNonce();
      const code_verifier = client.randomPKCECodeVerifier();
      const code_challenge = await client.calculatePKCECodeChallenge(code_verifier);

      const callbackURL = `https://${req.hostname}/api/callback`;
      oidcStateStore.set(state, { nonce, code_verifier, createdAt: Date.now() });

      const authUrl = client.buildAuthorizationUrl(config, {
        redirect_uri: callbackURL,
        scope: "openid email profile offline_access",
        state,
        nonce,
        code_challenge,
        code_challenge_method: "S256",
        prompt: "login consent",
      });

      console.log("[Auth] /api/login redirecting, state:", state.substring(0, 8) + "...");
      res.redirect(authUrl.href);
    } catch (err) {
      console.error("[Auth] /api/login error:", err);
      res.redirect("/auth?error=login_init_error");
    }
  });

  app.get("/api/callback", async (req, res) => {
    try {
      const stateFromUrl = req.query.state as string;
      const codeFromUrl = req.query.code as string;

      if (!stateFromUrl || !codeFromUrl) {
        console.error("[Auth] callback missing state or code");
        return res.redirect("/auth?error=missing_params");
      }

      const stored = oidcStateStore.get(stateFromUrl);
      if (!stored) {
        console.error("[Auth] callback state not found in store:", stateFromUrl.substring(0, 8) + "...");
        return res.redirect("/auth?error=invalid_state");
      }

      oidcStateStore.delete(stateFromUrl);

      const callbackURL = `https://${req.hostname}/api/callback`;
      const currentUrl = new URL(`${callbackURL}?${new URLSearchParams(req.query as Record<string, string>).toString()}`);

      const tokens = await client.authorizationCodeGrant(config, currentUrl, {
        pkceCodeVerifier: stored.code_verifier,
        expectedNonce: stored.nonce,
        expectedState: stateFromUrl,
      });

      const claims = tokens.claims();
      if (!claims) {
        console.error("[Auth] callback: no claims in tokens");
        return res.redirect("/auth?error=no_claims");
      }

      console.log("[Auth] callback success, email:", claims.email);
      const dbUser = await upsertUser(claims);
      const authToken = await createAuthToken(dbUser.id);

      (req.session as any).userId = dbUser.id;
      req.session.save(() => {
        res.redirect(`/?authToken=${authToken}`);
      });
    } catch (err: any) {
      console.error("[Auth] callback error:", err?.message || err);
      res.redirect("/auth?error=auth_error");
    }
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  return res.status(401).json({ message: "Unauthorized" });
};
