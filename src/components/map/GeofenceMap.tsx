"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeofenceLocation as ApiGeofenceLocation } from "@/lib/api/geofenceLocations";

// Fix for default marker icon in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

export type GeofenceLocation = ApiGeofenceLocation;

type GeofenceCreateInput = Omit<
  GeofenceLocation,
  "id" | "is_active" | "created_at" | "updated_at" | "address"
> & { address?: string };

interface GeofenceMapProps {
  locations?: GeofenceLocation[];
  onLocationCreate?: (location: GeofenceCreateInput) => void;
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
    name: string;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  // Use a more unique ID that includes component instance
  const mapIdRef = useRef<string>(
    `geofence-map-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}`
  );

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (mapRef.current) {
        const container = mapRef.current.getContainer();
        mapRef.current.off();
        mapRef.current.remove();
        if (container && (container as any)._leaflet_id) {
          delete (container as any)._leaflet_id;
        }
        mapRef.current = null;
      }
    };
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    if (mode === "create") {
      setNewLocation({ lat, lng, radius: 100, name: "" });
    }
  };

  const handleCreateLocation = () => {
    if (newLocation && onLocationCreate && newLocation.name?.trim()) {
      onLocationCreate({
        name: newLocation.name.trim(),
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
      className="relative w-full h-full min-h-[500px] rounded-lg overflow-hidden border border-slate-200"
    >
      <MapContainer
        id={mapIdRef.current}
        ref={mapRef}
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        scrollWheelZoom={true}
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
      </MapContainer>

      {/* Create location form overlay */}
      {newLocation && mode === "create" && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4 border border-slate-200 min-w-[300px] max-w-[400px]">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Create New Geofence Location
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Location Name *
              </label>
              <input
                type="text"
                id="create-name"
                placeholder="e.g., Cabuyao City Hall"
                value={newLocation.name || ""}
                onChange={(e) =>
                  setNewLocation({
                    ...newLocation,
                    name: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
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
                Radius (meters) *
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
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCreateLocation}
                disabled={!newLocation.name?.trim()}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-md hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
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
