import { db } from "./db";
import { users, trips, tripDays, groups, userRoles, devotionalCourses, tripInvitations } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

const ADMIN_EMAIL = "saisong@gmail.com";

const TRIP_DATA = {
  title: "2026 土耳其希臘朝聖之旅",
  destination: "土耳其 · 希臘",
  startDate: "2026-03-13",
  endDate: "2026-03-28",
};

const TRIP_DAYS_DATA = [
  { dayNo: 1, date: "2026-03-13", cityArea: "伊斯坦堡 Istanbul", title: "出發日 - 飛往伊斯坦堡", highlights: "搭乘飛機前往歐亞交會的城上之城", attractions: null, bibleRefs: null, breakfast: "X", lunch: "X", dinner: "機上", lodging: "機上", lodgingLevel: null, transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "歐亞交會的城上之城，豐富的歷史、世界遺產與現代生活無違和交融的城市" },
  { dayNo: 2, date: "2026-03-14", cityArea: "伊斯坦堡 Istanbul", title: "伊斯坦堡接機 / 自由活動", highlights: "伊斯坦堡接機 / 自由活動 / 夜宿伊斯坦堡", attractions: null, bibleRefs: "彼前1:1; 徒16:7", breakfast: "機上", lunch: "機上", dinner: "自理", lodging: "Hilton Istanbul Bomonti", lodgingLevel: "5星", transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "羅馬帝國的一個省，在小亞細亞西北角。保羅曾想去該地，但被聖靈阻止" },
  { dayNo: 3, date: "2026-03-15", cityArea: "聖索菲亞 St. Sophia", title: "伊斯坦堡歷史城區探索", highlights: "聖索菲亞 / 跑馬場 / 托普卡匹皇宮(含後宮）/ 聖伊蓮娜教堂 / 藍色清真寺", attractions: "聖索菲亞 / 跑馬場 / 托普卡匹皇宮 / 藍色清真寺 / 托普卡匹皇宮(含後宮） / 聖伊蓮娜教堂", bibleRefs: null, breakfast: "飯店", lunch: "當地特色", dinner: "當地特色", lodging: "Hilton Istanbul Bomonti", lodgingLevel: "5星", transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "聖索菲亞大教堂見證基督歷史的拜占庭式建築典範" },
  { dayNo: 4, date: "2026-03-16", cityArea: "Canakkale", title: "橫跨歐亞 / 特洛伊遺址", highlights: "達達尼爾海峽 / 木馬屠城記木馬 / 特洛伊遺址", attractions: "達達尼爾海峽 / 木馬屠城記木馬 / 特洛伊遺址", bibleRefs: null, breakfast: "飯店", lunch: "當地特色", dinner: "飯店或當地特色", lodging: "Kolin Hotel", lodgingLevel: "5星", transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "達達尼爾海峽是著名的土耳其海峽的一部分，位於亞歐分界處" },
  { dayNo: 5, date: "2026-03-17", cityArea: "特羅亞 Troas", title: "特羅亞 / 古城亞朔", highlights: "特羅亞異象之地 / 古城亞朔使徒保羅古道", attractions: "特羅亞 / 亞朔 / 特羅亞異象之地 / 古城亞朔使徒保羅古道", bibleRefs: "徒16:6-12; 徒20:1-14; 提後4:13; 林後2:12", breakfast: "飯店", lunch: "當地特色", dinner: "飯店或當地特色", lodging: "RAMADA RESORT", lodgingLevel: "5星", transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "保羅在此領受異象前往馬其頓，這是當年保羅前往歐洲宣教的啟航點" },
  { dayNo: 6, date: "2026-03-18", cityArea: "別迦摩 Pergamum", title: "別迦摩 / 推雅推喇 / 士每拿", highlights: "七教會：別迦摩 / 推雅推喇 / 士每拿", attractions: "別迦摩 / 推雅推喇 / 士每拿 / 七教會：別迦摩", bibleRefs: "啟2:12-17; 啟2:18-28; 啟2:8-11; 徒16:14", breakfast: "飯店", lunch: "當地特色", dinner: "飯店或當地特色", lodging: "Kaya İzmir Thermal", lodgingLevel: "5星", transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "別迦摩王國的首都，擁有古代第二大圖書館" },
  { dayNo: 7, date: "2026-03-19", cityArea: "撒狄 Sardis", title: "撒狄 / 非拉鐵非 / 棉花堡", highlights: "七教會：撒狄 / 非拉鐵非 / 希拉波立(棉花堡)", attractions: "非拉鐵非 / 撒狄 / 老底嘉 / 希拉波里斯 / 七教會：撒狄 / 希拉波立(棉花堡)", bibleRefs: "啟3:1-6; 啟3:7-13; 西4:13", breakfast: "飯店", lunch: "當地特色", dinner: "飯店或當地特色", lodging: "PAMUKKALE KAYA THERMAL SPA", lodgingLevel: "5星", transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "撒狄是歷史上第一次鑄造硬幣的地方，擁有豐富的黃金資源" },
  { dayNo: 8, date: "2026-03-20", cityArea: "老底嘉 Laodicea", title: "老底嘉 / 以弗所", highlights: "老底嘉 / 使徒約翰之墓 / 皮件工廠秀 / 以弗所古城", attractions: "以弗所古城 / 以弗所博物館 / 老底嘉 / 使徒約翰之墓 / 皮件工廠秀", bibleRefs: "啟3:14-22; 啟2:1-7; 徒18:19-24; 提前1:3", breakfast: "飯店", lunch: "當地特色", dinner: "飯店或當地特色", lodging: "Hotel Charisma De Luxe", lodgingLevel: "5星", transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "以弗所是初代教會中心，2015年列入世界遺產" },
  { dayNo: 9, date: "2026-03-21", cityArea: "拔摩島 Patmos", title: "愛琴海郵輪 / 拔摩島", highlights: "聖約翰修道院 / 啟示錄洞窟", attractions: "拔摩島 / 聖約翰修道院 / 啟示錄洞窟", bibleRefs: "啟1:9-21", breakfast: "飯店", lunch: "郵輪用餐", dinner: "郵輪用餐", lodging: "Celestyal Cruises 郵輪", lodgingLevel: null, transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "約翰在此領受啟示，寫下啟示錄" },
  { dayNo: 10, date: "2026-03-22", cityArea: "聖托里尼 Santorini", title: "聖托里尼自由活動", highlights: "聖托里尼 (導遊帶路自由活動)", attractions: "聖托里尼 / 聖托里尼 (導遊帶路自由活動)", bibleRefs: null, breakfast: "郵輪用餐", lunch: "郵輪用餐或自理", dinner: "郵輪用餐", lodging: "Celestyal Cruises 郵輪", lodgingLevel: null, transport: null, freeTimeFlag: true, shoppingFlag: false, mustKnow: null, notes: "沿著懸崖建立起的白色城市，亞特蘭提斯傳說的源頭" },
  { dayNo: 11, date: "2026-03-23", cityArea: "哥林多 Corinth", title: "希臘雅典 / 哥林多 / 雅典衛城", highlights: "下船 / 哥林多 / 堅革哩 / 雅典衛城 / 亞略巴古", attractions: "哥林多 / 雅典衛城 / 亞略巴古 / 堅革哩", bibleRefs: "林前; 林後; 徒17:15-18; 徒18:18", breakfast: "郵輪用餐", lunch: "當地特色", dinner: "飯店或當地特色", lodging: "Mirage Chalkida City Resort", lodgingLevel: "5星", transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "保羅曾造訪哥林多三次，在此建立教會" },
  { dayNo: 12, date: "2026-03-24", cityArea: "帖撒羅尼迦", title: "溫泉關 / 天空之城 / 庇哩亞", highlights: "溫泉關古戰場 / 邁泰奧拉(天空之城) / 庇哩亞 / 帖撒羅尼迦", attractions: "腓立比 / 庇哩亞 / 帖撒羅尼迦 / 溫泉關古戰場 / 邁泰奧拉(天空之城)", bibleRefs: "徒17:10-15; 帖前; 帖後", breakfast: "飯店", lunch: "當地特色", dinner: "飯店或當地特色", lodging: "GRECOTEL LARISSA IMPERIAL", lodgingLevel: "5星", transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "邁泰奧拉為1988年世界複合遺產，修道院建築群" },
  { dayNo: 13, date: "2026-03-25", cityArea: "腓立比 Philippi", title: "耶孫的家 / 暗妃波里 / 腓立比", highlights: "耶孫的家 / 暗妃波里 / 腓立比 / 尼亞波利(卡瓦拉)", attractions: "米特歐拉 / 耶孫的家 / 暗妃波里 / 腓立比 / 尼亞波利(卡瓦拉)", bibleRefs: "徒16:11; 徒17:1-10; 腓立比書", breakfast: "飯店", lunch: "當地特色", dinner: "飯店或當地特色", lodging: "Grecotel Astir Palace", lodgingLevel: "5星", transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "腓立比是保羅在歐洲傳福音的第一個城市" },
  { dayNo: 14, date: "2026-03-26", cityArea: "塔克辛廣場 Taksim", title: "返回伊斯坦堡 / 自由購物", highlights: "希臘土耳其邊界 / 塔克辛廣場自由活動", attractions: "德爾非 / 塔克辛廣場自由活動", bibleRefs: null, breakfast: "飯店", lunch: "當地特色", dinner: "X", lodging: "Hilton Istanbul Bomonti", lodgingLevel: "5星", transport: null, freeTimeFlag: true, shoppingFlag: true, mustKnow: null, notes: "塔克辛廣場與獨立大街是土耳其時尚購物天堂" },
  { dayNo: 15, date: "2026-03-27", cityArea: "伊斯坦堡", title: "返程航班", highlights: "悠閒早餐後前往機場 / 返程航班", attractions: null, bibleRefs: null, breakfast: "飯店", lunch: "機上", dinner: "機上", lodging: "機上", lodgingLevel: null, transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "帶著滿滿的故事踏上回家的路" },
  { dayNo: 16, date: "2026-03-28", cityArea: "溫暖的家", title: "抵達溫暖的家", highlights: "返抵國門，結束朝聖之旅", attractions: null, bibleRefs: "太18:22", breakfast: "機上", lunch: "X", dinner: "X", lodging: "溫暖的家", lodgingLevel: null, transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "腳掌所踏之地都要成為祝福" },
];

