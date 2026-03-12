import { PageLayout } from "@/components/layout/PageLayout";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <PageLayout title="關於" showBack>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-5 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-foreground">與神同行</h1>
          <p className="text-sm text-muted-foreground">trip.wechurch.online</p>
          <p className="text-sm text-foreground leading-relaxed">
            用科技重現聖經世界，讓每一個人都能走進耶穌的故事
          </p>
        </div>

        {/* Quote */}
        <div className="border-l-2 border-primary/40 pl-4 py-1">
          <p className="text-sm italic text-muted-foreground">
            「你們要去，使萬民作我的門徒。」— 馬太福音 28:19
          </p>
        </div>

        {/* 我們是誰 */}
        <article className="bg-card rounded-xl border border-border p-4 space-y-2">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="text-base">💡</span>
            我們是誰
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              「與神同行 Trip Companion」是由 <strong className="text-foreground">WeChurch 團隊</strong>開發的聖經旅遊與互動教學平台，也是 <strong className="text-foreground">Re:Jesus</strong> 教學生態系的一部分。
            </p>
            <p>
              我們是一群熱愛聖經、熱愛科技、也熱愛教會的創作者與工程師。我們相信——當你能親眼「看見」耶穌走過的每一條路，聖經的故事就不再只是文字，而是活生生的經歷。
            </p>
            <p>
              本平台從台灣出發，服務全球華人基督徒與所有對聖經歷史地理有興趣的學習者。
            </p>
          </div>
        </article>

        {/* 我們的願景 */}
        <article className="bg-card rounded-xl border border-border p-4 space-y-2">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="text-base">🔭</span>
            我們的願景
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              我們的目標不只是做一個「聖地旅遊介紹」的網站。我們想打造一個能讓人<strong className="text-foreground">身歷其境學習聖經</strong>的數位體驗——不管你在台北的教會小組裡、在客廳的沙發上、還是真的站在以色列的土地上。
            </p>
            <ul className="list-none space-y-1.5 mt-2">
              <li className="flex items-start gap-2">
                <span>🗺️</span>
                <span>讓每間教會都能「去」聖地 — 就算沒有機票預算</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📖</span>
                <span>讓聖經從平面文字變成立體的時空旅行</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🤝</span>
                <span>讓牧者與小組長擁有隨手可用的聖地教學工具</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🌱</span>
                <span>讓初信者和慕道友也能輕鬆進入聖經世界</span>
              </li>
            </ul>
          </div>
        </article>

        {/* 聯絡我們 */}
        <article className="bg-card rounded-xl border border-border p-4 space-y-2">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="text-base">💬</span>
            聯絡我們
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
            <p>如果你有任何問題、合作邀請、內容建議或教會導入需求，歡迎與我們聯繫：</p>
            <ul className="list-none space-y-1 mt-2">
              <li><strong className="text-foreground">平台：</strong>與神同行 Trip Companion</li>
              <li><strong className="text-foreground">團隊：</strong>WeChurch 團隊</li>
              <li><strong className="text-foreground">網站：</strong>trip.wechurch.online</li>
              <li><strong className="text-foreground">Email：</strong>hello@wechurch.online</li>
            </ul>
          </div>
        </article>

        {/* Footer */}
        <div className="text-center space-y-2 pt-2 pb-4">
          <p className="text-xs text-muted-foreground">
            © 2026 WeChurch 團隊 — 與神同行 Trip Companion。保留所有權利。
          </p>
          <div className="flex items-center justify-center gap-3 text-xs">
            <Link to="/" className="text-primary hover:underline">首頁</Link>
            <span className="text-muted-foreground">｜</span>
            <Link to="/privacy" className="text-primary hover:underline">隱私權政策</Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
