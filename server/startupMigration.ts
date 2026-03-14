import { db } from "./db";
import { pool } from "./db";
import { users, trips, tripDays, groups, userRoles, devotionalCourses, tripInvitations, platformRoles, tripNotes, tripNoteAssignments, bibleVerses, appSettings, paulJourneys } from "@shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

const ADMIN_EMAIL = "saisong@gmail.com";

const TRIP_DATA = {
  title: "2026 土耳其希臘平安同行",
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
  { dayNo: 7, date: "2026-03-19", cityArea: "撒狄 Sardis", title: "撒狄 / 非拉鐵非 / 棉花堡", highlights: "七教會：撒狄 / 非拉鐵非 / 希拉波立(棉花堡)", attractions: "非拉鐵非 / 撒狄 / 老底嘉 / 希拉波里斯 / 七教會：撒狄 / 希拉波立(棉花堡)", bibleRefs: "啟3:1-6; 啟3:7-13; 西4:13", breakfast: "飯店", lunch: "當地特色", dinner: "飯店或當地特色", lodging: "Colossae Hotel", lodgingLevel: "5星", transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "撒狄是歷史上第一次鑄造硬幣的地方，擁有豐富的黃金資源" },
  { dayNo: 8, date: "2026-03-20", cityArea: "老底嘉 Laodicea", title: "老底嘉 / 以弗所", highlights: "老底嘉 / 使徒約翰之墓 / 皮件工廠秀 / 以弗所古城", attractions: "以弗所古城 / 以弗所博物館 / 老底嘉 / 使徒約翰之墓 / 皮件工廠秀", bibleRefs: "啟3:14-22; 啟2:1-7; 徒18:19-24; 提前1:3", breakfast: "飯店", lunch: "當地特色", dinner: "飯店或當地特色", lodging: "Hotel Charisma De Luxe", lodgingLevel: "5星", transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "以弗所是初代教會中心，2015年列入世界遺產" },
  { dayNo: 9, date: "2026-03-21", cityArea: "雅典 Athens", title: "搭機飛往雅典 / 雅典市區觀光", highlights: "搭機 伊茲密爾→伊斯坦堡→雅典 / 憲法廣場 / 國會大廈 / 無名戰士墓 / 奧林匹克體育場 / 總統府", attractions: "憲法廣場 / 國會大廈 / 無名戰士墓 / 奧林匹克體育場 / 總統府", bibleRefs: "徒17:15-18", breakfast: "飯店", lunch: "機上", dinner: "特色晚餐", lodging: "Radisson Blu Park Hotel Athens", lodgingLevel: "5星", transport: "飛機", freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "抵達雅典後展開市區觀光，保羅曾在雅典等候西拉和提摩太" },
  { dayNo: 10, date: "2026-03-22", cityArea: "雅典 Athens", title: "雅典深度聖經＋歷史觀光", highlights: "雅典衛城 / 帕德嫩神廟 / 亞略巴古 / 雅典古市集（外觀）/ 哈德良拱門", attractions: "雅典衛城 / 帕德嫩神廟 / 亞略巴古 / 雅典古市集 / 哈德良拱門", bibleRefs: "徒17:15-34", breakfast: "飯店", lunch: "當地特色", dinner: "飯店或當地特色", lodging: "Radisson Blu Park Hotel Athens", lodgingLevel: "5星", transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "雅典衛城為UNESCO世界遺產，保羅在亞略巴古向雅典人宣講未識之神" },
  { dayNo: 11, date: "2026-03-23", cityArea: "哥林多 Corinth", title: "哥林多運河 / 哥林多古城", highlights: "哥林多運河 / 哥林多考古博物館 / 哥林多古城 / 審判台 / 堅革哩", attractions: "哥林多運河 / 哥林多考古博物館 / 哥林多古城 / 堅革哩", bibleRefs: "林前; 林後; 徒18:1-18", breakfast: "飯店", lunch: "當地特色", dinner: "飯店或當地特色", lodging: "Mirage Chalkida City Resort", lodgingLevel: "5星", transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "保羅曾造訪哥林多三次，在此建立教會" },
  { dayNo: 12, date: "2026-03-24", cityArea: "拉里薩 Larissa", title: "溫泉關 / 天空之城", highlights: "溫泉關古戰場 / 邁泰奧拉(天空之城) / 拉里薩", attractions: "溫泉關古戰場 / 邁泰奧拉(天空之城) / 拉里薩", bibleRefs: null, breakfast: "飯店", lunch: "當地特色", dinner: "飯店或當地特色", lodging: "GRECOTEL LARISSA IMPERIAL", lodgingLevel: "5星", transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "邁泰奧拉為1988年世界複合遺產，修道院建築群" },
  { dayNo: 13, date: "2026-03-25", cityArea: "腓立比 Philippi", title: "帖撒羅尼迦 / 腓立比", highlights: "帖撒羅尼迦 / 耶孫的家 / 暗妃波里 / 腓立比 / 呂底亞受洗處 / 尼亞波利(卡瓦拉) / 亞歷山卓波利", attractions: "帖撒羅尼迦 / 耶孫的家 / 暗妃波里 / 腓立比 / 尼亞波利(卡瓦拉) / 亞歷山卓波利", bibleRefs: "帖前; 帖後; 徒16:11; 徒17:1-10; 腓立比書", breakfast: "飯店", lunch: "當地特色", dinner: "飯店或當地特色", lodging: "Grecotel Astir Palace", lodgingLevel: "5星", transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "帖撒羅尼迦為1988年世界遺產。腓立比是保羅在歐洲傳福音的第一個城市" },
  { dayNo: 14, date: "2026-03-26", cityArea: "塔克辛廣場 Taksim", title: "返回伊斯坦堡 / 自由購物", highlights: "希臘土耳其邊界 / 塔克辛廣場自由活動", attractions: "塔克辛廣場自由活動", bibleRefs: null, breakfast: "飯店", lunch: "當地特色", dinner: "自理", lodging: "Hilton Istanbul Bomonti", lodgingLevel: "5星", transport: null, freeTimeFlag: true, shoppingFlag: true, mustKnow: null, notes: "塔克辛廣場與獨立大街是土耳其時尚購物天堂" },
  { dayNo: 15, date: "2026-03-27", cityArea: "伊斯坦堡", title: "返程航班", highlights: "悠閒早餐後前往機場 / 返程航班", attractions: null, bibleRefs: null, breakfast: "飯店", lunch: "機上", dinner: "機上", lodging: "機上", lodgingLevel: null, transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "帶著滿滿的故事踏上回家的路" },
  { dayNo: 16, date: "2026-03-28", cityArea: "溫暖的家", title: "抵達溫暖的家", highlights: "返抵國門，結束平安同行", attractions: null, bibleRefs: "太18:22", breakfast: "機上", lunch: "X", dinner: "X", lodging: "溫暖的家", lodgingLevel: null, transport: null, freeTimeFlag: false, shoppingFlag: false, mustKnow: null, notes: "腳掌所踏之地都要成為祝福" },
];

