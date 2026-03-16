import { useState } from "react";
import { Check, X, Clock, Users, Plus, History, ChevronLeft, Loader2, UserCheck, Lock } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  useActiveRollCall,
  useRollCalls,
  useRollCallDetail,
  useRollCallMutations,
  type RollCallAttendanceWithProfile,
  type RollCallWithCounts,
} from "@/hooks/useRollCall";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ViewMode = "active" | "history" | "detail";

export default function RollCall() {
  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [showStartSheet, setShowStartSheet] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [startLocation, setStartLocation] = useState("");
  const [selfCheckIn, setSelfCheckIn] = useState(false);

  const { user } = useAuth();
  const { data: activeRollCall, isLoading: activeLoading } = useActiveRollCall();
  const { data: rollCalls, isLoading: historyLoading } = useRollCalls();
  const { data: detailData } = useRollCallDetail(selectedHistoryId);
  const { createRollCall, toggleAttendance, selfCheckIn: doSelfCheckIn, closeRollCall, deleteRollCall } = useRollCallMutations();

  const isLeader = true; // TODO: check actual role, for now allow all auth users to manage

  const handleStartRollCall = () => {
    createRollCall.mutate(
      { location: startLocation || undefined, selfCheckInEnabled: selfCheckIn },
      {
        onSuccess: () => {
          setShowStartSheet(false);
          setStartLocation("");
          setSelfCheckIn(false);
          setViewMode("active");
        },
      }
    );
  };

  const handleToggle = (attendance: RollCallAttendanceWithProfile) => {
    if (!activeRollCall) return;
    const newStatus = attendance.status === "present" ? "absent" : "present";
    toggleAttendance.mutate({
      rollCallId: activeRollCall.id,
      userId: attendance.userId,
      status: newStatus,
    });
  };

  const handleClose = () => {
    if (!activeRollCall) return;
    closeRollCall.mutate(activeRollCall.id);
    setShowCloseConfirm(false);
  };

  const filteredAttendances = (attendances: RollCallAttendanceWithProfile[]) => {
    if (!searchQuery) return attendances;
    const q = searchQuery.toLowerCase();
    return attendances.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.groupName && a.groupName.toLowerCase().includes(q))
    );
  };

  // Sort: absent first, then by name
  const sortedAttendances = (attendances: RollCallAttendanceWithProfile[]) => {
    return [...filteredAttendances(attendances)].sort((a, b) => {
      if (a.status === "present" && b.status !== "present") return 1;
      if (a.status !== "present" && b.status === "present") return -1;
      return a.name.localeCompare(b.name, "zh-TW");
    });
  };

  const renderActiveView = () => {
    if (activeLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!activeRollCall) {
      return (
        <div className="text-center py-16 space-y-4">
          <Users className="w-16 h-16 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground text-body-lg">目前沒有進行中的點名</p>
          {isLeader && (
            <Button
              onClick={() => setShowStartSheet(true)}
              className="gradient-warm text-primary-foreground rounded-xl h-12 px-8"
            >
              <Plus className="w-5 h-5 mr-2" />
              開始點名
            </Button>
          )}
          <button
            onClick={() => setViewMode("history")}
            className="block mx-auto text-primary text-body mt-4"
          >
            查看歷史紀錄
          </button>
        </div>
      );
    }

    const sorted = sortedAttendances(activeRollCall.attendances);
    const myAttendance = activeRollCall.attendances.find(a => a.userId === user?.id);

    return (
      <div className="space-y-4">
        {/* Status bar */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-caption text-muted-foreground">
              {activeRollCall.location || activeRollCall.date}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-primary">{activeRollCall.presentCount}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-lg text-muted-foreground">{activeRollCall.totalCount}</span>
              <span className="text-caption text-muted-foreground">到齊</span>
            </div>
          </div>
          <div className="flex gap-2">
            {activeRollCall.selfCheckInEnabled && myAttendance && myAttendance.status !== "present" && (
              <Button
                onClick={() => doSelfCheckIn.mutate(activeRollCall.id)}
                disabled={doSelfCheckIn.isPending}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
              >
                <UserCheck className="w-4 h-4 mr-1" />
                簽到
              </Button>
            )}
            {isLeader && (
              <Button
                onClick={() => setShowCloseConfirm(true)}
                variant="outline"
                className="rounded-xl"
              >
                <Lock className="w-4 h-4 mr-1" />
                結束
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${activeRollCall.totalCount > 0 ? (activeRollCall.presentCount / activeRollCall.totalCount) * 100 : 0}%` }}
          />
        </div>

        {/* Search */}
        <Input
          placeholder="搜尋團員..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-xl"
        />

        {/* Member list */}
        <div className="space-y-2">
          {sorted.map((attendance) => (
            <button
              key={attendance.userId}
              onClick={() => isLeader && handleToggle(attendance)}
              disabled={!isLeader}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl transition-all active:scale-[0.98]",
                attendance.status === "present"
                  ? "bg-green-50 border-2 border-green-200"
                  : "bg-card border-2 border-transparent shadow-sm"
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0",
                attendance.status === "present"
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}>
                {attendance.avatarUrl ? (
                  <img src={attendance.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  attendance.name.charAt(0)
                )}
              </div>

              {/* Name & group */}
              <div className="flex-1 text-left min-w-0">
                <p className={cn(
                  "text-body font-semibold truncate",
                  attendance.status === "present" ? "text-green-800" : "text-foreground"
                )}>
                  {attendance.name}
                </p>
                {attendance.groupName && (
                  <p className="text-caption text-muted-foreground truncate">{attendance.groupName}</p>
                )}
              </div>

              {/* Status icon */}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                attendance.status === "present"
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}>
                {attendance.status === "present" ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderHistoryView = () => {
    if (historyLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    const closedRollCalls = (rollCalls || []).filter(rc => rc.closedAt);

    if (closedRollCalls.length === 0) {
      return (
        <div className="text-center py-16 space-y-3">
          <History className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">尚無點名紀錄</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {closedRollCalls.map((rc) => (
          <button
            key={rc.id}
            onClick={() => { setSelectedHistoryId(rc.id); setViewMode("detail"); }}
            className="w-full bg-card rounded-xl p-4 shadow-sm text-left flex items-center justify-between"
          >
            <div>
              <p className="text-body font-semibold">{rc.location || rc.date}</p>
              <p className="text-caption text-muted-foreground">{rc.date}</p>
            </div>
            <div className="text-right">
              <p className="text-body-lg font-bold text-primary">{rc.presentCount}/{rc.totalCount}</p>
              <p className="text-caption text-muted-foreground">到齊</p>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderDetailView = () => {
    if (!detailData) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-card rounded-xl p-4 shadow-sm">
          <p className="text-body font-semibold">{detailData.location || "點名"}</p>
          <p className="text-caption text-muted-foreground">{detailData.date}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xl font-bold text-primary">{detailData.presentCount}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-lg text-muted-foreground">{detailData.totalCount}</span>
            <span className="text-caption text-muted-foreground">到齊</span>
          </div>
        </div>
        <div className="space-y-2">
          {detailData.attendances.map((a) => (
            <div
              key={a.userId}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl",
                a.status === "present" ? "bg-green-50" : "bg-card"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                a.status === "present" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
              )}>
                {a.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium truncate">{a.name}</p>
                {a.groupName && <p className="text-caption text-muted-foreground">{a.groupName}</p>}
              </div>
              <div className={cn(
                "text-caption font-medium",
                a.status === "present" ? "text-green-600" : "text-red-400"
              )}>
                {a.status === "present" ? "到" : "未到"}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <PageLayout title="點名系統">
      <div className="px-4 md:px-6 lg:px-8 pt-4 pb-20 md:pb-8 max-w-2xl mx-auto">
        {/* Tab bar */}
        <div className="flex items-center gap-2 mb-6">
          {viewMode === "detail" ? (
            <button
              onClick={() => { setViewMode("history"); setSelectedHistoryId(null); }}
              className="flex items-center gap-1 text-primary text-body"
            >
              <ChevronLeft className="w-4 h-4" />
              返回
            </button>
          ) : (
            <>
              <button
                onClick={() => setViewMode("active")}
                className={cn(
                  "px-4 py-2 rounded-full text-body font-medium transition-colors",
                  viewMode === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <Users className="w-4 h-4 inline mr-1" />
                點名
              </button>
              <button
                onClick={() => setViewMode("history")}
                className={cn(
                  "px-4 py-2 rounded-full text-body font-medium transition-colors",
                  viewMode === "history" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <History className="w-4 h-4 inline mr-1" />
                紀錄
              </button>
              {isLeader && viewMode === "active" && activeRollCall && (
                <Button
                  onClick={() => setShowStartSheet(true)}
                  size="sm"
                  variant="outline"
                  className="ml-auto rounded-xl"
                  disabled
                >
                  進行中
                </Button>
              )}
              {isLeader && viewMode === "active" && !activeRollCall && (
                <Button
                  onClick={() => setShowStartSheet(true)}
                  size="sm"
                  className="ml-auto rounded-xl gradient-warm text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  開始
                </Button>
              )}
            </>
          )}
        </div>

        {viewMode === "active" && renderActiveView()}
        {viewMode === "history" && renderHistoryView()}
        {viewMode === "detail" && renderDetailView()}

        {/* Start roll call sheet */}
        <Sheet open={showStartSheet} onOpenChange={setShowStartSheet}>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-center">開始點名</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pb-6">
              <div>
                <label className="text-body font-medium mb-1.5 block">地點 (選填)</label>
                <Input
                  placeholder="例如：遊覽車、達達尼爾海峽..."
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <label className="flex items-center gap-3 p-3 bg-muted rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={selfCheckIn}
                  onChange={(e) => setSelfCheckIn(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <div>
                  <p className="text-body font-medium">開放自助簽到</p>
                  <p className="text-caption text-muted-foreground">團員可以自己按簽到</p>
                </div>
              </label>
              <Button
                onClick={handleStartRollCall}
                disabled={createRollCall.isPending}
                className="w-full h-14 gradient-warm text-primary-foreground rounded-xl text-body-lg"
              >
                {createRollCall.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "開始點名"
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Close confirmation */}
        <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>結束點名？</AlertDialogTitle>
              <AlertDialogDescription>
                結束後將無法再修改出席狀態。
                目前 {activeRollCall?.presentCount}/{activeRollCall?.totalCount} 人到齊。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleClose}>確定結束</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageLayout>
  );
}
