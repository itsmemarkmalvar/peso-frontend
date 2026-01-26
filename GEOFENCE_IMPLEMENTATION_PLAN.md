# Geofence Implementation Plan (Leaflet)

Solid plan to implement the geofence feature using **Leaflet**, aligned with:

1. **Admin/Supervisor can add and delete new pins** on the map where Interns/GIP can clock in or clock out.
2. **Vicinity (radius) of the pinned location can be edited.**

---

## Current State Summary

| Area | Status | Notes |
|------|--------|-------|
| **DB** | ✅ Ready | `geofence_locations` table exists (name, address, lat, lng, radius_meters, is_active). `attendance.geofence_location_id` nullable FK. |
| **Backend API** | ❌ Missing | No model, controller, or routes for geofences. |
| **Frontend – GeofenceMap** | ✅ Mostly done | Add (click-to-create), circles, markers, radius in create overlay. Select, view. |
| **Frontend – Geofences page** | ⚠️ UI only | Create, edit, delete work in UI; **localStorage only**. TODOs for API. |
| **Frontend – Intern clock** | ⚠️ localStorage | Geofences from `intern-geofences-v1`; used for “within geofence” check. |
| **RBAC** | 📋 Design done | Admin/Supervisor manage geofences; Intern/GIP read-only (list active for clock). |

---

## Implementation Phases

### Phase 1: Backend – Model, API, RBAC

**Goal:** Expose CRUD for geofence locations, restricted to admin/supervisor.

#### 1.1 Model & migration check

- [ ] Create `App\Models\GeofenceLocation`:
  - Fillable: `name`, `address`, `latitude`, `longitude`, `radius_meters`, `is_active`.
  - Casts: `latitude`/`longitude` → float, `is_active` → bool.
  - No code changes to migrations; table already matches.

#### 1.2 Controller

- [ ] Create `App\Http\Controllers\Api\GeofenceLocationsController` (or similar):
  - `index()`: List geofences. **Admin/Supervisor:** all. **Intern/GIP:** active only (`is_active = true`), for clock-in UI.
  - `store()`: Create. **Admin/Supervisor only.** Validate: name, address, lat, lng, radius_meters (e.g. 10–5000).
  - `show($id)`: Get one. **Admin/Supervisor:** any. **Intern/GIP:** active only.
  - `update($id)`: Update (name, address, radius_meters, is_active). **Admin/Supervisor only.**
  - `destroy($id)`: Soft-delete or hard delete. **Admin/Supervisor only.** Consider `attendance.geofence_location_id` → `nullOnDelete` (already in migration).

Use `BaseController` and `ResponseHelper` for consistent JSON.

#### 1.3 Routes & middleware

- [ ] In `routes/api.php`, under `auth:sanctum`:
  - `GET    /api/geofence-locations` → `index`
  - `POST   /api/geofence-locations` → `store`
  - `GET    /api/geofence-locations/{id}` → `show`
  - `PUT    /api/geofence-locations/{id}` → `update`
  - `DELETE /api/geofence-locations/{id}` → `destroy`
- [ ] Restrict create/update/delete to admin/supervisor (middleware or inline role check). Keep `index` (and optionally `show`) available to intern/gip for clock-in geofence list.

#### 1.4 Validation

- [ ] `store` / `update`: required name, address; lat (-90–90), lng (-180–180); radius_meters (e.g. 10–5000). Optional `is_active` on update.

---

### Phase 2: Frontend – API Client & Types

**Goal:** Centralized geofence API and types.

#### 2.1 Endpoints & client

- [ ] In `src/lib/api/endpoints.ts`, add:
  - `geofenceLocations.list`, `geofenceLocations.create`, `geofenceLocations.show(id)`, `geofenceLocations.update(id)`, `geofenceLocations.delete(id)`.