export const DEVOTIONAL_COURSES_DATA = [
  { dayNo: 1, place: "機上→伊斯坦堡", title: "離開，是看見自己的開始", scripture: "創12:1「離開你的本地、本族、父家」", reflection: "飛機起飛的那一刻，你離開了熟悉的一切——日常節奏、角色責任、習慣軌道。旅行的意義不只是去哪裡，而是離開之後，你才發現自己一直抓著什麼不放。亞伯拉罕被呼召離開時，目的地是「我要指示你的地方」——連地址都沒有。離開，需要的不是資訊，是信任。", action: "寫下兩句話：「這趟旅程，我最想放下的是＿＿＿」和「我最怕發生的是＿＿＿」。寫完後不修改，收起來。", prayer: "神啊，我帶著期待也帶著不安出發。在三萬英尺的高空，讓我開始卸下平日的面具，進入祢的節奏。", lifeQuestion: "離開日常軌道後，你心裡第一個浮上來的情緒是什麼？它透露了你內心真正的狀態嗎？" },
  { dayNo: 2, place: "伊斯坦堡（接機／自由活動）", title: "不舒服的地方，往往是成長的入口", scripture: "彼前2:11「你們是客旅，是寄居的」", reflection: "踏上陌生的土地，語言不通、路不熟、食物不同。這種「不舒服感」其實是好的——它打破你的自動駕駛模式，讓感官重新甦醒。彼得寫信給「分散各處」的信徒，提醒他們本來就是客旅。當我們承認自己不是什麼都懂，反而變得柔軟、開放、謙卑。", action: "今天遇到任何不順——延誤、迷路、溝通不良——練習一句話：「這正在教我什麼？」不急著抱怨，先觀察自己的反應。", prayer: "主啊，讓我在陌生中不急著掌控，而是學會放鬆、信任、接受。讓不舒服成為我柔軟的起點。", lifeQuestion: "你上一次處在完全陌生的環境是什麼時候？那段經驗，改變了你什麼？" },
  { dayNo: 3, place: "伊斯坦堡（聖索菲亞／藍色清真寺／跑馬場／托普卡匹）", title: "壯觀的建築背後，是人心深處對「永恆」的渴望", scripture: "傳3:11「神將永恆安置在世人心裡」", reflection: "聖索菲亞大教堂一千五百年來從教堂變清真寺、變博物館、又變回清真寺。外在形式不斷翻轉，但人心對「比我更大的存在」的渴望從未消失。仰頭看穹頂時，無論你信什麼，那份「被震撼」的感覺是真實的——那就是永恆在你心裡回響。", action: "找一個角落，三分鐘不拍照、不打卡，只是抬頭看、深呼吸，然後問自己：「我心裡最深的渴望是什麼？」", prayer: "造物主啊，千年來人類不斷蓋起壯觀的殿堂尋找祢。此刻，我也站在這裡，帶著我的渴望和疑問。", lifeQuestion: "站在壯觀的古蹟前，那種「被震撼」的感覺從何而來？你覺得那份渴望指向什麼？" },
  { dayNo: 4, place: "恰納卡萊／達達尼爾海峽／特洛伊", title: "最大的威脅，常是你親手請進來的", scripture: "雅1:14「各人被自己的私慾牽引誘惑」", reflection: "特洛伊人打了十年仗沒有輸，卻被一匹「禮物」毀滅。木馬最可怕的地方不是它的設計，而是有人決定把它拉進城門。我們的生命也一樣——真正的威脅往往不是外來的壓力，而是我們以為無害、甚至以為是安慰的習慣或依賴。", action: "寫下你生命中的一匹「木馬」（手機成癮、討好、比較心、逃避衝突、用忙碌麻痺自己……），然後寫一句：「我看見你了，你不再是我的保護。」", prayer: "主啊，給我誠實面對自己的勇氣。幫助我辨認那些偽裝成安慰的破壞，不再讓它進門。", lifeQuestion: "如果你的生活是一座城，什麼是你明知有風險、卻一直捨不得關門拒絕的「木馬」？" },
  { dayNo: 5, place: "特羅亞Troas／亞朔Assos", title: "在噪音中刻意安靜，是一種勇敢", scripture: "詩46:10「你們要安靜，要知道我是神」", reflection: "特羅亞是保羅跨向歐洲宣教的起點——也是少年猶推古因疲憊睡著而墜樓的地方（徒20:9）。旅程到了中段，興奮感退去，疲憊感上來——這時最容易「靈性墜樓」。但在亞朔，保羅刻意讓同工搭船，自己選擇獨自步行。在最忙的時候爭取安靜，不是浪費時間，是為了聽見最重要的聲音。", action: "今天安排十分鐘「獨行時間」：不說話、不拍照、不看手機，只是走路、呼吸、聽風。把一個重擔在心裡默默交出去。", prayer: "神啊，在所有聲音之下，讓我聽見祢安靜的聲音——或者至少，讓我聽見自己真正的心聲。", lifeQuestion: "你最近一次在完全安靜中待超過十分鐘是什麼時候？那時你腦海裡浮現了什麼？" },
  { dayNo: 6, place: "別迦摩／推雅推喇／士每拿（七教會）", title: "在壓力下說真話，比在安全中說漂亮話更有價值", scripture: "啟2:10「你務要至死忠心」", reflection: "三座城，三種壓力：士每拿的信徒物質匱乏卻被稱為「富足」；別迦摩在強權核心仍拒絕改口；推雅推喇最大的試探則是「用小小的妥協換取和平」。兩千年前在這裡堅持信念要付出代價。今天你的壓力可能不是逼迫，而是「不被認同」的孤獨感。你心裡知道對的事，有沒有說出來？", action: "今天做一個「不討好」的小決定：選你認為對的，而不是最容易或最不得罪人的那個選項。做完後記錄你的感受。", prayer: "主啊，我常常用妥協換取平靜。給我勇氣在壓力中做對的事，即使沒有人鼓掌。", lifeQuestion: "你最近一次為了「維持關係」或「避免麻煩」而說了違心的話是什麼時候？回頭看，你會怎麼評價？" },
  { dayNo: 7, place: "撒狄／非拉鐵非／希拉波立／棉花堡", title: "好看不等於活著，微小不等於無用", scripture: "啟3:1「你按名是活的，其實是死的」", reflection: "棉花堡的白色梯田潔白耀眼，像精心維護的外在形象——漂亮、完美、無瑕。但撒狄教會被提醒：「你看起來活著，其實已經死了。」忙碌、光鮮、有效率，不等於真正活著。而旁邊的非拉鐵非——力量微小卻被稱許，因為它忠心持守。真正的生命力不在於規模或外表，在於你裡面還有沒有在呼吸。", action: "問自己一個殘酷的問題：「如果拿掉頭銜、成就、社群數字，我還剩下什麼？」安靜寫下答案。", prayer: "主啊，叫我醒來。讓我不只追求好看，更追求真正地活著——即使活得微小，也活得真實。", lifeQuestion: "你生活中有沒有什麼看起來很好、但其實已經失去生命力的東西？你願意面對它嗎？" },
  { dayNo: 8, place: "老底嘉／使徒約翰之墓／以弗所", title: "麻木比反對更危險——找回你的「第一次心動」", scripture: "啟2:4「你把起初的愛心離棄了」", reflection: "老底嘉的水管遺跡還在——溫泉水流到城裡時已不冷不熱，無法治療也不能解渴，只剩「沒有功能的溫吞」。以弗所教會什麼都做對了，卻被指出最致命的問題：你忘了起初的愛。以弗所大劇場曾因福音引起兩萬人暴動——至少那代表有人在乎。最可怕的不是反對，是麻木。你對什麼曾經充滿熱情，現在只剩慣性？", action: "寫下你「第一次被深深觸動」的片段——可能是信仰、可能是愛、可能是某個夢想。然後問自己：那份火還在嗎？今天你可以為它做一件什麼小事？", prayer: "主啊，把我從舒適的麻木中喚醒。我不想只是「不反對」，我想要重新心動、重新有功能、重新活過來。", lifeQuestion: "你對什麼曾經充滿熱情，現在卻只剩下習慣性地維持？你想找回那份感覺嗎？" },
  { dayNo: 9, place: "伊茲密爾→伊斯坦堡→雅典（憲法廣場／國會大廈／無名戰士墓／奧林匹克體育場／總統府）", title: "在趕路的日子裡，學會在「經過」中看見意義", scripture: "徒17:26「神從一本造出萬族，預先定準他們的疆界和年限」", reflection: "今天是移動日——轉機、等待、拉車。你可能覺得「今天沒有重頭戲」。但雅典街頭的每一個角落都在無聲地說故事：無名戰士墓前衛兵的緩慢步伐，是一整個國家對犧牲者的記憶；奧林匹克體育場的大理石階梯，見證了人類想要超越極限的古老渴望；憲法廣場的人潮來去，和兩千年前保羅踏進這城時一樣——人在忙，但心裡的問題從沒變過：我是誰？我從哪裡來？我要往哪裡去？", action: "在等待或移動的空檔，選一個你眼前看到的畫面（衛兵、人潮、建築、甚至機場），用一句話描述它讓你想到什麼。不用深刻，只要誠實。", prayer: "神啊，即使在趕路的日子、在過渡的時刻，祢仍然在。讓我不把今天當成空白頁，而是看見祢藏在「經過」裡的心意。", lifeQuestion: "你人生中有沒有一段「只是在趕路」的日子，後來才發現那段時間其實很重要？" },
  { dayNo: 10, place: "雅典（衛城／帕德嫩神廟／亞略巴古／古市集／哈德良拱門）", title: "真正的溝通不是贏了辯論，而是走進對方的世界", scripture: "徒17:23「我看見你們有一座壇，上面寫著『未識之神』」", reflection: "站在亞略巴古的岩石上，你腳下就是保羅兩千年前站立的地方。他面對的聽眾是全世界最會辯論的哲學家——不讀聖經、不認識以色列的神。保羅沒有指責他們拜偶像，而是從他們自己立的「未識之神」祭壇出發，引用希臘詩人的句子，用對方的語言講出真理。帕德嫩神廟的完美比例、古市集的辯論遺址、哈德良拱門上「新城舊城」的刻字——這座城市的每一塊石頭都在問同一個問題：什麼是真的？什麼是好的？人心需要什麼？", action: "觀察今天旅途中的一個畫面或現象，試著用一句「不帶任何專業術語」的話，說出你認為人心最需要的一件事。然後想想：你身邊有誰需要聽到這句話？", prayer: "主啊，給我智慧像保羅一樣——不是用大聲壓過別人，而是用理解走進他們。讓我先傾聽，再開口。", lifeQuestion: "你最想讓別人理解的一件事是什麼？你有沒有試過用「對方的語言」而不是「你習慣的語言」去表達？" },
  { dayNo: 11, place: "哥林多（運河／古城／考古博物館／審判台／堅革哩）", title: "承認軟弱，是另一種強大", scripture: "林前2:3「我在你們那裡，又軟弱又懼怕又甚戰兢」", reflection: "哥林多運河把兩片大陸切開——窄窄的水道，兩邊是八十公尺高的垂直崖壁，壯觀卻也讓人感受到被「切開」的力量。哥林多古城曾是繁華的商業港口，紙醉金迷、道德混亂——保羅就是在這裡承認自己「又軟弱又懼怕又甚戰兢」。但神在夜裡對他說：「不要怕，有我同在。」審判台的遺跡還在，當年保羅被拖到這裡受審，他沒有逃。在考古博物館裡你看見的每件文物，都來自一個曾經以為只有強者才能活下來的城市。但保羅證明了另一件事：承認軟弱的人，反而走得最遠。", action: "傳訊息給你信任的一位朋友，說一句你平常不太敢說的真心話——不一定要很重，也許只是：「最近其實有點累」或「謝謝你一直在。」", prayer: "主啊，我常常害怕被看見軟弱。但祢說祢的力量在人的軟弱上顯得完全。今天我不裝了——我需要祢。", lifeQuestion: "你上一次對人坦承「我其實不太好」是什麼時候？對方的回應是什麼？那次經驗讓你更敢還是更不敢脆弱？" },
  { dayNo: 12, place: "溫泉關／拉里薩／邁泰奧拉天空之城", title: "退到高處是為了回來時站得更穩", scripture: "可1:35「天還沒亮，耶穌起來到曠野禱告」", reflection: "溫泉關的三百壯士面對百萬大軍，在最窄的隘口死守到底——不是因為魯莽，是因為心中有比活命更重要的東西。拉里薩是希臘中部的平原城市，是旅人南來北往的交會點——一個「經過」的地方，提醒你不是每一天都有高潮，但每一天都是旅程的一部分。而邁泰奧拉的修道院蓋在數百公尺高的巨石頂端——修士們為了安靜，願意走到多高的地方？耶穌在最忙的時期也會天不亮就獨自去曠野。退到高處不是逃避，是為了回到平地時，心裡有底。", action: "今天給自己五分鐘「高處時間」：找一個能看遠的地方——陽台、觀景台、窗邊——深呼吸三次，問自己：「回去之後，我要為什麼站穩？」把答案寫下來帶走。", prayer: "主啊，讓我學會退到祢面前充電，也讓我有勇氣帶著力量回到最難的日常。不逃避，但也不硬撐。", lifeQuestion: "你平常用什麼方式替自己「充電」？那個方式真的讓你更有力量面對壓力，還是只是暫時逃避？" },
  { dayNo: 13, place: "帖撒羅尼迦／耶孫的家／暗妃波里／腓立比（呂底亞受洗處）／尼亞波利（卡瓦拉）／亞歷山卓波利", title: "在最黑的夜裡唱歌，是信心最高的表達", scripture: "徒16:25「半夜，保羅和西拉禱告唱詩讚美神」", reflection: "帖撒羅尼迦是馬其頓第一大城，兩千年前保羅在這裡的猶太會堂連續三個安息日講論基督，引起騷動。耶孫因為接待保羅而被拖去見官——他冒的風險不是「方便」，而是「代價」。往東走，腓立比的河邊是呂底亞聽道受洗的地方——這個賣紫色布的商人成為歐洲第一個基督徒家庭。在同一座城，保羅和西拉被鞭打、上木狗、關進內監，卻在半夜唱歌讚美。不是因為不痛，是因為他們認識一個比疼痛更大的存在。一整天從帖撒羅尼迦到卡瓦拉，你走過的是一條「代價之路」：每一站都有人為了相信的事付出了什麼。", action: "在今天最疲憊的一刻，停下來做一件「反直覺」的事：不是抱怨，而是說出三件具體的感恩。然後主動關心一位看起來也很累的夥伴——問一句「你還好嗎？」就夠了。", prayer: "主啊，教我在黑暗中仍然能唱歌、能感恩。也讓我像耶孫和呂底亞一樣，願意付代價成為別人生命中的一扇門。", lifeQuestion: "你有沒有在人生的低谷中，反而感受到某種超越處境的力量或平安？那股力量從哪裡來？" },
  { dayNo: 14, place: "希臘土耳其邊界→伊斯坦堡（塔克辛大道）", title: "等待考驗你的耐心，消費考驗你的自由", scripture: "提前6:6「敬虔加上知足，便是大利」", reflection: "過境的漫長等待讓人焦躁——因為你沒辦法掌控進度。回到伊斯坦堡的購物街，消費的便利讓人興奮——因為你以為花錢就是掌控。但真正的自由不是掌控一切、擁有一切，而是在擁有和沒有之間，心都能安穩。知足不是壓抑慾望，是發現你已經擁有的其實足夠。", action: "等待時練習一句：「我可以不急。」購物結帳前問自己：「我買的是需要、是紀念、還是在填補什麼？」今天至少放下一樣「差點買了但其實不需要」的東西。", prayer: "主啊，在等待中教我耐心，在消費中教我知足。讓我的安全感不建立在掌控之上，而是在祢的供應裡。", lifeQuestion: "你上一次衝動消費是在什麼心情之下？你覺得你真正想「買」的是什麼？" },
  { dayNo: 15, place: "返程（機上）", title: "感動的保質期只有三天——除非你把它帶進日常", scripture: "申6:6-7「這些話要記在心上，無論在家或在路上都要談論」", reflection: "飛機離地的那一刻，這些日子的畫面會開始快速倒帶。但旅途中的感動和領悟有保質期——心理學研究顯示，強烈情緒體驗如果不在七十二小時內轉化為具體行動，就會被日常淹沒。你這趟旅程想帶走的，不應該只是照片和紀念品。", action: "在飛機上完成三句話：①這趟旅程，我看見了＿＿＿ ②我被提醒要改變的是＿＿＿ ③回去後七天內，我要開始做的一件事是＿＿＿", prayer: "主啊，讓我帶走的不只是風景，而是被改變的眼光和柔軟的心。幫助我把路上的領悟活進日常。", lifeQuestion: "回想所有旅程片段，哪一個畫面你最想永遠記住？為什麼是那個畫面？" },
  { dayNo: 16, place: "回到家（收心日）", title: "回家後怎麼對人，才是旅程真正的成績單", scripture: "彌6:8「行公義，好憐憫，存謙卑的心與你的神同行」", reflection: "旅行中我們容易變得開放、柔軟、感恩——因為一切都是新鮮的、沒有壓力的。但回到日常的第一天才是真正的考驗：你對家人的語氣、你對同事的耐心、你面對壓力時是否還記得在路上的領悟。真正的改變不是在聖地流淚，而是回家後對身邊的人多了一份溫柔。", action: "列一個「三人清單」：一位你想感謝的人、一位你想道歉的人、一位你想祝福的人。今天就用訊息或電話行動，不要等到「有空再說」。", prayer: "主啊，讓這趟旅程的恩典不留在路上。讓它變成我每天的善意、饒恕、耐心與愛。我願意行公義、好憐憫、謙卑地與祢同行。", lifeQuestion: "如果這趟旅程只能改變你一個習慣或態度，你希望是什麼？三個月後的你還會記得嗎？" },
];

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
      const courseValues = DEVOTIONAL_COURSES_DATA.map(d => ({ ...d, tripId }));
      await db.insert(devotionalCourses).values(courseValues);
      console.log("[data-sync] created", courseValues.length, "devotional courses");
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
本行程涵蓋希臘本土+山區修道院+土耳其小亞細亞。3–4月屬春季但變化大，重點不是極冷，而是「早晚溫差、山風、偶雨」與長時間遺址步行。

