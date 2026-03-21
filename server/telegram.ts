import TelegramBot from "node-telegram-bot-api";
import { db } from "./db";
import { telegramLinks, users, profiles, trips, tripDays, userRoles, journalEntries, devotionalEntries, devotionalCourses, rollCalls } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

let bot: TelegramBot | null = null;

/**
 * Get the singleton bot instance (or null if not configured).
 */
export function getBot(): TelegramBot | null {
  return bot;
}

/**
 * Initialize the Telegram bot if TELEGRAM_BOT_TOKEN is set.
 * Uses polling mode for simplicity.
 */
export function initTelegramBot(): void {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("[telegram] TELEGRAM_BOT_TOKEN not set, skipping bot initialization");
    return;
  }

  bot = new TelegramBot(token, { polling: true });
  console.log("[telegram] Bot initialized with polling");

  // --- Command handlers ---

  bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id.toString();
    const param = match?.[1]?.trim();

    // If /start has a link code parameter, attempt to bind
    if (param) {
      await handleLinkCode(chatId, param, msg);
      return;
    }

    await bot!.sendMessage(
      chatId,
      `🙏 歡迎使用「平安同行」Telegram Bot！\n\n` +
        `請在 App 的「設定 → Telegram 綁定」中取得綁定碼，\n` +
        `然後傳送給我完成綁定。\n\n` +
        `可用指令：\n` +
        `/today - 查看今日行程\n` +
        `/devotional - 查看今日靈修\n` +
        `/journal - 快速寫日誌\n` +
        `/status - 查看綁定狀態\n` +
        `/unlink - 解除綁定\n` +
        `/help - 查看說明`,
    );
  });

  bot.onText(/\/help/, async (msg) => {
    await bot!.sendMessage(
      msg.chat.id,
      `📖 平安同行 Bot 指令說明\n\n` +
        `/today - 查看今日行程安排\n` +
        `/devotional - 查看今日靈修內容\n` +
        `/journal <內容> - 快速寫一篇日誌\n` +
        `/status - 查看目前的綁定狀態\n` +
        `/unlink - 解除 Telegram 綁定\n` +
        `/help - 查看本說明\n\n` +
        `💡 直接輸入 6 位綁定碼也可以綁定帳號`,
    );
  });

  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id.toString();
    const link = await getTelegramLink(chatId);
    if (!link) {
      await bot!.sendMessage(chatId, "❌ 尚未綁定帳號。請在 App 設定中取得綁定碼。");
      return;
    }
    const profile = await db.select().from(profiles).where(eq(profiles.userId, link.userId)).then(r => r[0]);
    await bot!.sendMessage(
      chatId,
      `✅ 已綁定帳號\n\n` +
        `👤 姓名：${profile?.name || "未設定"}\n` +
        `📧 Email：${profile?.email || "未設定"}\n` +
        `🔔 靈修通知：${link.notifyDevotional ? "開啟" : "關閉"}\n` +
        `📅 行程通知：${link.notifySchedule ? "開啟" : "關閉"}\n` +
        `📋 點名通知：${link.notifyRollCall ? "開啟" : "關閉"}`,
    );
  });

  bot.onText(/\/unlink/, async (msg) => {
    const chatId = msg.chat.id.toString();
    const link = await getTelegramLink(chatId);
    if (!link) {
      await bot!.sendMessage(chatId, "您尚未綁定帳號。");
      return;
    }
    await db.delete(telegramLinks).where(eq(telegramLinks.telegramChatId, chatId));
    await bot!.sendMessage(chatId, "✅ 已成功解除 Telegram 綁定。\n如需重新綁定，請在 App 設定中取得新的綁定碼。");
  });

  bot.onText(/\/today/, async (msg) => {
    const chatId = msg.chat.id.toString();
    const link = await getTelegramLink(chatId);
    if (!link) {
      await bot!.sendMessage(chatId, "❌ 請先綁定帳號才能查看行程。");
      return;
    }

    // Get user's trip
    const userRole = await db.select().from(userRoles).where(eq(userRoles.userId, link.userId)).then(r => r[0]);
    if (!userRole?.tripId) {
      await bot!.sendMessage(chatId, "您目前沒有加入任何旅程。");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const dayInfo = await db.select().from(tripDays)
      .where(and(eq(tripDays.tripId, userRole.tripId), eq(tripDays.date, today)))
      .then(r => r[0]);

    if (!dayInfo) {
      await bot!.sendMessage(chatId, "今天沒有行程安排。");
      return;
    }

    let message = `📅 第 ${dayInfo.dayNo} 天 — ${dayInfo.title || ""}\n`;
    message += `📍 ${dayInfo.cityArea || ""}\n\n`;
    if (dayInfo.highlights) message += `✨ ${dayInfo.highlights}\n\n`;
    if (dayInfo.attractions) message += `🏛 景點：${dayInfo.attractions}\n\n`;
    if (dayInfo.bibleRefs) message += `📖 經文：${dayInfo.bibleRefs}\n\n`;
    message += `🍽 餐食：\n`;
    message += `  早餐：${dayInfo.breakfast || "—"}\n`;
    message += `  午餐：${dayInfo.lunch || "—"}\n`;
    message += `  晚餐：${dayInfo.dinner || "—"}\n`;
    if (dayInfo.lodging) message += `\n🏨 住宿：${dayInfo.lodging}`;
    if (dayInfo.notes) message += `\n\n📝 ${dayInfo.notes}`;

    await bot!.sendMessage(chatId, message);
  });

  bot.onText(/\/devotional/, async (msg) => {
    const chatId = msg.chat.id.toString();
    const link = await getTelegramLink(chatId);
    if (!link) {
      await bot!.sendMessage(chatId, "❌ 請先綁定帳號才能查看靈修。");
      return;
    }

    const userRole = await db.select().from(userRoles).where(eq(userRoles.userId, link.userId)).then(r => r[0]);
    if (!userRole?.tripId) {
      await bot!.sendMessage(chatId, "您目前沒有加入任何旅程。");
      return;
    }

    // Find today's day number
    const today = new Date().toISOString().split("T")[0];
    const dayInfo = await db.select().from(tripDays)
      .where(and(eq(tripDays.tripId, userRole.tripId), eq(tripDays.date, today)))
      .then(r => r[0]);

    if (!dayInfo) {
      await bot!.sendMessage(chatId, "今天沒有靈修安排。");
      return;
    }

    const course = await db.select().from(devotionalCourses)
      .where(and(eq(devotionalCourses.tripId, userRole.tripId), eq(devotionalCourses.dayNo, dayInfo.dayNo)))
      .then(r => r[0]);

    if (!course) {
      await bot!.sendMessage(chatId, "今天沒有靈修內容。");
      return;
    }

    let message = `🙏 第 ${dayInfo.dayNo} 天靈修\n`;
    message += `📍 ${course.place || ""}\n\n`;
    message += `📖 ${course.title}\n\n`;
    if (course.scripture) message += `📜 經文：${course.scripture}\n\n`;
    if (course.reflection) message += `💭 默想：\n${course.reflection.substring(0, 500)}${course.reflection.length > 500 ? "..." : ""}\n\n`;
    if (course.action) message += `🎯 行動：\n${course.action}\n\n`;
    if (course.prayer) message += `🤲 禱告：\n${course.prayer}\n\n`;
    if (course.lifeQuestion) message += `❓ 生命提問：\n${course.lifeQuestion}`;

    await bot!.sendMessage(chatId, message);
  });

  bot.onText(/\/journal (.+)/, async (msg, match) => {
    const chatId = msg.chat.id.toString();
    const content = match?.[1]?.trim();
    if (!content) {
      await bot!.sendMessage(chatId, "請輸入日誌內容，例如：/journal 今天在聖索菲亞大教堂感受到歷史的厚重");
      return;
    }

    const link = await getTelegramLink(chatId);
    if (!link) {
      await bot!.sendMessage(chatId, "❌ 請先綁定帳號才能寫日誌。");
      return;
    }

    const userRole = await db.select().from(userRoles).where(eq(userRoles.userId, link.userId)).then(r => r[0]);
    if (!userRole?.tripId) {
      await bot!.sendMessage(chatId, "您目前沒有加入任何旅程。");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const title = `Telegram 日誌 — ${new Date().toLocaleDateString("zh-TW")}`;

    await db.insert(journalEntries).values({
      userId: link.userId,
      tripId: userRole.tripId,
      title,
      content,
      entryDate: today,
    });

    await bot!.sendMessage(chatId, `✅ 日誌已儲存！\n\n📝 ${title}\n${content}`);
  });

  // Handle plain text that looks like a link code (6 alphanumeric characters)
  bot.on("message", async (msg) => {
    if (msg.text?.startsWith("/")) return; // skip commands
    const text = msg.text?.trim();
    if (!text) return;

    // Check if it looks like a 6-character link code
    if (/^[A-Z0-9]{6}$/i.test(text)) {
      await handleLinkCode(msg.chat.id.toString(), text.toUpperCase(), msg);
    }
  });

  bot.on("polling_error", (error) => {
    console.error("[telegram] Polling error:", error.message);
  });
}

/**
 * Handle a link code submitted via /start param or plain text
 */
async function handleLinkCode(chatId: string, code: string, msg: TelegramBot.Message): Promise<void> {
  if (!bot) return;

  // Check if this chat is already linked
  const existingLink = await getTelegramLink(chatId);
  if (existingLink) {
    await bot.sendMessage(chatId, "✅ 您的帳號已經綁定了！\n使用 /unlink 解除後可重新綁定。");
    return;
  }

  // Find the link code
  const linkRecord = await db.select().from(telegramLinks)
    .where(and(
      eq(telegramLinks.linkCode, code.toUpperCase()),
      sql`${telegramLinks.linkCodeExpiresAt} > NOW()`,
    ))
    .then(r => r[0]);

  if (!linkRecord) {
    await bot.sendMessage(chatId, "❌ 綁定碼無效或已過期。\n請在 App 設定中重新取得綁定碼。");
    return;
  }

  // Update the record with Telegram info
  await db.update(telegramLinks)
    .set({
      telegramChatId: chatId,
      telegramUsername: msg.from?.username || null,
      telegramFirstName: msg.from?.first_name || null,
      linkCode: null, // clear the code after use
      linkCodeExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(telegramLinks.id, linkRecord.id));

  const profile = await db.select().from(profiles).where(eq(profiles.userId, linkRecord.userId)).then(r => r[0]);

  await bot.sendMessage(
    chatId,
    `🎉 綁定成功！\n\n` +
      `👤 ${profile?.name || "朝聖者"}，歡迎連接平安同行！\n\n` +
      `您現在可以透過 Telegram 接收旅程通知，\n` +
      `也可以使用指令快速查看行程和寫日誌。\n\n` +
      `輸入 /help 查看所有可用指令。`,
  );
}

// --- Helper functions ---

async function getTelegramLink(chatId: string) {
  return db.select().from(telegramLinks)
    .where(eq(telegramLinks.telegramChatId, chatId))
    .then(r => r[0] || null);
}

/**
 * Generate a 6-character alphanumeric link code for a user.
 * Creates or updates the telegram_links record.
 */
export async function generateLinkCode(userId: string): Promise<{ code: string; expiresAt: Date }> {
  const code = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Check if user already has a record (without a chatId — i.e. pending link)
  const existing = await db.select().from(telegramLinks)
    .where(eq(telegramLinks.userId, userId))
    .then(r => r[0]);

  if (existing) {
    if (existing.telegramChatId) {
      // Already linked — throw or return existing
      throw new Error("ALREADY_LINKED");
    }
    // Update existing pending record with new code
    await db.update(telegramLinks)
      .set({ linkCode: code, linkCodeExpiresAt: expiresAt, updatedAt: new Date() })
      .where(eq(telegramLinks.id, existing.id));
  } else {
    // Create new pending record (telegramChatId will be set when user messages the bot)
    await db.insert(telegramLinks).values({
      userId,
      telegramChatId: `pending_${userId}`, // placeholder, will be replaced on link
      linkCode: code,
      linkCodeExpiresAt: expiresAt,
    });
  }

  return { code, expiresAt };
}

/**
 * Get user's Telegram link status
 */
export async function getTelegramLinkByUserId(userId: string) {
  return db.select().from(telegramLinks)
    .where(eq(telegramLinks.userId, userId))
    .then(r => {
      const record = r[0];
      if (!record) return null;
      // Only return as "linked" if it has a real chatId
      if (record.telegramChatId.startsWith("pending_")) {
        return { ...record, isLinked: false };
      }
      return { ...record, isLinked: true };
    });
}

/**
 * Unlink Telegram from a user account
 */
export async function unlinkTelegram(userId: string): Promise<void> {
  const link = await db.select().from(telegramLinks)
    .where(eq(telegramLinks.userId, userId))
    .then(r => r[0]);

  if (link && bot && !link.telegramChatId.startsWith("pending_")) {
    try {
      await bot.sendMessage(link.telegramChatId, "⚠️ 您的 Telegram 帳號已從平安同行解除綁定。");
    } catch {
      // ignore if we can't message the user
    }
  }

  await db.delete(telegramLinks).where(eq(telegramLinks.userId, userId));
}

/**
 * Send a notification to a specific user via Telegram
 */
export async function sendTelegramNotification(userId: string, message: string): Promise<boolean> {
  if (!bot) return false;

  const link = await db.select().from(telegramLinks)
    .where(eq(telegramLinks.userId, userId))
    .then(r => r[0]);

  if (!link || link.telegramChatId.startsWith("pending_")) return false;

  try {
    await bot.sendMessage(link.telegramChatId, message);
    return true;
  } catch (error) {
    console.error(`[telegram] Failed to send notification to user ${userId}:`, error);
    return false;
  }
}

/**
 * Send a notification to all linked users in a trip
 */
export async function sendTripNotification(tripId: string, message: string, notificationType?: "devotional" | "schedule" | "rollCall"): Promise<number> {
  if (!bot) return 0;

  // Get all users in the trip who have Telegram linked
  const tripUsers = await db.select({ userId: userRoles.userId })
    .from(userRoles)
    .where(eq(userRoles.tripId, tripId));

  let sent = 0;
  for (const { userId } of tripUsers) {
    const link = await db.select().from(telegramLinks)
      .where(eq(telegramLinks.userId, userId))
      .then(r => r[0]);

    if (!link || link.telegramChatId.startsWith("pending_")) continue;

    // Check notification preferences
    if (notificationType === "devotional" && !link.notifyDevotional) continue;
    if (notificationType === "schedule" && !link.notifySchedule) continue;
    if (notificationType === "rollCall" && !link.notifyRollCall) continue;

    try {
      await bot.sendMessage(link.telegramChatId, message);
      sent++;
    } catch (error) {
      console.error(`[telegram] Failed to notify user ${userId}:`, error);
    }
  }

  return sent;
}