- [ ] Create `src/lib/api/geofenceLocations.ts`:
  - `getGeofenceLocations(params?: { active_only?: boolean })` → `GET /geofence-locations`.
  - `createGeofenceLocation(payload)` → `POST /geofence-locations`.
  - `getGeofenceLocation(id)` → `GET /geofence-locations/:id`.
  - `updateGeofenceLocation(id, payload)` → `PUT /geofence-locations/:id`.
  - `deleteGeofenceLocation(id)` → `DELETE /geofence-locations/:id`.
- [ ] Use shared `GeofenceLocation`-like type (align with `GeofenceMap` and backend response). Include `id`, `is_active`, `created_at`/`updated_at` if returned.

---

### Phase 3: Geofences Admin Page – Wire to API

**Goal:** Admin/Supervisor manage pins (add, delete) and edit vicinity (radius) via API. Keep Leaflet map UX.

#### 3.1 Data loading & persistence

- [ ] **Load:** On mount, call `getGeofenceLocations()` (admin/supervisor → all). Replace localStorage init for list.
- [ ] **Create:** On “Create” (click map → overlay → Confirm):
  - Call `createGeofenceLocation({ name, address, latitude, longitude, radius_meters })`.
  - On success, append to list, select new pin, clear create overlay. On failure, show error (toast/alert).
- [ ] **Update:** On “Save” in edit mode (name, address, radius):
  - Call `updateGeofenceLocation(id, { name, address, radius_meters })`.
  - On success, update local state so map/form reflect new data. **Radius change** updates `Circle` via existing `location.radius_meters` prop.
- [ ] **Delete:** On “Delete” (sidebar or future map action):
  - Call `deleteGeofenceLocation(id)`. On success, remove from list and selection.

#### 3.2 Create flow – name & address

- [ ] **Option A (recommended):** Add **name** and **address** inputs to the **create overlay** in `GeofenceMap` (or keep overlay minimal and pass coords+radius up; parent opens a modal with name/address before calling create). Ensure we never create with empty name/address.
- [ ] **Option B:** Keep “Create” with coords+radius only; then **edit** name/address in sidebar immediately after create. Either way, backend always receives name + address.

#### 3.3 UX hardening

- [ ] Loading state: skeleton or spinner while fetching locations.
- [ ] Error state: message + retry when fetch/create/update/delete fails.
- [ ] Optimistic updates optional: update UI before API response, revert on error.

#### 3.4 Optional: Remove localStorage

- [ ] After API is stable, **stop** reading/writing geofences to `intern-geofences-v1` on the **admin** geofences page. Intern clock will use API instead (Phase 4).

---

### Phase 4: GeofenceMap – Small Fixes

**Goal:** Ensure add/delete and edit-vicinity work cleanly with API-backed data.

#### 4.1 Create overlay

- [ ] If name/address live in overlay: add inputs, validate, pass to `onLocationCreate`. Else ensure parent supplies them before `createGeofenceLocation`.
- [ ] Keep radius input in overlay; creation uses overlay radius.

#### 4.2 Edit radius

- [ ] Radius is already edited in **sidebar** (Location Details). Form → `handleSave` → `updateGeofenceLocation` → state update → `Circle` re-renders. **No map changes** if this flow is wired.
- [ ] Ensure `formData.radius_meters` is always synced when editing and that `handleSave` calls the update API.

#### 4.3 Delete

- [ ] Delete stays in **sidebar** (existing). Optional later: “Delete” on marker popup or right-click. For now, sidebar delete is enough.

#### 4.4 Keys & stability

- [ ] Use stable `location.id` for `key` in map list (no `Date.now()` after create once we have server id). Update list with API response after create.

---

### Phase 5: Intern Clock – Use API Geofences

**Goal:** Interns/GIP see only **active** geofences; clock-in validation uses API data.

#### 5.1 Fetch geofences

- [ ] On Intern Time/Clock page load, call `getGeofenceLocations({ active_only: true })` (or equivalent). Replace localStorage read for geofence list.
- [ ] Store result in state and pass to `GeofenceMap` / `isWithinGeofence` logic.

