import { useState, useMemo, useEffect, useRef } from "react";
import {
  Sun, Compass, Moon, Plus, Calendar, ChevronLeft, ChevronRight,
  Loader2, Check, BookOpen, Volume2, Heart, Bookmark, Pencil, MapPin, HandHeart, MessageCircleHeart,
  ChevronDown, Copy, HelpCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/layout/PageLayout";
import { JournalEntry, JournalEntryData } from "@/components/journal/JournalEntry";
import { AddJournalSheet } from "@/components/journal/AddJournalSheet";
import { ViewJournalSheet } from "@/components/journal/ViewJournalSheet";
import { useJournalEntries, useCreateJournalEntry, useDeleteJournalEntry, useUpdateJournalEntry } from "@/hooks/useJournalEntries";
import { useDevotionalEntries, useMyDevotionalEntry, useSaveDevotional, useTripDevotionalCourses, useBibleLookup } from "@/hooks/useDevotional";
import { useEveningReflection, useSaveEveningReflection } from "@/hooks/useEveningReflection";
import { useTrip } from "@/hooks/useTrip";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { transformPhotoUrl } from "@/lib/photoUtils";
import { format, addDays, startOfDay, parseISO, differenceInDays } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ScriptureData } from "@/components/devotional/ScriptureCard";

