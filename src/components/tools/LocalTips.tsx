import { 
  AlertTriangle, 
  Plug, 
  Droplets, 
  Sun, 
  ShieldCheck,
  Phone,
  Clock,
  Shirt,
  Camera,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Tip {
  icon: typeof AlertTriangle;
  title: string;
  content: string;
  type: "warning" | "info" | "tip";
}

const tips: Tip[] = [
  {
    icon: Shirt,
    title: "服裝須知",
    content: "進入宗教場所需穿著保守服裝。女性需遮蓋肩膀和膝蓋，男性不可穿短褲。建議攜帶圍巾備用。",
    type: "warning",
  },
  {
    icon: Sun,
    title: "防曬準備",
    content: "以色列陽光強烈，請攜帶防曬霜（SPF50+）、太陽眼鏡和遮陽帽。建議穿著淺色透氣衣物。",
    type: "tip",
  },
  {
    icon: Droplets,
    title: "飲水建議",
    content: "每日建議飲水量2-3公升。自來水可安全飲用，但礦泉水口感較佳。隨身攜帶水壺。",
    type: "info",
  },
  {
    icon: Plug,
    title: "電壓插座",
    content: "以色列使用220V電壓，H型三孔插座。請攜帶萬用轉接頭，手機充電器通常支援100-240V。",
    type: "info",
  },
  {
    icon: Clock,
    title: "安息日須知",
    content: "週五日落至週六日落為安息日，大部分商店休息，公共交通停駛。請提前準備所需物品。",
    type: "warning",
  },
  {
    icon: ShieldCheck,
    title: "安全須知",
    content: "聽從導遊指示，不要單獨行動。在檢查站配合安檢，隨身攜帶護照影本。",
    type: "warning",
  },
  {
    icon: Camera,
    title: "拍照禮儀",
    content: "部分宗教場所禁止拍照或使用閃光燈。拍攝當地人前請先徵得同意。軍事設施嚴禁拍攝。",
    type: "tip",
  },
  {
    icon: CreditCard,
    title: "付款方式",
    content: "信用卡普遍接受，但小商店和市場建議使用現金。ATM提款方便，建議攜帶少量美金備用。",
    type: "info",
  },
  {
    icon: Phone,
    title: "緊急聯絡",
    content: "以色列緊急電話：警察100、急救101、消防102。台灣駐以代表處：+972-3-5461258",
    type: "warning",
  },
];

const typeStyles = {
  warning: "border-l-terracotta bg-terracotta/5",
  info: "border-l-primary bg-primary/5",
  tip: "border-l-secondary bg-olive-light/30",
};

const iconStyles = {
  warning: "text-terracotta bg-terracotta/10",
  info: "text-primary bg-primary/10",
  tip: "text-secondary bg-olive-light",
};

export function LocalTips() {
  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg shadow-card p-4">
        <h3 className="text-body font-semibold mb-2">以色列旅遊須知</h3>
        <p className="text-caption text-muted-foreground">
          了解當地文化習俗，讓旅程更加順利愉快
        </p>
      </div>

      <div className="space-y-3">
        {tips.map((tip, index) => (
          <div
            key={index}
            className={cn(
              "bg-card rounded-lg shadow-soft p-4 border-l-4",
              typeStyles[tip.type]
            )}
          >
            <div className="flex gap-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                iconStyles[tip.type]
              )}>
                <tip.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-body font-semibold mb-1">{tip.title}</h4>
                <p className="text-caption text-muted-foreground leading-relaxed">
                  {tip.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
