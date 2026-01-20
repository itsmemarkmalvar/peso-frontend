"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GeofenceMap, GeofenceLocation } from "@/components/map/GeofenceMap";

const geofenceStorageKey = "intern-geofences-v1";

const defaultLocations: GeofenceLocation[] = [
  {
    id: 1,
    name: "Cabuyao City Hall",
    address: "Cabuyao City Hall, Laguna",
    latitude: 14.2486,
    longitude: 121.1258,
    radius_meters: 100,
  },
];

function parseStoredLocations(raw: string | null): GeofenceLocation[] | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    const cleaned = parsed.flatMap((item, index) => {
      if (!item || typeof item !== "object") {
        return [];
      }
      const lat = Number(item.latitude);
      const lng = Number(item.longitude);
      const radius = Number(item.radius_meters);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius)) {
        return [];
      }
      return [
        {
          id: typeof item.id === "number" ? item.id : Date.now() + index,
          name: typeof item.name === "string" ? item.name : `Location ${index + 1}`,
          address: typeof item.address === "string" ? item.address : "",
          latitude: lat,
          longitude: lng,
          radius_meters: radius,
        },
      ];
    });
    return cleaned.length ? cleaned : null;
  } catch {
    return null;
  }
}

// Dynamic import to avoid SSR issues with Leaflet
const GeofenceMapDynamic = dynamic(
  () => import("@/components/map/GeofenceMap").then((mod) => ({ default: mod.GeofenceMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-slate-100 rounded-lg flex items-center justify-center">
        <p className="text-slate-600">Loading map...</p>
      </div>
    ),
  }
);

export default function GeofencesPage() {
  const [locations, setLocations] = useState<GeofenceLocation[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = parseStoredLocations(window.localStorage.getItem(geofenceStorageKey));
    setLocations(stored ?? defaultLocations);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!locations.length) {
      window.localStorage.removeItem(geofenceStorageKey);
      return;
    }
    window.localStorage.setItem(geofenceStorageKey, JSON.stringify(locations));
  }, [locations]);

  const [selectedLocation, setSelectedLocation] = useState<GeofenceLocation | null>(null);
  const [mode, setMode] = useState<"view" | "create" | "edit">("view");
  const [editingLocation, setEditingLocation] = useState<GeofenceLocation | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    radius_meters: 100,
  });

  const handleLocationCreate = (location: Omit<GeofenceLocation, "id">) => {
    const newLocation: GeofenceLocation = {
      ...location,
      id: Date.now(), // Temporary ID, will be replaced by backend
      name: formData.name || `Location ${locations.length + 1}`,
      address: formData.address || "Address to be determined",
      radius_meters: formData.radius_meters,
    };
    setLocations((prev) => [...prev, newLocation]);
    setSelectedLocation(newLocation);
    setMode("view");
    setFormData({ name: "", address: "", radius_meters: 100 });
    // TODO: Call API to save location
  };

  const handleLocationSelect = (location: GeofenceLocation | null) => {
    setSelectedLocation(location);
    if (location) {
      setFormData({
        name: location.name,
        address: location.address,
        radius_meters: location.radius_meters,
      });
    }
  };

  const handleEdit = () => {
    if (selectedLocation) {
      setEditingLocation(selectedLocation);
      setMode("edit");
    }
  };

  const handleSave = () => {
    if (editingLocation) {
      const updated = locations.map((loc) =>
        loc.id === editingLocation.id
          ? {
              ...loc,
              name: formData.name,
              address: formData.address,
              radius_meters: formData.radius_meters,
            }
          : loc
      );
      setLocations(updated);
      setSelectedLocation(updated.find((loc) => loc.id === editingLocation.id) || null);
      setEditingLocation(null);
      setMode("view");
      // TODO: Call API to update location
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this location?")) {
      setLocations((prev) => prev.filter((loc) => loc.id !== id));
      if (selectedLocation?.id === id) {
        setSelectedLocation(null);
      }
      // TODO: Call API to delete location
    }
  };

  const handleCreateMode = () => {
    setMode("create");
    setSelectedLocation(null);
    setFormData({ name: "", address: "", radius_meters: 100 });
  };

  return (
    <div className="flex flex-col gap-6 px-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Geofence Locations</h1>
          <p className="text-sm text-slate-600">
            Manage locations where interns can clock in/out
          </p>
        </div>
        <Button
          onClick={handleCreateMode}
          className="bg-blue-700 hover:bg-blue-800"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Location
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Map View</CardTitle>
                <CardDescription>
                  {mode === "create"
                    ? "Click on the map to create a new geofence location"
                    : "Click on a location marker to view details"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] w-full">
                <GeofenceMapDynamic
                  locations={locations}
                  onLocationCreate={handleLocationCreate}
                  onLocationSelect={handleLocationSelect}
                  selectedLocation={selectedLocation}
                  mode={mode}
                  initialCenter={[14.2486, 121.1258]} // Cabuyao, Laguna
                  initialZoom={13}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Location List & Details */}
        <div className="space-y-4">
          {/* Location Details Form */}
          {selectedLocation && (
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Location Details</CardTitle>
                  <div className="flex gap-2">
                    {mode === "view" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEdit}
                          className="h-7"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(selectedLocation.id!)}
                          className="h-7"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    {mode === "edit" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSave}
                          className="h-7"
                        >
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMode("view");
                            setEditingLocation(null);
                          }}
                          className="h-7"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-xs">Location Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={mode === "view"}
                    placeholder="e.g., Cabuyao City Hall"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="text-xs">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    disabled={mode === "view"}
                    placeholder="Full address"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Coordinates</Label>
                  <div className="text-xs text-slate-600 space-y-0.5 mt-1">
                    <p>Lat: {selectedLocation.latitude.toFixed(6)}</p>
                    <p>Lng: {selectedLocation.longitude.toFixed(6)}</p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="radius" className="text-xs">Radius (meters)</Label>
                  <Input
                    id="radius"
                    type="number"
                    min="10"
                    max="5000"
                    value={formData.radius_meters}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        radius_meters: parseInt(e.target.value) || 100,
                      })
                    }
                    disabled={mode === "view"}
                    className="h-8 text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Allowed clock-in/out radius from this location
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Locations List */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">All Locations</CardTitle>
              <CardDescription className="text-xs">
                {locations.length} location(s) configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      selectedLocation?.id === location.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    onClick={() => handleLocationSelect(location)}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-blue-700 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {location.name}
                        </p>
                        <p className="text-[11px] text-slate-600 truncate mt-0.5">
                          {location.address}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Radius: {location.radius_meters}m
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {locations.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No locations created yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