const fallbackScriptures: Record<number, ScriptureData> = {
  1: {
    reference: "創12:1",
    theme: "離開，是看見自己的開始",
    verses: [],
    place: "機上→伊斯坦堡",
    reflection: "飛機起飛的那一刻，你離開了熟悉的一切——日常節奏、角色責任、習慣軌道。旅行的意義不只是去哪裡，而是離開之後，你才發現自己一直抓著什麼不放。亞伯拉罕被呼召離開時，目的地是「我要指示你的地方」——連地址都沒有。離開，需要的不是資訊，是信任。",
    action: "寫下兩句話：「這趟旅程，我最想放下的是＿＿＿」和「我最怕發生的是＿＿＿」。寫完後不修改，收起來。",
    prayer: "神啊，我帶著期待也帶著不安出發。在三萬英尺的高空，讓我開始卸下平日的面具，進入祢的節奏。",
    lifeQuestion: "離開日常軌道後，你心裡第一個浮上來的情緒是什麼？它透露了你內心真正的狀態嗎？",
  },
  2: {
    reference: "彼前2:11",
    theme: "不舒服的地方，往往是成長的入口",
    verses: [],
    place: "伊斯坦堡（接機／自由活動）",
    reflection: "踏上陌生的土地，語言不通、路不熟、食物不同。這種「不舒服感」其實是好的——它打破你的自動駕駛模式，讓感官重新甦醒。彼得寫信給「分散各處」的信徒，提醒他們本來就是客旅。當我們承認自己不是什麼都懂，反而變得柔軟、開放、謙卑。",
    action: "今天遇到任何不順——延誤、迷路、溝通不良——練習一句話：「這正在教我什麼？」不急著抱怨，先觀察自己的反應。",
    prayer: "主啊，讓我在陌生中不急著掌控，而是學會放鬆、信任、接受。讓不舒服成為我柔軟的起點。",
    lifeQuestion: "你上一次處在完全陌生的環境是什麼時候？那段經驗，改變了你什麼？",
  },
  3: {
    reference: "傳3:11",
    theme: "壯觀的建築背後，是人心深處對「永恆」的渴望",
    verses: [],
    place: "伊斯坦堡（聖索菲亞／藍色清真寺／跑馬場／托普卡匹）",
    reflection: "聖索菲亞大教堂一千五百年來從教堂變清真寺、變博物館、又變回清真寺。外在形式不斷翻轉，但人心對「比我更大的存在」的渴望從未消失。仰頭看穹頂時，無論你信什麼，那份「被震撼」的感覺是真實的——那就是永恆在你心裡回響。",
    action: "找一個角落，三分鐘不拍照、不打卡，只是抬頭看、深呼吸，然後問自己：「我心裡最深的渴望是什麼？」",
    prayer: "造物主啊，千年來人類不斷蓋起壯觀的殿堂尋找祢。此刻，我也站在這裡，帶著我的渴望和疑問。",
    lifeQuestion: "站在壯觀的古蹟前，那種「被震撼」的感覺從何而來？你覺得那份渴望指向什麼？",
  },
  4: {
    reference: "雅1:14",
    theme: "最大的威脅，常是你親手請進來的",
    verses: [],
    place: "恰納卡萊／達達尼爾海峽／特洛伊",
    reflection: "特洛伊人打了十年仗沒有輸，卻被一匹「禮物」毀滅。木馬最可怕的地方不是它的設計，而是有人決定把它拉進城門。我們的生命也一樣——真正的威脅往往不是外來的壓力，而是我們以為無害、甚至以為是安慰的習慣或依賴。",
    action: "寫下你生命中的一匹「木馬」（手機成癮、討好、比較心、逃避衝突、用忙碌麻痺自己……），然後寫一句：「我看見你了，你不再是我的保護。」",
    prayer: "主啊，給我誠實面對自己的勇氣。幫助我辨認那些偽裝成安慰的破壞，不再讓它進門。",
    lifeQuestion: "如果你的生活是一座城，什麼是你明知有風險、卻一直捨不得關門拒絕的「木馬」？",
  },
  5: {
    reference: "詩46:10",
    theme: "在噪音中刻意安靜，是一種勇敢",
    verses: [],
    place: "特羅亞Troas／亞朔Assos",
    reflection: "特羅亞是保羅跨向歐洲宣教的起點——也是少年猶推古因疲憊睡著而墜樓的地方（徒20:9）。旅程到了中段，興奮感退去，疲憊感上來——這時最容易「靈性墜樓」。但在亞朔，保羅刻意讓同工搭船，自己選擇獨自步行。在最忙的時候爭取安靜，不是浪費時間，是為了聽見最重要的聲音。",
    action: "今天安排十分鐘「獨行時間」：不說話、不拍照、不看手機，只是走路、呼吸、聽風。把一個重擔在心裡默默交出去。",
    prayer: "神啊，在所有聲音之下，讓我聽見祢安靜的聲音——或者至少，讓我聽見自己真正的心聲。",
    lifeQuestion: "你最近一次在完全安靜中待超過十分鐘是什麼時候？那時你腦海裡浮現了什麼？",
  },
  6: {
    reference: "啟2:10",
    theme: "在壓力下說真話，比在安全中說漂亮話更有價值",
    verses: [],
    place: "別迦摩／推雅推喇／士每拿（七教會）",
    reflection: "三座城，三種壓力：士每拿的信徒物質匱乏卻被稱為「富足」；別迦摩在強權核心仍拒絕改口；推雅推喇最大的試探則是「用小小的妥協換取和平」。兩千年前在這裡堅持信念要付出代價。今天你的壓力可能不是逼迫，而是「不被認同」的孤獨感。你心裡知道對的事，有沒有說出來？",
    action: "今天做一個「不討好」的小決定：選你認為對的，而不是最容易或最不得罪人的那個選項。做完後記錄你的感受。",
    prayer: "主啊，我常常用妥協換取平靜。給我勇氣在壓力中做對的事，即使沒有人鼓掌。",
    lifeQuestion: "你最近一次為了「維持關係」或「避免麻煩」而說了違心的話是什麼時候？回頭看，你會怎麼評價？",
  },
  7: {
    reference: "啟3:1",
    theme: "好看不等於活著，微小不等於無用",
    verses: [],
    place: "撒狄／非拉鐵非／希拉波立／棉花堡",
    reflection: "棉花堡的白色梯田潔白耀眼，像精心維護的外在形象——漂亮、完美、無瑕。但撒狄教會被提醒：「你看起來活著，其實已經死了。」忙碌、光鮮、有效率，不等於真正活著。而旁邊的非拉鐵非——力量微小卻被稱許，因為它忠心持守。真正的生命力不在於規模或外表，在於你裡面還有沒有在呼吸。",
    action: "問自己一個殘酷的問題：「如果拿掉頭銜、成就、社群數字，我還剩下什麼？」安靜寫下答案。",
    prayer: "主啊，叫我醒來。讓我不只追求好看，更追求真正地活著——即使活得微小，也活得真實。",
    lifeQuestion: "你生活中有沒有什麼看起來很好、但其實已經失去生命力的東西？你願意面對它嗎？",
  },
  8: {
    reference: "啟2:4",
    theme: "麻木比反對更危險——找回你的「第一次心動」",
    verses: [],
    place: "老底嘉／使徒約翰之墓／以弗所",
    reflection: "老底嘉的水管遺跡還在——溫泉水流到城裡時已不冷不熱，無法治療也不能解渴，只剩「沒有功能的溫吞」。以弗所教會什麼都做對了，卻被指出最致命的問題：你忘了起初的愛。以弗所大劇場曾因福音引起兩萬人暴動——至少那代表有人在乎。最可怕的不是反對，是麻木。你對什麼曾經充滿熱情，現在只剩慣性？",
    action: "寫下你「第一次被深深觸動」的片段——可能是信仰、可能是愛、可能是某個夢想。然後問自己：那份火還在嗎？今天你可以為它做一件什麼小事？",
    prayer: "主啊，把我從舒適的麻木中喚醒。我不想只是「不反對」，我想要重新心動、重新有功能、重新活過來。",
    lifeQuestion: "你對什麼曾經充滿熱情，現在卻只剩下習慣性地維持？你想找回那份感覺嗎？",
  },
  9: {
    reference: "啟1:9",
    theme: "被困住的地方，可能是你看得最清楚的地方",
    verses: [],
    place: "拔摩島Patmos（聖約翰修道院／啟示錄洞窟）",
    reflection: "約翰被放逐到這座荒涼的小島，與世隔絕、失去自由、遠離所愛。但正是在這裡——不是在繁華的以弗所、不是在宏偉的聖殿——他看見了人類歷史最宏大的異象。限制剝奪了他的選項，卻打開了他的視野。有時候困境不是懲罰，是一個不同角度的觀景台。",
    action: "把你一直想逃避的一件事或一個處境寫下來，然後換個問法：「這個困境正在教我看見什麼我以前看不見的？」",
    prayer: "主啊，我不喜歡被困住的感覺。但如果這是祢讓我看得更清楚的方式，我願意停下來、睜開眼。",
    lifeQuestion: "回想你人生中最大的一次限制或低谷——它最終讓你「看見」了什麼之前看不見的東西？",
  },
  10: {
    reference: "羅8:28",
    theme: "絕美的風景，來自巨大的撕裂",
    verses: [],
    place: "聖托里尼Santorini（自由活動）",
    reflection: "聖托里尼的月牙海灣、懸崖白屋、夕陽倒映——這些舉世聞名的美景全部來自三千六百年前一場毀滅性的火山爆發。島嶼被炸開、海水灌入、文明消失。但時間過去，災難的傷痕竟成為地球上最令人屏息的風景。你的生命中也有撕裂，有些傷口你甚至還在癒合。但也許有一天，回頭看，那些破碎也會成為你最美的部分。",
    action: "拍一張你覺得最美的風景，然後在旁邊寫一句：「我生命中的＿＿＿＿也是破碎之後的美。」如果暫時想不到，就寫：「我願意等待那天。」",
    prayer: "神啊，祢是那位能把廢墟變成風景的神。在我還看不見結果的時候，幫助我選擇信任，而不是絕望。",
    lifeQuestion: "如果聖托里尼的美需要火山爆發才能形成——你相信你的破碎也有可能變成某種美嗎？",
  },
  11: {
    reference: "林前9:22",
    theme: "真正的溝通不是贏了辯論，而是走進對方的世界",
    verses: [],
    place: "哥林多／雅典／亞略巴古",
    reflection: "保羅在雅典的亞略巴古面對的聽眾不讀聖經，所以他沒有引經據典，而是引用了希臘詩人，從雅典人自己的「未識之神」祭壇出發。他走進對方的世界，而不是要求對方走進他的。但到了哥林多，他坦承自己「又軟弱又懼怕又戰兢」（林前2:3），神卻在夜裡安慰他：不要怕。最好的溝通者不是最會講的人，而是最願意聽、最願意脆弱的人。",
    action: "雙重操練：①觀察旅途中一個現象，用一句不帶「專業術語」的話說出你最在意的價值觀。②傳訊息給一位你信任的朋友，謝謝他曾在你軟弱時接住你。",
    prayer: "主啊，給我智慧說出讓人聽得懂的話，也給我勇氣在軟弱時不假裝堅強。",
    lifeQuestion: "你最想讓別人理解的一件事是什麼？你有沒有試過用「對方的語言」去表達？",
  },
  12: {
    reference: "可1:35",
    theme: "退到高處是為了回來時站得更穩",
    verses: [],
    place: "溫泉關／邁泰奧拉／庇哩亞／帖撒羅尼迦",
    reflection: "邁泰奧拉的修道院蓋在巨石頂端——人為了安靜，可以走多高？庇哩亞人被稱讚不是因為聽話，而是「天天自己查考」。溫泉關三百壯士面對百萬大軍死守隘口——不是魯莽，是因為心中有比生命更重要的東西。耶穌在最忙的時期也會天不亮就獨自去安靜。退到高處不是逃避，是為了回到平地時不被壓力壓垮。",
    action: "今天給自己五分鐘「高處時間」：找一個能看遠的地方（陽台、山丘、窗邊），深呼吸三次，問自己：「回去之後，我要為什麼站穩？」把答案記下來。",
    prayer: "主啊，讓我學會退到祢面前充電，也讓我有勇氣帶著力量回到最難的地方。",
    lifeQuestion: "你平常用什麼方式替自己「充電」？那個方式真的讓你更有力量面對壓力，還是只是暫時逃避？",
  },
  13: {
    reference: "徒16:25",
    theme: "在最黑的夜裡唱歌，是信心最高的表達",
    verses: [],
    place: "耶孫的家／暗妃波里／腓立比／尼亞波利（卡瓦拉）",
    reflection: "在腓立比，保羅和西拉被鞭打、關進內監、雙腳上了木狗。半夜——不是天亮後、不是獲釋後——他們唱歌了。不是因為不痛，而是因為他們認識一個比疼痛更大的存在。同一城市裡，呂底亞和耶孫冒著風險打開家門接待陌生人。有人在黑暗中唱歌，有人在危險中開門——這兩種勇氣都是信心的表達。",
    action: "在今天最疲憊的一刻，刻意停下來說出三件你感恩的事（不用很大，越具體越好）。然後主動關心一位看起來也很累的夥伴。",
    prayer: "主啊，教我在黑暗中仍然能唱歌、能讚美。也讓我成為別人黑暗中的一扇門。",
    lifeQuestion: "你有沒有在人生的低谷中，反而感受到某種超越處境的力量或平安？那是什麼感覺？",
  },
  14: {
    reference: "提前6:6",
    theme: "等待考驗你的耐心，消費考驗你的自由",
    verses: [],
    place: "希臘土耳其邊界→伊斯坦堡（塔克辛大道）",
    reflection: "過境的漫長等待讓人焦躁——因為你沒辦法掌控進度。回到伊斯坦堡的購物街，消費的便利讓人興奮——因為你以為花錢就是掌控。但真正的自由不是掌控一切、擁有一切，而是在擁有和沒有之間，心都能安穩。知足不是壓抑慾望，是發現你已經擁有的其實足夠。",
    action: "等待時練習一句：「我可以不急。」購物結帳前問自己：「我買的是需要、是紀念、還是在填補什麼？」今天至少放下一樣「差點買了但其實不需要」的東西。",
    prayer: "主啊，在等待中教我耐心，在消費中教我知足。讓我的安全感不建立在掌控之上，而是在祢的供應裡。",
    lifeQuestion: "你上一次衝動消費是在什麼心情之下？你覺得你真正想「買」的是什麼？",
  },
  15: {
    reference: "申6:6-7",
    theme: "感動的保質期只有三天——除非你把它帶進日常",
    verses: [],
    place: "返程（機上）",
    reflection: "飛機離地的那一刻，這些日子的畫面會開始快速倒帶。但旅途中的感動和領悟有保質期——心理學研究顯示，強烈情緒體驗如果不在七十二小時內轉化為具體行動，就會被日常淹沒。你這趟旅程想帶走的，不應該只是照片和紀念品。",
    action: "在飛機上完成三句話：①這趟旅程，我看見了＿＿＿ ②我被提醒要改變的是＿＿＿ ③回去後七天內，我要開始做的一件事是＿＿＿",
    prayer: "主啊，讓我帶走的不只是風景，而是被改變的眼光和柔軟的心。幫助我把路上的領悟活進日常。",
    lifeQuestion: "回想所有旅程片段，哪一個畫面你最想永遠記住？為什麼是那個畫面？",
  },
  16: {
    reference: "彌6:8",
    theme: "回家後怎麼對人，才是旅程真正的成績單",
    verses: [],
    place: "回到家（收心日）",
    reflection: "旅行中我們容易變得開放、柔軟、感恩——因為一切都是新鮮的、沒有壓力的。但回到日常的第一天才是真正的考驗：你對家人的語氣、你對同事的耐心、你面對壓力時是否還記得在路上的領悟。真正的改變不是在聖地流淚，而是回家後對身邊的人多了一份溫柔。",
    action: "列一個「三人清單」：一位你想感謝的人、一位你想道歉的人、一位你想祝福的人。今天就用訊息或電話行動，不要等到「有空再說」。",
    prayer: "主啊，讓這趟旅程的恩典不留在路上。讓它變成我每天的善意、饒恕、耐心與愛。我願意行公義、好憐憫、謙卑地與祢同行。",
    lifeQuestion: "如果這趟旅程只能改變你一個習慣或態度，你希望是什麼？三個月後的你還會記得嗎？",
  },
};

