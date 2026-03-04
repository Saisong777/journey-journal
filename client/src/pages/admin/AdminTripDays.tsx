import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  useAllTrips,
  useTripDays,
  useTripDayMutations,
  TripDay,
} from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, ArrowLeft, Calendar, MapPin, Book, Utensils, Hotel, Bus, Plane, Ship, Car, Landmark } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

// Helper functions for statistics
function getDayStats(day: TripDay) {
  const transport = (day.transport || "").toLowerCase();
  const highlights = day.highlights || "";
  const attractions = day.attractions || "";
  
  // Count flights
  const flightKeywords = ["飛機", "航班", "班機", "起飛", "降落", "轉機"];
  const departureKeywords = ["出境", "離開", "起飛", "搭機"];
  const arrivalKeywords = ["入境", "抵達", "降落", "接機"];
  
  let departures = 0;
  let arrivals = 0;
  
  if (flightKeywords.some(k => transport.includes(k) || highlights.includes(k))) {
    if (departureKeywords.some(k => highlights.includes(k))) departures++;
    if (arrivalKeywords.some(k => highlights.includes(k))) arrivals++;
    // If only "飛機" mentioned without direction, count as one flight
    if (departures === 0 && arrivals === 0) {
      if (transport.includes("飛機") || transport.includes("航班")) departures = 1;
    }
  }
  
  // Count cruises/sailing
  const cruiseKeywords = ["郵輪", "渡輪", "航行", "船"];
  const cruises = cruiseKeywords.some(k => transport.includes(k) || highlights.includes(k)) ? 1 : 0;
  
  // Count shuttles/transfers
  const shuttleKeywords = ["接駁", "接送", "接機", "送機", "機場接送"];
  const shuttles = shuttleKeywords.some(k => highlights.includes(k)) ? 1 : 0;
  
  // Count attractions
  const attractionCount = attractions ? attractions.split("/").map(a => a.trim()).filter(Boolean).length : 0;
  
  return { departures, arrivals, cruises, shuttles, attractionCount };
}

function getTotalStats(days: TripDay[]) {
  let totalDepartures = 0;
  let totalArrivals = 0;
  let totalCruises = 0;
  let totalShuttles = 0;
  let totalAttractions = 0;
  
  // Meal counts
  let airplaneMeals = 0;
  let cruiseMeals = 0;
  let hotelMeals = 0;
  
  days.forEach(day => {
    const stats = getDayStats(day);
    totalDepartures += stats.departures;
    totalArrivals += stats.arrivals;
    totalCruises += stats.cruises;
    totalShuttles += stats.shuttles;
    totalAttractions += stats.attractionCount;
    
    // Count meals
    const meals = [day.breakfast, day.lunch, day.dinner].filter(Boolean);
    meals.forEach(meal => {
      const m = (meal || "").toLowerCase();
      if (m.includes("機上") || m.includes("飛機")) airplaneMeals++;
      else if (m.includes("郵輪") || m.includes("船上")) cruiseMeals++;
      else if (m.includes("hotel") || m.includes("飯店") || m.includes("酒店")) hotelMeals++;
      else hotelMeals++; // Default to hotel meal
    });
  });
  
  return {
    departures: totalDepartures,
    arrivals: totalArrivals,
    cruises: totalCruises,
    shuttles: totalShuttles,
    attractions: totalAttractions,
    meals: {
      airplane: airplaneMeals,
      cruise: cruiseMeals,
      hotel: hotelMeals,
      total: airplaneMeals + cruiseMeals + hotelMeals
    }
  };
}

interface TripDayFormData {
  dayNo: number;
  date: string;
  cityArea: string;
  title: string;
  highlights: string;
  attractions: string;
  bibleRefs: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  lodging: string;
  lodgingLevel: string;
  transport: string;
  freeTimeFlag: boolean;
  shoppingFlag: boolean;
  mustKnow: string;
  notes: string;
}

const emptyFormData: TripDayFormData = {
  dayNo: 1,
  date: "",
  cityArea: "",
  title: "",
  highlights: "",
  attractions: "",
  bibleRefs: "",
  breakfast: "",
  lunch: "",
  dinner: "",
  lodging: "",
  lodgingLevel: "",
  transport: "",
  freeTimeFlag: false,
  shoppingFlag: false,
  mustKnow: "",
  notes: "",
};