地形與體感：雅典與各遺址多為曝曬平地或丘陵，走路時間長；梅黛奧拉屬山區高岩柱，風強、石階多、比平地冷；土耳其遺址多在開闊地，白色石灰岩（希拉波立）反光強，日晒明顯。

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

async function migrateToLandItinerary() {
  try {
    const allTrips = await db.select().from(trips).limit(1);
    if (!allTrips.length) return;
    const tripId = allTrips[0].id;

    // Check if migration already applied by looking at Day 9's cityArea
    const day9 = await db.select().from(tripDays)
      .where(and(eq(tripDays.tripId, tripId), eq(tripDays.dayNo, 9)))
      .limit(1);
    if (!day9.length || day9[0].cityArea === "雅典 Athens") {
      return; // already migrated or no data
    }

    console.log("[data-sync] migrating from cruise to land itinerary...");

    const updates: { dayNo: number; data: Record<string, any> }[] = [
      { dayNo: 7, data: { lodging: "Colossae Hotel" } },
      { dayNo: 9, data: {
        cityArea: "雅典 Athens",
        title: "搭機飛往雅典 / 雅典市區觀光",
        highlights: "搭機 伊茲密爾→伊斯坦堡→雅典 / 憲法廣場 / 國會大廈 / 無名戰士墓 / 奧林匹克體育場 / 總統府",
        attractions: "憲法廣場 / 國會大廈 / 無名戰士墓 / 奧林匹克體育場 / 總統府",
        bibleRefs: "徒17:15-18",
        breakfast: "飯店", lunch: "機上", dinner: "特色晚餐",
        lodging: "Radisson Blu Park Hotel Athens", lodgingLevel: "5星",
        transport: "飛機",
        freeTimeFlag: false, shoppingFlag: false,
        notes: "抵達雅典後展開市區觀光，保羅曾在雅典等候西拉和提摩太",
      }},
      { dayNo: 10, data: {
        cityArea: "雅典 Athens",
        title: "雅典深度聖經＋歷史觀光",
        highlights: "雅典衛城 / 帕德嫩神廟 / 亞略巴古 / 雅典古市集（外觀）/ 哈德良拱門",
        attractions: "雅典衛城 / 帕德嫩神廟 / 亞略巴古 / 雅典古市集 / 哈德良拱門",
        bibleRefs: "徒17:15-34",
        breakfast: "飯店", lunch: "當地特色", dinner: "飯店或當地特色",
        lodging: "Radisson Blu Park Hotel Athens", lodgingLevel: "5星",
        transport: null,
        freeTimeFlag: false, shoppingFlag: false,
        notes: "雅典衛城為UNESCO世界遺產，保羅在亞略巴古向雅典人宣講未識之神",
      }},
      { dayNo: 11, data: {
        title: "哥林多運河 / 哥林多古城",
        highlights: "哥林多運河 / 哥林多考古博物館 / 哥林多古城 / 審判台 / 堅革哩",
        attractions: "哥林多運河 / 哥林多考古博物館 / 哥林多古城 / 堅革哩",
        bibleRefs: "林前; 林後; 徒18:1-18",
        breakfast: "飯店",
      }},
      { dayNo: 12, data: {
        cityArea: "拉里薩 Larissa",
        title: "溫泉關 / 天空之城",
        highlights: "溫泉關古戰場 / 邁泰奧拉(天空之城) / 拉里薩",
        attractions: "溫泉關古戰場 / 邁泰奧拉(天空之城) / 拉里薩",
        bibleRefs: null,
      }},
      { dayNo: 13, data: {
        title: "帖撒羅尼迦 / 腓立比",
        highlights: "帖撒羅尼迦 / 耶孫的家 / 暗妃波里 / 腓立比 / 呂底亞受洗處 / 尼亞波利(卡瓦拉) / 亞歷山卓波利",
        attractions: "帖撒羅尼迦 / 耶孫的家 / 暗妃波里 / 腓立比 / 尼亞波利(卡瓦拉) / 亞歷山卓波利",
        bibleRefs: "帖前; 帖後; 徒16:11; 徒17:1-10; 腓立比書",
        notes: "帖撒羅尼迦為1988年世界遺產。腓立比是保羅在歐洲傳福音的第一個城市",
      }},
      { dayNo: 14, data: {
        dinner: "自理",
        attractions: "塔克辛廣場自由活動",
      }},
    ];

    for (const { dayNo, data } of updates) {
      await db.update(tripDays)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(tripDays.tripId, tripId), eq(tripDays.dayNo, dayNo)));
    }

    console.log("[data-sync] land itinerary migration complete, updated", updates.length, "days");
  } catch (error) {
    console.error("[data-sync] land itinerary migration error:", error);
  }
}

