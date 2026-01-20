"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

export interface GeofenceLocation {
  id?: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

interface GeofenceMapProps {
  locations?: GeofenceLocation[];
  onLocationCreate?: (location: Omit<GeofenceLocation, "id">) => void;
  onLocationUpdate?: (location: GeofenceLocation) => void;
  onLocationSelect?: (location: GeofenceLocation | null) => void;
  selectedLocation?: GeofenceLocation | null;
  mode?: "view" | "create" | "edit";
  initialCenter?: [number, number];
  initialZoom?: number;
}

// Component to handle map clicks for creating new locations
function MapClickHandler({
  onMapClick,
  mode,
}: {
  onMapClick: (lat: number, lng: number) => void;
  mode: "view" | "create" | "edit";
}) {
  useMapEvents({
    click: (e) => {
      if (mode === "create") {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Wrapper component to prevent double initialization
function MapWrapper({
  children,
  center,
  zoom,
  mapId,
  onMapCreated,
}: {
  children: React.ReactNode;
  center: [number, number];
  zoom: number;
  mapId: string;
  onMapCreated?: (map: L.Map) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const hasRenderedRef = useRef(false);

  useEffect(() => {
    // Only render once, even in Strict Mode
    if (hasRenderedRef.current) {
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!hasRenderedRef.current && containerRef.current) {
        // Check if container already has a Leaflet map
        const container = containerRef.current;
        const hasExistingMap = (container as any)._leaflet_id !== undefined;
        
        if (!hasExistingMap) {
          hasRenderedRef.current = true;
          setShouldRender(true);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          const map = mapInstanceRef.current;
          if (map && typeof map.remove === 'function') {
            map.remove();
          }
        } catch (e) {
          // Ignore errors during cleanup
        }
        mapInstanceRef.current = null;
      }
      hasRenderedRef.current = false;
    };
  }, []);

  if (!shouldRender) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-slate-100">
        <p className="text-slate-600 text-sm">Loading map...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full" id={mapId}>
      <MapContainer
        key={mapId}
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        scrollWheelZoom={true}
        whenCreated={(map) => {
          // Only store the first map instance
          if (!mapInstanceRef.current) {
            mapInstanceRef.current = map;
            if (onMapCreated) {
              onMapCreated(map);
            }
          } else {
            // Duplicate detected - remove it immediately
            try {
              if (map && typeof map.remove === 'function') {
                map.remove();
              }
            } catch (e) {
              // Ignore cleanup errors
            }
          }
        }}
      >
        {children}
      </MapContainer>
    </div>
  );
}

export function GeofenceMap({
  locations = [],
  onLocationCreate,
  onLocationUpdate,
  onLocationSelect,
  selectedLocation,
  mode = "view",
  initialCenter = [14.2486, 121.1258], // Default: Cabuyao, Laguna, Philippines
  initialZoom = 13,
}: GeofenceMapProps) {
  const [mapCenter] = useState<[number, number]>(initialCenter);
  const [mapZoom] = useState(initialZoom);
  const [newLocation, setNewLocation] = useState<{
    lat: number;
    lng: number;
    radius: number;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Use a more unique ID that includes component instance
  const mapIdRef = useRef<string>(`geofence-map-${Date.now()}-${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    // Small delay to ensure clean mount
    const timer = setTimeout(() => {
      setIsMounted(true);
      // Force a new key to ensure fresh container
      setMapKey(prev => prev + 1);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          // Map might already be removed
        }
        mapRef.current = null;
      }
    };
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    if (mode === "create") {
      setNewLocation({ lat, lng, radius: 100 }); // Default 100m radius
    }
  };

  const handleCreateLocation = () => {
    if (newLocation && onLocationCreate) {
      onLocationCreate({
        name: "",
        address: "",
        latitude: newLocation.lat,
        longitude: newLocation.lng,
        radius_meters: newLocation.radius,
      });
      setNewLocation(null);
    }
  };

  const handleCancelCreate = () => {
    setNewLocation(null);
  };

  if (!isMounted) {
    return (
      <div className="relative w-full h-full min-h-[500px] rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading map...</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] rounded-lg overflow-hidden border border-slate-200"
      id={mapIdRef.current}
    >
      <MapWrapper
        key={mapKey}
        center={mapCenter}
        zoom={mapZoom}
        mapId={`${mapIdRef.current}-${mapKey}`}
        onMapCreated={(map) => {
          if (!mapRef.current) {
            mapRef.current = map;
          }
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapClickHandler onMapClick={handleMapClick} mode={mode} />

        {/* Render existing geofence locations */}
        {locations.map((location) => {
          const isSelected = selectedLocation?.id === location.id;
          return (
            <div key={location.id}>
              <Circle
                center={[location.latitude, location.longitude]}
                radius={location.radius_meters}
                pathOptions={{
                  color: isSelected ? "#dc2626" : "#2563eb",
                  fillColor: isSelected ? "#dc2626" : "#2563eb",
                  fillOpacity: 0.2,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => {
                    if (onLocationSelect) {
                      onLocationSelect(location);
                    }
                  },
                }}
              />
              <Marker
                position={[location.latitude, location.longitude]}
                eventHandlers={{
                  click: () => {
                    if (onLocationSelect) {
                      onLocationSelect(location);
                    }
                  },
                }}
              />
            </div>
          );
        })}

        {/* Render new location being created */}
        {newLocation && (
          <div>
            <Circle
              center={[newLocation.lat, newLocation.lng]}
              radius={newLocation.radius}
              pathOptions={{
                color: "#10b981",
                fillColor: "#10b981",
                fillOpacity: 0.2,
                weight: 2,
              }}
            />
            <Marker position={[newLocation.lat, newLocation.lng]} />
          </div>
        )}
      </MapWrapper>

      {/* Create location form overlay */}
      {newLocation && mode === "create" && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4 border border-slate-200 min-w-[300px]">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Create New Geofence Location
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Coordinates
              </label>
              <p className="text-xs text-slate-600">
                Lat: {newLocation.lat.toFixed(6)}, Lng: {newLocation.lng.toFixed(6)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Radius (meters)
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                value={newLocation.radius}
                onChange={(e) =>
                  setNewLocation({
                    ...newLocation,
                    radius: parseInt(e.target.value) || 100,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreateLocation}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800"
              >
                Create
              </button>
              <button
                onClick={handleCancelCreate}
                className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode indicator */}
      {mode === "create" && !newLocation && (
        <div className="absolute top-4 right-4 z-[1000] bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <p className="text-xs font-medium text-blue-800">
            Click on the map to create a new location
          </p>
        </div>
      )}
    </div>
  );
}
