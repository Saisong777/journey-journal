import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MemberLocation } from "@/hooks/useLocations";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 24px;
      height: 24px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const myLocationIcon = createCustomIcon("#d97706");
const memberIcon = createCustomIcon("#3b82f6");

interface TeamMapProps {
  locations: MemberLocation[];
  myUserId?: string;
  center?: [number, number];
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  const initializedRef = useRef(false);
  
  useEffect(() => {
    if (!initializedRef.current && center) {
      map.setView(center, 14);
      initializedRef.current = true;
    }
  }, [map, center]);
  
  return null;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "剛剛";
  if (diffMins < 60) return `${diffMins} 分鐘前`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} 小時前`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} 天前`;
}

export function TeamMap({ locations, myUserId, center }: TeamMapProps) {
  const defaultCenter: [number, number] = center || [31.7683, 35.2137];

  return (
    <div className="w-full h-72 rounded-lg overflow-hidden shadow-card">
      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={defaultCenter} />
        
        {locations.map((loc) => {
          const isMe = loc.userId === myUserId;
          return (
            <Marker
              key={loc.id}
              position={[loc.latitude, loc.longitude]}
              icon={isMe ? myLocationIcon : memberIcon}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">
                    {loc.profile?.name || "未知成員"}
                    {isMe && " (我)"}
                  </p>
                  <p className="text-xs text-gray-500">
                    更新於 {formatTimeAgo(loc.updatedAt)}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
