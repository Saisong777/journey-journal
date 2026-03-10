import { db } from "./db";
import { pool } from "./db";
import { users, trips, tripDays, groups, userRoles, devotionalCourses, tripInvitations, platformRoles, tripNotes, tripNoteAssignments, bibleVerses, appSettings, paulJourneys } from "@shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

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

const TURKEY_NOTE_CONTENT = `【關於餐食】
◆候機、轉機時，若逢用餐時段，該餐煩請自理。
◆餐廳用餐之單點飲料需自費。
◆早餐與晚餐多是在住宿酒店內使用，領隊會宣佈用餐時間與規定。
◆享用自助餐時，請先少量取用，確定口味OK後再度取用，避免浪費。
◆中午的用餐時間，有時候為了配合景點參觀，會遲緩進餐。
◆由於土耳其是伊斯蘭文化國家，沒有豬肉，若攜帶零食入境時請避免外包裝上出現豬的圖案。
◆避免生飲，每日提供3瓶瓶裝水。若不足請自行購買。
◆旅遊國家沒有飲用熱水的習慣，若每日需飲用熱水，可自行準備熱水壺。

【關於天氣及服裝】
本行程涵蓋海島+希臘本土+山區修道院+土耳其小亞細亞。3–4月屬春季但變化大，重點不是極冷，而是「早晚溫差、海風、山風、偶雨」與長時間遺址步行。

地形與體感：海島風大，船上與觀景台體感偏涼；雅典與各遺址多為曝曬平地或丘陵，走路時間長；梅黛奧拉屬山區高岩柱，風強、石階多、比平地冷；土耳其遺址多在開闊地，白色石灰岩（希拉波立）反光強，日晒明顯。

穿搭核心：洋蔥式＋防風＋耐走。建議帶：吸汗長袖/薄發熱衣（內層）、薄針織或刷毛（中層）、防風外套或輕羽絨（外層）；下身以長褲為主，女生另備長裙或大披肩（進修道院/清真寺可遮腿遮肩）。鞋子以止滑包腳運動鞋/健行鞋為主，避免跟鞋與薄底平底鞋。配件必帶：大披肩/圍巾（保暖＋遮肩）、折傘或輕雨衣、太陽眼鏡、防曬、襪子（進清真寺需脫鞋）。

宗教服裝：梅黛奧拉修道院需遮肩、過膝、避免緊身；清真寺女生需頭巾＋長袖＋長裙/長褲，男生避免短褲背心。

【關於住宿】
（1）酒店浴室有大浴巾、毛巾、洗髮沐浴乳；但不一定提供牙刷、牙膏、拖鞋、浴帽等。支持環保請自行攜帶。
（2）基於國際禮儀，請勿穿拖鞋進餐廳用餐。
（3）浴室地板大部份沒有排水孔，洗澡時，請將浴簾拉上並置於浴缸內。
（4）如廁後請將衛生紙直接丟入馬桶沖掉。
（5）請珍惜與室友相處的機會，彼此包容、關懷、照顧。
（6）入住各酒店時；務必先檢查房間內的冷暖氣的遙控器、冷熱水及電等；一旦發現有問題，請務必當場告知領隊即時處理。有的HOTEL在窗戶開啟時，空調會自動關閉，開空調前請確認門窗已關好。

【關於出行】
（1）飛機上：如想要更換座位時，請等飛機起飛穩定（系好安全帶燈號熄滅）後才處理。
（2）遊覽車（巴士）：前二排坐位是給當地導遊、領隊使用；其餘坐位基於公平原則請每日輪流協調。每當車輛駛動時，不要再走動，以免發生意外。
（3）集合：注意領隊宣佈的時間與地點，一定要（守時）。
（4）參觀行進時，請保持秩序（不要脫隊）並注意安全（切忌邊走路邊掏東西）。
（5）時差：北京(臺北)時間+5小時/美東時間-8小時
（6）照相、攝影：底片、電池
（7）電壓、插頭：220v、雙圓孔
（8）貨幣：土耳其主要貨幣是里拉 (TL) 可使用美金。希臘的貨幣是歐元（EUR）。自動提款機在城市和旅遊區隨處可見，旅客可以使用金融卡或信用卡提取現金。大多數飯店、餐廳和商店都接受信用卡，但建議攜帶一些現金，以便在當地市場或小酒館進行小額採購和交易。

【保險】
除了旅行社依規定投保的責任險之外，建議再去投保旅遊平安險（尤其是加強疾病醫療險）。

【出入境注意事項】
A. 出境登機流程：
（1）辦理行李托運，換取登機
（2）前往通關櫃檯排隊通關
（3）接受邊防（移民局）檢查（出示護照、簽證、登機牌）
（4）接受安全檢查
（5）前往登機證上指定的登機口候機、登機

B. 行李托運：
（1）托運行李及手提行重量及件數請依照各航空公司規定。
（2）托運行李裡切勿放現金、照相機、手提電腦等貴重物品，以防被竊。
（3）行動電源、鋰電池等不能托運。
（4）液體、膏狀物品、膠狀物品等儘量托運，若不托運則請放置於容量不超過100毫升的容器裡，用可重新封口的透明密膠袋裝好，以備機場安檢，每名旅客每次僅充許攜帶一個透明膠袋，超出部份應托運。
（5）保留好行李票，如果托運行李受損或遺失，必須當場於機場行李櫃檯報案，並出示登機卡和行李票辦理必要的手續。
（6）藥物（如糖尿病藥物包等旅客必需的液態藥品及針劑，憑醫生處方或醫院證明）、嬰兒食品（有嬰兒隨行，只限旅程所需數量如牛奶、母乳等）隨身攜帶。

【其他事項】
*如遇不可抗拒之情況，本公司保有變更酒店及班機行程之權利。
*土耳其及希臘緊急電話：112

團隊連絡人
領隊：
持證導遊：`;

