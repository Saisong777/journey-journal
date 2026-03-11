import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const attractionIcon = L.divIcon({
  className: "attraction-marker",
  html: `<div style="
    width: 20px;
    height: 20px;
    background: #d97706;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

interface AttractionMarker {
  id: string;
  nameZh: string;
  dayNo: number;
  lat: number;
  lng: number;
}

interface AttractionsMapProps {
  attractions: { id: string; nameZh: string; dayNo: number; gps: string | null }[];
  onMarkerClick?: (id: string) => void;
}

/** Parse GPS text field like "31.7767, 35.2345" into [lat, lng] */
function parseGps(gps: string | null): [number, number] | null {
  if (!gps) return null;
  const parts = gps.split(",").map((s) => parseFloat(s.trim()));
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }
  return null;
}

function FitBounds({ markers }: { markers: AttractionMarker[] }) {
  const map = useMap();
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (markers.length === 0) return;
    // Only re-fit when marker count changes
    if (markers.length === prevCountRef.current) return;
    prevCountRef.current = markers.length;

    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  }, [map, markers]);

  return null;
}

export function AttractionsMap({ attractions, onMarkerClick }: AttractionsMapProps) {
  const markers: AttractionMarker[] = attractions
    .map((a) => {
      const coords = parseGps(a.gps);
      if (!coords) return null;
      return { id: a.id, nameZh: a.nameZh, dayNo: a.dayNo, lat: coords[0], lng: coords[1] };
    })
    .filter((m): m is AttractionMarker => m !== null);

  if (markers.length === 0) return null;

  const center: [number, number] = [markers[0].lat, markers[0].lng];

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden shadow-card">
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={markers} />
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={attractionIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-sm">{m.nameZh}</p>
                <p className="text-xs text-gray-500 mb-2">第 {m.dayNo} 天</p>
                {onMarkerClick && (
                  <button
                    onClick={() => onMarkerClick(m.id)}
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      background: "#d97706",
                      color: "white",
                      borderRadius: "6px",
                      fontSize: "12px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    查看詳情
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
