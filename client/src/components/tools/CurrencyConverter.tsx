import { useState, useEffect } from "react";
import { ArrowRightLeft, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
}

const CURRENCY_META: CurrencyMeta[] = [
  { code: "TWD", name: "新台幣", symbol: "NT$" },
  { code: "USD", name: "美元", symbol: "$" },
  { code: "ILS", name: "以色列謝克爾", symbol: "₪" },
  { code: "JOD", name: "約旦第納爾", symbol: "JD" },
  { code: "EUR", name: "歐元", symbol: "€" },
  { code: "TRY", name: "土耳其里拉", symbol: "₺" },
];

const FALLBACK_RATES: Record<string, number> = {
  TWD: 1, USD: 0.032, ILS: 0.12, JOD: 0.023, EUR: 0.029, TRY: 1.04,
};

export function CurrencyConverter() {
  const [amount, setAmount] = useState<string>("1000");
  const [fromCurrency, setFromCurrency] = useState<string>("TWD");
  const [toCurrency, setToCurrency] = useState<string>("ILS");
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [lastUpdated, setLastUpdated] = useState<string>("資料載入中...");
  const [isLoading, setIsLoading] = useState(false);

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/TWD");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const newRates: Record<string, number> = { TWD: 1 };
      for (const { code } of CURRENCY_META) {
        if (code !== "TWD" && data.rates[code]) {
          newRates[code] = data.rates[code];
        }
      }
      setRates(newRates);
      const updated = new Date(data.time_last_update_utc);
      setLastUpdated(
        updated.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" })
      );
    } catch {
      setLastUpdated("使用離線預設匯率");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const fromRate = rates[fromCurrency] ?? 1;
  const toRate = rates[toCurrency] ?? 1;
  const fromSymbol = CURRENCY_META.find((c) => c.code === fromCurrency)?.symbol || "";
  const toSymbol = CURRENCY_META.find((c) => c.code === toCurrency)?.symbol || "";
  const convertedAmount = (parseFloat(amount || "0") / fromRate) * toRate;

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="bg-card rounded-lg shadow-card overflow-hidden">
      {/* Header */}
      <div className="gradient-warm p-4">
        <h3 className="text-body font-semibold text-primary-foreground">匯率轉換</h3>
        <div className="flex items-center gap-2">
          <p className="text-caption text-primary-foreground/80">
            更新時間：{lastUpdated}
          </p>
          <button
            onClick={fetchRates}
            disabled={isLoading}
            aria-label="重新整理匯率"
            className="text-primary-foreground/80 hover:text-primary-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
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
              className="h-14 px-4 rounded-lg bg-muted text-body font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CURRENCY_META.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwap}
            aria-label="互換貨幣"
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
                {toSymbol} {isNaN(convertedAmount) ? "0.00" : convertedAmount.toFixed(2)}
              </span>
            </div>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="h-14 px-4 rounded-lg bg-muted text-body font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CURRENCY_META.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="bg-olive-light/50 rounded-lg p-4 space-y-2">
          <h4 className="text-caption font-semibold text-secondary">快速參考（NT$ → ₪）</h4>
          <div className="grid grid-cols-2 gap-2 text-caption">
            {[100, 500, 1000, 5000].map((amt) => {
              const ilsRate = rates["ILS"] ?? FALLBACK_RATES["ILS"];
              const converted = amt * ilsRate;
              return (
                <div key={amt} className="flex justify-between">
                  <span className="text-muted-foreground">NT$ {amt.toLocaleString()}</span>
                  <span className="font-medium">≈ ₪ {converted.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
