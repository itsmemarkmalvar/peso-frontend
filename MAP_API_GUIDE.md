# Free Map API Guide for PESO OJT Attendance System

## Overview

For the OJT attendance system, you need:
- **Geolocation**: Get user's current GPS coordinates (lat/lng)
- **Geofencing**: Verify if user is within allowed location radius
- **Reverse Geocoding**: Convert coordinates to readable addresses (optional)

## Best Free Options (No/Low Limits)

### 🏆 **Option 1: Browser Geolocation API (100% Free, No Limits)**

**Best for**: Getting GPS coordinates, no map display needed

The browser's native `navigator.geolocation` API is completely free and has no limits. This is perfect for your attendance system since you only need coordinates, not a visual map.

```typescript
// Get user's current location
function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

// Usage
const position = await getCurrentLocation();
const lat = position.coords.latitude;
const lng = position.coords.longitude;
```

**Pros:**
- ✅ 100% free, no API keys needed
- ✅ No rate limits
- ✅ Works offline (uses device GPS)
- ✅ High accuracy
- ✅ No external dependencies

**Cons:**
- ❌ Requires user permission
- ❌ Doesn't provide map visualization (but you don't need it)

---

### 🗺️ **Option 2: OpenStreetMap + Leaflet.js (Free, Open Source)**

**Best for**: If you need to display a map for geofencing visualization

**Cost**: Free (open source)
**Limits**: Fair use policy (reasonable usage)

```bash
# Install Leaflet for React/Next.js
npm install react-leaflet leaflet
npm install --save-dev @types/leaflet
```

```typescript
// components/MapView.tsx
'use client';

import { MapContainer, TileLayer, Circle, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngExpression } from 'leaflet';

interface MapViewProps {
  center: LatLngExpression;
  radius: number; // in meters
  userLocation?: LatLngExpression;
}

export function MapView({ center, radius, userLocation }: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {/* Geofence circle */}
      <Circle
        center={center}
        radius={radius}
        pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
      />
      {/* User location */}
      {userLocation && (
        <Marker position={userLocation} />
      )}
    </MapContainer>
  );
}
```

**For Next.js**, use dynamic import to avoid SSR issues:

```typescript
// app/clock/page.tsx
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
});
```

**Pros:**
- ✅ Completely free and open source
- ✅ No API keys required
- ✅ Good for map visualization
- ✅ Self-hostable (can run your own tile server)

**Cons:**
- ⚠️ Fair use policy (don't abuse public tile servers)
- ⚠️ For production, consider self-hosting tiles

---

### 📍 **Option 3: Nominatim (OpenStreetMap Geocoding) - Free**

**Best for**: Reverse geocoding (coordinates → address)

**Cost**: Free
**Limits**: 1 request per second (strict rate limit)

```typescript
// Reverse geocoding: Convert lat/lng to address
async function getAddressFromCoordinates(lat: number, lng: number) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
    {
      headers: {
        'User-Agent': 'PESO-OJT-Attendance-System' // Required
      }
    }
  );
  
  const data = await response.json();
  return data.display_name; // Full address string
}
```

**Pros:**
- ✅ Free
- ✅ Good for address lookup

**Cons:**
- ❌ Strict rate limit (1 req/sec)
- ❌ Requires User-Agent header

---

### 🔄 **Option 4: Photon (OpenStreetMap Geocoding) - Better Alternative**

**Best for**: Geocoding with better rate limits

**Cost**: Free
**Limits**: More lenient than Nominatim

```typescript
// Geocoding: Address → coordinates
async function getCoordinatesFromAddress(address: string) {
  const response = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`
  );
  
  const data = await response.json();
  if (data.features && data.features.length > 0) {
    const [lng, lat] = data.features[0].geometry.coordinates;
    return { lat, lng };
  }
  return null;
}
```

**Pros:**
- ✅ Free
- ✅ Better rate limits than Nominatim
- ✅ Fast and reliable

**Cons:**
- ⚠️ Still has fair use policy

---

## Recommended Implementation for Your Project

### For Attendance System (Geolocation Only)

**Use Browser Geolocation API** - You don't need a map API at all!

```typescript
// lib/geolocation.ts
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export async function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