const DEVOTIONAL_COURSE = {
  dayNo: 1,
  title: "為了主出發",
  scripture: "詩篇 1:1-4",
  reflection: "eataewt",
  action: "sadfasfsadf",
  prayer: "sadfsadfasdf",
};

async function syncDataToCurrentDb() {
  try {
    const allTrips = await db.select().from(trips).limit(1);
    if (!allTrips.length) {
      console.log("[data-sync] no trips found, skipping sync");
      return;
    }

    const tripId = allTrips[0].id;
    const existingDays = await db.select().from(tripDays).where(eq(tripDays.tripId, tripId)).limit(1);
    if (existingDays.length) {
      console.log("[data-sync] trip already has days, skipping sync");
      return;
    }

    console.log("[data-sync] syncing data for trip:", tripId);

    await db.update(trips).set({
      title: TRIP_DATA.title,
      destination: TRIP_DATA.destination,
      startDate: TRIP_DATA.startDate,
      endDate: TRIP_DATA.endDate,
    }).where(eq(trips.id, tripId));
    console.log("[data-sync] updated trip info");

    const dayValues = TRIP_DAYS_DATA.map(d => ({ ...d, tripId }));
    await db.insert(tripDays).values(dayValues);
    console.log("[data-sync] inserted", dayValues.length, "trip days");

    const existingGroups = await db.select().from(groups).where(eq(groups.tripId, tripId)).limit(1);
    if (!existingGroups.length) {
      await db.insert(groups).values({ tripId, name: "第一小組" });
      console.log("[data-sync] created group");
    }

    const existingCourses = await db.select().from(devotionalCourses).where(eq(devotionalCourses.tripId, tripId)).limit(1);
    if (!existingCourses.length) {
      await db.insert(devotionalCourses).values({ ...DEVOTIONAL_COURSE, tripId });
      console.log("[data-sync] created devotional course");
    }

    const existingInvitations = await db.select().from(tripInvitations).where(eq(tripInvitations.tripId, tripId)).limit(1);
    if (!existingInvitations.length) {
      await db.insert(tripInvitations).values({
        tripId,
        code: "YEUC",
        description: "第一次報名",
        maxUses: null,
        usedCount: 0,
        expiresAt: new Date("2026-03-07"),
        isActive: true,
      });
      console.log("[data-sync] created invitation code");
    }

    const adminUser = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);
    if (adminUser.length) {
      const userId = adminUser[0].id;
      const memberRole = await db.select().from(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "member"), eq(userRoles.tripId, tripId)))
        .limit(1);
      if (!memberRole.length) {
        await db.insert(userRoles).values({ userId, role: "member", tripId });
        console.log("[data-sync] created member role for admin user");
      }

      const adminRole = await db.select().from(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "admin"), eq(userRoles.tripId, tripId)))
        .limit(1);
      if (!adminRole.length) {
        await db.insert(userRoles).values({ userId, role: "admin", tripId });
        console.log("[data-sync] created admin role for trip");
      }
    }

    console.log("[data-sync] sync complete");
  } catch (error) {
    console.error("[data-sync] error:", error);
  }
}