async function migrateDevotionalCourses() {
  const client = await pool.connect();
  try {
    const tripResult = await client.query(`SELECT id FROM trips LIMIT 1`);
    if (!tripResult.rows.length) return;
    const tripId = tripResult.rows[0].id;

    // Check if migration already applied by verifying Day 9 has the land itinerary title
    const checkResult = await client.query(
      `SELECT title FROM devotional_courses WHERE trip_id = $1 AND day_no = 9`,
      [tripId]
    );
    if (checkResult.rows.length > 0 && checkResult.rows[0].title === "在趕路的日子裡，學會在「經過」中看見意義") {
      console.log("[data-sync] devotional courses already migrated, skipping");
      return;
    }

    console.log("[data-sync] migrating devotional courses to new content (raw SQL)...");
    console.log("[data-sync] found", checkResult.rows.length, "existing courses, titles:", checkResult.rows.map((r: any) => r.title));

    // Delete all existing courses for this trip
    await client.query(`DELETE FROM devotional_courses WHERE trip_id = $1`, [tripId]);

    // Insert new courses using raw SQL to avoid Drizzle schema issues
    for (const d of DEVOTIONAL_COURSES_DATA) {
      await client.query(
        `INSERT INTO devotional_courses (trip_id, day_no, title, place, scripture, reflection, action, prayer, life_question)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [tripId, d.dayNo, d.title, d.place, d.scripture, d.reflection, d.action, d.prayer, d.lifeQuestion]
      );
    }

    console.log("[data-sync] devotional courses migration complete, inserted", DEVOTIONAL_COURSES_DATA.length, "courses");
  } catch (error) {
    console.error("[data-sync] devotional courses migration error:", error);
  } finally {
    client.release();
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

    // Ensure columns exist BEFORE any migrations that depend on them
    try {
      const client = await pool.connect();
      try {
        await client.query(`ALTER TABLE devotional_courses ADD COLUMN IF NOT EXISTS place TEXT`);
        await client.query(`ALTER TABLE devotional_courses ADD COLUMN IF NOT EXISTS life_question TEXT`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE`);
        console.log("[startup-migration] ensured place, life_question, google_id columns");
      } finally {
        client.release();
      }
    } catch (e) {
      console.error("[startup-migration] column migration error:", e);
    }

    await syncDataToCurrentDb();
    await migrateToLandItinerary();
    await migrateDevotionalCourses();

    const allTrips = await db.select().from(trips).limit(1);
    if (allTrips.length) {
      await seedTripNotes(allTrips[0].id);
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
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ`);
        console.log("[startup-migration] ensured reset_token columns on users");
      } finally {
        client.release();
      }
    } catch (e) {
      console.error("[startup-migration] reset_token column migration error:", e);
    }

    await ensureAttractionsTable();
    await ensureBibleLibraryTables();

    console.log("[startup-migration] complete");
  } catch (error) {
    console.error("[startup-migration] error:", error);
  }
}

async function ensureAttractionsTable() {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS attractions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          day_no INTEGER NOT NULL,
          seq INTEGER NOT NULL,
          name_zh TEXT NOT NULL,
          name_en TEXT,
          name_alt TEXT,
          country TEXT,
          date TEXT,
          modern_location TEXT,
          ancient_toponym TEXT,
          gps TEXT,
          opening_hours TEXT,
          admission TEXT,
          duration TEXT,
          scripture_refs TEXT,
          bible_books TEXT,
          story_summary TEXT,
          key_figures TEXT,
          historical_era TEXT,
          theological_significance TEXT,
          life_application TEXT,
          discussion_questions TEXT,
          archaeological_findings TEXT,
          historical_strata TEXT,
          accuracy_rating TEXT,
          key_artifacts TEXT,
          tour_route_position TEXT,
          best_time TEXT,
          dress_code TEXT,
          photo_restrictions TEXT,
          crowd_levels TEXT,
          safety_notes TEXT,
          accessibility TEXT,
          nearby_dining TEXT,
          accommodation TEXT,
          nearby_biblical_sites TEXT,
          local_products TEXT,
          recommendation_score TEXT,
          physical_comment TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_attractions_trip_day ON attractions(trip_id, day_no)`);
      console.log("[startup-migration] ensured attractions table");
    } finally {
      client.release();
    }
  } catch (e) {
    console.error("[startup-migration] attractions table error:", e);
  }
}

