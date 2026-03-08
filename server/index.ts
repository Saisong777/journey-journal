import express from "express";
import crypto from "crypto";
import { createServer } from "http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { registerUploadRoutes } from "./uploadRoutes";
import { runStartupMigration } from "./startupMigration";

const app = express();
app.set('trust proxy', 1);

// S5: Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org", process.env.R2_PUBLIC_URL || "https://*.r2.cloudflarestorage.com"].filter(Boolean),
      connectSrc: ["'self'", "https://accounts.google.com", "https://*.tile.openstreetmap.org", "https://*.r2.cloudflarestorage.com", process.env.R2_PUBLIC_URL].filter(Boolean) as string[],
      frameSrc: ["'self'", "https://accounts.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// S4: Global rate limit — 300 requests per 15 min (skip non-API routes)
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/auth/google/callback"),
  message: { error: "Too many requests, please try again later" },
}));

// S4: Strict rate limit for auth endpoints — 10 attempts per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/reset-password", authLimiter);
app.use("/api/verify-invitation", authLimiter);
app.use("/api/login", authLimiter); // OAuth initiation

// S5/S8: Body parsing with explicit size limits
app.use((req, res, next) => {
  // Skip JSON parsing for direct binary upload route
  if (req.path.startsWith("/api/uploads/direct/")) {
    return next();
  }
  express.json({ limit: "1mb" })(req, res, next);
});
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  console.log("[server] starting up...", { NODE_ENV: process.env.NODE_ENV, PORT: process.env.PORT, HAS_DB: !!process.env.DATABASE_URL });
  // Setup session middleware (PostgreSQL store)
  const pgStore = connectPg(session);
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  app.use(session({
    secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === "production"
      ? (() => { console.error("[SECURITY] SESSION_SECRET not set in production! Generating random secret (sessions will not persist across restarts)."); return crypto.randomBytes(32).toString("hex"); })()
      : "dev-secret-change-me"),
    store: new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
      pruneSessionInterval: 60 * 15,
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: sessionTtl,
    },
  }));

  // Register upload routes
  registerUploadRoutes(app);

  // Run startup migration (ensure admin roles and trip data exist)
  try {
    await runStartupMigration();
  } catch (e) {
    console.error("[startup-migration] failed, server will continue:", e);
  }

  // Register application routes
  registerRoutes(app);

  const server = createServer(app);

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("[error-handler]", err);
    res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
})().catch((err) => {
  console.error("[server] fatal startup error:", err);
  process.exit(1);
});