const TRIP_NOTES_SEED = [
  {
    title: "土耳其",
    content: TURKEY_NOTE_CONTENT,
  },
];

async function migrateOldNotesToRegional(tripId: string) {
  try {
    const existingNotes = await db.select().from(tripNotes);
    const oldStyleTitles = ["關於餐食", "關於天氣及服裝", "關於住宿", "關於出行", "保險", "出入境注意事項", "其他事項"];
    const oldNotes = existingNotes.filter(n => oldStyleTitles.includes(n.title));

    if (oldNotes.length < 3) return;

    console.log("[data-sync] migrating", oldNotes.length, "old-style notes to regional format...");

    const affectedTripIds = new Set<string>();
    for (const note of oldNotes) {
      const assignments = await db.select().from(tripNoteAssignments)
        .where(eq(tripNoteAssignments.noteId, note.id));
      assignments.forEach(a => affectedTripIds.add(a.tripId));
    }

    for (const note of oldNotes) {
      await db.delete(tripNoteAssignments).where(eq(tripNoteAssignments.noteId, note.id));
      await db.delete(tripNotes).where(eq(tripNotes.id, note.id));
    }

    const [regionalNote] = await db.insert(tripNotes).values({
      title: "土耳其",
      content: TURKEY_NOTE_CONTENT,
    }).returning();

    for (const tid of affectedTripIds) {
      await db.insert(tripNoteAssignments).values({
        tripId: tid,
        noteId: regionalNote.id,
        sortOrder: 1,
      });
    }

    console.log("[data-sync] migrated to regional note '土耳其', assigned to", affectedTripIds.size, "trip(s)");
  } catch (error) {
    console.error("[data-sync] migration error:", error);
  }
}

async function seedTripNotes(tripId: string) {
  try {
    await migrateOldNotesToRegional(tripId);

    const existingNotes = await db.select().from(tripNotes).limit(1);
    if (existingNotes.length) {
      console.log("[data-sync] trip notes already exist, skipping seed");
      return;
    }

    console.log("[data-sync] seeding trip notes...");
    for (let i = 0; i < TRIP_NOTES_SEED.length; i++) {
      const seed = TRIP_NOTES_SEED[i];
      const [note] = await db.insert(tripNotes).values({
        title: seed.title,
        content: seed.content,
      }).returning();

      await db.insert(tripNoteAssignments).values({
        tripId,
        noteId: note.id,
        sortOrder: i + 1,
      });
    }
    console.log("[data-sync] seeded", TRIP_NOTES_SEED.length, "regional trip note(s)");
  } catch (error) {
    console.error("[data-sync] trip notes seed error:", error);
  }
}