// Check if user is within geofence
export function isWithinGeofence(
  userLat: number,
  userLng: number,
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(userLat, userLng, centerLat, centerLng);
  return distance <= radiusMeters;
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
```

### For Map Visualization (Optional)

If you want to show a map to users, use **Leaflet + OpenStreetMap**:

```bash
npm install react-leaflet leaflet
```

---

## Comparison Table

| Solution | Cost | Limits | Best For | Setup Complexity |
|----------|------|--------|----------|------------------|
| **Browser Geolocation API** | Free | None | Getting GPS coordinates | ⭐ Easy |
| **OpenStreetMap + Leaflet** | Free | Fair use | Map visualization | ⭐⭐ Medium |
| **Nominatim** | Free | 1 req/sec | Reverse geocoding | ⭐ Easy |
| **Photon** | Free | Fair use | Geocoding | ⭐ Easy |
| **Google Maps API** | Paid | $200 free credit/month | Full-featured maps | ⭐⭐⭐ Complex |
| **Mapbox** | Paid | 50k requests/month free | Modern vector maps | ⭐⭐⭐ Complex |

---

## Implementation Recommendation

**For your OJT Attendance System:**

1. **Primary**: Use **Browser Geolocation API** (native, no limits)
   - Get GPS coordinates on clock-in/out
   - No API keys needed
   - No external dependencies
   - Works offline

2. **Optional**: Use **OpenStreetMap + Leaflet** if you want to:
   - Show a map to users
   - Visualize geofence boundaries
   - Display user location on map

3. **Optional**: Use **Photon** for reverse geocoding (coordinates → address)
   - Store readable addresses in database
   - Better than Nominatim (less strict limits)

---

## Code Example: Complete Implementation

```typescript
// hooks/useGeolocation.ts
'use client';

import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return { location, error, loading, getLocation };
}
```

---

## Implementation in Your Project

### Installation

```bash
cd peso-frontend
npm install leaflet react-leaflet @types/leaflet --legacy-peer-deps
```

**Note**: The `--legacy-peer-deps` flag is required because `react-leaflet` currently requires React 18, but your project uses React 19. This is safe to use as React 19 is backward compatible with React 18 code. The map functionality will work correctly.

### Files Created

1. **`src/components/map/GeofenceMap.tsx`** - Interactive map component
2. **`src/lib/geolocation.ts`** - Geolocation utilities
3. **`src/hooks/useGeolocation.ts`** - React hook for geolocation
4. **`src/app/(dashboard)/admin/geofences/page.tsx`** - Admin page for managing geofence locations

### Usage Example

```typescript
// In your clock-in page
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { isWithinGeofence } from "@/lib/geolocation";

const GeofenceMap = dynamic(
  () => import("@/components/map/GeofenceMap").then(mod => ({ default: mod.GeofenceMap })),
  { ssr: false }
);

export default function ClockInPage() {
  const { location, fetchLocation, loading, error } = useGeolocation();
  const [geofenceLocations, setGeofenceLocations] = useState([]);

  const handleClockIn = async () => {
    // Get user location
    const userLocation = await fetchLocation();
    
    // Check if within any geofence
    const withinGeofence = geofenceLocations.some(geofence => {
      const check = isWithinGeofence(
        userLocation.latitude,
        userLocation.longitude,
        geofence.latitude,
        geofence.longitude,
        geofence.radius_meters
      );
      return check.isWithin;
    });

    if (!withinGeofence) {
      alert("You must be within an allowed location to clock in");
      return;
    }

    // Proceed with clock-in
    // ... API call to clock in
  };

  return (
    <div>
      <GeofenceMap locations={geofenceLocations} mode="view" />
      <button onClick={handleClockIn}>Clock In</button>
    </div>
  );
}
```

## Summary

✅ **Best Choice**: Browser Geolocation API (100% free, no limits)
- Perfect for your use case
- No API keys needed
- No external services
- Works offline

✅ **For Map Visualization**: OpenStreetMap + Leaflet.js
- Free and open source
- Interactive map for creating/managing geofence locations
- Fair use policy
- Already implemented in your project!

✅ **For geocoding**: Photon API
- Free geocoding service
- Better than Nominatim

**You don't need a paid map API for your attendance system!** The browser's native geolocation API + OpenStreetMap provides everything you need for geofencing and map visualization.
