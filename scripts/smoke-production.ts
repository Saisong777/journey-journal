type SmokeCheck = {
  name: string;
  path: string;
  expectedStatus: number;
  validate?: (response: Response, body: string) => Promise<void> | void;
};

const baseUrl = (process.env.SMOKE_BASE_URL || "https://trip.wechurch.online").replace(/\/$/, "");

const checks: SmokeCheck[] = [
  {
    name: "plain health",
    path: "/healthz",
    expectedStatus: 200,
    validate: async (_response, body) => {
      const parsed = JSON.parse(body);
      if (parsed.ok !== true || parsed.service !== "journey-journal") {
        throw new Error("healthz payload is not healthy");
      }
    },
  },
  {
    name: "api health with database",
    path: "/api/health",
    expectedStatus: 200,
    validate: async (_response, body) => {
      const parsed = JSON.parse(body);
      if (parsed.ok !== true || parsed.db !== "ok") {
        throw new Error("api health payload is not database-ready");
      }
    },
  },
  {
    name: "landing shell",
    path: "/",
    expectedStatus: 200,
    validate: (response, body) => {
      const csp = response.headers.get("content-security-policy");
      if (!csp?.includes("default-src 'self'")) {
        throw new Error("missing expected security headers");
      }
      if (!body.includes("root")) {
        throw new Error("root HTML shell was not returned");
      }
    },
  },
  { name: "welcome route", path: "/welcome", expectedStatus: 200 },
  { name: "auth route", path: "/auth", expectedStatus: 200 },
  {
    name: "anonymous session",
    path: "/api/auth/session",
    expectedStatus: 200,
    validate: async (_response, body) => {
      const parsed = JSON.parse(body);
      if (!Object.prototype.hasOwnProperty.call(parsed, "user")) {
        throw new Error("session payload is missing user");
      }
    },
  },
  { name: "protected trip rejects anonymous", path: "/api/trip", expectedStatus: 401 },
  { name: "protected trip days reject anonymous", path: "/api/trip-days", expectedStatus: 401 },
  { name: "admin status rejects anonymous", path: "/api/admin/system-status", expectedStatus: 401 },
];

async function run() {
  const failures: string[] = [];

  for (const check of checks) {
    const startedAt = Date.now();
    try {
      const response = await fetch(`${baseUrl}${check.path}`, {
        redirect: "manual",
        headers: { "User-Agent": "journey-journal-smoke/1.0" },
      });
      const body = await response.text();
      const elapsed = Date.now() - startedAt;

      if (response.status !== check.expectedStatus) {
        throw new Error(`expected ${check.expectedStatus}, got ${response.status}: ${body.slice(0, 120)}`);
      }

      await check.validate?.(response, body);
      console.log(`ok ${check.name} ${check.path} ${response.status} ${elapsed}ms`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${check.name} ${check.path}: ${message}`);
      console.error(`fail ${check.name} ${check.path}: ${message}`);
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} smoke check(s) failed for ${baseUrl}`);
    process.exit(1);
  }

  console.log(`\nAll smoke checks passed for ${baseUrl}`);
}

void run();
