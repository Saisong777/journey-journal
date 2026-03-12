import { useState } from "react";
import { ArrowRightLeft, RefreshCw, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/queryClient";

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

const currencyOptions: CurrencyOption[] = [
  { code: "TWD", name: "新台幣", symbol: "NT$" },
  { code: "USD", name: "美元", symbol: "$" },
  { code: "ILS", name: "以色列謝克爾", symbol: "₪" },
  { code: "JOD", name: "約旦第納爾", symbol: "JD" },
  { code: "EUR", name: "歐元", symbol: "€" },
  { code: "GBP", name: "英鎊", symbol: "£" },
  { code: "JPY", name: "日圓", symbol: "¥" },
  { code: "KRW", name: "韓元", symbol: "₩" },
  { code: "CNY", name: "人民幣", symbol: "¥" },
  { code: "HKD", name: "港幣", symbol: "HK$" },
  { code: "SGD", name: "新加坡幣", symbol: "S$" },
  { code: "THB", name: "泰銖", symbol: "฿" },
  { code: "AUD", name: "澳幣", symbol: "A$" },
  { code: "CAD", name: "加幣", symbol: "C$" },
  { code: "CHF", name: "瑞士法郎", symbol: "CHF" },
  { code: "TRY", name: "土耳其里拉", symbol: "₺" },
  { code: "EGP", name: "埃及鎊", symbol: "E£" },
  { code: "MYR", name: "馬來西亞令吉", symbol: "RM" },
];

function formatUpdatedAt(isoString: string | null): string {
  if (!isoString) return "使用離線匯率";
  const d = new Date(isoString);
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function CurrencyConverter() {
  const [amount, setAmount] = useState<string>("1000");
  const [fromCurrency, setFromCurrency] = useState<string>("TWD");
  const [toCurrency, setToCurrency] = useState<string>("ILS");

  const { data: rateData, isLoading, refetch, isFetching } = useQuery<{
    rates: Record<string, number>;
    updatedAt: string | null;
    fallback?: boolean;
    stale?: boolean;
  }>({
    queryKey: ["/api/exchange-rates"],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch("/api/exchange-rates", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch rates");
      return response.json();
    },
    staleTime: 15 * 60 * 1000, // 15 min client-side
    refetchOnWindowFocus: false,
  });

  const rates = rateData?.rates || {};
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  const fromInfo = currencyOptions.find((c) => c.code === fromCurrency);
  const toInfo = currencyOptions.find((c) => c.code === toCurrency);

  const convertedAmount = (parseFloat(amount || "0") / fromRate) * toRate;

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Quick reference amounts for current pair
  const quickAmounts = [100, 500, 1000, 5000];

  return (
    <div className="bg-card rounded-lg shadow-card overflow-hidden">
      {/* Header */}
      <div className="gradient-warm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-body font-semibold text-primary-foreground">匯率轉換</h3>
            <p className="text-caption text-primary-foreground/80">
              {isLoading ? "載入匯率中..." : rateData?.fallback ? "離線匯率（僅供參考）" : rateData?.stale ? "匯率可能已過時" : `更新時間：${formatUpdatedAt(rateData?.updatedAt || null)}`}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            title="重新整理匯率"
          >
            <RefreshCw className={cn("w-4 h-4 text-primary-foreground", isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-body text-muted-foreground">取得即時匯率...</span>
          </div>
        ) : (
          <>
            {/* From Currency */}
            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">輸入金額</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-14 text-title text-center"
                    placeholder="0"
                  />
                </div>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="h-14 px-3 rounded-lg bg-muted text-body font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {currencyOptions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSwap}
                className="p-3 rounded-full bg-muted hover:bg-primary/10 transition-colors touch-target"
              >
                <ArrowRightLeft className="w-5 h-5 text-primary" />
              </button>
            </div>

            {/* To Currency */}
            <div className="space-y-2">
              <label className="text-caption text-muted-foreground">轉換結果</label>
              <div className="flex gap-3">
                <div className="flex-1 h-14 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-title text-primary">
                    {toInfo?.symbol} {convertedAmount.toFixed(2)}
                  </span>
                </div>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="h-14 px-3 rounded-lg bg-muted text-body font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {currencyOptions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Exchange rate display */}
            <div className="text-center text-caption text-muted-foreground">
              1 {fromInfo?.code} = {(toRate / fromRate).toFixed(4)} {toInfo?.code}
            </div>

            {/* Quick Reference */}
            <div className="bg-olive-light/50 rounded-lg p-4 space-y-2">
              <h4 className="text-caption font-semibold text-secondary">快速參考</h4>
              <div className="grid grid-cols-2 gap-2 text-caption">
                {quickAmounts.map((qa) => (
                  <div key={qa} className="flex justify-between">
                    <span className="text-muted-foreground">{fromInfo?.symbol} {qa.toLocaleString()}</span>
                    <span className="font-medium">≈ {toInfo?.symbol} {((qa / fromRate) * toRate).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
