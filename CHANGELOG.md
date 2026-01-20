# Changelog

All notable changes to this project are documented in this file.

## [2026-01-20]

### Added
- Intern shell layout with retractable sidebar for the intern dashboard.
- Intern page content moved into named components under `src/components/intern/pages`.
- Intern time clock selfie capture modal for clock-in, breaks, and clock-out.
- Location verification via browser geolocation during time clock actions.
- GDPR consent modal for camera and location use with a 7-day retention notice.
- Geofence location persistence in localStorage for the geofences page.
- Intern API scaffolding for dashboard, time clock, timesheets, and approvals.

### Changed
- Intern dashboard layout to mirror the admin dashboard card structure.
- Time clock flow now gates actions behind selfie and location verification.
- Break and clock-out actions are blocked until the user clocks in.
- Consent is stored in localStorage until backend persistence is available.
- Time clock geofence validation now uses saved geofence locations.
- Location verification UI lists allowed geofences when outside and shows the matched location when inside.

### Fixed
- Leaflet map cleanup to prevent "Map container is already initialized" errors.
- Admin dashboard status tone typing to satisfy the StatusChip union type.
- Build failures from stale Next.js dev type references by excluding `.next/dev`.
