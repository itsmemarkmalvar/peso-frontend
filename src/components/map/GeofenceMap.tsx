"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Circle, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeofenceLocation as ApiGeofenceLocation } from "@/lib/api/geofenceLocations";
import { DEFAULT_MAP_CENTER } from "@/lib/mapConstants";

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

export type PendingNewLocation = {
  lat: number;
  lng: number;
  radius: number;
  name: string;
};

interface GeofenceMapProps {
  locations?: GeofenceLocation[];
  onLocationCreate?: (location: GeofenceCreateInput) => void;
  onLocationUpdate?: (location: GeofenceLocation) => void;
  onLocationSelect?: (location: GeofenceLocation | null) => void;
  selectedLocation?: GeofenceLocation | null;
  mode?: "view" | "create" | "edit";
  initialCenter?: [number, number];
  initialZoom?: number;
  /** Pending location from map click (parent renders form in sidebar). No overlay on map. */
  pendingNewLocation?: PendingNewLocation | null;
  onMapClickForCreate?: (lat: number, lng: number) => void;
}

// Disable scroll/double-click zoom in create mode so the map doesn't adjust when user clicks to pin
function MapZoomLock({ mode }: { mode: "view" | "create" | "edit" }) {
  const map = useMap();
  useEffect(() => {
    if (mode === "create") {
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
    } else {
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
    }
    return () => {
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
    };
  }, [map, mode]);
  return null;
}

// Component to handle map clicks for creating new locations
// Uses mouseEventToLatLng for exact placement at the pixel the user clicked
function MapClickHandler({
  onMapClick,
  mode,
}: {
  onMapClick: (lat: number, lng: number) => void;
  mode: "view" | "create" | "edit";
}) {
  const map = useMap();
  useMapEvents({
    click: (e) => {
      if (mode === "create") {
        const latlng = map.mouseEventToLatLng(e.originalEvent);
        onMapClick(latlng.lat, latlng.lng);
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
  initialCenter = DEFAULT_MAP_CENTER,
  initialZoom = 13,
  pendingNewLocation = null,
  onMapClickForCreate,
}: GeofenceMapProps) {
  const [mapCenter] = useState<[number, number]>(initialCenter);
  const [mapZoom] = useState(initialZoom);
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
    if (mode === "create" && onMapClickForCreate) {
      onMapClickForCreate(lat, lng);
    }
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

        <MapZoomLock mode={mode} />
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
        {pendingNewLocation && (
          <div>
            <Circle
              center={[pendingNewLocation.lat, pendingNewLocation.lng]}
              radius={pendingNewLocation.radius}
              pathOptions={{
                color: "#10b981",
                fillColor: "#10b981",
                fillOpacity: 0.2,
                weight: 2,
              }}
            />
            <Marker position={[pendingNewLocation.lat, pendingNewLocation.lng]} />
          </div>
        )}
      </MapContainer>

      {/* Mode indicator - no overlay on map */}
      {mode === "create" && !pendingNewLocation && (
        <div className="absolute top-4 right-4 z-[1000] bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <p className="text-xs font-medium text-blue-800">
            Click on the map to pin the location. Use +/− to zoom.
          </p>
        </div>
      )}
    </div>
  );
}
