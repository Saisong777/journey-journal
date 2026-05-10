import bcrypt from "bcrypt";
import pg from "pg";
import { pool as appPool } from "../server/db";
import { runStartupMigration } from "../server/startupMigration";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL must be set before running demo seed");
}

const ADMIN_EMAIL = "admin@local.test";
const ADMIN_PASSWORD = "123456";
const BOOTSTRAP_ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();

const startDate = new Date(Date.UTC(2026, 4, 7));

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

function addDays(days: number) {
  const date = new Date(startDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

async function ensureBootstrapData(client: pg.PoolClient) {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  if (BOOTSTRAP_ADMIN_EMAIL) {
    await client.query(
      `INSERT INTO users (email, password, temp_password, first_name, updated_at)
       VALUES ($1, $2, NULL, 'Bootstrap Admin', NOW())
       ON CONFLICT (email) DO UPDATE
       SET password = EXCLUDED.password,
           temp_password = NULL,
           first_name = EXCLUDED.first_name,
           updated_at = NOW()`,
      [BOOTSTRAP_ADMIN_EMAIL, passwordHash],
    );
  }

  const tripCount = await client.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM trips");
  if (tripCount.rows[0].count === 0) {
    await client.query(
      `INSERT INTO trips (title, destination, start_date, end_date, special_remarks, bible_library_enabled)
       VALUES ($1, '土耳其 · 希臘', $2, $3, 'Local Docker demo data', true)`,
      ["Development Seed Trip", formatDate(startDate), formatDate(addDays(15))],
    );
  }
}

async function ensureGroup(client: pg.PoolClient, tripId: string, name: string) {
  const existing = await client.query<{ id: string }>(
    "SELECT id FROM groups WHERE trip_id = $1 AND name = $2 LIMIT 1",
    [tripId, name],
  );
  if (existing.rowCount) return existing.rows[0].id;

  const created = await client.query<{ id: string }>(
    "INSERT INTO groups (trip_id, name) VALUES ($1, $2) RETURNING id",
    [tripId, name],
  );
  return created.rows[0].id;
}

async function enrichDemoData(client: pg.PoolClient) {
  const tripResult = await client.query<{ id: string }>("SELECT id FROM trips ORDER BY created_at LIMIT 1");
  if (!tripResult.rowCount) throw new Error("No trip found after startup migration");

  const tripId = tripResult.rows[0].id;
  const firstGroupId = await ensureGroup(client, tripId, "第一小組");
  const secondGroupId = await ensureGroup(client, tripId, "第二小組");

  await client.query(
    `UPDATE trips
     SET title = '2026 土耳其希臘平安同行（本機測試）',
         destination = '土耳其 · 希臘',
         start_date = $2,
         end_date = $3,
         special_remarks = 'Local Docker demo data: 今天會落在 D3，可安心新增、修改、刪除。',
         bible_library_enabled = true,
         updated_at = NOW()
     WHERE id = $1`,
    [tripId, formatDate(startDate), formatDate(addDays(15))],
  );

  for (let dayNo = 1; dayNo <= 16; dayNo += 1) {
    await client.query(
      "UPDATE trip_days SET date = $1, updated_at = NOW() WHERE trip_id = $2 AND day_no = $3",
      [formatDate(addDays(dayNo - 1)), tripId, dayNo],
    );
  }

  await client.query(
    `INSERT INTO app_settings (key, value)
     VALUES ('bible_library_enabled', 'true')
     ON CONFLICT (key) DO UPDATE SET value = 'true'`,
  );

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await client.query<{ id: string }>(
    `INSERT INTO users (email, password, temp_password, first_name, updated_at)
     VALUES ($1, $2, NULL, '本機管理員', NOW())
     ON CONFLICT (email) DO UPDATE
     SET password = EXCLUDED.password,
         temp_password = NULL,
         first_name = EXCLUDED.first_name,
         updated_at = NOW()
     RETURNING id`,
    [ADMIN_EMAIL, passwordHash],
  );
  const adminId = admin.rows[0].id;

  await client.query(
    `INSERT INTO profiles (user_id, name, email, phone, group_id, updated_at)
     VALUES ($1, '本機管理員', $2, '0900-000-000', $3, NOW())
     ON CONFLICT (user_id) DO UPDATE
     SET name = EXCLUDED.name,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         group_id = EXCLUDED.group_id,
         updated_at = NOW()`,
    [adminId, ADMIN_EMAIL, firstGroupId],
  );

  await client.query(
    `INSERT INTO platform_roles (user_id, role, permissions, assigned_by, updated_at)
     VALUES ($1, 'super_admin', NULL, $1, NOW())
     ON CONFLICT (user_id) DO UPDATE
     SET role = 'super_admin',
         permissions = NULL,
         assigned_by = EXCLUDED.assigned_by,
         updated_at = NOW()`,
    [adminId],
  );

  await client.query(
    `INSERT INTO user_roles (user_id, role, trip_id)
     SELECT $1, 'admin', $2
     WHERE NOT EXISTS (
       SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin' AND trip_id = $2
     )`,
    [adminId, tripId],
  );

  const demoUsers = [
    ["member1@local.test", "王小恩", "0912-000-001", firstGroupId, "member"],
    ["member2@local.test", "林以琳", "0912-000-002", firstGroupId, "member"],
    ["member3@local.test", "張牧心", "0912-000-003", secondGroupId, "member"],
    ["member4@local.test", "陳約書亞", "0912-000-004", secondGroupId, "member"],
    ["guide@local.test", "測試導遊", "0912-000-005", firstGroupId, "guide"],
  ] as const;

  const memberIds: string[] = [];
  for (const [email, name, phone, groupId, role] of demoUsers) {
    const user = await client.query<{ id: string }>(
      `INSERT INTO users (email, password, temp_password, first_name, updated_at)
       VALUES ($1, $2, NULL, $3, NOW())
       ON CONFLICT (email) DO UPDATE
       SET password = EXCLUDED.password,
           temp_password = NULL,
           first_name = EXCLUDED.first_name,
           updated_at = NOW()
       RETURNING id`,
      [email, passwordHash, name],
    );
    const userId = user.rows[0].id;
    memberIds.push(userId);

    await client.query(
      `INSERT INTO profiles (user_id, name, email, phone, group_id, emergency_contact_name, emergency_contact_phone, dietary_restrictions, updated_at)
       VALUES ($1, $2, $3, $4, $5, '緊急聯絡人', '0999-123-456', '測試資料：無特殊飲食', NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET name = EXCLUDED.name,
           email = EXCLUDED.email,
           phone = EXCLUDED.phone,
           group_id = EXCLUDED.group_id,
           updated_at = NOW()`,
      [userId, name, email, phone, groupId],
    );

    await client.query(
      `INSERT INTO user_roles (user_id, role, trip_id)
       SELECT $1, $2::app_role, $3
       WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = $1 AND trip_id = $3)`,
      [userId, role, tripId],
    );
  }

  await client.query("DELETE FROM trip_schedule_items WHERE trip_id = $1", [tripId]);
  await client.query("DELETE FROM attractions WHERE trip_id = $1", [tripId]);

  const days = await client.query(
    "SELECT * FROM trip_days WHERE trip_id = $1 ORDER BY day_no",
    [tripId],
  );
  const activityTimes = ["09:00", "10:30", "14:00", "15:30", "16:30"];

  for (const day of days.rows) {
    let scheduleSeq = 1;
    const meals = [
      ["07:30", "meal", "早餐", day.breakfast],
      ["12:00", "meal", "午餐", day.lunch],
      ["18:30", "meal", "晚餐", day.dinner],
    ].filter(([, , , value]) => value && !["X", "x"].includes(String(value)));

    for (const [time, type, title, location] of meals) {
      await client.query(
        `INSERT INTO trip_schedule_items (trip_id, day_no, seq, time, type, title, location, notes)
         VALUES ($1, $2, $3, $4, $5::schedule_item_type, $6, $7, 'Local Docker seed')`,
        [tripId, day.day_no, scheduleSeq, time, type, title, location],
      );
      scheduleSeq += 1;
    }

    const names = String(day.attractions || day.highlights || "")
      .split("/")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 8);

    let attractionSeq = 1;
    for (const name of names) {
      const attraction = await client.query<{ id: string }>(
        `INSERT INTO attractions (trip_id, day_no, seq, name_zh, country, date, modern_location, scripture_refs, story_summary, life_application, md_content)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          tripId,
          day.day_no,
          attractionSeq,
          name,
          day.city_area?.includes("Athens") || day.city_area?.includes("哥") || day.city_area?.includes("拉里") || day.city_area?.includes("腓")
            ? "希臘"
            : "土耳其",
          day.date,
          day.city_area,
          day.bible_refs,
          `${name} 是 D${day.day_no} 行程中的重點站，適合測試景點資訊、經文連結與行程卡片。`,
          "測試時可以在這裡補充導覽文字、照片、考古資料與靈修問題。",
          `## ${name}\n\n這是 local Docker demo data，用來讓景點詳情頁有內容可讀。\n\n**所在區域：** ${day.city_area || "旅程途中"}\n\n**當日主題：** ${day.title || ""}\n\n> 可在後台編輯為正式導覽內容。`,
        ],
      );
      attractionSeq += 1;

      if (scheduleSeq <= 8) {
        await client.query(
          `INSERT INTO trip_schedule_items (trip_id, day_no, seq, time, type, title, location, attraction_id, notes)
           VALUES ($1, $2, $3, $4, 'activity', $5, $6, $7, 'Local Docker seed')`,
          [
            tripId,
            day.day_no,
            scheduleSeq,
            activityTimes[(scheduleSeq - 1) % activityTimes.length],
            name,
            day.city_area || "",
            attraction.rows[0].id,
          ],
        );
        scheduleSeq += 1;
      }
    }

    if (day.lodging && !["X", "x"].includes(String(day.lodging))) {
      await client.query(
        `INSERT INTO trip_schedule_items (trip_id, day_no, seq, time, type, title, location, notes)
         VALUES ($1, $2, $3, '20:00', 'accommodation', '住宿', $4, 'Local Docker seed')`,
        [tripId, day.day_no, scheduleSeq, day.lodging],
      );
    }
  }

  const modules = await client.query<{ id: string }>("SELECT id FROM bible_library_modules");
  for (const module of modules.rows) {
    await client.query(
      `INSERT INTO bible_library_module_trips (module_id, trip_id)
       SELECT $1, $2
       WHERE NOT EXISTS (
         SELECT 1 FROM bible_library_module_trips WHERE module_id = $1 AND trip_id = $2
       )`,
      [module.id, tripId],
    );
  }

  const handbook = await client.query<{ id: string }>(
    `INSERT INTO bible_library_modules (slug, title, description, icon_name, sort_order, is_builtin, module_type, visible)
     VALUES ('local-handbook', '旅前手冊', 'Local Docker demo data', 'BookOpen', 10, false, 'document-library', true)
     ON CONFLICT (slug) DO UPDATE
     SET title = EXCLUDED.title,
         description = EXCLUDED.description,
         visible = true,
         updated_at = NOW()
     RETURNING id`,
  );
  const handbookId = handbook.rows[0].id;
  await client.query("DELETE FROM bible_library_items WHERE module_id = $1", [handbookId]);
  await client.query(
    `INSERT INTO bible_library_items (module_id, title, content, sort_order)
     VALUES ($1, '測試資料說明', $2, 1), ($1, '旅程提醒', $3, 2)`,
    [
      handbookId,
      "# Local Docker Demo Data\n\n這份資料只存在本機 Docker DB，用來測試前台、後台、Markdown、行程與靈修功能。\n\n- 可新增/修改/刪除\n- 不影響正式站\n- 測試帳號密碼皆為 `123456`",
      "## 今日測試重點\n\n1. 登入首頁是否看到 D3 行程。\n2. 景點資訊是否可打開。\n3. 後台是否可管理團員、行程、資料庫。",
    ],
  );
  await client.query(
    `INSERT INTO bible_library_module_trips (module_id, trip_id)
     SELECT $1, $2
     WHERE NOT EXISTS (
       SELECT 1 FROM bible_library_module_trips WHERE module_id = $1 AND trip_id = $2
     )`,
    [handbookId, tripId],
  );

  await client.query(
    "DELETE FROM roll_call_attendances WHERE roll_call_id IN (SELECT id FROM roll_calls WHERE trip_id = $1)",
    [tripId],
  );
  await client.query("DELETE FROM roll_calls WHERE trip_id = $1", [tripId]);
  const rollCall = await client.query<{ id: string }>(
    `INSERT INTO roll_calls (trip_id, date, location, note, created_by, self_check_in_enabled)
     VALUES ($1, $2, '飯店大廳', 'Local Docker 測試點名', $3, true)
     RETURNING id`,
    [tripId, formatDate(addDays(2)), adminId],
  );
  for (const [index, userId] of memberIds.entries()) {
    const status = index < 3 ? "present" : "absent";
    await client.query(
      `INSERT INTO roll_call_attendances (roll_call_id, user_id, status, checked_in_by, checked_in_at)
       VALUES ($1, $2, $3, $4, CASE WHEN $3 = 'present' THEN NOW() ELSE NULL END)`,
      [rollCall.rows[0].id, userId, status, adminId],
    );
  }

  return { tripId, members: demoUsers.length, currentDay: 3 };
}

async function main() {
  const scriptPool = new pg.Pool({ connectionString: DATABASE_URL, connectionTimeoutMillis: 5000 });
  const client = await scriptPool.connect();

  try {
    await client.query("BEGIN");
    await ensureBootstrapData(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  await runStartupMigration();

  const enrichClient = await scriptPool.connect();
  try {
    await enrichClient.query("BEGIN");
    const result = await enrichDemoData(enrichClient);
    await enrichClient.query("COMMIT");
    console.log(JSON.stringify({ ok: true, adminEmail: ADMIN_EMAIL, password: ADMIN_PASSWORD, ...result }, null, 2));
  } catch (error) {
    await enrichClient.query("ROLLBACK");
    throw error;
  } finally {
    enrichClient.release();
    await scriptPool.end();
    await appPool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