async function importBibleVerses() {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS bible_verses (
          id SERIAL PRIMARY KEY,
          book_name TEXT NOT NULL,
          book_number INTEGER NOT NULL,
          chapter INTEGER NOT NULL,
          verse INTEGER NOT NULL,
          text TEXT NOT NULL
        )
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_bible_book_chapter_verse ON bible_verses (book_name, chapter, verse)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_bible_book_number ON bible_verses (book_number)`);

      const countResult = await client.query("SELECT COUNT(*) as cnt FROM bible_verses");
      const count = parseInt(countResult.rows[0].cnt, 10);
      if (count > 0) {
        console.log(`[bible-import] bible_verses already has ${count} rows, skipping import`);
        return;
      }

      const csvPath = path.resolve(process.cwd(), "attached_assets/chinese_union_trad_xx_corrected_1772467521173.csv");
      if (!fs.existsSync(csvPath)) {
        console.log("[bible-import] CSV file not found at", csvPath);
        return;
      }

      console.log("[bible-import] importing Bible verses from CSV...");
      let raw = fs.readFileSync(csvPath, "utf-8");
      if (raw.charCodeAt(0) === 0xFEFF) {
        raw = raw.slice(1);
      }

      const lines = raw.split("\n");
      const BATCH_SIZE = 500;
      let inserted = 0;

      for (let i = 1; i < lines.length; i += BATCH_SIZE) {
        const batch = lines.slice(i, i + BATCH_SIZE);
        const values: string[] = [];
        const params: any[] = [];
        let paramIdx = 0;

        for (const line of batch) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          const firstComma = trimmed.indexOf(",");
          const secondComma = trimmed.indexOf(",", firstComma + 1);
          const thirdComma = trimmed.indexOf(",", secondComma + 1);
          const fourthComma = trimmed.indexOf(",", thirdComma + 1);
          const fifthComma = trimmed.indexOf(",", fourthComma + 1);

          if (fifthComma === -1) continue;

          const bookName = trimmed.substring(firstComma + 1, secondComma);
          const bookNumber = parseInt(trimmed.substring(secondComma + 1, thirdComma), 10);
          const chapter = parseInt(trimmed.substring(thirdComma + 1, fourthComma), 10);
          const verse = parseInt(trimmed.substring(fourthComma + 1, fifthComma), 10);
          const text = trimmed.substring(fifthComma + 1).replace(/ +/g, "");

          if (isNaN(bookNumber) || isNaN(chapter) || isNaN(verse)) continue;

          values.push(`($${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5})`);
          params.push(bookName, bookNumber, chapter, verse, text);
          paramIdx += 5;
        }

        if (values.length > 0) {
          await client.query(
            `INSERT INTO bible_verses (book_name, book_number, chapter, verse, text) VALUES ${values.join(", ")}`,
            params
          );
          inserted += values.length;
        }
      }

      console.log(`[bible-import] imported ${inserted} Bible verses`);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[bible-import] error:", error);
  }
}

async function importPaulJourneys() {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS paul_journeys (
          id SERIAL PRIMARY KEY,
          journey TEXT NOT NULL,
          sequence INTEGER NOT NULL,
          year TEXT,
          location TEXT NOT NULL,
          scripture TEXT,
          companions TEXT,
          events TEXT,
          epistles TEXT
        )
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_paul_journeys_journey ON paul_journeys (journey)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_paul_journeys_sequence ON paul_journeys (journey, sequence)`);

      const countResult = await client.query("SELECT COUNT(*) as cnt FROM paul_journeys");
      const count = parseInt(countResult.rows[0].cnt, 10);
      if (count > 0) {
        console.log(`[paul-import] paul_journeys already has ${count} rows, skipping import`);
        return;
      }

      const csvPath = path.resolve(process.cwd(), "attached_assets/保羅四次的旅遊_1772473482625.csv");
      if (!fs.existsSync(csvPath)) {
        console.log("[paul-import] CSV file not found at", csvPath);
        return;
      }

      console.log("[paul-import] importing Paul's journeys from CSV...");
      let raw = fs.readFileSync(csvPath, "utf-8");
      if (raw.charCodeAt(0) === 0xFEFF) {
        raw = raw.slice(1);
      }

      const lines = raw.split("\n");
      let inserted = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(",");
        if (parts.length < 8) continue;

        const journey = parts[0].trim();
        const sequence = parseInt(parts[1].trim(), 10);
        const year = parts[2].trim() || null;
        const location = parts[3].trim();
        const scripture = parts[4].trim() || null;
        const companions = parts[5].trim() || null;
        const events = parts[6].trim() || null;
        const epistles = parts[7].trim() || null;

        if (!journey || isNaN(sequence) || !location) continue;

        await client.query(
          `INSERT INTO paul_journeys (journey, sequence, year, location, scripture, companions, events, epistles) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [journey, sequence, year, location, scripture, companions, events, epistles === "無" ? null : epistles]
        );
        inserted++;
      }

      console.log(`[paul-import] imported ${inserted} rows into paul_journeys`);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[paul-import] error:", error);
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
      await db.insert(userRoles).values({
        userId,
        role: "admin",
        tripId: null,
      });
      console.log("[startup-migration] created admin role (global) for user:", userId);
    } else {
      console.log("[startup-migration] admin role already exists");
    }

    const existingPlatformRole = await db
      .select()
      .from(platformRoles)
      .where(eq(platformRoles.userId, userId))
      .limit(1);

    if (!existingPlatformRole.length) {
      await db.insert(platformRoles).values({
        userId,
        role: "super_admin",
        permissions: null,
        assignedBy: null,
      });
      console.log("[startup-migration] created super_admin platform role for user:", userId);
    } else {
      console.log("[startup-migration] platform role already exists:", existingPlatformRole[0].role);
    }

    await syncDataToCurrentDb();

    const allTrips = await db.select().from(trips).limit(1);
    if (allTrips.length) {
      await seedTripNotes(allTrips[0].id);
    }

    try {
      const client = await pool.connect();
      try {
        await client.query(`ALTER TABLE devotional_courses ADD COLUMN IF NOT EXISTS place TEXT`);
        console.log("[startup-migration] ensured place column on devotional_courses");
      } finally {
        client.release();
      }
    } catch (e) {
      console.error("[startup-migration] place column migration error:", e);
    }

    await importBibleVerses();

    try {
      const client = await pool.connect();
      try {
        await client.query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS bible_library_enabled BOOLEAN DEFAULT FALSE`);
        console.log("[startup-migration] ensured bible_library_enabled column on trips");

        await client.query(`
          CREATE TABLE IF NOT EXISTS app_settings (
            id SERIAL PRIMARY KEY,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL
          )
        `);
        const existing = await client.query(`SELECT 1 FROM app_settings WHERE key = 'bible_library_enabled'`);
        if (existing.rows.length === 0) {
          await client.query(`INSERT INTO app_settings (key, value) VALUES ('bible_library_enabled', 'false')`);
        }
        console.log("[startup-migration] ensured app_settings table");
      } finally {
        client.release();
      }
    } catch (e) {
      console.error("[startup-migration] app_settings/bible_library migration error:", e);
    }

    await importPaulJourneys();

    try {
      const client = await pool.connect();
      try {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE`);
        console.log("[startup-migration] ensured google_id column on users");
      } finally {
        client.release();
      }
    } catch (e) {
      console.error("[startup-migration] google_id column migration error:", e);
    }

    try {
      const client = await pool.connect();
      try {
        await client.query(`ALTER TABLE devotional_courses ADD COLUMN IF NOT EXISTS life_question TEXT`);
        console.log("[startup-migration] ensured life_question column on devotional_courses");
      } finally {
        client.release();
      }
    } catch (e) {
      console.error("[startup-migration] life_question column migration error:", e);
    }

    console.log("[startup-migration] complete");
  } catch (error) {
    console.error("[startup-migration] error:", error);
  }
}
