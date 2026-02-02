import { useState } from "react";
import { ArrowRightLeft, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Rate relative to TWD
}

const currencies: Currency[] = [
  { code: "TWD", name: "新台幣", symbol: "NT$", rate: 1 },
  { code: "USD", name: "美元", symbol: "$", rate: 0.032 },
  { code: "ILS", name: "以色列謝克爾", symbol: "₪", rate: 0.12 },
  { code: "JOD", name: "約旦第納爾", symbol: "JD", rate: 0.023 },
  { code: "EUR", name: "歐元", symbol: "€", rate: 0.029 },
  { code: "TRY", name: "土耳其里拉", symbol: "₺", rate: 1.04 },
];

export function CurrencyConverter() {
  const [amount, setAmount] = useState<string>("1000");
  const [fromCurrency, setFromCurrency] = useState<string>("TWD");
  const [toCurrency, setToCurrency] = useState<string>("ILS");
  const [lastUpdated] = useState("2024年3月17日 09:00");

  const fromRate = currencies.find((c) => c.code === fromCurrency)?.rate || 1;
  const toRate = currencies.find((c) => c.code === toCurrency)?.rate || 1;
  const fromSymbol = currencies.find((c) => c.code === fromCurrency)?.symbol || "";
  const toSymbol = currencies.find((c) => c.code === toCurrency)?.symbol || "";

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
        <p className="text-caption text-primary-foreground/80">
          更新時間：{lastUpdated}
        </p>
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
              {currencies.map((currency) => (
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
                {toSymbol} {convertedAmount.toFixed(2)}
              </span>
            </div>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="h-14 px-4 rounded-lg bg-muted text-body font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="bg-olive-light/50 rounded-lg p-4 space-y-2">
          <h4 className="text-caption font-semibold text-secondary">快速參考</h4>
          <div className="grid grid-cols-2 gap-2 text-caption">
            <div className="flex justify-between">
              <span className="text-muted-foreground">NT$ 100</span>
              <span className="font-medium">≈ ₪ 12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NT$ 500</span>
              <span className="font-medium">≈ ₪ 60</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NT$ 1,000</span>
              <span className="font-medium">≈ ₪ 120</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NT$ 5,000</span>
              <span className="font-medium">≈ ₪ 600</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
