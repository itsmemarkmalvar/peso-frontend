# Geofence Feature & mapcn Research

Research on **mapcn** (shadcn-style map components) and how it can be used for the PESO geofence feature.

---

## Objectives compatibility (Leaflet vs mapcn)

**Target objectives:**

1. **Admin/Supervisor can add and delete new pins** on the map where Interns/GIP can clock in or clock out.
2. **Vicinity (radius) of the pinned location can be edited.**

### Objective 1: Add and delete pins

| Approach | Add pin | Delete pin | Notes |
|----------|---------|------------|--------|
| **Leaflet** | Click map → `useMapEvents` → create `Circle` + `Marker` in state → both render declaratively. **Already implemented.** | Remove location from state → `Circle` and `Marker` unmount. No extra cleanup. | Simple, declarative. Add/delete = state in, components out. |
| **mapcn** | `useMap` → `map.on('click')` → get `lngLat` → `onLocationCreate`. Add `MapMarker` + Turf circle → GeoJSON source + fill/line layers. | Remove from state → remove `MapMarker` + remove GeoJSON source + layers. Must track layer IDs and clean up in `useEffect`. | Fully compatible, but more manual lifecycle (sources, layers, IDs). |

**Verdict:** Both **compatible**. Leaflet is simpler (declarative components); mapcn requires explicit layer/source management.

---

### Objective 2: Edit vicinity (radius)

| Approach | Edit radius | Notes |
|----------|-------------|--------|
| **Leaflet** | `Circle` has **`radius={location.radius_meters}`**. User edits radius in form → state updates → `Circle` re-renders with new radius. **Native, zero extra logic.** | Radius is a first-class prop. Geofences page already has radius input in edit mode. |
| **mapcn** | No built-in circle. Vicinity = Turf polygon. Edit radius → **regenerate** `turf.circle(center, newRadiusKm, opts)` → `source.setData(newCircle)`. Must map form changes to the correct GeoJSON source and update it. | Compatible, but **custom logic**: Turf + source updates whenever radius changes. |

**Verdict:** **Leaflet is a better fit.** Radius editing is native and declarative. mapcn works but needs Turf + imperative layer updates.

---

### Recommendation for these objectives

**Use Leaflet** for the geofence feature **if** the priority is:

- **Objective 1 (add/delete pins)** and **Objective 2 (edit vicinity)** with minimal custom code.
- **Edit radius** as a core interaction: Leaflet’s `Circle` supports this directly; mapcn does not.

**Consider mapcn** only if you care more about:

- shadcn alignment, light/dark tiles, MapControls (locate, fullscreen), and are **willing to implement** Turf-based circles + radius-update logic.

**Summary:** For *“add/delete pins + edit vicinity”*, **Leaflet is more compatible** and **simpler to implement and maintain**. The current Leaflet-based `GeofenceMap` already supports both objectives; extending it (e.g. wire to API, polish UX) is straightforward.

---

## 1. Current Geofence Setup (Leaflet)

### Stack
- **Leaflet** + **react-leaflet** + **@types/leaflet**
- **OpenStreetMap** tiles (`{s}.tile.openstreetmap.org`)
- Custom `GeofenceMap` in `src/components/map/GeofenceMap.tsx`

### Features
- **GeofenceMap**: circles (radius in meters), markers, click-to-create, view/create/edit modes
- **GeofenceLocation**: `id`, `name`, `address`, `latitude`, `longitude`, `radius_meters`
- Used in:
  - **Admin Geofences** (`/dashboard/geofences`): manage locations, localStorage persistence
  - **Intern Clock** (`/dashboard/intern/clock` + `InternTimePage`): verify user inside geofence before clock-in
- **lib/geolocation.ts**: `isWithinGeofence()`, Haversine distance, Photon reverse geocoding
- **Coordinate order**: `[lat, lng]` (Leaflet)

### Known issues
- `reactStrictMode: false` to avoid Leaflet double-init
- Manual Leaflet icon fix for Next.js
- Map cleanup hacks (`_leaflet_id`) to prevent “container already initialized”
- `--legacy-peer-deps` (react-leaflet vs React 19)

---

## 2. What is mapcn?

**mapcn** is a map component library for **shadcn/ui** projects.

