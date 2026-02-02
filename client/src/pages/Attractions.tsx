import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { AttractionCard } from "@/components/attractions/AttractionCard";
import { AttractionDetailSheet, Attraction } from "@/components/attractions/AttractionDetailSheet";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Import attraction images
import holySepulchreImg from "@/assets/attractions/holy-sepulchre.jpg";
import westernWallImg from "@/assets/attractions/western-wall.jpg";
import mountOlivesImg from "@/assets/attractions/mount-olives.jpg";
import gethsemaneImg from "@/assets/attractions/gethsemane.jpg";
import viaDolorosaImg from "@/assets/attractions/via-dolorosa.jpg";
import nativityChurchImg from "@/assets/attractions/nativity-church.jpg";
import seaGalileeImg from "@/assets/attractions/sea-galilee.jpg";
import petraImg from "@/assets/attractions/petra.jpg";
import deadSeaImg from "@/assets/attractions/dead-sea.jpg";

const attractions: Attraction[] = [
  {
    id: "1",
    name: "聖墓教堂",
    location: "耶路撒冷舊城區",
    imageUrl: holySepulchreImg,
    category: "religious",
    visitDuration: "1.5-2小時",
    visitDate: "3月17日",
    description: "聖墓教堂是基督教最神聖的地點之一，相傳是耶穌被釘十字架、埋葬及復活的地點。教堂內包含各各他山（髑髏地）和耶穌的空墳墓。",
    history: "教堂最初由君士坦丁大帝於公元326年下令建造，歷經多次毀壞與重建。現存建築主要為1149年十字軍時期的結構。教堂由六個基督教派共同管理，包括希臘東正教、天主教方濟會等。",
    scripture: "天使對婦女說：不要害怕！我知道你們是尋找那釘十字架的耶穌。他不在這裡，照他所說的，已經復活了。",
    scriptureReference: "馬太福音 28:5-6",
    visitTips: [
      "建議清晨或傍晚前往，避開擁擠人潮",
      "需穿著遮蓋肩膀和膝蓋的服裝",
      "保持肅靜，尊重正在祈禱的朝聖者",
      "可攜帶聖經閱讀相關經文",
    ],
  },
  {
    id: "2",
    name: "西牆（哭牆）",
    location: "耶路撒冷聖殿山",
    imageUrl: westernWallImg,
    category: "religious",
    visitDuration: "1小時",
    visitDate: "3月17日",
    description: "西牆是猶太教最神聖的禱告地點，是第二聖殿時期（公元前516年至公元70年）聖殿山的西側擋土牆遺跡。信徒們在此禱告並將寫有禱詞的紙條塞入牆縫。",
    history: "西牆建於大希律王時期（約公元前19年），是擴建第二聖殿時所建造的擋土牆。公元70年羅馬軍隊摧毀聖殿後，這面牆成為猶太人兩千年來緬懷聖殿的象徵。",
    scripture: "耶和華啊，我愛你所住的殿和你榮耀居住的地方。",
    scriptureReference: "詩篇 26:8",
    visitTips: [
      "男女分區禱告，男士需戴小帽（現場有提供）",
      "安息日（週五日落至週六日落）禁止攝影",
      "可準備小紙條寫下禱詞",
      "通過安檢時需出示證件",
    ],
  },
  {
    id: "3",
    name: "橄欖山",
    location: "耶路撒冷東部",
    imageUrl: mountOlivesImg,
    category: "religious",
    visitDuration: "2-3小時",
    visitDate: "3月18日",
    description: "橄欖山是耶路撒冷東側的一座山丘，與舊城隔著汲淪谷相望。這裡是眺望耶路撒冷老城和聖殿山的最佳地點，也是耶穌生平中許多重要事件的發生地。",
    history: "橄欖山在聖經中有著重要地位，耶穌經常在此教導門徒、預言末世，並在最後一週從這裡榮耀進入耶路撒冷。根據使徒行傳，耶穌也是從橄欖山升天。",
    scripture: "第二天，有許多上來過節的人聽見耶穌將到耶路撒冷，就拿著棕樹枝出去迎接他。",
    scriptureReference: "約翰福音 12:12-13",
    visitTips: [
      "穿著舒適的步行鞋",
      "建議從山頂往下走，較為輕鬆",
      "攜帶防曬用品和飲用水",
      "清晨光線最適合攝影",
    ],
  },
  {
    id: "4",
    name: "客西馬尼園",
    location: "橄欖山山腳",
    imageUrl: gethsemaneImg,
    category: "religious",
    visitDuration: "45分鐘",
    visitDate: "3月18日",
    description: "客西馬尼園位於橄欖山山腳，是耶穌被捕前夜禱告的地方。園中至今仍有數棵可能超過兩千年的古老橄欖樹，旁邊的萬國教堂建於1924年。",
    history: "「客西馬尼」源自希伯來語，意為「榨油機」，因這裡曾是榨橄欖油的地方。耶穌在此度過了被捕前最痛苦的夜晚，汗如血滴地禱告。",
    scripture: "於是來到一個地方，名叫客西馬尼，就對門徒說：你們坐在這裡，等我禱告。",
    scriptureReference: "馬可福音 14:32",
    visitTips: [
      "園區較小，人多時需排隊",
      "萬國教堂內部禁止說話",
      "可在古橄欖樹旁默想禱告",
      "鄰近抹大拉馬利亞教堂可一同參觀",
    ],
  },
  {
    id: "5",
    name: "苦路（十四站）",
    location: "耶路撒冷舊城區",
    imageUrl: viaDolorosaImg,
    category: "religious",
    visitDuration: "1.5-2小時",
    visitDate: "3月17日",
    description: "苦路是耶穌背負十字架從被定罪到被釘死的路線，全程約600公尺，設有十四站，每站紀念耶穌受難的一個事件。最後五站位於聖墓教堂內。",
    history: "苦路的傳統始於拜占庭時期的朝聖者，十四站的形式在中世紀逐漸確立。雖然確切的歷史路線已難考證，但這條路徑承載了千年來基督徒的信仰見證。",
    scripture: "他們把耶穌帶走，耶穌背著自己的十字架出來，到了一個地方，名叫髑髏地，希伯來話叫各各他。",
    scriptureReference: "約翰福音 19:16-17",
    visitTips: [
      "建議週五下午跟隨方濟會神父的遊行",
      "穿過狹窄市場，注意隨身物品",
      "每站可停下默想禱告",
      "路線複雜，建議跟隨導遊",
    ],
  },
  {
    id: "6",
    name: "伯利恆主誕教堂",
    location: "伯利恆",
    imageUrl: nativityChurchImg,
    category: "religious",
    visitDuration: "1.5小時",
    visitDate: "3月19日",
    description: "主誕教堂建於耶穌降生的傳統地點上，是世界上最古老且持續使用的教堂之一。教堂地下的洞穴中有一顆銀星，標誌著耶穌誕生的確切位置。",
    history: "教堂最初由君士坦丁大帝的母親海倫娜於公元326年下令建造。現存建築主要建於公元565年查士丁尼一世時期。2012年被列入世界遺產名錄。",
    scripture: "當希律王的時候，耶穌生在猶太的伯利恆。",
    scriptureReference: "馬太福音 2:1",
    visitTips: [
      "需跨越約旦河西岸檢查站",
      "謙卑門入口很矮，需彎腰進入",
      "參觀馬槽廣場和牧羊人田野",
      "可購買橄欖木手工藝品",
    ],
  },
  {
    id: "7",
    name: "加利利海",
    location: "以色列北部",
    imageUrl: seaGalileeImg,
    category: "natural",
    visitDuration: "半天",
    visitDate: "3月20日",
    description: "加利利海是以色列最大的淡水湖，也是耶穌傳道的主要地區。耶穌在這裡呼召漁夫門徒、行走海面、平靜風浪，許多神蹟都發生在這片水域。",
    history: "加利利海海拔低於海平面約210公尺，是世界上海拔最低的淡水湖。自古以來這裡就是富饒的漁場，也是商業要道交匯之處。",
    scripture: "耶穌在加利利海邊行走，看見弟兄二人，就是那稱呼彼得的西門和他兄弟安得烈，在海裡撒網。",
    scriptureReference: "馬太福音 4:18",
    visitTips: [
      "可搭乘仿古木船遊湖",
      "參觀迦百農古城遺址",
      "在塔加享用彼得魚午餐",
      "遊覽八福山和五餅二魚教堂",
    ],
  },
  {
    id: "8",
    name: "佩特拉古城",
    location: "約旦",
    imageUrl: petraImg,
    category: "historical",
    visitDuration: "全天",
    visitDate: "3月22日",
    description: "佩特拉是古代納巴泰王國的首都，以其壯觀的岩石雕刻建築聞名，尤其是玫瑰色的「卡茲尼神殿」。這座城市隱藏在群山峽谷之中，被譽為世界新七大奇蹟之一。",
    history: "佩特拉建於公元前4世紀，是重要的貿易樞紐，控制著從阿拉伯半島到地中海的香料之路。公元106年被羅馬帝國吞併後逐漸衰落，直到1812年才被西方世界重新發現。",
    visitTips: [
      "穿著舒適的步行鞋，全程約8公里",
      "清晨入園可避開人潮和酷熱",
      "攜帶充足的水和防曬用品",
      "可騎駱駝或馬車代步部分路程",
    ],
  },
  {
    id: "9",
    name: "死海",
    location: "以色列/約旦邊界",
    imageUrl: deadSeaImg,
    category: "natural",
    visitDuration: "3-4小時",
    visitDate: "3月21日",
    description: "死海是地球上最低的地點，位於海平面以下430公尺。其鹽度約為一般海水的10倍，人可以輕鬆漂浮在水面上。死海泥被認為具有美容和治療功效。",
    history: "死海在聖經中被稱為「鹽海」或「亞拉巴海」，所多瑪和蛾摩拉的故事就發生在這片區域。死海古卷於1947年在附近的昆蘭洞穴中被發現。",
    scripture: "亞伯蘭的牧人和羅得的牧人相爭...羅得舉目看見約旦河的全平原，直到瑣珥，都是滋潤的。",
    scriptureReference: "創世記 13:7-10",
    visitTips: [
      "勿將水濺入眼睛或嘴巴",
      "身上有傷口會感到刺痛",
      "限制浸泡時間在15-20分鐘內",
      "沖洗後可塗抹死海泥",
    ],
  },
];

