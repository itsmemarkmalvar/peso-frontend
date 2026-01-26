"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGeolocation } from "@/hooks/useGeolocation";
import { isWithinGeofence } from "@/lib/geolocation";
import { getGeofenceLocations, type GeofenceLocation } from "@/lib/api/geofenceLocations";

// Dynamic import for map (SSR disabled)
const GeofenceMapDynamic = dynamic(
  () => import("@/components/map/GeofenceMap").then((mod) => ({ default: mod.GeofenceMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-slate-100 rounded-lg flex items-center justify-center">
        <p className="text-slate-600">Loading map...</p>
      </div>
    ),
  }
);

export default function ClockInPage() {
  const { location, fetchLocation, loading, error } = useGeolocation();
  const [geofenceLocations, setGeofenceLocations] = useState<GeofenceLocation[]>([]);
  const [geofenceCheck, setGeofenceCheck] = useState<{
    isWithin: boolean;
    distance: number;
    locationName: string;
  } | null>(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [clocking, setClocking] = useState(false);

  // Fetch geofence locations from API on mount
  useEffect(() => {
    let active = true;

    const loadGeofences = async () => {
      try {
        const data = await getGeofenceLocations(true); // active_only = true for intern/GIP
        if (active) {
          setGeofenceLocations(data);
        }
      } catch (err) {
        console.error("Failed to load geofence locations:", err);
        // Fallback to empty array if API fails
        if (active) {
          setGeofenceLocations([]);
        }
      }
    };

    loadGeofences();

    return () => {
      active = false;
    };
  }, []);

  // Check geofence when location changes
  useEffect(() => {
    if (location && geofenceLocations.length > 0) {
      let found = false;
      for (const geofence of geofenceLocations) {
        const check = isWithinGeofence(
          location.latitude,
          location.longitude,
          geofence.latitude,
          geofence.longitude,
          geofence.radius_meters
        );
        if (check.isWithin) {
          setGeofenceCheck({
            isWithin: true,
            distance: check.distance,
            locationName: geofence.name,
          });
          found = true;
          break;
        }
      }
      if (!found) {
        setGeofenceCheck({
          isWithin: false,
          distance: 0,
          locationName: "",
        });
      }
    }
  }, [location, geofenceLocations]);

  const handleGetLocation = async () => {
    try {
      await fetchLocation();
    } catch (err) {
      console.error("Failed to get location:", err);
    }
  };

  const handleClockIn = async () => {
    if (!location) {
      alert("Please get your location first");
      return;
    }

    if (!geofenceCheck?.isWithin) {
      alert("You must be within an allowed location to clock in");
      return;
    }

    setClocking(true);
    try {
      // TODO: Call API to clock in
      // await apiClient.post(API_ENDPOINTS.attendance.clockIn, {
      //   latitude: location.latitude,
      //   longitude: location.longitude,
      //   geofence_id: geofenceCheck.locationName,
      // });
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setClockedIn(true);
    } catch (err) {
      alert("Failed to clock in. Please try again.");
    } finally {
      setClocking(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Clock In</h1>
        <p className="text-slate-600 mt-1">
          Record your attendance with location verification
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Location</CardTitle>
            <CardDescription>
              Verify you are within an allowed geofence location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[400px] w-full">
              <GeofenceMapDynamic
                locations={geofenceLocations}
                mode="view"
                initialCenter={
                  location ? [location.latitude, location.longitude] : [14.2486, 121.1258]
                }
                initialZoom={location ? 16 : 13}
              />
            </div>

            {!location && (
              <Button
                onClick={handleGetLocation}
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-800"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Get My Location
                  </>
                )}
              </Button>
            )}

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Location Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {location && (
              <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-blue-700" />
                  <span className="font-medium">Coordinates:</span>
                </div>
                <div className="text-xs text-slate-600 space-y-1 pl-6">
                  <p>Latitude: {location.latitude.toFixed(6)}</p>
                  <p>Longitude: {location.longitude.toFixed(6)}</p>
                  <p>Accuracy: ±{Math.round(location.accuracy)}m</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clock In Section */}
        <Card>
          <CardHeader>
            <CardTitle>Clock In Status</CardTitle>
            <CardDescription>Verify location and clock in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!location && (
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertTitle>Location Required</AlertTitle>
                <AlertDescription>
                  Please get your location first to verify you are within an allowed area.
                </AlertDescription>
              </Alert>
            )}

            {location && geofenceCheck && (
              <Alert variant={geofenceCheck.isWithin ? "default" : "destructive"}>
                {geofenceCheck.isWithin ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {geofenceCheck.isWithin ? "Location Verified" : "Outside Allowed Area"}
                </AlertTitle>
                <AlertDescription>
                  {geofenceCheck.isWithin ? (
                    <>
                      You are within <strong>{geofenceCheck.locationName}</strong>. You can
                      proceed to clock in.
                    </>
                  ) : (
                    <>
                      You are outside the allowed geofence area. Please move to an allowed
                      location to clock in.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {clockedIn ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Clocked In Successfully</AlertTitle>
                <AlertDescription>
                  Your attendance has been recorded. Have a great day!
                </AlertDescription>
              </Alert>
            ) : (
              <Button
                onClick={handleClockIn}
                disabled={!location || !geofenceCheck?.isWithin || clocking}
                className="w-full bg-blue-700 hover:bg-blue-800"
                size="lg"
              >
                {clocking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Clocking in...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Clock In
                  </>
                )}
              </Button>
            )}

            {location && geofenceCheck && (
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">Location Status</h3>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    Status:{" "}
                    <span
                      className={`font-semibold ${
                        geofenceCheck.isWithin ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {geofenceCheck.isWithin ? "Within Geofence" : "Outside Geofence"}
                    </span>
                  </p>
                  {geofenceCheck.isWithin && (
                    <p>Distance from center: {geofenceCheck.distance}m</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