#### 5.2 Within-geofence check

- [ ] Keep `lib/geolocation.ts` `isWithinGeofence(lat, lng, centerLat, centerLng, radiusMeters)`. Use API geofences for center + radius.
- [ ] If no geofences exist, either disable clock-in or show “No geofence configured” message (product decision).

#### 5.3 Optional: localStorage cache

- [ ] For offline-ish or faster load, optionally cache API geofences in localStorage and use as fallback. Prefer API when online.

---

### Phase 6: Testing & Edge Cases

- [ ] **Admin flow:** Add pin → edit name/address/radius → delete pin. All via API.
- [ ] **Intern flow:** Open clock page → geofences loaded from API → inside/outside check works.
- [ ] **RBAC:** Intern/GIP cannot create/update/delete geofences (403). They can list active ones.
- [ ] **Validation:** Invalid lat/lng/radius rejected by API; show validation errors in UI.
- [ ] **Empty state:** No geofences → sensible empty state on admin page and intern clock.
- [ ] **Leaflet:** No duplicate map init, clean unmount (existing cleanup preserved).

---

## File Checklist

| File | Action |
|------|--------|
| `peso-backend/app/Models/GeofenceLocation.php` | **Create** |
| `peso-backend/app/Http/Controllers/Api/GeofenceLocationsController.php` | **Create** |
| `peso-backend/routes/api.php` | **Add** geofence routes + middleware |
| `peso-frontend/src/lib/api/endpoints.ts` | **Add** `geofenceLocations` |
| `peso-frontend/src/lib/api/geofenceLocations.ts` | **Create** |
| `peso-frontend/src/app/(dashboard)/dashboard/geofences/page.tsx` | **Refactor** to use API, drop localStorage |
| `peso-frontend/src/components/map/GeofenceMap.tsx` | **Tweak** create overlay (name/address) if needed, keys |
| `peso-frontend/src/components/intern/pages/InternTimePage.tsx` | **Refactor** to fetch geofences from API |
| `peso-frontend/src/app/(dashboard)/intern/clock/page.tsx` | **Refactor** if it uses geofences (fetch from API) |

---

## API Contract (Reference)

**List**

- `GET /api/geofence-locations?active_only=1`
- Response: `{ success, data: GeofenceLocation[] }`

**Create**

- `POST /api/geofence-locations`
- Body: `{ name, address, latitude, longitude, radius_meters }`
- Response: `{ success, data: GeofenceLocation }`

**Update**

- `PUT /api/geofence-locations/:id`
- Body: `{ name?, address?, radius_meters?, is_active? }`
- Response: `{ success, data: GeofenceLocation }`

**Delete**

- `DELETE /api/geofence-locations/:id`
- Response: `{ success, message }`

**GeofenceLocation** (backend): `id`, `name`, `address`, `latitude`, `longitude`, `radius_meters`, `is_active`, `created_at`, `updated_at`.

---

## Order of Work (Suggested)

1. **Phase 1** – Backend model, controller, routes, RBAC.
2. **Phase 2** – Frontend API client + endpoints.
3. **Phase 3** – Geofences page wired to API; remove localStorage for geofences.
4. **Phase 4** – GeofenceMap small fixes (create overlay, keys).
5. **Phase 5** – Intern clock uses API geofences.
6. **Phase 6** – Manual + automated tests, edge cases.

---

## Objectives vs Plan

| Objective | How it’s covered |
|-----------|------------------|
| **1. Add & delete pins** | Add: click map → create overlay → API `store`. Delete: sidebar delete → API `destroy`. Map reflects state from API. |
| **2. Edit vicinity (radius)** | Edit mode in sidebar → change radius → Save → API `update` → state refresh → `Circle` radius updates via prop. |

Both objectives are satisfied with the current Leaflet setup plus API persistence and the small UI/flow adjustments above.
