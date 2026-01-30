"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import { Circle, MapContainer, Marker, TileLayer } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

import { cn } from "@/lib/utils"

type MapBackdropProps = {
  center?: [number, number]
  zoom?: number
  interactive?: boolean
  geofences?: Array<{
    id?: number | string
    name?: string
    lat: number
    lng: number
    radiusMeters?: number
  }>
  userLocation?: {
    lat: number
    lng: number
  } | null
  className?: string
}

if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  })
}

export function MapBackdrop({
  center = [14.2486, 121.1258],
  zoom = 13,
  interactive = false,
  geofences = [],
  userLocation = null,
  className,
}: MapBackdropProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [mapKey, setMapKey] = useState(0)
  const enableInteraction = Boolean(interactive)
  const userLocationIcon = L.divIcon({
    className: "map-user-marker",
    html: `
      <span class="map-user-marker__pulse"></span>
      <img src="/map/user-location.svg" alt="You are here" />
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })

  useEffect(() => {
    setIsMounted(true)
    // Force remount on Fast Refresh to prevent "already initialized" error
    setMapKey((prev) => prev + 1)
  }, [])

  return (
    <div
      className={cn(
        "h-full w-full",
        enableInteraction ? "pointer-events-auto" : "pointer-events-none",
        className
      )}
    >
      {isMounted ? (
        <MapContainer
          key={mapKey}
          center={center}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          zoomControl={enableInteraction}
          scrollWheelZoom={enableInteraction}
          dragging={enableInteraction}
          doubleClickZoom={enableInteraction}
          touchZoom={enableInteraction}
          keyboard={enableInteraction}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {geofences.map((geofence, index) => {
            const key =
              typeof geofence.id === "number" || typeof geofence.id === "string"
                ? String(geofence.id)
                : `${geofence.lat}-${geofence.lng}-${index}`
            return (
              <Fragment key={key}>
                {geofence.radiusMeters ? (
                  <Circle
                    center={[geofence.lat, geofence.lng]}
                    radius={geofence.radiusMeters}
                    pathOptions={{
                      color: "#2563eb",
                      fillColor: "#93c5fd",
                      fillOpacity: 0.2,
                      weight: 2,
                    }}
                  />
                ) : null}
                <Marker position={[geofence.lat, geofence.lng]} />
              </Fragment>
            )
          })}

          {userLocation ? (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
            />
          ) : null}
        </MapContainer>
      ) : (
        <div className="h-full w-full bg-slate-100" />
      )}
    </div>
  )
}