export async function runStartupMigration() {
  try {
    console.log("[startup-migration] checking admin role...");

    const adminUser = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);
    if (!adminUser.length) {
      console.log("[startup-migration] admin user not found, skipping");
      return;
    }

    const userId = adminUser[0].id;
    console.log("[startup-migration] found admin user:", userId);

    const existingAdminRole = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "admin")))
      .limit(1);

    if (!existingAdminRole.length) {
      const existingTrips = await db.select().from(trips).limit(1);
      const tripId = existingTrips.length ? existingTrips[0].id : null;

      await db.insert(userRoles).values({
        userId,
        role: "admin",
        tripId,
      });
      console.log("[startup-migration] created admin role for user:", userId);
    } else {
      console.log("[startup-migration] admin role already exists");
    }

    await syncDataToCurrentDb();

    const nullTripRoles = await db.select().from(userRoles)
      .where(and(eq(userRoles.userId, userId), isNull(userRoles.tripId)));
    if (nullTripRoles.length) {
      const validRoles = await db.select().from(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "admin")))
        .limit(10);
      const hasValidAdmin = validRoles.some(r => r.tripId !== null);
      if (hasValidAdmin) {
        for (const r of nullTripRoles) {
          await db.delete(userRoles).where(eq(userRoles.id, r.id));
        }
        console.log("[startup-migration] cleaned up", nullTripRoles.length, "null-tripId roles");
      }
    }

    console.log("[startup-migration] complete");
  } catch (error) {
    console.error("[startup-migration] error:", error);
  }
}
