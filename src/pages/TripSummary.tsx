import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { TripOverview } from "@/components/summary/TripOverview";
import { DailyItinerary } from "@/components/summary/DailyItinerary";
import { PhotoGallery } from "@/components/summary/PhotoGallery";
import { HighlightMoments } from "@/components/summary/HighlightMoments";
import { ExportOptions } from "@/components/summary/ExportOptions";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const tripData = {
  title: "2024 聖地朝聖之旅",
  destination: "以色列 · 約旦",
  dateRange: "2024/3/15 - 3/25",
  duration: 11,
  memberCount: 28,
  coverImage: "https://images.unsplash.com/photo-1547036346-0e63c72f8a4d?w=800&auto=format&fit=crop",
};

const scheduleData = [
  {
    day: 1,
    date: "3月15日（週五）",
    title: "台北出發",
    locations: ["桃園機場", "香港轉機"],
    highlights: "懷著期待的心情，踏上朝聖之旅。在機場與團員們會合，開始這趟屬靈之旅。",
    completed: true,
  },
  {
    day: 2,
    date: "3月16日（週六）",
    title: "抵達特拉維夫",
    locations: ["特拉維夫", "雅法古城"],
    highlights: "抵達以色列，參觀雅法古城，感受地中海的美麗風光與悠久歷史。",
    completed: true,
  },
  {
    day: 3,
    date: "3月17日（週日）",
    title: "耶路撒冷聖城",
    locations: ["聖墓教堂", "苦路", "西牆"],
    highlights: "進入耶路撒冷舊城，走過耶穌受難的苦路，在西牆前禱告，心靈深受感動。",
    completed: true,
  },
  {
    day: 4,
    date: "3月18日（週一）",
    title: "橄欖山與客西馬尼",
    locations: ["橄欖山", "客西馬尼園", "萬國教堂"],
    highlights: "從橄欖山俯瞰耶路撒冷全景，在客西馬尼園默想耶穌的禱告。",
    completed: false,
  },
  {
    day: 5,
    date: "3月19日（週二）",
    title: "伯利恆之行",
    locations: ["主誕教堂", "牧羊人田野"],
    highlights: "前往伯利恆，朝拜主耶穌的誕生地，感受聖誕故事的真實場景。",
    completed: false,
  },
];

const photosData = [
  { id: "1", url: "https://images.unsplash.com/photo-1547036346-0e63c72f8a4d?w=400", caption: "聖墓教堂", date: "3月17日", location: "耶路撒冷" },
  { id: "2", url: "https://images.unsplash.com/photo-1552423314-cf29ab68ad73?w=400", caption: "西牆禱告", date: "3月17日", location: "耶路撒冷" },
  { id: "3", url: "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400", caption: "橄欖山日出", date: "3月18日", location: "橄欖山" },
  { id: "4", url: "https://images.unsplash.com/photo-1601142634808-38923eb7c560?w=400", caption: "客西馬尼園", date: "3月18日", location: "橄欖山" },
  { id: "5", url: "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=400", caption: "苦路朝聖", date: "3月17日", location: "耶路撒冷" },
  { id: "6", url: "https://images.unsplash.com/photo-1580109169051-1f4de1f61e65?w=400", caption: "主誕教堂", date: "3月19日", location: "伯利恆" },
  { id: "7", url: "https://images.unsplash.com/photo-1591018533273-cc9ed9e6f2ac?w=400", caption: "加利利海", date: "3月20日", location: "加利利" },
  { id: "8", url: "https://images.unsplash.com/photo-1579606032821-4e6161c81571?w=400", caption: "佩特拉古城", date: "3月22日", location: "約旦" },
  { id: "9", url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400", caption: "死海漂浮", date: "3月21日", location: "死海" },
  { id: "10", url: "https://images.unsplash.com/photo-1547036346-0e63c72f8a4d?w=400", caption: "團體合照", date: "3月17日", location: "耶路撒冷" },
];

const highlightsData = [
  {
    id: "1",
    type: "spiritual" as const,
    title: "西牆前的禱告",
    description: "站在西牆前，將手放在古老的石牆上，感受千年來無數人在此禱告的力量，淚水不禁流下。",
    date: "3月17日",
  },
  {
    id: "2",
    type: "experience" as const,
    title: "死海漂浮體驗",
    description: "第一次體驗在死海上漂浮的奇妙感覺，塗上死海泥，享受大自然的恩賜。",
    date: "3月21日",
  },
  {
    id: "3",
    type: "fellowship" as const,
    title: "加利利海邊敬拜",
    description: "全團在加利利海邊唱詩敬拜，彷彿回到兩千年前門徒們與主同行的時刻。",
    date: "3月20日",
  },
  {
    id: "4",
    type: "spiritual" as const,
    title: "客西馬尼園默想",
    description: "在古老的橄欖樹下靜默禱告，默想主耶穌在被捕前夜的掙扎與順服。",
    date: "3月18日",
  },
];

const TripSummary = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        {/* Title */}
        <section className="text-center space-y-2">
          <h1 className="text-display">旅程回憶錄</h1>
          <p className="text-body text-muted-foreground">
            珍藏這趟朝聖之旅的美好記憶
          </p>
        </section>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="overview" className="text-caption">總覽</TabsTrigger>
            <TabsTrigger value="itinerary" className="text-caption">行程</TabsTrigger>
            <TabsTrigger value="photos" className="text-caption">照片</TabsTrigger>
            <TabsTrigger value="export" className="text-caption">匯出</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <TripOverview {...tripData} />
            <Separator />
            <HighlightMoments highlights={highlightsData} />
          </TabsContent>

          <TabsContent value="itinerary" className="mt-6">
            <DailyItinerary schedule={scheduleData} />
          </TabsContent>

          <TabsContent value="photos" className="mt-6">
            <PhotoGallery photos={photosData} />
          </TabsContent>

          <TabsContent value="export" className="mt-6">
            <ExportOptions />
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default TripSummary;