type TabType = "morning" | "adventure" | "evening";


export default function DailyJourney() {
  const [activeTab, setActiveTab] = useState<TabType>("morning");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateScrollRef = useRef<HTMLDivElement>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<JournalEntryData | null>(null);

  const [reflection, setReflection] = useState("");
  const [prayerContent, setPrayerContent] = useState("");

  const [gratitude, setGratitude] = useState("");
  const [highlight, setHighlight] = useState("");
  const [prayerForTomorrow, setPrayerForTomorrow] = useState("");

  const [isEditingDevotional, setIsEditingDevotional] = useState(false);
  const [isEditingEvening, setIsEditingEvening] = useState(false);
  const [versesExpanded, setVersesExpanded] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    setIsEditingDevotional(false);
    setIsEditingEvening(false);
    setVersesExpanded(false);
    setSelectedVerses(new Set());
    setReflection("");
    setPrayerContent("");
    setGratitude("");
    setHighlight("");
    setPrayerForTomorrow("");
  }, [selectedDate]);

  const { user } = useAuth();
  const { data: trip } = useTrip();
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: entries, isLoading: journalLoading } = useJournalEntries(dateStr);
  const createEntry = useCreateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();
  const updateEntry = useUpdateJournalEntry();

  const { data: myDevotional, isLoading: devotionalLoading } = useMyDevotionalEntry(dateStr);
  const saveDevotional = useSaveDevotional();

  const { data: eveningData, isLoading: eveningLoading } = useEveningReflection(dateStr);
  const saveEvening = useSaveEveningReflection();

  const currentDay = useMemo(() => {
    if (!trip?.startDate) return 0;
    // Use local midnight (not UTC) to avoid timezone offset issues
    const start = new Date(trip.startDate + 'T00:00:00');
    const selected = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    return differenceInDays(selected, start) + 1;
  }, [trip?.startDate, selectedDate]);

  const { data: devotionalCourses } = useTripDevotionalCourses();

  const todayCourse = useMemo(() => {
    if (!devotionalCourses || devotionalCourses.length === 0) return null;
    return devotionalCourses.find(c => c.dayNo === currentDay) || null;
  }, [devotionalCourses, currentDay]);

  const scriptureRef = todayCourse?.scripture || null;
  const { data: bibleLookup, isLoading: bibleLoading } = useBibleLookup(scriptureRef);

  const hasCourses = devotionalCourses && devotionalCourses.length > 0;

  const todayScripture: ScriptureData | null = useMemo(() => {
    if (todayCourse && bibleLookup && bibleLookup.verses.length > 0) {
      return {
        reference: todayCourse.scripture || "",
        theme: todayCourse.title,
        verses: bibleLookup.verses,
        reflection: todayCourse.reflection || "",
        place: todayCourse.place || undefined,
        action: todayCourse.action || undefined,
        prayer: todayCourse.prayer || undefined,
        lifeQuestion: todayCourse.lifeQuestion || undefined,
      };
    }
    if (todayCourse) {
      return {
        reference: todayCourse.scripture || "",
        theme: todayCourse.title,
        verses: [],
        reflection: todayCourse.reflection || "",
        place: todayCourse.place || undefined,
        action: todayCourse.action || undefined,
        prayer: todayCourse.prayer || undefined,
        lifeQuestion: todayCourse.lifeQuestion || undefined,
      };
    }
    if (!hasCourses) {
      return fallbackScriptures[currentDay] || fallbackScriptures[((currentDay - 1) % 5) + 1];
    }
    return null;
  }, [todayCourse, bibleLookup, currentDay, hasCourses]);

  const toggleVerseSelection = (idx: number) => {
    setSelectedVerses(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAllVerses = (verses: { number: number; text: string }[]) => {
    const indices = verses.map((v, i) => v.number > 0 ? i : -1).filter(i => i >= 0);
    setSelectedVerses(prev => {
      const allSelected = indices.every(i => prev.has(i));
      if (allSelected) return new Set();
      return new Set(indices);
    });
  };

  const copySelectedVerses = (verses: { number: number; text: string }[], reference: string) => {
    const selected = verses.filter((v, i) => selectedVerses.has(i) && v.number > 0);
    if (selected.length === 0) return;
    const text = `${reference}\n${selected.map(v => `${v.number} ${v.text}`).join("\n")}`;
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `已複製 ${selected.length} 節經文` });
      setSelectedVerses(new Set());
    });
  };

  const days = useMemo(() => {
    const selected = startOfDay(selectedDate);
    const dayOfWeek = selected.getDay();
    const weekStart = addDays(selected, -dayOfWeek);
    const today = startOfDay(new Date());

    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        date: format(date, "M/d"),
        day: format(date, "EEEEE", { locale: zhTW }),
        fullDate: date,
        isToday: startOfDay(date).getTime() === today.getTime(),
      };
    });
  }, [selectedDate]);

  const selectedDayIndex = days.findIndex(
    (d) => format(d.fullDate, "yyyy-MM-dd") === dateStr
  );

  // Scroll selected date into center
  useEffect(() => {
    if (selectedDayIndex < 0 || !dateScrollRef.current) return;
    const container = dateScrollRef.current;
    const child = container.children[selectedDayIndex] as HTMLElement;
    if (!child) return;
    const scrollLeft = child.offsetLeft - container.offsetWidth / 2 + child.offsetWidth / 2;
    container.scrollTo({ left: scrollLeft, behavior: "smooth" });
  }, [selectedDayIndex]);

  const morningCompleted = !!myDevotional?.reflection;
  const adventureCompleted = (entries || []).length > 0;
  const eveningCompleted = !!eveningData?.gratitude;

  const transformedEntries: JournalEntryData[] = (entries || []).map((entry) => ({
    id: entry.id,
    location: entry.location || "",
    time: entry.createdAt ? format(parseISO(entry.createdAt), "HH:mm") : "",
    content: entry.content || "",
    photos: entry.photos?.map((p) => transformPhotoUrl(p.photoUrl)) || [],
    photoDetails: entry.photos?.map((p) => ({
      url: transformPhotoUrl(p.photoUrl),
      originalPath: p.photoUrl,
      latitude: p.latitude ?? null,
      longitude: p.longitude ?? null,
    })) || [],
    originalPhotoPaths: entry.photos?.map((p) => p.photoUrl) || [],
    mood: undefined,
  }));

  const handleSaveDevotional = async () => {
    await saveDevotional.mutateAsync({
      scriptureReference: todayScripture?.reference || "",
      reflection,
      prayer: prayerContent || "",
      date: dateStr,
      id: myDevotional?.id,
    });
    setReflection("");
    setPrayerContent("");
    setIsEditingDevotional(false);
  };

  const handleEditDevotional = () => {
    if (myDevotional) {
      setReflection(myDevotional.reflection || "");
      setPrayerContent(myDevotional.prayer || "");
      setIsEditingDevotional(true);
    }
  };

  const handleSaveEvening = async () => {
    await saveEvening.mutateAsync({
      gratitude,
      highlight,
      prayerForTomorrow,
      entryDate: dateStr,
    });
    setGratitude("");
    setHighlight("");
    setPrayerForTomorrow("");
    setIsEditingEvening(false);
  };

  const handleEditEvening = () => {
    if (eveningData) {
      setGratitude(eveningData.gratitude || "");
      setHighlight(eveningData.highlight || "");
      setPrayerForTomorrow(eveningData.prayerForTomorrow || "");
      setIsEditingEvening(true);
    }
  };

  const handleSaveJournal = async (newEntry: {
    location: string;
    content: string;
    photos: { photoUrl: string; latitude?: number | null; longitude?: number | null }[];
    mood: string;
  }) => {
    await createEntry.mutateAsync({
      title: newEntry.location || "日誌",
      content: newEntry.content,
      location: newEntry.location,
      photos: newEntry.photos,
    });
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteEntry.mutateAsync(id);
    setViewingEntry(null);
  };

  const handleUpdateEntry = async (id: string, data: { content: string; location: string; photos?: { photoUrl: string; latitude?: number | null; longitude?: number | null }[] }) => {
    await updateEntry.mutateAsync({
      id,
      content: data.content,
      location: data.location,
      title: data.location || "日誌",
      photos: data.photos,
    });
    setViewingEntry(prev => {
      if (!prev) return null;
      const updated = { ...prev, content: data.content, location: data.location };
      if (data.photos) {
        updated.originalPhotoPaths = data.photos.map(p => p.photoUrl);
        updated.photos = data.photos.map(p => transformPhotoUrl(p.photoUrl));
        updated.photoDetails = data.photos.map(p => ({
          url: transformPhotoUrl(p.photoUrl),
          originalPath: p.photoUrl,
          latitude: p.latitude ?? null,
          longitude: p.longitude ?? null,
        }));
      }
      return updated;
    });
  };

  const tabs: { key: TabType; label: string; icon: typeof Sun; completed: boolean }[] = [
    { key: "morning", label: "晨光靈修", icon: Sun, completed: morningCompleted },
    { key: "adventure", label: "旅途探險", icon: Compass, completed: adventureCompleted },
    { key: "evening", label: "夜間感恩", icon: Moon, completed: eveningCompleted },
  ];

  return (
    <PageLayout title="每日旅程">
      <div className="relative px-4 md:px-8 py-6 pb-20 container max-w-5xl mx-auto space-y-8 animate-fade-in">
        {/* Date Selector */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-display">
              {format(selectedDate, "yyyy年M月", { locale: zhTW })}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDate(prev => addDays(prev, -7))}
                className="p-2 rounded-xl hover:bg-muted transition-all active:scale-95 touch-target"
                data-testid="button-prev-week"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95"
                data-testid="button-today"
              >
                今天
              </button>
              <button
                onClick={() => setSelectedDate(prev => addDays(prev, 7))}
                className="p-2 rounded-xl hover:bg-muted transition-all active:scale-95 touch-target"
                data-testid="button-next-week"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div ref={dateScrollRef} className="flex flex-nowrap gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(day.fullDate)}
                data-testid={`button-day-${index}`}
                className={cn(
                  "flex-shrink-0 w-20 py-4 rounded-2xl flex flex-col items-center gap-1.5 transition-all touch-target snap-start",
                  selectedDayIndex === index
                    ? "gradient-warm text-primary-foreground shadow-elevated transform scale-105"
                    : "bg-card/80 backdrop-blur-md text-foreground hover:bg-muted border border-border shadow-sm hover:shadow-card hover:-translate-y-1"
                )}
              >
                <span className={cn("text-caption font-medium", selectedDayIndex === index ? "text-primary-foreground/90" : "text-muted-foreground")}>{day.day}</span>
                <span className="text-display text-2xl">{day.date.split("/")[1]}</span>
                {day.isToday && selectedDayIndex !== index && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-1 shadow-sm" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Step Tabs */}
        <section className="flex gap-3 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              data-testid={`tab-${tab.key}`}
              className={cn(
                "flex-1 py-4 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2 transition-all touch-target relative",
                activeTab === tab.key
                  ? tab.key === "morning"
                    ? "bg-amber-100 text-amber-800 shadow-elevated dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
                    : tab.key === "adventure"
                      ? "bg-emerald-100 text-emerald-800 shadow-elevated dark:bg-emerald-900/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
                      : "bg-indigo-100 text-indigo-800 shadow-elevated dark:bg-indigo-900/40 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                  : "bg-card/80 backdrop-blur-md text-muted-foreground hover:bg-muted border border-white/10 hover:shadow-card hover:-translate-y-1"
              )}
            >
              <tab.icon className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="text-body font-semibold">{tab.label}</span>
              {tab.completed && (
                <Check className="w-4 h-4 sm:w-3.5 sm:h-3.5 absolute top-2 right-2 text-green-600 bg-green-100 rounded-full p-0.5" />
              )}
            </button>
          ))}
        </section>

        {/* Morning Devotion Tab */}
        {activeTab === "morning" && (
          <section className="space-y-5 animate-fade-in min-h-[200px]">
            {devotionalLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !todayScripture ? (
              <div className="space-y-4">
                <div className="bg-card rounded-lg shadow-card p-8 text-center space-y-3">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="text-title font-semibold text-muted-foreground">今日沒有安排靈修經文</p>
                  <p className="text-body text-muted-foreground/70">享受旅途中的自由時光吧！</p>
                </div>
                {myDevotional?.reflection && !isEditingDevotional ? (
                  <div className="bg-card rounded-lg shadow-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 flex items-start gap-2 flex-1">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-caption font-medium text-green-700 dark:text-green-300">我的靈修心得</p>
                          <p className="text-body text-foreground mt-1">{myDevotional.reflection}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleEditDevotional}
                        className="p-2 rounded-lg hover:bg-muted transition-colors ml-2"
                        data-testid="button-edit-devotional-nodevotional"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    {myDevotional.prayer && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-caption font-medium text-muted-foreground mb-1">禱告</p>
                        <p className="text-body text-foreground">{myDevotional.prayer}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-card rounded-lg shadow-card p-5 space-y-4">
                    <div className="space-y-3">
                      <label className="text-body font-medium flex items-center gap-2">
                        <Heart className="w-5 h-5 text-terracotta" />
                        今日感動
                      </label>
                      <Textarea
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                        placeholder="今天有什麼感動或領受..."
                        className="min-h-[100px] max-h-[200px] text-body resize-none"
                        data-testid="input-reflection-nodevotional"
                      />
                    </div>
                    {isEditingDevotional && (
                      <Button
                        onClick={() => {
                          setIsEditingDevotional(false);
                          setReflection("");
                          setPrayerContent("");
                        }}
                        variant="outline"
                        className="w-full h-12 rounded-xl"
                        data-testid="button-cancel-devotional-nodevotional"
                      >
                        取消編輯
                      </Button>
                    )}
                    <Button
                      onClick={handleSaveDevotional}
                      disabled={!reflection.trim() || saveDevotional.isPending}
                      className="w-full h-12 gradient-warm text-primary-foreground rounded-xl"
                      data-testid="button-save-devotional-nodevotional"
                    >
                      {saveDevotional.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isEditingDevotional ? "儲存修改" : "記錄感動"}
                    </Button>
                  </div>
                )}
              </div>
            ) : myDevotional?.reflection && !isEditingDevotional ? (
              <div className="space-y-4">
                <div className="bg-card rounded-lg shadow-card overflow-hidden">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                        <BookOpen className="w-5 h-5" />
                        <span className="text-body font-semibold">{todayScripture.reference}</span>
                      </div>
                      <button
                        onClick={handleEditDevotional}
                        className="p-2 rounded-lg bg-white/40 hover:bg-white/60 transition-colors"
                        data-testid="button-edit-devotional"
                      >
                        <Pencil className="w-4 h-4 text-amber-800 dark:text-amber-200" />
                      </button>
                    </div>
                    <p className="text-caption text-amber-700/80 dark:text-amber-300/80 mt-1">{todayScripture.theme}</p>
                    {todayScripture.place && (
                      <p className="text-caption text-amber-700/60 dark:text-amber-300/60 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {todayScripture.place}
                      </p>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    {todayScripture.verses.length > 0 && (
                      <div className="bg-amber-50/60 dark:bg-amber-900/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => { setVersesExpanded(!versesExpanded); setSelectedVerses(new Set()); }}
                          className="w-full flex items-center justify-between p-3 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
                          data-testid="button-toggle-verses-completed"
                        >
                          <span className="text-caption font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            經文 ({todayScripture.verses.filter(v => v.number > 0).length} 節)
                          </span>
                          <ChevronDown className={cn("w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform", versesExpanded && "rotate-180")} />
                        </button>
                        {versesExpanded && (
                          <div className="px-3 pb-3 space-y-1">
                            <div className="flex justify-end mb-1">
                              <button
                                onClick={() => selectAllVerses(todayScripture.verses)}
                                className="text-xs text-amber-600 dark:text-amber-400 hover:underline px-1"
                                data-testid="button-select-all-completed"
                              >
                                {todayScripture.verses.filter((v, i) => v.number > 0 && selectedVerses.has(i)).length === todayScripture.verses.filter(v => v.number > 0).length ? "取消全選" : "全選"}
                              </button>
                            </div>
                            {todayScripture.verses.map((verse, idx) => (
                              verse.number === 0 ? (
                                <p key={`label-${idx}`} className="text-caption text-amber-600 dark:text-amber-400 font-medium pt-2">{verse.text}</p>
                              ) : (
                                <button
                                  key={`v-${idx}-${verse.number}`}
                                  onClick={() => toggleVerseSelection(idx)}
                                  className={cn(
                                    "w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors",
                                    selectedVerses.has(idx) ? "bg-amber-200/60 dark:bg-amber-800/40" : "hover:bg-amber-100/40 dark:hover:bg-amber-900/20"
                                  )}
                                  data-testid={`button-select-verse-${verse.number}`}
                                >
                                  <div className={cn(
                                    "w-4 h-4 rounded border flex-shrink-0 mt-1 flex items-center justify-center transition-colors",
                                    selectedVerses.has(idx) ? "bg-amber-600 border-amber-600 text-white" : "border-amber-400"
                                  )}>
                                    {selectedVerses.has(idx) && <Check className="w-3 h-3" />}
                                  </div>
                                  <p className="text-body text-foreground leading-relaxed flex-1">
                                    <span className="text-caption font-semibold text-amber-700 dark:text-amber-400 mr-1">{verse.number}</span>
                                    {verse.text}
                                  </p>
                                </button>
                              )
                            ))}
                            {selectedVerses.size > 0 && (
                              <button
                                onClick={() => copySelectedVerses(todayScripture.verses, todayScripture.reference)}
                                className="w-full mt-2 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                                data-testid="button-copy-selected-completed"
                              >
                                <Copy className="w-4 h-4" />
                                複製 {todayScripture.verses.filter((v, i) => selectedVerses.has(i) && v.number > 0).length} 節經文
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {todayScripture.reflection && (
                      <p className="text-body text-muted-foreground italic leading-relaxed px-1">
                        {todayScripture.reflection}
                      </p>
                    )}
                    {todayScripture.action && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-start gap-2">
                        <HandHeart className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-caption font-medium text-blue-700 dark:text-blue-300">今日操練</p>
                          <p className="text-body text-foreground mt-1">{todayScripture.action}</p>
                        </div>
                      </div>
                    )}
                    {todayScripture.prayer && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 flex items-start gap-2">
                        <MessageCircleHeart className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-caption font-medium text-purple-700 dark:text-purple-300">安靜時刻</p>
                          <p className="text-body text-foreground mt-1">{todayScripture.prayer}</p>
                        </div>
                      </div>
                    )}
                    {todayScripture.lifeQuestion && (
                      <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3 flex items-start gap-2">
                        <HelpCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-caption font-medium text-rose-700 dark:text-rose-300">生命提問</p>
                          <p className="text-body text-foreground mt-1">{todayScripture.lifeQuestion}</p>
                        </div>
                      </div>
                    )}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-caption font-medium text-green-700 dark:text-green-300">我的靈修心得</p>
                        <p className="text-body text-foreground mt-1">{myDevotional.reflection}</p>
                      </div>
                    </div>
                    {myDevotional.prayer && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-caption font-medium text-muted-foreground mb-1">禱告</p>
                        <p className="text-body text-foreground">{myDevotional.prayer}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : todayScripture ? (
              <div className="space-y-4">
                {/* Scripture Card */}
                <div className="bg-card rounded-lg shadow-card overflow-hidden">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                        <BookOpen className="w-5 h-5" />
                        <span className="text-body font-semibold">{todayScripture.reference}</span>
                      </div>
                    </div>
                    <p className="text-caption text-amber-700/80 dark:text-amber-300/80 mt-1">{todayScripture.theme}</p>
                    {todayScripture.place && (
                      <p className="text-caption text-amber-700/60 dark:text-amber-300/60 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {todayScripture.place}
                      </p>
                    )}
                  </div>
                  <div className="p-5 space-y-4">
                    {todayScripture.verses.length > 0 && (
                      <div className="bg-amber-50/40 dark:bg-amber-900/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => { setVersesExpanded(!versesExpanded); setSelectedVerses(new Set()); }}
                          className="w-full flex items-center justify-between p-3 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
                          data-testid="button-toggle-verses"
                        >
                          <span className="text-caption font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            經文 ({todayScripture.verses.filter(v => v.number > 0).length} 節)
                          </span>
                          <ChevronDown className={cn("w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform", versesExpanded && "rotate-180")} />
                        </button>
                        {versesExpanded && (
                          <div className="px-3 pb-3 space-y-1">
                            <div className="flex justify-end mb-1">
                              <button
                                onClick={() => selectAllVerses(todayScripture.verses)}
                                className="text-xs text-amber-600 dark:text-amber-400 hover:underline px-1"
                                data-testid="button-select-all"
                              >
                                {todayScripture.verses.filter((v, i) => v.number > 0 && selectedVerses.has(i)).length === todayScripture.verses.filter(v => v.number > 0).length ? "取消全選" : "全選"}
                              </button>
                            </div>
                            {todayScripture.verses.map((verse, idx) => (
                              verse.number === 0 ? (
                                <p key={`label-${idx}`} className="text-caption text-amber-600 dark:text-amber-400 font-medium pt-2">{verse.text}</p>
                              ) : (
                                <button
                                  key={`v-${idx}-${verse.number}`}
                                  onClick={() => toggleVerseSelection(idx)}
                                  className={cn(
                                    "w-full flex items-start gap-2 p-2 rounded-lg text-left transition-colors",
                                    selectedVerses.has(idx) ? "bg-amber-200/60 dark:bg-amber-800/40" : "hover:bg-amber-100/40 dark:hover:bg-amber-900/20"
                                  )}
                                  data-testid={`button-select-verse-${verse.number}`}
                                >
                                  <div className={cn(
                                    "w-4 h-4 rounded border flex-shrink-0 mt-1 flex items-center justify-center transition-colors",
                                    selectedVerses.has(idx) ? "bg-amber-600 border-amber-600 text-white" : "border-amber-400"
                                  )}>
                                    {selectedVerses.has(idx) && <Check className="w-3 h-3" />}
                                  </div>
                                  <p className="text-body leading-relaxed flex-1">
                                    <span className="text-primary font-semibold text-caption align-super mr-1">{verse.number}</span>
                                    {verse.text}
                                  </p>
                                </button>
                              )
                            ))}
                            {selectedVerses.size > 0 && (
                              <button
                                onClick={() => copySelectedVerses(todayScripture.verses, todayScripture.reference)}
                                className="w-full mt-2 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                                data-testid="button-copy-selected"
                              >
                                <Copy className="w-4 h-4" />
                                複製 {todayScripture.verses.filter((v, i) => selectedVerses.has(i) && v.number > 0).length} 節經文
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                      <h4 className="text-caption font-semibold text-amber-700 dark:text-amber-300 mb-2">看見與感受</h4>
                      <p className="text-body text-muted-foreground leading-relaxed">{todayScripture.reflection}</p>
                    </div>
                    {todayScripture.action && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h4 className="text-caption font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
                          <HandHeart className="w-3.5 h-3.5" />
                          今日操練
                        </h4>
                        <p className="text-body text-muted-foreground leading-relaxed">{todayScripture.action}</p>
                      </div>
                    )}
                    {todayScripture.prayer && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                        <h4 className="text-caption font-semibold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-1">
                          <MessageCircleHeart className="w-3.5 h-3.5" />
                          安靜時刻
                        </h4>
                        <p className="text-body text-muted-foreground leading-relaxed">{todayScripture.prayer}</p>
                      </div>
                    )}
                    {todayScripture.lifeQuestion && (
                      <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-4">
                        <h4 className="text-caption font-semibold text-rose-700 dark:text-rose-300 mb-2 flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                          生命提問
                        </h4>
                        <p className="text-body text-muted-foreground leading-relaxed">{todayScripture.lifeQuestion}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reflection Form */}
                <div className="bg-card rounded-lg shadow-card p-5 space-y-4">
                  <div className="space-y-3">
                    <label className="text-body font-medium flex items-center gap-2">
                      <Heart className="w-5 h-5 text-terracotta" />
                      今日感動
                    </label>
                    <Textarea
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value)}
                      placeholder="這段經文對我說了什麼？我有什麼感動或領受..."
                      className="min-h-[100px] max-h-[200px] text-body resize-none"
                      data-testid="input-reflection"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-body font-medium flex items-center gap-2">
                      <MessageCircleHeart className="w-5 h-5 text-purple-600" />
                      今日禱告
                    </label>
                    <Textarea
                      value={prayerContent}
                      onChange={(e) => setPrayerContent(e.target.value)}
                      placeholder="親愛的天父，感謝祢..."
                      className="min-h-[80px] max-h-[200px] text-body resize-none"
                      data-testid="input-prayer"
                    />
                  </div>

                  {isEditingDevotional && (
                    <Button
                      onClick={() => {
                        setIsEditingDevotional(false);
                        setReflection("");
                        setPrayerContent("");
                      }}
                      variant="outline"
                      className="w-full h-12 rounded-xl"
                      data-testid="button-cancel-devotional"
                    >
                      取消編輯
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveDevotional}
                    disabled={!reflection.trim() || saveDevotional.isPending}
                    className="w-full h-12 gradient-warm text-primary-foreground rounded-xl"
                    data-testid="button-save-devotional"
                  >
                    {saveDevotional.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isEditingDevotional ? (
                      "儲存修改"
                    ) : (
                      "完成靈修"
                    )}
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {/* Adventure Tab */}
        {activeTab === "adventure" && (
          <section className="space-y-4 animate-fade-in min-h-[200px]">
            <div className="bg-card rounded-lg shadow-card p-4">
              <div className="flex items-center justify-around text-center">
                <div>
                  <p className="text-display text-primary" data-testid="text-entry-count">{transformedEntries.length}</p>
                  <p className="text-caption text-muted-foreground">今日記錄</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-display text-secondary" data-testid="text-photo-count">
                    {transformedEntries.reduce((acc, e) => acc + e.photos.length, 0)}
                  </p>
                  <p className="text-caption text-muted-foreground">照片數量</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-display text-terracotta" data-testid="text-location-count">
                    {new Set(transformedEntries.filter(e => e.location).map(e => e.location)).size}
                  </p>
                  <p className="text-caption text-muted-foreground">景點打卡</p>
                </div>
              </div>
            </div>

            {journalLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : transformedEntries.length > 0 ? (
              <div className="space-y-4">
                {transformedEntries.map((entry) => (
                  <JournalEntry
                    key={entry.id}
                    entry={entry}
                    onClick={() => setViewingEntry(entry)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-lg shadow-card p-8 text-center">
                <Compass className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-body text-muted-foreground">
                  今天還沒有探險記錄，點擊下方按鈕開始記錄吧！
                </p>
              </div>
            )}

            <button
              onClick={() => setIsAddOpen(true)}
              disabled={createEntry.isPending}
              data-testid="button-add-journal"
              className={cn(
                "fixed right-4 bottom-24 w-16 h-16 rounded-full z-40",
                "bg-emerald-500 text-white shadow-elevated",
                "flex items-center justify-center",
                "hover:scale-105 active:scale-95 transition-transform",
                "focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2",
                "disabled:opacity-50"
              )}
            >
              {createEntry.isPending ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <Plus className="w-8 h-8" strokeWidth={2} />
              )}
            </button>
          </section>
        )}

        {/* Evening Tab */}
        {activeTab === "evening" && (
          <section className="space-y-5 animate-fade-in min-h-[200px]">
            {eveningLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : eveningData?.gratitude && !isEditingEvening ? (
              <div className="bg-card rounded-lg shadow-card overflow-hidden">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
                      <Moon className="w-5 h-5" />
                      <span className="text-body font-semibold">今日回顧</span>
                    </div>
                    <button
                      onClick={handleEditEvening}
                      className="p-2 rounded-lg bg-white/40 hover:bg-white/60 transition-colors"
                      data-testid="button-edit-evening"
                    >
                      <Pencil className="w-4 h-4 text-indigo-800 dark:text-indigo-200" />
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-caption font-medium text-green-700 dark:text-green-300">已完成今日回顧</p>
                  </div>
                  {eveningData.gratitude && (
                    <div className="space-y-1">
                      <p className="text-caption font-medium text-muted-foreground">感恩的事</p>
                      <p className="text-body text-foreground">{eveningData.gratitude}</p>
                    </div>
                  )}
                  {eveningData.highlight && (
                    <div className="space-y-1">
                      <p className="text-caption font-medium text-muted-foreground">最美好的時刻</p>
                      <p className="text-body text-foreground">{eveningData.highlight}</p>
                    </div>
                  )}
                  {eveningData.prayerForTomorrow && (
                    <div className="space-y-1">
                      <p className="text-caption font-medium text-muted-foreground">為明天的禱告</p>
                      <p className="text-body text-foreground">{eveningData.prayerForTomorrow}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-lg shadow-card p-5 space-y-5">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-center">
                  <Moon className="w-8 h-8 text-indigo-600 dark:text-indigo-300 mx-auto mb-2" />
                  <p className="text-body font-medium text-indigo-800 dark:text-indigo-200">睡前回顧與感恩</p>
                  <p className="text-caption text-indigo-600/70 dark:text-indigo-300/70 mt-1">回顧今天，數算恩典</p>
                </div>

                <div className="space-y-3">
                  <label className="text-body font-medium">今日最感恩的事</label>
                  <Textarea
                    value={gratitude}
                    onChange={(e) => setGratitude(e.target.value)}
                    placeholder="今天最讓我感恩的是..."
                    className="min-h-[80px] max-h-[200px] text-body resize-none"
                    data-testid="input-gratitude"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-body font-medium">今天最美好的時刻</label>
                  <Textarea
                    value={highlight}
                    onChange={(e) => setHighlight(e.target.value)}
                    placeholder="今天讓我最印象深刻的事情是..."
                    className="min-h-[80px] max-h-[200px] text-body resize-none"
                    data-testid="input-highlight"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-body font-medium">為明天的禱告</label>
                  <Textarea
                    value={prayerForTomorrow}
                    onChange={(e) => setPrayerForTomorrow(e.target.value)}
                    placeholder="求主帶領明天的旅程..."
                    className="min-h-[80px] max-h-[200px] text-body resize-none"
                    data-testid="input-prayer-tomorrow"
                  />
                </div>

                {isEditingEvening && (
                  <Button
                    onClick={() => {
                      setIsEditingEvening(false);
                      setGratitude("");
                      setHighlight("");
                      setPrayerForTomorrow("");
                    }}
                    variant="outline"
                    className="w-full h-12 rounded-xl"
                    data-testid="button-cancel-evening"
                  >
                    取消編輯
                  </Button>
                )}
                <Button
                  onClick={handleSaveEvening}
                  disabled={!gratitude.trim() || saveEvening.isPending}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                  data-testid="button-save-evening"
                >
                  {saveEvening.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isEditingEvening ? (
                    "儲存修改"
                  ) : (
                    "完成今日回顧"
                  )}
                </Button>
              </div>
            )}
          </section>
        )}
      </div>

      <AddJournalSheet
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        date={dateStr}
        onSave={handleSaveJournal}
      />

      <ViewJournalSheet
        entry={viewingEntry}
        open={!!viewingEntry}
        onOpenChange={(open) => !open && setViewingEntry(null)}
        onDelete={handleDeleteEntry}
        onUpdate={handleUpdateEntry}
      />
    </PageLayout>
  );
}
