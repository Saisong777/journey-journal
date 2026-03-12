import { PageLayout } from "@/components/layout/PageLayout";
import { Shield } from "lucide-react";

const sections = [
  {
    icon: "📋",
    titleZh: "我們蒐集哪些資料",
    content: (
      <>
        <p>為了提供你最佳的使用體驗，我們可能蒐集以下類型的資料：</p>
        <ul>
          <li><strong>基本帳號資訊：</strong>當你註冊或登入時，包括姓名、Email、顯示名稱等。</li>
          <li><strong>使用紀錄：</strong>你在平台上瀏覽的聖地景點、學習進度、收藏的內容等。</li>
          <li><strong>裝置資訊：</strong>瀏覽器類型、作業系統、螢幕尺寸等，用於優化顯示體驗。</li>
          <li><strong>自願提供的內容：</strong>你主動填寫的筆記、禱告事項、小組討論回應等。</li>
        </ul>
        <p>我們<strong>不會</strong>蒐集你的精確地理位置、通訊錄、照片或任何與本服務無關的資料。</p>
      </>
    ),
  },
  {
    icon: "🔍",
    titleZh: "我們如何使用你的資料",
    content: (
      <>
        <ul>
          <li>提供、維護、改善平台功能與服務品質。</li>
          <li>記錄你的學習進度、瀏覽歷史與個人化推薦。</li>
          <li>發送與平台服務相關的通知（你可隨時選擇退出）。</li>
          <li>進行匿名化的統計分析，以優化內容與使用者體驗。</li>
        </ul>
        <p>我們<strong>絕不會</strong>使用你的資料進行任何形式的廣告投放或行銷推播。</p>
      </>
    ),
  },
  {
    icon: "🔒",
    titleZh: "資料安全與保護",
    content: (
      <>
        <p>我們採取業界標準的安全措施來保護你的資料：</p>
        <ul>
          <li>所有資料傳輸均使用 HTTPS/TLS 加密。</li>
          <li>密碼使用單向雜湊（hash）加密儲存，我們無法也不會看到你的密碼。</li>
          <li>資料庫實施存取權限控管，僅授權人員可存取。</li>
          <li>定期審查安全措施與系統漏洞。</li>
        </ul>
      </>
    ),
  },
  {
    icon: "🤝",
    titleZh: "第三方服務",
    content: (
      <>
        <p>本平台可能使用以下第三方服務來增強功能：</p>
        <ul>
          <li><strong>託管服務：</strong>我們使用雲端服務來託管本平台，這些服務商均遵守國際資料保護標準。</li>
          <li><strong>地圖服務：</strong>聖地地圖功能可能使用 Google Maps 或 Mapbox API，這些服務會依其自身隱私權政策處理資料。</li>
          <li><strong>AI 功能：</strong>若你使用 AI 輔助學習功能，你輸入的問題會傳送至 AI 服務提供商處理，但不會與你的帳號身份綁定。</li>
        </ul>
        <p>我們不會向任何第三方出售或出租你的個人資料。</p>
      </>
    ),
  },
  {
    icon: "🍪",
    titleZh: "Cookies 與本地儲存",
    content: (
      <>
        <p>我們使用 Cookies 和瀏覽器本地儲存來：</p>
        <ul>
          <li>維持你的登入狀態。</li>
          <li>記住你的語言偏好與介面設定。</li>
          <li>儲存你的學習進度以提供無縫體驗。</li>
        </ul>
        <p>我們<strong>不使用</strong>任何第三方追蹤型 Cookies（如 Google Ads、Facebook Pixel 等）。你可以透過瀏覽器設定管理或刪除 Cookies。</p>
      </>
    ),
  },
  {
    icon: "✋",
    titleZh: "你的權利",
    content: (
      <>
        <p>根據適用的資料保護法規（包括台灣《個人資料保護法》及歐盟 GDPR），你享有以下權利：</p>
        <ul>
          <li><strong>查閱權：</strong>你可以要求查閱我們持有的你的個人資料。</li>
          <li><strong>更正權：</strong>你可以要求更正不正確或不完整的資料。</li>
          <li><strong>刪除權：</strong>你可以要求刪除你的帳號及所有相關個人資料。</li>
          <li><strong>可攜權：</strong>你可以要求匯出你的個人資料。</li>
          <li><strong>退出權：</strong>你可以隨時選擇停止接收非必要的通知。</li>
        </ul>
        <p>如需行使上述任何權利，請透過下方聯絡方式與我們聯繫。</p>
      </>
    ),
  },
  {
    icon: "👶",
    titleZh: "兒童隱私保護",
    content: (
      <p>本服務並非針對 13 歲以下兒童設計。我們不會故意蒐集 13 歲以下兒童的個人資料。如果你是家長或監護人，並發現你的孩子在未經同意的情況下向我們提供了個人資料，請與我們聯繫，我們會立即刪除相關資料。</p>
    ),
  },
  {
    icon: "📦",
    titleZh: "資料保留期間",
    content: (
      <p>我們會在提供服務所需的期間內保留你的個人資料。當你刪除帳號後，我們會在 30 天內刪除或匿名化你的所有個人資料，法律另有要求除外。匿名化的統計資料可能會被保留，但這些資料無法識別你的身份。</p>
    ),
  },
  {
    icon: "📝",
    titleZh: "隱私權政策變更",
    content: (
      <p>我們可能會不定期更新本隱私權政策。任何重大變更將透過平台內通知或 Email 通知你。我們建議你定期查看本頁面以瞭解最新的隱私權保護措施。繼續使用本服務即表示你同意更新後的政策。</p>
    ),
  },
  {
    icon: "💬",
    titleZh: "聯絡我們",
    content: (
      <>
        <p>如果你對本隱私權政策有任何疑問、建議或權利行使需求，歡迎聯絡我們：</p>
        <ul>
          <li><strong>平台名稱：</strong>與神同行 Trip Companion</li>
          <li><strong>營運團隊：</strong>WeChurch 團隊</li>
          <li><strong>網站：</strong>trip.wechurch.online</li>
          <li><strong>Email：</strong>privacy@wechurch.online</li>
        </ul>
        <p>我們承諾在收到你的請求後 15 個工作天內回覆。</p>
      </>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <PageLayout title="隱私權政策" showBack>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-4 animate-fade-in">
        {/* Trust Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-foreground leading-relaxed">
            <strong>我們的承諾：</strong>「與神同行」是由 WeChurch 團隊開發的聖地旅遊教學平台。我們不會販賣你的個人資料、不會追蹤你的行為用於廣告投放，也不會將你的資料分享給任何第三方行銷機構。
          </p>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <article
            key={section.titleZh}
            className="bg-card rounded-xl border border-border p-4 space-y-2"
          >
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="text-base">{section.icon}</span>
              {section.titleZh}
            </h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-sm [&_strong]:text-foreground [&_strong]:font-semibold">
              {section.content}
            </div>
          </article>
        ))}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-2 pb-4">
          生效日期：2026 年 3 月 12 日<br />
          © 2026 WeChurch 團隊 — 與神同行 Trip Companion
        </p>
      </div>
    </PageLayout>
  );
}
