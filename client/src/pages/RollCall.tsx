import { useState } from "react";
import { Check, X, Users, Plus, Loader2, UserCheck, Lock, Search } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  useActiveRollCall,
  isActiveRollCall,
  useRollCallMutations,
  type RollCallAttendanceWithProfile,
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

export default function RollCall() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showStartSheet, setShowStartSheet] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [startLocation, setStartLocation] = useState("");
  const [selfCheckInOption, setSelfCheckInOption] = useState(true);

  const { user } = useAuth();
  const { data: rawData, isLoading } = useActiveRollCall();
  const { createRollCall, toggleAttendance, selfCheckIn: doSelfCheckIn, closeRollCall } = useRollCallMutations();

  const activeRollCall = isActiveRollCall(rawData) ? rawData : null;
  const myRole = rawData?.myRole as string | undefined;
  const canManage = myRole === "admin" || myRole === "leader" || myRole === "guide";

  const handleStartRollCall = () => {
    createRollCall.mutate(
      { location: startLocation || undefined, selfCheckInEnabled: selfCheckInOption },
      {
        onSuccess: () => {
          setShowStartSheet(false);
          setStartLocation("");
        },
      }
    );
  };

  const handleToggle = (attendance: RollCallAttendanceWithProfile) => {
    if (!activeRollCall || !canManage) return;
    const newStatus = attendance.status === "present" ? "absent" : "present";
    toggleAttendance.mutate({
      rollCallId: activeRollCall.id,
      userId: attendance.userId,
      status: newStatus,
    });
  };

  const handleSelfCheckIn = () => {
    if (!activeRollCall) return;
    doSelfCheckIn.mutate(activeRollCall.id);
  };

  const handleClose = () => {
    if (!activeRollCall) return;
    closeRollCall.mutate(activeRollCall.id);
    setShowCloseConfirm(false);
  };

  // Filter by search
  const filtered = (attendances: RollCallAttendanceWithProfile[]) => {
    if (!searchQuery) return attendances;
    const q = searchQuery.toLowerCase();
    return attendances.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.groupName && a.groupName.toLowerCase().includes(q))
    );
  };

  // Sort: absent first, then by name
  const sorted = (attendances: RollCallAttendanceWithProfile[]) => {
    return [...filtered(attendances)].sort((a, b) => {
      if (a.status === "present" && b.status !== "present") return 1;
      if (a.status !== "present" && b.status === "present") return -1;
      return a.name.localeCompare(b.name, "zh-TW");
    });
  };

  if (isLoading) {
    return (
      <PageLayout title="點名">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  // No active roll call
  if (!activeRollCall) {
    return (
      <PageLayout title="點名">
        <div className="px-4 pt-4 pb-20 max-w-2xl mx-auto">
          <div className="text-center py-20 space-y-4">
            <Users className="w-20 h-20 mx-auto text-muted-foreground/20" />
            <p className="text-muted-foreground text-body-lg">目前沒有進行中的點名</p>
            {canManage && (
              <Button
                onClick={() => setShowStartSheet(true)}
                className="gradient-warm text-primary-foreground rounded-xl h-14 px-10 text-body-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                開始點名
              </Button>
            )}
          </div>

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
                    checked={selfCheckInOption}
                    onChange={(e) => setSelfCheckInOption(e.target.checked)}
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
        </div>
      </PageLayout>
    );
  }

  // Active roll call view
  const attendances = sorted(activeRollCall.attendances);
  const myAttendance = activeRollCall.attendances.find(a => a.userId === user?.id);
  const showSelfCheckIn = activeRollCall.selfCheckInEnabled && myAttendance && myAttendance.status !== "present" && !canManage;

  return (
    <PageLayout title="點名">
      <div className="px-4 pt-4 pb-20 max-w-2xl mx-auto space-y-4">
        {/* Status header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              {activeRollCall.location && (
                <p className="text-body font-medium text-foreground">{activeRollCall.location}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl font-bold text-primary">{activeRollCall.presentCount}</span>
                <span className="text-lg text-muted-foreground">/</span>
                <span className="text-xl text-muted-foreground">{activeRollCall.totalCount}</span>
                <span className="text-body text-muted-foreground">到齊</span>
              </div>
            </div>
            <div className="flex gap-2">
              {showSelfCheckIn && (
                <Button
                  onClick={handleSelfCheckIn}
                  disabled={doSelfCheckIn.isPending}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-xl h-12 px-5"
                >
                  {doSelfCheckIn.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5 mr-1.5" />
                      簽到
                    </>
                  )}
                </Button>
              )}
              {canManage && (
                <Button
                  onClick={() => setShowCloseConfirm(true)}
                  variant="outline"
                  className="rounded-xl h-12"
                >
                  <Lock className="w-4 h-4 mr-1" />
                  結束點名
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 bg-white/60 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${activeRollCall.totalCount > 0 ? (activeRollCall.presentCount / activeRollCall.totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Search */}
        {activeRollCall.totalCount > 10 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜尋團員..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl pl-10"
            />
          </div>
        )}

        {/* Member list */}
        <div className="space-y-2">
          {attendances.map((attendance) => {
            const isMe = attendance.userId === user?.id;
            const canTap = canManage || (isMe && activeRollCall.selfCheckInEnabled && attendance.status !== "present");

            return (
              <button
                key={attendance.userId}
                onClick={() => {
                  if (canManage) {
                    handleToggle(attendance);
                  } else if (isMe && activeRollCall.selfCheckInEnabled && attendance.status !== "present") {
                    handleSelfCheckIn();
                  }
                }}
                disabled={!canTap}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl transition-all",
                  canTap && "active:scale-[0.98]",
                  attendance.status === "present"
                    ? "bg-green-50 border-2 border-green-200"
                    : "bg-card border-2 border-transparent shadow-sm",
                  isMe && "ring-2 ring-primary/30"
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
                    {isMe && <span className="text-caption text-primary ml-1">(我)</span>}
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
            );
          })}
        </div>

        {/* Close confirmation */}
        <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>結束點名？</AlertDialogTitle>
              <AlertDialogDescription>
                結束後將無法再修改出席狀態。
                目前 {activeRollCall.presentCount}/{activeRollCall.totalCount} 人到齊。
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