async function ensureBibleLibraryTables() {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS bible_library_modules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          slug TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          description TEXT,
          icon_name TEXT DEFAULT 'BookOpen',
          cover_image_url TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_builtin BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS bible_library_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          module_id UUID NOT NULL REFERENCES bible_library_modules(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          content TEXT,
          image_url TEXT,
          file_url TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_bible_library_items_module ON bible_library_items(module_id)`);
      await client.query(`
        CREATE TABLE IF NOT EXISTS bible_library_module_trips (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          module_id UUID NOT NULL REFERENCES bible_library_modules(id) ON DELETE CASCADE,
          trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_bible_module_trips_unique ON bible_library_module_trips(trip_id, module_id)`);

      // Add visible column if not exists
      await client.query(`ALTER TABLE bible_library_modules ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT true`);

      // Add module_type column if not exists
      await client.query(`ALTER TABLE bible_library_modules ADD COLUMN IF NOT EXISTS module_type TEXT NOT NULL DEFAULT 'standard'`);

      // Seed built-in Paul Journeys module
      const existing = await client.query(`SELECT id FROM bible_library_modules WHERE slug = 'paul-journeys'`);
      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO bible_library_modules (slug, title, description, icon_name, sort_order, is_builtin)
          VALUES ('paul-journeys', '保羅行蹤', '探索使徒保羅的四次宣教旅程，包含地點、同伴、事件與相關經文', 'Footprints', 0, true)
        `);
      }
      // Rename「深度研究」→「相關資料」in modules, items title, and items content
      await client.query(`UPDATE bible_library_modules SET title = '相關資料' WHERE title = '深度研究'`);
      await client.query(`UPDATE bible_library_items SET title = REPLACE(title, '深度研究', '相關資料') WHERE title LIKE '%深度研究%'`);
      await client.query(`UPDATE bible_library_items SET content = REPLACE(content, '深度研究', '相關資料') WHERE content LIKE '%深度研究%'`);

      console.log("[startup-migration] ensured bible library tables");
    } finally {
      client.release();
    }
  } catch (e) {
    console.error("[startup-migration] bible library tables error:", e);
  }
}