const categories = [
  { id: "all", label: "全部" },
  { id: "religious", label: "宗教聖地" },
  { id: "historical", label: "歷史遺跡" },
  { id: "natural", label: "自然景觀" },
];

const Attractions = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filteredAttractions = attractions.filter((attraction) => {
    const matchesSearch =
      attraction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attraction.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || attraction.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAttractionClick = (attraction: Attraction) => {
    setSelectedAttraction(attraction);
    setSheetOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6 animate-fade-in">
        {/* Title */}
        <section className="space-y-2">
          <h1 className="text-display">景點資訊</h1>
          <p className="text-body text-muted-foreground">
            探索聖地的歷史與故事
          </p>
        </section>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="搜尋景點名稱或地點..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-body"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "rounded-full whitespace-nowrap",
                selectedCategory === category.id && "shadow-md"
              )}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-body text-muted-foreground">
          <span>共 {filteredAttractions.length} 個景點</span>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Filter className="w-4 h-4 mr-1" />
            排序
          </Button>
        </div>

        {/* Attractions Grid */}
        <div className="grid gap-4">
          {filteredAttractions.map((attraction) => (
            <AttractionCard
              key={attraction.id}
              name={attraction.name}
              location={attraction.location}
              imageUrl={attraction.imageUrl}
              category={attraction.category}
              visitDuration={attraction.visitDuration}
              onClick={() => handleAttractionClick(attraction)}
            />
          ))}
        </div>

        {filteredAttractions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-body text-muted-foreground">找不到符合條件的景點</p>
          </div>
        )}
      </main>

      <AttractionDetailSheet
        attraction={selectedAttraction}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <BottomNav />
    </div>
  );
};

export default Attractions;
