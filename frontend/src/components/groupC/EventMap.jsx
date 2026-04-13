import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Navigation, X } from "lucide-react";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon for Ethiopian theme
const ethiopianMarker = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to center map on location
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Ethiopian cities coordinates
const ethiopianCities = {
  "Addis Ababa": { lat: 9.032, lng: 38.7469 },
  "Bahir Dar": { lat: 11.5742, lng: 37.3613 },
  Gondar: { lat: 12.6, lng: 37.4667 },
  Lalibela: { lat: 12.0329, lng: 39.0476 },
  Axum: { lat: 14.1217, lng: 38.7315 },
  Hawassa: { lat: 7.05, lng: 38.4667 },
  "Dire Dawa": { lat: 9.6, lng: 41.85 },
  Mekelle: { lat: 13.5, lng: 39.4667 },
  Jimma: { lat: 7.6667, lng: 36.8333 },
  Harar: { lat: 9.3167, lng: 42.1167 },
};

export function EventMap({
  events,
  selectedEvent,
  onEventSelect,
  height = "400px",
}) {
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([9.032, 38.7469]); // Default to Addis Ababa
  const [mapZoom, setMapZoom] = useState(7);
  const [showUserLocation, setShowUserLocation] = useState(false);

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter([latitude, longitude]);
          setMapZoom(12);
          setShowUserLocation(true);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert(
            "Unable to get your location. Please enable location services.",
          );
        },
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Sort events by distance from user
  const sortedEvents =
    userLocation && showUserLocation
      ? [...events].sort((a, b) => {
          const distA = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            a.latitude || ethiopianCities[a.city]?.lat || 9.032,
            a.longitude || ethiopianCities[a.city]?.lng || 38.7469,
          );
          const distB = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            b.latitude || ethiopianCities[b.city]?.lat || 9.032,
            b.longitude || ethiopianCities[b.city]?.lng || 38.7469,
          );
          return distA - distB;
        })
      : events;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="size-5" />
            <h3 className="font-semibold">Event Locations Map</h3>
          </div>
          <button
            onClick={getUserLocation}
            className="px-4 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition flex items-center gap-2"
          >
            <Navigation className="size-4" />
            Find Near Me
          </button>
        </div>
      </div>

      <div style={{ height, position: "relative" }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <ChangeMapView center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User location marker */}
          {userLocation && showUserLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={
                new L.Icon({
                  iconUrl:
                    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
                  shadowUrl:
                    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41],
                })
              }
            >
              <Popup>Your Location</Popup>
            </Marker>
          )}

          {/* Event markers */}
          {sortedEvents.map((event, idx) => {
            const lat =
              event.latitude || ethiopianCities[event.city]?.lat || 9.032;
            const lng =
              event.longitude || ethiopianCities[event.city]?.lng || 38.7469;
            const distance =
              userLocation && showUserLocation
                ? calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    lat,
                    lng,
                  ).toFixed(1)
                : null;

            return (
              <Marker
                key={event.id || idx}
                position={[lat, lng]}
                icon={ethiopianMarker}
                eventHandlers={{
                  click: () => onEventSelect?.(event),
                }}
              >
                <Popup>
                  <div className="w-[min(220px,70vw)] p-2">
                    <img
                      src={
                        event.banner_url ||
                        "https://images.unsplash.com/photo-1540575467063-178a50c2df87"
                      }
                      alt={event.title}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                    <h4 className="font-bold text-gray-900 text-sm">
                      {event.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {event.venue_name || event.city}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {new Date(event.start_datetime).toLocaleDateString()}
                    </p>
                    {distance && (
                      <p className="text-xs text-blue-600 mt-1">
                        Distance: {distance} km away
                      </p>
                    )}
                    <button
                      onClick={() =>
                        (window.location.href = `/event/${event.id}`)
                      }
                      className="mt-2 w-full px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition"
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Events List Sidebar */}
      <div className="p-4 border-t border-gray-200 max-h-64 overflow-y-auto">
        <h4 className="font-semibold text-gray-900 mb-3">Events Near You</h4>
        <div className="space-y-2">
          {sortedEvents.slice(0, 5).map((event, idx) => {
            const lat =
              event.latitude || ethiopianCities[event.city]?.lat || 9.032;
            const lng =
              event.longitude || ethiopianCities[event.city]?.lng || 38.7469;
            const distance =
              userLocation && showUserLocation
                ? calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    lat,
                    lng,
                  ).toFixed(1)
                : null;

            return (
              <div
                key={event.id || idx}
                className={`p-3 rounded-lg cursor-pointer transition-all ${selectedEvent?.id === event.id ? "bg-green-50 border-l-4 border-green-500" : "hover:bg-gray-50"}`}
                onClick={() => onEventSelect?.(event)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {event.venue_name || event.city}
                    </p>
                  </div>
                  {distance && (
                    <span className="text-xs text-green-600 ml-2">
                      {distance} km
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Update for: feat(engine): add appeal status tracking and admin review interface