- **Site**: [mapcn.dev](https://mapcn.dev)
- **Docs**: [mapcn.dev/docs](https://www.mapcn.dev/docs)
- **Engine**: **MapLibre GL JS** (not Leaflet)
- **Styling**: Tailwind, shadcn-style
- **Install**: `npx shadcn@latest add https://mapcn.dev/maps/map.json`

### What gets installed
- `maplibre-gl`
- `lucide-react` (if not present)
- `src/components/ui/map.tsx` (or `src/registry/map.tsx` → `components/ui/map.tsx`)

### Built-in components
| Component | Purpose |
|-----------|---------|
| **Map** | Root container, MapLibre setup, theme (light/dark) |
| **MapControls** | Zoom, compass, locate, fullscreen |
| **MapMarker** | Markers with popup, tooltip, label, draggable |
| **MapPopup** | Standalone popup (no marker) |
| **MapRoute** | Line/route from `[lng, lat][]` |
| **MapClusterLayer** | Clustered points from GeoJSON |
| **useMap** | Hook for raw MapLibre instance |

### Key characteristics
- **No API keys**: Uses free CARTO basemaps (light/dark)
- **Theme**: Follows `document` class or system (e.g. next-themes)
- **Coordinate order**: `[longitude, latitude]` (GeoJSON / MapLibre)
- **Advanced**: Full MapLibre API via `useMap` → `map` ref

---

## 3. Geofences with mapcn

mapcn **does not** ship a “circle” or “geofence” primitive. Geofences are implemented with:

1. **Custom GeoJSON layers** (MapLibre fill + line), or  
2. **Turf.js** to create circle polygons, then add as GeoJSON.

### 3.1 MapLibre “Draw a circle” approach

From [MapLibre Draw a Circle](https://maplibre.org/maplibre-gl-js/docs/examples/draw-a-circle/):

```js
import * as turf from '@turf/turf';

// Center as [lng, lat]
const center = [121.1258, 14.2486]; // Cabuyao
const radiusKm = 0.1; // 100m
const circle = turf.circle(center, radiusKm, { steps: 64, units: 'kilometers' });

map.addSource('geofence-1', { type: 'geojson', data: circle });
map.addLayer({
  id: 'geofence-1-fill',
  type: 'fill',
  source: 'geofence-1',
  paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.2 }
});
map.addLayer({
  id: 'geofence-1-outline',
  type: 'line',
  source: 'geofence-1',
  paint: { 'line-color': '#2563eb', 'line-width': 2 }
});
```

### 3.2 mapcn integration pattern

- Use **Map** as wrapper; optionally **MapControls** (e.g. `showLocate` for “my location”).
- Use **useMap** inside **Map** to:
  - Add/update/remove GeoJSON sources and layers for each geofence (Turf circles).
  - Subscribe to `map.on('click')` for **click-to-create**.
- Use **MapMarker** for geofence **centers** (optional; could use only GeoJSON).
- Use **MapPopup** or **MarkerPopup** for “Create geofence” / “Edit radius” UIs.

### 3.3 Geofence UX parity with current Leaflet

| Current (Leaflet) | With mapcn |
|-------------------|------------|
| Circles + markers | Turf circles → GeoJSON fill+line; MapMarker for center |
| Click map to create | `useMap` → `map.on('click')` → `onLocationCreate(lng, lat)` |
| Select geofence | Click handler on layer or marker → `onLocationSelect` |
| Create form overlay | Same React UI; trigger from map click |
| View / Create / Edit modes | Same; map logic in a child of `Map` using `useMap` |

**Coordinate conversion**: current code uses `[lat, lng]`; mapcn/MapLibre use `[lng, lat]`. Convert at the boundary (e.g. in `GeofenceMap` or API layer).

---

## 4. mapcn vs current Leaflet setup

| Aspect | Current (Leaflet) | mapcn (MapLibre) |
|--------|-------------------|------------------|
| **Bundle** | leaflet, react-leaflet, @types/leaflet | maplibre-gl, mapcn (adds map.tsx) |
| **Tiles** | OSM | CARTO (light/dark), no key |
| **Theme** | Manual | Auto light/dark |
| **SSR** | Dynamic import, `ssr: false` | Same pattern for Map |
| **StrictMode** | Disabled | Can likely re-enable |
| **Circles** | Native `Circle` | Turf + GeoJSON |
| **Click-to-create** | `useMapEvents` | `useMap` + `map.on('click')` |
| **React 19** | legacy-peer-deps | No special flag |
| **Extras** | — | MapControls (locate, fullscreen, etc.) |

---

## 5. Pros and cons of switching to mapcn

### Pros
- Aligns with **shadcn** (one design system).
- **Light/dark** map tiles without extra config.
- **No API keys** (CARTO).
- **MapControls**: locate user, fullscreen, etc., useful for geofence management.
- Uses **MapLibre** (modern, WebGL).
- **useMap** gives full MapLibre API for advanced geofence logic.
- **Official docs** mention **geofencing** as a use case.
- Avoids Leaflet double-init and icon hacks.
- Better long-term fit with React 19 and Next.js.

### Cons
- **No built-in circle**: need Turf + GeoJSON (extra dep: `@turf/turf`).
- **Custom geofence layer logic**: we’d maintain a small “geofence layer” layer (add/update/remove sources + layers).
- **Coordinate swap**: `[lat, lng]` ↔ `[lng, lat]` at boundaries.
- **Migration effort**: replace `GeofenceMap` and any direct Leaflet usage, then retest geofences + intern clock.

---

## 6. Recommendation

**For objectives “add/delete pins” + “edit vicinity”: use Leaflet.**

- **Leaflet** matches both objectives with less code: native `Circle` (radius = prop), declarative add/delete.
- **mapcn** can do both but needs Turf + GeoJSON + imperative layer updates for radius editing and more careful add/delete lifecycle.

**Option A – Keep Leaflet (recommended for these objectives)**

- Keep `GeofenceMap` on Leaflet.
- Harden as needed: fix Leaflet/Next/React 19 quirks, wire geofences to API, add delete-from-map if desired.
- Revisit mapcn only if you later prioritize shadcn alignment, MapControls, or MapLibre-specific features over simplicity of “edit radius.”

**Option B – Adopt mapcn**

- Add mapcn + `@turf/turf`.
- Rebuild **GeofenceMap** with Map + useMap + Turf circles + MapMarker.
- Implement radius edits via Turf + `source.setData()`, and explicit add/delete of sources/layers.

**Suggested direction**: **Option A (Leaflet)** for the stated geofence objectives. Use Option B only if other factors (shadcn, theme, MapLibre) outweigh the extra effort for vicinity editing.

---

## 7. Implementation sketch (mapcn-based GeofenceMap)

```tsx
// 1. Install
// npx shadcn@latest add https://mapcn.dev/maps/map.json
// npm install @turf/turf

// 2. GeofenceMap structure
import { Map, MapControls, MapMarker, useMap } from "@/components/ui/map";
import * as turf from "@turf/turf";

interface GeofenceLocation {
  id?: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

// Child component: manage GeoJSON layers + map click
function GeofenceLayers({
  locations,
  selectedId,
  onMapClick,
  onSelect,
}: {
  locations: GeofenceLocation[];
  selectedId?: number;
  onMapClick?: (lat: number, lng: number) => void;
  onSelect?: (loc: GeofenceLocation | null) => void;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!isLoaded || !map) return;
    // Add GeoJSON source + fill + line per geofence (turf.circle)
    // Store layer ids, update on locations change, cleanup on unmount.
  }, [isLoaded, map, locations, selectedId]);

  useEffect(() => {
    if (!isLoaded || !map) return;
    const handler = (e: MapLibreGL.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      onMapClick?.(lat, lng);
    };
    map.on("click", handler);
    return () => map.off("click", handler);
  }, [isLoaded, map, onMapClick]);

  return null;
}

export function GeofenceMap({ locations, mode, onLocationCreate, ... }) {
  return (
    <Map
      center={[121.1258, 14.2486]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <MapControls showLocate showZoom position="top-right" />
      <GeofenceLayers
        locations={locations}
        selectedId={selectedLocation?.id}
        onMapClick={mode === "create" ? handleMapClick : undefined}
        onSelect={onLocationSelect}
      />
      {locations.map((loc) => (
        <MapMarker
          key={loc.id}
          longitude={loc.longitude}
          latitude={loc.latitude}
          onClick={() => onLocationSelect?.(loc)}
        >
          <MarkerContent />
          <MarkerPopup>{loc.name}</MarkerPopup>
        </MapMarker>
      ))}
    </Map>
  );
}
```

---

## 8. References

- [mapcn – mapcn.dev](https://mapcn.dev)
- [mapcn Installation](https://www.mapcn.dev/docs/installation)
- [mapcn API Reference](https://www.mapcn.dev/docs/api-reference)
- [mapcn Advanced (useMap, GeoJSON, geofencing)](https://www.mapcn.dev/docs/advanced-usage)
- [MapLibre Draw a Circle (Turf)](https://maplibre.org/maplibre-gl-js/docs/examples/draw-a-circle/)
- [MapLibre Map API](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/)
- [Turf.js circle](https://turfjs.org/docs/#circle)

---

## 9. Files to touch when migrating

| File | Change |
|------|--------|
| `src/components/map/GeofenceMap.tsx` | Rewrite to use Map + useMap + Turf circles |
| `src/app/(dashboard)/dashboard/geofences/page.tsx` | Keep flow; ensure props still match |
| `src/app/(dashboard)/intern/clock/page.tsx` | Unchanged if GeofenceMap interface preserved |
| `src/components/intern/pages/InternTimePage.tsx` | Same; uses `GeofenceLocation` / geofence check |
| `src/lib/geolocation.ts` | No change (Haversine, `isWithinGeofence`) |
| `package.json` | Remove leaflet, react-leaflet, @types/leaflet; add @turf/turf; run mapcn add |
| `next.config.ts` | Consider `reactStrictMode: true` again |
| `MAP_API_GUIDE.md` | Add mapcn + Turf geofence section |

---

*Document generated for the PESO geofence feature. Last updated: 2026-01-26.*
