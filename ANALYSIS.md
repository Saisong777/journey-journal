# Journey Journal App 分析報告

## App 用途

Journey Journal（與神同行）是一款專為**基督教聖地旅行團**設計的行程管理與靈修 App，以繁體中文為主要介面語言，目標用戶為前往以色列、約旦、土耳其等聖地旅遊的台灣基督徒旅遊團。

## 技術架構

- 前端：React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- 後端：Express.js + Drizzle ORM + PostgreSQL
- 認證：Bearer Token + Session 雙軌制
- 離線：IndexedDB (idb-keyval) 佇列機制
- PWA：manifest.json 配置（缺 Service Worker）

## 優化建議

### 一、效能優化

1. **路由層級 Code Splitting** - 所有 20+ 頁面同步載入，應使用 React.lazy 延遲載入
2. **圖片優化** - attractions 圖片無壓縮、無 WebP、無 lazy loading
3. **React Query 快取策略** - staleTime: Infinity 過於極端，即時資料（位置、行程）應設短 staleTime

### 二、安全性

4. **tempPassword 明文欄位** - 應改用 token-based 密碼重設
5. **Auth Token 存 localStorage** - 容易受 XSS 攻擊，應改用 httpOnly cookie

### 三、架構

6. **routes.ts 過大 (82KB)** - 應拆分為功能模組
7. **前端重複定義型別** - 應統一從 shared/schema 引用
8. **匯率寫死** - 應接 API 或提供 Admin 更新

### 四、UX

9. **缺少 Service Worker** - PWA 無法離線存取頁面
10. **位置追蹤僅手動** - 應加入可選的背景更新
11. **DailyJourney.tsx 過大 (56KB)** - 應拆分子元件
12. **無障礙不足** - 缺少 aria-label、鍵盤導航、螢幕閱讀器支援

### 五、可靠性

13. **離線同步無衝突處理** - 應加入時間戳比對
14. **無自動化測試** - 應為核心功能加上單元測試
15. **無 Error Boundary** - 元件崩潰無法優雅降級
