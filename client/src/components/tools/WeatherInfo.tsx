import { useQuery } from "@tanstack/react-query";
import { Thermometer, Droplets, Sun, Wind, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface WeatherData {
  temperature: number | null;
  humidity: number | null;
  uvIndex: number | null;
  aqi: number | null;
  destination: string;
  updatedAt: string;
}

function getUvLabel(uv: number): string {
  if (uv <= 2) return "低";
  if (uv <= 5) return "中等";
  if (uv <= 7) return "高";
  if (uv <= 10) return "極高";
  return "危險";
}

function getUvColor(uv: number): string {
  if (uv <= 2) return "text-green-600";
  if (uv <= 5) return "text-amber-500";
  if (uv <= 7) return "text-orange-500";
  return "text-red-500";
}

function getAqiLabel(aqi: number): string {
  if (aqi <= 50) return "優良";
  if (aqi <= 100) return "普通";
  if (aqi <= 150) return "敏感";
  if (aqi <= 200) return "不健康";
  return "危險";
}

function getAqiColor(aqi: number): string {
  if (aqi <= 50) return "text-green-600";
  if (aqi <= 100) return "text-amber-500";
  if (aqi <= 150) return "text-orange-500";
  return "text-red-500";
}

export function WeatherInfo() {
  const { data, isLoading, isError } = useQuery<WeatherData>({
    queryKey: ["/api/weather"],
    refetchInterval: 600000,
  });

  if (isLoading) {
    return (
      <section className="bg-card rounded-lg shadow-card p-4">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="bg-card rounded-lg shadow-card p-4">
        <p className="text-center text-caption text-muted-foreground">
          天氣資訊暫時無法取得
        </p>
      </section>
    );
  }

  const cards = [
    {
      icon: Thermometer,
      label: "氣溫",
      value: data.temperature !== null ? `${Math.round(data.temperature)}°C` : "--",
      iconColor: "text-terracotta",
      valueColor: "",
    },
    {
      icon: Droplets,
      label: "濕度",
      value: data.humidity !== null ? `${Math.round(data.humidity)}%` : "--",
      iconColor: "text-blue-500",
      valueColor: "",
    },
    {
      icon: Sun,
      label: "紫外線",
      value: data.uvIndex !== null ? `${data.uvIndex.toFixed(1)}` : "--",
      subLabel: data.uvIndex !== null ? getUvLabel(data.uvIndex) : "",
      iconColor: "text-amber-500",
      valueColor: data.uvIndex !== null ? getUvColor(data.uvIndex) : "",
    },
    {
      icon: Wind,
      label: "空氣品質",
      value: data.aqi !== null ? `${Math.round(data.aqi)}` : "--",
      subLabel: data.aqi !== null ? getAqiLabel(data.aqi) : "",
      iconColor: "text-secondary",
      valueColor: data.aqi !== null ? getAqiColor(data.aqi) : "",
    },
  ];

  return (
    <section className="bg-card rounded-lg shadow-card p-4 space-y-3" data-testid="section-weather">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-3 bg-muted/50 rounded-lg p-3"
            data-testid={`weather-${card.label}`}
          >
            <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center flex-shrink-0">
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-caption text-muted-foreground">{card.label}</p>
              <div className="flex items-baseline gap-1">
                <p className={`text-body font-semibold ${card.valueColor}`}>{card.value}</p>
                {card.subLabel && (
                  <span className={`text-caption ${card.valueColor}`}>{card.subLabel}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {data.destination} · 每 10 分鐘更新
      </p>
    </section>
  );
}