export default function AdminTripDays() {
  const { tripId: paramTripId } = useParams<{ tripId: string }>();
  const tripId = paramTripId || null;
  const navigate = useNavigate();

  const { data: trips } = useAllTrips();
  const { data: tripDays, isLoading } = useTripDays(tripId);
  const { createTripDay, updateTripDay, deleteTripDay } = useTripDayMutations(tripId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<TripDay | null>(null);
  const [formData, setFormData] = useState<TripDayFormData>(emptyFormData);

  const currentTrip = trips?.find((t: any) => t.id === tripId);

  const resetForm = () => {
    setFormData(emptyFormData);
    setEditingDay(null);
  };

  const handleCreate = async () => {
    await createTripDay.mutateAsync(formData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingDay) return;
    await updateTripDay.mutateAsync({ id: editingDay.id, ...formData });
    setEditingDay(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteTripDay.mutateAsync(id);
  };

  const openEdit = (day: TripDay) => {
    setEditingDay(day);
    setFormData({
      dayNo: day.dayNo,
      date: day.date,
      cityArea: day.cityArea || "",
      title: day.title || "",
      highlights: day.highlights || "",
      attractions: day.attractions || "",
      bibleRefs: day.bibleRefs || "",
      breakfast: day.breakfast || "",
      lunch: day.lunch || "",
      dinner: day.dinner || "",
      lodging: day.lodging || "",
      lodgingLevel: day.lodgingLevel || "",
      transport: day.transport || "",
      freeTimeFlag: day.freeTimeFlag || false,
      shoppingFlag: day.shoppingFlag || false,
      mustKnow: day.mustKnow || "",
      notes: day.notes || "",
    });
  };

  const openCreate = () => {
    const nextDayNo = tripDays ? tripDays.length + 1 : 1;
    setFormData({ ...emptyFormData, dayNo: nextDayNo });
    setIsCreateOpen(true);
  };

  if (!tripId) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h2 className="text-display">每日行程管理</h2>
          <p className="text-body text-muted-foreground mb-4">請先選擇一個旅程：</p>
          <div className="grid gap-4">
            {trips?.map((trip: any) => (
              <Button
                key={trip.id}
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => navigate(`/admin/trip-days/${trip.id}`)}
                data-testid={`button-select-trip-${trip.id}`}
              >
                <div className="text-left">
                  <p className="font-semibold">{trip.title}</p>
                  <p className="text-caption text-muted-foreground">
                    {trip.destination} · {trip.startDate} - {trip.endDate}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const TripDayForm = ({ isEditing = false }: { isEditing?: boolean }) => (
    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dayNo">第幾天</Label>
          <Input
            id="dayNo"
            type="number"
            min={1}
            value={formData.dayNo}
            onChange={(e) => setFormData({ ...formData, dayNo: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">日期</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cityArea">城市/地區</Label>
        <Input
          id="cityArea"
          value={formData.cityArea}
          onChange={(e) => setFormData({ ...formData, cityArea: e.target.value })}
          placeholder="例：伊斯坦堡 Istanbul"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">行程標題</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="例：聖索菲亞 / 藍色清真寺"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="highlights">行程亮點</Label>
        <Textarea
          id="highlights"
          value={formData.highlights}
          onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
          placeholder="伊斯坦堡歷史城區 / 聖索菲亞 / 跑馬場..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>勾選景點（從行程亮點中選擇觀光景點）</Label>
        {formData.highlights ? (
          <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-md max-h-40 overflow-y-auto">
            {formData.highlights.split("/").map((h) => h.trim()).filter(Boolean).map((highlight, index) => {
              const selectedAttractions = formData.attractions.split("/").map(a => a.trim()).filter(Boolean);
              const isChecked = selectedAttractions.includes(highlight);
              return (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`attraction-${index}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      let newAttractions: string[];
                      if (checked) {
                        newAttractions = [...selectedAttractions, highlight];
                      } else {
                        newAttractions = selectedAttractions.filter(a => a !== highlight);
                      }
                      setFormData({ ...formData, attractions: newAttractions.join(" / ") });
                    }}
                  />
                  <label
                    htmlFor={`attraction-${index}`}
                    className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {highlight}
                  </label>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
            請先填寫行程亮點，再勾選景點
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bibleRefs">經文參考</Label>
        <Input
          id="bibleRefs"
          value={formData.bibleRefs}
          onChange={(e) => setFormData({ ...formData, bibleRefs: e.target.value })}
          placeholder="例：徒16:6-12;林後2:12"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="breakfast">早餐</Label>
          <Input
            id="breakfast"
            value={formData.breakfast}
            onChange={(e) => setFormData({ ...formData, breakfast: e.target.value })}
            placeholder="HOTEL / 機上 / X"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lunch">午餐</Label>
          <Input
            id="lunch"
            value={formData.lunch}
            onChange={(e) => setFormData({ ...formData, lunch: e.target.value })}
            placeholder="當地特色"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dinner">晚餐</Label>
          <Input
            id="dinner"
            value={formData.dinner}
            onChange={(e) => setFormData({ ...formData, dinner: e.target.value })}
            placeholder="HOTEL或當地特色"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lodging">住宿</Label>
          <Input
            id="lodging"
            value={formData.lodging}
            onChange={(e) => setFormData({ ...formData, lodging: e.target.value })}
            placeholder="5星Hilton Istanbul"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lodgingLevel">住宿等級</Label>
          <Select
            value={formData.lodgingLevel}
            onValueChange={(value) => setFormData({ ...formData, lodgingLevel: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="選擇等級" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5-star">5星級</SelectItem>
              <SelectItem value="4-star">4星級</SelectItem>
              <SelectItem value="3-star">3星級</SelectItem>
              <SelectItem value="cruise">郵輪</SelectItem>
              <SelectItem value="flight">機上</SelectItem>
              <SelectItem value="other">其他</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transport">交通方式</Label>
        <Input
          id="transport"
          value={formData.transport}
          onChange={(e) => setFormData({ ...formData, transport: e.target.value })}
          placeholder="旅遊巴士 / 郵輪 / 飛機"
        />
      </div>

      <div className="flex gap-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="freeTimeFlag"
            checked={formData.freeTimeFlag}
            onCheckedChange={(checked) => setFormData({ ...formData, freeTimeFlag: !!checked })}
          />
          <Label htmlFor="freeTimeFlag">有自由時間</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="shoppingFlag"
            checked={formData.shoppingFlag}
            onCheckedChange={(checked) => setFormData({ ...formData, shoppingFlag: !!checked })}
          />
          <Label htmlFor="shoppingFlag">有購物行程</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mustKnow">重要須知</Label>
        <Textarea
          id="mustKnow"
          value={formData.mustKnow}
          onChange={(e) => setFormData({ ...formData, mustKnow: e.target.value })}
          placeholder="請攜帶護照..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">備註</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
        />
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/trip-days")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-display mb-1">每日行程管理</h2>
            {currentTrip && (
              <p className="text-body text-muted-foreground">
                {currentTrip.title} · {currentTrip.destination}
              </p>
            )}
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} data-testid="button-create-trip-day">
                <Plus className="w-4 h-4 mr-2" />
                新增每日行程
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增每日行程</DialogTitle>
              </DialogHeader>
              <TripDayForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  取消
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createTripDay.isPending || !formData.date}
                  data-testid="button-submit-create-day"
                >
                  {createTripDay.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  建立
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overall Statistics */}
        {tripDays && tripDays.length > 0 && (() => {
          const stats = getTotalStats(tripDays);
          return (
            <div className="bg-card rounded-lg shadow-card p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">行程統計</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {(stats.departures > 0 || stats.arrivals > 0) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Plane className="w-4 h-4 text-blue-500" />
                    <span>飛行 {stats.departures + stats.arrivals} 次</span>
                    <span className="text-xs text-muted-foreground">
                      (出{stats.departures}/入{stats.arrivals})
                    </span>
                  </div>
                )}
                {stats.cruises > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Ship className="w-4 h-4 text-cyan-500" />
                    <span>航行 {stats.cruises} 次</span>
                  </div>
                )}
                {stats.shuttles > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="w-4 h-4 text-green-500" />
                    <span>接駁 {stats.shuttles} 次</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Utensils className="w-4 h-4 text-orange-500" />
                  <span>共 {stats.meals.total} 餐</span>
                  <span className="text-xs text-muted-foreground">
                    (機上{stats.meals.airplane}/船上{stats.meals.cruise}/飯店{stats.meals.hotel})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Landmark className="w-4 h-4 text-amber-500" />
                  <span>{stats.attractions} 個景點</span>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="space-y-4">
          {tripDays?.length ? (
            tripDays.map((day) => {
              const dayStats = getDayStats(day);
              return (
              <div
                key={day.id}
                className="bg-card rounded-lg shadow-card p-6"
                data-testid={`trip-day-${day.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gradient-warm flex items-center justify-center text-primary-foreground font-bold text-lg">
                      {day.dayNo}
                    </div>
                    <div>
                      <h3 className="text-body font-semibold">{day.title || day.cityArea || `第 ${day.dayNo} 天`}</h3>
                      <p className="text-caption text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(day.date), "yyyy/MM/dd (EEEE)", { locale: zhTW })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog
                      open={editingDay?.id === day.id}
                      onOpenChange={(open) => !open && setEditingDay(null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => openEdit(day)}>
                          <Pencil className="w-4 h-4 mr-1" />
                          編輯
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>編輯每日行程</DialogTitle>
                        </DialogHeader>
                        <TripDayForm isEditing />
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingDay(null)}>
                            取消
                          </Button>
                          <Button
                            onClick={handleUpdate}
                            disabled={updateTripDay.isPending}
                          >
                            {updateTripDay.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            儲存
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>確定要刪除此行程？</AlertDialogTitle>
                          <AlertDialogDescription>
                            此操作無法復原。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(day.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            刪除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-caption">
                  {day.cityArea && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{day.cityArea}</span>
                    </div>
                  )}
                  {day.bibleRefs && (
                    <div className="flex items-center gap-2">
                      <Book className="w-4 h-4 text-primary" />
                      <span className="truncate">{day.bibleRefs}</span>
                    </div>
                  )}
                  {day.lodging && (
                    <div className="flex items-center gap-2">
                      <Hotel className="w-4 h-4 text-primary" />
                      <span className="truncate">{day.lodging}</span>
                    </div>
                  )}
                  {day.transport && (
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-primary" />
                      <span>{day.transport}</span>
                    </div>
                  )}
                </div>

                {day.highlights && (
                  <p className="mt-3 text-body text-muted-foreground">{day.highlights}</p>
                )}

                <div className="flex gap-4 mt-3 text-caption">
                  {day.breakfast && (
                    <span className="flex items-center gap-1">
                      <Utensils className="w-3 h-3" />
                      早: {day.breakfast}
                    </span>
                  )}
                  {day.lunch && <span>午: {day.lunch}</span>}
                  {day.dinner && <span>晚: {day.dinner}</span>}
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {day.freeTimeFlag && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">自由時間</span>
                  )}
                  {day.shoppingFlag && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">購物行程</span>
                  )}
                  {/* Per-day statistics */}
                  {(dayStats.departures > 0 || dayStats.arrivals > 0) && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs flex items-center gap-1">
                      <Plane className="w-3 h-3" />
                      {dayStats.departures > 0 && `出境${dayStats.departures}`}
                      {dayStats.departures > 0 && dayStats.arrivals > 0 && "/"}
                      {dayStats.arrivals > 0 && `入境${dayStats.arrivals}`}
                    </span>
                  )}
                  {dayStats.cruises > 0 && (
                    <span className="px-2 py-1 bg-cyan-50 text-cyan-600 rounded text-xs flex items-center gap-1">
                      <Ship className="w-3 h-3" />
                      航行
                    </span>
                  )}
                  {dayStats.shuttles > 0 && (
                    <span className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      接駁
                    </span>
                  )}
                  {dayStats.attractionCount > 0 && (
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-xs flex items-center gap-1">
                      <Landmark className="w-3 h-3" />
                      {dayStats.attractionCount} 景點
                    </span>
                  )}
                </div>
              </div>
              );
            })
          ) : (
            <div className="bg-card rounded-lg shadow-card p-12 text-center">
              <p className="text-body text-muted-foreground mb-4">目前沒有任何每日行程</p>
              <Button onClick={openCreate} data-testid="button-create-first-day">
                <Plus className="w-4 h-4 mr-2" />
                建立第一天行程
              </Button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
