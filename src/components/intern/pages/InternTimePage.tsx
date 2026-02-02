"use client"

import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"

import {
  getInternTimeClock,
  type InternActivityItem,
  type InternDashboardStat,
  type InternTimeClockHeader,
  type InternTimeClockSnapshot,
  type InternTimeClockWeekItem,
} from "@/lib/api/intern"
import { getGeofenceLocations } from "@/lib/api/geofenceLocations"
import { getSettings } from "@/lib/api/settings"
import type { SystemSettings } from "@/types"
import { clockIn, clockOut, breakStart, breakEnd, getTodayAttendance } from "@/lib/api/attendance"
import { Button } from "@/components/ui/button"

type VerificationAction = "clock-in" | "break-start" | "break-end" | "clock-out"
type SelfieCaptureKey = VerificationAction | "break"

type ConsentState = {
  camera: boolean
  location: boolean
  acceptedAt: string
  retentionDays: number
}

type LocationCapture = {
  coords: {
    lat: number
    lng: number
  }
  capturedAt: string
}

type StoredGeofenceLocation = {
  id?: number | string
  name?: string
  latitude?: number
  longitude?: number
  radius_meters?: number
}

type GeofenceArea = {
  id: string
  name: string
  lat: number
  lng: number
  radiusMeters: number
}

type GeofenceMatch = {
  geofence: GeofenceArea
  distanceMeters: number
}

type GeofenceCheck = {
  inside: boolean
  closest: GeofenceMatch | null
  matches: GeofenceMatch[]
}

const consentStorageKey = "intern-consent-v1"
const geofenceStorageKey = "intern-geofences-v1"

const MapBackdrop = dynamic(
  () => import("@/components/map/MapBackdrop").then((mod) => mod.MapBackdrop),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100" />,
  }
)

const defaultStoredGeofences: StoredGeofenceLocation[] = [
  {
    id: "cabuyao-city-hall",
    name: "Cabuyao City Hall",
    latitude: 14.2486,
    longitude: 121.1258,
    radius_meters: 100,
  },
]

const earthRadiusMeters = 6371000

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function getDistanceMeters(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
) {
  const deltaLat = toRadians(toLat - fromLat)
  const deltaLng = toRadians(toLng - fromLng)
  const originLat = toRadians(fromLat)
  const destinationLat = toRadians(toLat)
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(originLat) *
      Math.cos(destinationLat) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusMeters * c
}

function toGeofenceArea(
  location: StoredGeofenceLocation,
  index: number
): GeofenceArea | null {
  const lat = Number(location.latitude)
  const lng = Number(location.longitude)
  const radiusMeters = Number(location.radius_meters)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusMeters)) {
    return null
  }
  return {
    id: typeof location.id === "number" || typeof location.id === "string"
      ? String(location.id)
      : `geofence-${index + 1}`,
    name: typeof location.name === "string" ? location.name : `Location ${index + 1}`,
    lat,
    lng,
    radiusMeters,
  }
}

function parseStoredGeofences(raw: string | null): GeofenceArea[] | null {
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return null
    }
    const cleaned = parsed
      .map((item, index) => toGeofenceArea(item as StoredGeofenceLocation, index))
      .filter((item): item is GeofenceArea => Boolean(item))
    return cleaned.length ? cleaned : null
  } catch {
    return null
  }
}

function checkGeofence(
  lat: number,
  lng: number,
  geofences: GeofenceArea[]
): GeofenceCheck {
  if (!geofences.length) {
    return { inside: false, closest: null, matches: [] }
  }
  const matches = geofences
    .map((geofence) => ({
      geofence,
      distanceMeters: getDistanceMeters(lat, lng, geofence.lat, geofence.lng),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
  const closest = matches[0] ?? null
  const inside = matches.some(
    (match) => match.distanceMeters <= match.geofence.radiusMeters
  )
  return { inside, closest, matches }
}

function formatOverlayTimestamp(value: Date) {
  const pad = (input: number) => String(input).padStart(2, "0")
  const year = value.getFullYear()
  const month = pad(value.getMonth() + 1)
  const day = pad(value.getDate())
  const hours = pad(value.getHours())
  const minutes = pad(value.getMinutes())
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

/** Format API clock time (ISO string) for display in Philippine time e.g. "8:10 AM" */
function formatClockTime(isoTime: string | null): string {
  if (!isoTime) return "—"
  const d = new Date(isoTime)
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  })
}

const fallbackSummary: InternDashboardStat[] = [
  { label: "Today", value: "2h 10m", sub: "In progress" },
  { label: "This week", value: "18h 40m", sub: "40h target" },
  { label: "Overtime", value: "0h 00m", sub: "No overtime" },
] as const

const fallbackLogs: InternActivityItem[] = [
  { time: "08:10 AM", title: "Clocked in", detail: "Main office" },
  { time: "12:05 PM", title: "Break start", detail: "Lunch" },
  { time: "12:45 PM", title: "Break end", detail: "Back to work" },
] as const

const fallbackWeek: InternTimeClockWeekItem[] = [
  { day: "Mon", hours: "7h 50m" },
  { day: "Tue", hours: "6h 15m" },
  { day: "Wed", hours: "4h 35m" },
  { day: "Thu", hours: "0h 00m" },
  { day: "Fri", hours: "0h 00m" },
] as const

const fallbackHeader: InternTimeClockHeader = {
  currentTime: "08:10",
  meridiem: "AM",
  dateLabel: "Tuesday, Jan 20",
  statusLabel: "On shift",
  statusTone: "active",
  shiftLabel: "Shift 8:00 AM - 5:00 PM",
}

const fallbackSnapshot: InternTimeClockSnapshot = {
  lastClock: "08:10 AM",
  breakLabel: "1h lunch",
  locationLabel: "Main office",
}

export default function InternTimePage() {
  const [header, setHeader] = useState<InternTimeClockHeader>(fallbackHeader)
  const [snapshot, setSnapshot] =
    useState<InternTimeClockSnapshot>(fallbackSnapshot)
  const [summary, setSummary] =
    useState<InternDashboardStat[]>(fallbackSummary)
  const [week, setWeek] =
    useState<InternTimeClockWeekItem[]>(fallbackWeek)
  const [logs, setLogs] = useState<InternActivityItem[]>(fallbackLogs)
  const [geofences, setGeofences] = useState<GeofenceArea[]>(
    defaultStoredGeofences
      .map((item, index) => toGeofenceArea(item, index))
      .filter((item): item is GeofenceArea => Boolean(item))
  )
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [clockNotice, setClockNotice] = useState<string | null>(null)
  const [consent, setConsent] = useState<ConsentState | null>(null)
  const [consentOpen, setConsentOpen] = useState(false)
  const [consentForm, setConsentForm] = useState({
    camera: false,
    location: false,
  })
  const [consentError, setConsentError] = useState<string | null>(null)
  const [consentNotice, setConsentNotice] = useState<string | null>(null)
  const [pendingAction, setPendingAction] =
    useState<VerificationAction | null>(null)
  const [selfieAction, setSelfieAction] =
    useState<VerificationAction | null>(null)
  const [selfieError, setSelfieError] = useState<string | null>(null)
  const [selfieImage, setSelfieImage] = useState<string | null>(null)
  const [selfieOverlayTimestamp, setSelfieOverlayTimestamp] = useState<
    string | null
  >(null)
  const [cameraOverlayTimestamp, setCameraOverlayTimestamp] = useState<
    string | null
  >(null)
  const [selfieCapturedAt, setSelfieCapturedAt] = useState<
    Partial<Record<SelfieCaptureKey, string>>
  >({})
  const [isSubmittingSelfie, setIsSubmittingSelfie] = useState(false)
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationCheck, setLocationCheck] = useState<GeofenceCheck | null>(null)
  const [locationCapture, setLocationCapture] = useState<
    Partial<Record<VerificationAction, LocationCapture>>
  >({})
  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const selfieOpen = selfieAction !== null

  // Live current time so intern sees real-time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours()
      const mins = now.getMinutes()
      const ampm = hours >= 12 ? "PM" : "AM"
      const hour12 = hours % 12 || 12
      const timeStr = `${hour12}:${String(mins).padStart(2, "0")}`
      setHeader((prev) => ({
        ...prev,
        currentTime: timeStr,
        meridiem: ampm,
        dateLabel: now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" }),
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let active = true

    getInternTimeClock()
      .then((data) => {
        if (!active) {
          return
        }
        if (data?.header) {
          setHeader(data.header)
        }
        if (data?.snapshot) {
          setSnapshot(data.snapshot)
        }
        if (data?.summary?.length) {
          setSummary(data.summary)
        }
        if (data?.week?.length) {
          setWeek(data.week)
        }
        if (data?.recentActivity?.length) {
          setLogs(data.recentActivity)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  // Today's break state (for Start Break / End Break button and API choice)
  const [todayBreakStart, setTodayBreakStart] = useState<string | null>(null)
  const [todayBreakEnd, setTodayBreakEnd] = useState<string | null>(null)

  // Load today's attendance so clock-in state reflects server (real-time on load)
  useEffect(() => {
    let active = true

    getTodayAttendance()
      .then((res) => {
        if (!active || !res?.data) return
        const att = res.data
        const hasClockIn = Boolean(att.clock_in_time)
        const hasClockOut = Boolean(att.clock_out_time)
        setIsClockedIn(hasClockIn && !hasClockOut)
        setTodayBreakStart(att.break_start ?? null)
        setTodayBreakEnd(att.break_end ?? null)
        // Update snapshot and header from real attendance
        if (hasClockOut) {
          setSnapshot((prev) => ({
            ...prev,
            lastClock: `Out at ${formatClockTime(att.clock_out_time)}`,
          }))
          setHeader((prev) => ({
            ...prev,
            statusLabel: "Off shift",
            statusTone: "inactive",
          }))
        } else if (hasClockIn) {
          setSnapshot((prev) => ({
            ...prev,
            lastClock: formatClockTime(att.clock_in_time),
          }))
          setHeader((prev) => ({
            ...prev,
            statusLabel: "On shift",
            statusTone: "active",
          }))
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const storedConsent = window.localStorage.getItem(consentStorageKey)
    if (!storedConsent) {
      return
    }
    try {
      const parsed = JSON.parse(storedConsent) as ConsentState
      if (parsed?.camera && parsed?.location) {
        setConsent(parsed)
      }
    } catch {
      window.localStorage.removeItem(consentStorageKey)
    }
  }, [])

  // Load system settings (determines if location verification is required)
  useEffect(() => {
    let active = true
    getSettings()
      .then((data) => {
        if (active) setSettings(data)
      })
      .catch(() => {
        if (active) setSettings({ grace_period_minutes: 10, verification_gps: true, verification_selfie: true })
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadGeofences = async () => {
      try {
        const data = await getGeofenceLocations(true) // active_only = true for intern/GIP
        if (active) {
          // Convert API geofences to GeofenceArea format
          const converted = data
            .map((loc, index) => ({
              id: String(loc.id || `geofence-${index + 1}`),
              name: loc.name,
              lat: loc.latitude,
              lng: loc.longitude,
              radiusMeters: loc.radius_meters,
            }))
            .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng) && Number.isFinite(item.radiusMeters))
          if (converted.length) {
            setGeofences(converted)
          }
        }
      } catch (err) {
        console.error("Failed to load geofence locations:", err)
        // Fallback: try localStorage if API fails
        if (active && typeof window !== "undefined") {
          const storedGeofences = parseStoredGeofences(
            window.localStorage.getItem(geofenceStorageKey)
          )
          if (storedGeofences?.length) {
            setGeofences(storedGeofences)
          }
        }
      }
    }

    loadGeofences()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!consent?.location || userLocation) {
      return
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    )
  }, [consent, userLocation])

  useEffect(() => {
    if (!selfieAction) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setSelfieOverlayTimestamp(null)
      setCameraOverlayTimestamp(null)
      return
    }

    let cancelled = false

    const startCamera = async () => {
      setSelfieError(null)
      setSelfieImage(null)
      setSelfieOverlayTimestamp(null)
      setCameraOverlayTimestamp(null)
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera not supported")
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
      } catch (error) {
        if (!cancelled) {
          setSelfieError(
            "Camera access is unavailable. Please allow permissions and try again."
          )
        }
      }
    }

    startCamera()

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [selfieAction])

  useEffect(() => {
    if (!selfieAction || selfieImage) {
      setCameraOverlayTimestamp(null)
      return
    }
    const updateTimestamp = () => {
      setCameraOverlayTimestamp(formatOverlayTimestamp(new Date()))
    }
    updateTimestamp()
    const intervalId = window.setInterval(updateTimestamp, 1000)
    return () => {
      window.clearInterval(intervalId)
    }
  }, [selfieAction, selfieImage])

  useEffect(() => {
    if (!selfieAction) {
      setLocationStatus("idle")
      setLocationError(null)
      setLocationCheck(null)
      return
    }
    if (settings?.verification_gps === false) {
      setLocationStatus("success")
      setLocationError(null)
      setLocationCheck(null)
      return
    }
    if (!consent?.location) {
      setLocationStatus("idle")
      setLocationError(null)
      setLocationCheck(null)
      return
    }

    if (!navigator.geolocation) {
      setLocationStatus("error")
      setLocationError("Location services are not available in this browser.")
      return
    }

    const action = selfieAction
    setLocationStatus("loading")
    setLocationError(null)
    setLocationCheck(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const timestamp = new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setUserLocation({ lat, lng })
        setLocationCapture((prev) => ({
          ...prev,
          [action]: {
            coords: {
              lat,
              lng,
            },
            capturedAt: timestamp,
          },
        }))
        const check = checkGeofence(lat, lng, geofences)
        setLocationCheck(check)
        if (!check.inside) {
          setLocationStatus("error")
          if (check.closest) {
            setLocationError(
              `Invalid location. You are outside the ${check.closest.geofence.name} radius.`
            )
          } else {
            setLocationError("Invalid location. No approved locations are configured.")
          }
          return
        }
        setLocationStatus("success")
      },
      (error) => {
        setLocationStatus("error")
        setLocationError(
          error.message || "Unable to read your current location."
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }, [selfieAction, consent, geofences, settings?.verification_gps])

  const statusClassName =
    header.statusTone === "active"
      ? "bg-blue-100 text-blue-700"
      : "bg-red-100 text-red-700"

  const requiresLocation = settings == null ? true : settings.verification_gps === true
  const hasConsent = Boolean(
    consent?.camera && (requiresLocation ? consent?.location : true)
  )

  const openVerification = (action: VerificationAction) => {
    setConsentNotice(null)
    setClockNotice(null)
    if ((action === "break-start" || action === "break-end" || action === "clock-out") && !isClockedIn) {
      setClockNotice("Clock in first to start a break or clock out.")
      return
    }
    if (!hasConsent) {
      setPendingAction(action)
      setConsentForm({ camera: false, location: false })
      setConsentError(null)
      setConsentOpen(true)
      return
    }
    setSelfieAction(action)
  }

  const handleConsentConfirm = () => {
    const needLocation = settings?.verification_gps === true
    if (!consentForm.camera || (needLocation && !consentForm.location)) {
      setConsentError(
        needLocation
          ? "You must consent to selfie and location verification to continue."
          : "You must consent to selfie verification to continue."
      )
      return
    }
    const payload: ConsentState = {
      camera: true,
      location: needLocation ? consentForm.location : true,
      acceptedAt: new Date().toISOString(),
      retentionDays: 7,
    }
    setConsent(payload)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(consentStorageKey, JSON.stringify(payload))
    }
    setConsentOpen(false)
    setConsentError(null)
    setConsentNotice(null)
    if (pendingAction) {
      setSelfieAction(pendingAction)
      setPendingAction(null)
    }
  }

  const handleConsentDecline = () => {
    setConsentOpen(false)
    setPendingAction(null)
    setConsentError(null)
    setConsentNotice(
      "Clock-in, breaks, and clock-out are blocked until you provide consent."
    )
  }

  const handleCaptureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) {
      return
    }
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) {
      return
    }
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const capturedAt = new Date()
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const overlayTimestamp = formatOverlayTimestamp(capturedAt)
    const fontSize = Math.max(16, Math.round(canvas.width * 0.03))
    const margin = Math.round(fontSize * 0.6)
    context.save()
    context.font = `${fontSize}px monospace`
    context.textAlign = "left"
    context.textBaseline = "bottom"
    context.lineWidth = Math.max(2, Math.round(fontSize * 0.12))
    context.strokeStyle = "rgba(0, 0, 0, 0.6)"
    context.fillStyle = "rgba(255, 196, 0, 0.95)"
    context.strokeText(overlayTimestamp, margin, canvas.height - margin)
    context.fillText(overlayTimestamp, margin, canvas.height - margin)
    context.restore()
    setSelfieImage(canvas.toDataURL("image/jpeg", 0.92))
    setSelfieOverlayTimestamp(overlayTimestamp)
  }

  const handleConfirmSelfie = async () => {
    if (!selfieAction) {
      return
    }
    if (isSubmittingSelfie) return
    if (settings?.verification_gps !== false && locationStatus !== "success") {
      return
    }
    if (!selfieImage) {
      return
    }
    const needLocation = settings?.verification_gps === true
    if (needLocation && !locationCapture[selfieAction]?.coords) {
      return
    }

    const action = selfieAction
    setIsSubmittingSelfie(true)
    const coords = locationCapture[action]?.coords
    const geofenceId = insideMatch?.geofence.id ? parseInt(insideMatch.geofence.id) : undefined

    try {
      setClockNotice(null)
      
      if (action === "clock-in") {
        const response = await clockIn({
          ...(coords && { location_lat: coords.lat, location_lng: coords.lng }),
          photo: selfieImage,
          ...(geofenceId && { geofence_location_id: geofenceId }),
        })
        
        if (response.success) {
          setIsClockedIn(true)
          const timestamp = new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
          setSelfieCapturedAt((prev) => ({
            ...prev,
            [action]: timestamp,
          }))
          setClockNotice(response.data?.message || "Clocked in successfully")
          // Real-time: update UI from server response immediately
          const att = response.data?.attendance
          if (att?.clock_in_time) {
            setSnapshot((prev) => ({
              ...prev,
              lastClock: formatClockTime(att.clock_in_time),
              locationLabel: att.location_address || prev.locationLabel,
            }))
            setHeader((prev) => ({
              ...prev,
              statusLabel: "On shift",
              statusTone: "active",
            }))
            setLogs((prev) => [
              { time: formatClockTime(att.clock_in_time), title: "Clocked in", detail: att.location_address || "Office" },
              ...prev.slice(0, 9),
            ])
          }
          // Refetch so summary/week and any server state stay in sync
          getInternTimeClock().then((data) => {
            if (data?.summary?.length) setSummary(data.summary)
            if (data?.week?.length) setWeek(data.week)
            if (data?.recentActivity?.length) setLogs(data.recentActivity)
          }).catch(() => {})
          getTodayAttendance().catch(() => {})
        }
      } else if (action === "clock-out") {
        const response = await clockOut({
          ...(coords && { location_lat: coords.lat, location_lng: coords.lng }),
          photo: selfieImage,
          ...(geofenceId && { geofence_location_id: geofenceId }),
        })
        
        if (response.success) {
          setIsClockedIn(false)
          const timestamp = new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
          setSelfieCapturedAt((prev) => ({
            ...prev,
            [action]: timestamp,
          }))
          setClockNotice(
            response.data?.message || 
            `Clocked out successfully. Total hours: ${response.data?.total_hours ?? 0}h`
          )
          // Real-time: update UI from server response immediately
          const att = response.data?.attendance
          if (att?.clock_out_time) {
            setSnapshot((prev) => ({
              ...prev,
              lastClock: `Out at ${formatClockTime(att.clock_out_time)}`,
            }))
            setHeader((prev) => ({
              ...prev,
              statusLabel: "Off shift",
              statusTone: "inactive",
            }))
            setLogs((prev) => [
              { time: formatClockTime(att.clock_out_time), title: "Clocked out", detail: `Total: ${response.data?.total_hours ?? 0}h` },
              ...prev.slice(0, 9),
            ])
          }
          // Refetch so summary/week and server state stay in sync
          getInternTimeClock().then((data) => {
            if (data?.header) setHeader(data.header)
            if (data?.snapshot) setSnapshot(data.snapshot)
            if (data?.summary?.length) setSummary(data.summary)
            if (data?.week?.length) setWeek(data.week)
            if (data?.recentActivity?.length) setLogs(data.recentActivity)
          }).catch(() => {})
          getTodayAttendance().catch(() => {})
        }
      } else if (action === "break-start") {
        const response = await breakStart({
          ...(coords && { location_lat: coords.lat, location_lng: coords.lng }),
          photo: selfieImage,
          ...(geofenceId && { geofence_location_id: geofenceId }),
        })
        if (response.success) {
          const timestamp = new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
          setSelfieCapturedAt((prev) => ({ ...prev, break: timestamp }))
          setTodayBreakStart(new Date().toISOString())
          setClockNotice(response.data?.message || "Break started")
          getInternTimeClock().then((data) => {
            if (data?.header) setHeader(data.header)
            if (data?.snapshot) setSnapshot(data.snapshot)
            if (data?.summary?.length) setSummary(data.summary)
            if (data?.week?.length) setWeek(data.week)
            if (data?.recentActivity?.length) setLogs(data.recentActivity)
          }).catch(() => {})
          getTodayAttendance().then((res) => {
            if (res?.data?.break_start) setTodayBreakStart(res.data.break_start)
            if (res?.data?.break_end) setTodayBreakEnd(res.data.break_end)
          }).catch(() => {})
        }
      } else if (action === "break-end") {
        const response = await breakEnd({
          ...(coords && { location_lat: coords.lat, location_lng: coords.lng }),
          photo: selfieImage,
          ...(geofenceId && { geofence_location_id: geofenceId }),
        })
        if (response.success) {
          const timestamp = new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
          setSelfieCapturedAt((prev) => ({ ...prev, break: timestamp }))
          setTodayBreakEnd(new Date().toISOString())
          setClockNotice(response.data?.message || "Break ended")
          getInternTimeClock().then((data) => {
            if (data?.header) setHeader(data.header)
            if (data?.snapshot) setSnapshot(data.snapshot)
            if (data?.summary?.length) setSummary(data.summary)
            if (data?.week?.length) setWeek(data.week)
            if (data?.recentActivity?.length) setLogs(data.recentActivity)
          }).catch(() => {})
          getTodayAttendance().then((res) => {
            if (res?.data?.break_start) setTodayBreakStart(res.data.break_start)
            if (res?.data?.break_end) setTodayBreakEnd(res.data.break_end)
          }).catch(() => {})
        }
      }
      
      setSelfieAction(null)
      setSelfieImage(null)
      setSelfieOverlayTimestamp(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit. Please try again."
      
      // "Already clocked in" is a soft validation: close overlay and sync state
      if (message.toLowerCase().includes("already clocked in")) {
        console.info("Clock-in prevented: Already clocked in today")
        setClockNotice("You have already clocked in today. Your attendance is being tracked.")
        setSelfieAction(null)
        setSelfieImage(null)
        setSelfieOverlayTimestamp(null)
        setIsClockedIn(true)
        
        // Refresh data from server to show current state
        getInternTimeClock().then((data) => {
          if (data?.header) setHeader(data.header)
          if (data?.snapshot) setSnapshot(data.snapshot)
          if (data?.summary?.length) setSummary(data.summary)
          if (data?.week?.length) setWeek(data.week)
          if (data?.recentActivity?.length) setLogs(data.recentActivity)
        }).catch(() => {})
        getTodayAttendance().then((res) => {
          if (res?.data) {
            const att = res.data
            setIsClockedIn(Boolean(att.clock_in_time) && !Boolean(att.clock_out_time))
            setTodayBreakStart(att.break_start ?? null)
            setTodayBreakEnd(att.break_end ?? null)
          }
        }).catch(() => {})
      } else if (message.toLowerCase().includes("already clocked out")) {
        console.info("Clock-out prevented: Already clocked out today")
        setClockNotice("You have already clocked out today.")
        setSelfieAction(null)
        setSelfieImage(null)
        setSelfieOverlayTimestamp(null)
        setIsClockedIn(false)
        
        // Refresh data from server
        getInternTimeClock().then((data) => {
          if (data?.header) setHeader(data.header)
          if (data?.snapshot) setSnapshot(data.snapshot)
          if (data?.summary?.length) setSummary(data.summary)
          if (data?.week?.length) setWeek(data.week)
          if (data?.recentActivity?.length) setLogs(data.recentActivity)
        }).catch(() => {})
      } else if (message.toLowerCase().includes("must clock in first")) {
        console.info("Action prevented: Must clock in first")
        setClockNotice("Please clock in first before performing this action.")
        setSelfieAction(null)
        setSelfieImage(null)
        setSelfieOverlayTimestamp(null)
        setIsClockedIn(false)
        
        // Refresh data from server
        getInternTimeClock().then((data) => {
          if (data?.header) setHeader(data.header)
          if (data?.snapshot) setSnapshot(data.snapshot)
          if (data?.summary?.length) setSummary(data.summary)
          if (data?.week?.length) setWeek(data.week)
          if (data?.recentActivity?.length) setLogs(data.recentActivity)
        }).catch(() => {})
        getTodayAttendance().then((res) => {
          if (res?.data) {
            const att = res.data
            setIsClockedIn(Boolean(att.clock_in_time) && !Boolean(att.clock_out_time))
            setTodayBreakStart(att.break_start ?? null)
            setTodayBreakEnd(att.break_end ?? null)
          }
        }).catch(() => {})
      } else {
        // Actual error - log it
        console.error("Failed to submit:", error)
        setClockNotice(message)
      }
    } finally {
      setIsSubmittingSelfie(false)
    }
  }

  const actionLabel = selfieAction
    ? selfieAction === "break-start"
      ? "Start break"
      : selfieAction === "break-end"
        ? "End break"
        : selfieAction === "clock-out"
          ? "clock-out"
          : "clock-in"
    : ""
  const isLocationVerified =
    settings?.verification_gps === false || locationStatus === "success"
  const overlayTimestamp = selfieImage
    ? selfieOverlayTimestamp
    : cameraOverlayTimestamp
  const insideMatch = locationCheck?.matches.find(
    (match) => match.distanceMeters <= match.geofence.radiusMeters
  )
  const locationGateMessage =
    locationStatus === "error"
      ? locationError || "Invalid location. Move within the approved radius."
      : locationStatus === "loading"
        ? "Checking your location..."
        : "Waiting for location verification..."
  const mapCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : geofences.length
      ? [geofences[0].lat, geofences[0].lng]
      : [14.2486, 121.1258]
  const mapZoom = userLocation ? 16 : geofences.length ? 15 : 13

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="relative min-h-[360px] overflow-hidden rounded-3xl border border-[color:var(--dash-border)] md:min-h-[480px]">
          <MapBackdrop
            center={mapCenter}
            zoom={mapZoom}
            interactive
            geofences={geofences}
            userLocation={userLocation}
            className="h-full w-full"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/50" />
        </section>

        <div className="flex flex-col gap-4">
          <header className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
              Time and Clock
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Time clock</h1>
            <p className="mt-1 text-sm text-[color:var(--dash-muted)]">
              Clock in, manage breaks, and review your day in one screen.
            </p>
          </header>

          <section className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
                  Current time
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-tight">
                    {header.currentTime}
                  </span>
                  <span className="pb-2 text-sm font-semibold text-[color:var(--dash-muted)]">
                    {header.meridiem}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--dash-muted)]">
                  {header.dateLabel}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName}`}
                  >
                    {header.statusLabel}
                  </span>
                  <span className="text-xs text-[color:var(--dash-muted)]">
                    {header.shiftLabel}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 rounded-xl border border-[color:var(--dash-border)] bg-white px-4 py-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--dash-muted)]">Last clock</span>
                  <span className="font-semibold">{snapshot.lastClock}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--dash-muted)]">Break</span>
                  <span className="font-semibold">{snapshot.breakLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--dash-muted)]">Location</span>
                  <span className="font-semibold">{snapshot.locationLabel}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Button
                className="h-12 w-full bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)]"
                onClick={() => openVerification("clock-in")}
              >
                Clock In
              </Button>
              {!todayBreakStart ? (
                <Button
                  className="h-12 w-full bg-yellow-300 text-yellow-900 hover:bg-yellow-400"
                  onClick={() => openVerification("break-start")}
                  disabled={!isClockedIn}
                >
                  Start Break
                </Button>
              ) : todayBreakStart && !todayBreakEnd ? (
                <Button
                  className="h-12 w-full bg-amber-400 text-amber-900 hover:bg-amber-500"
                  onClick={() => openVerification("break-end")}
                  disabled={!isClockedIn}
                >
                  End Break
                </Button>
              ) : (
                <div className="flex h-12 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-center text-xs font-medium text-slate-500">
                  Break recorded
                </div>
              )}
              <Button
                className="h-12 w-full bg-red-600 text-white hover:bg-red-700"
                onClick={() => openVerification("clock-out")}
                disabled={!isClockedIn}
              >
                Clock Out
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[color:var(--dash-muted)]">
              <span>
                {requiresLocation
                  ? "Selfie and location verification are required for clock-in, breaks, and clock-out."
                  : "Selfie verification is required for clock-in, breaks, and clock-out."}
              </span>
              <div className="flex flex-wrap gap-2">
                {selfieCapturedAt["clock-in"] ? (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                    Clock In selfie {selfieCapturedAt["clock-in"]}
                  </span>
                ) : null}
                {selfieCapturedAt["break"] ? (
                  <span className="rounded-full bg-yellow-50 px-3 py-1 text-[11px] font-semibold text-yellow-800">
                    Break selfie {selfieCapturedAt["break"]}
                  </span>
                ) : null}
                {selfieCapturedAt["clock-out"] ? (
                  <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700">
                    Clock Out selfie {selfieCapturedAt["clock-out"]}
                  </span>
                ) : null}
              </div>
            </div>
            {consentNotice ? (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {consentNotice}
              </p>
            ) : null}
            {clockNotice ? (
              <p className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
                {clockNotice}
              </p>
            ) : !isClockedIn ? (
              <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Clock in to enable break and clock out.
              </p>
            ) : null}
          </section>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {summary.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
              {item.label}
            </p>
            <p className="mt-3 text-2xl font-semibold">{item.value}</p>
            <p className="mt-2 text-xs text-[color:var(--dash-muted)]">
              {item.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
            Recent activity
          </p>
          <div className="mt-4 space-y-4">
            {logs.map((entry) => (
              <div key={entry.time} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-[color:var(--dash-accent)]" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{entry.title}</span>
                    <span className="text-xs text-[color:var(--dash-muted)]">
                      {entry.time}
                    </span>
                  </div>
                  <p className="text-xs text-[color:var(--dash-muted)]">
                    {entry.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
            This week logs
          </p>
          <div className="mt-4 space-y-3">
            {week.map((entry) => (
              <div
                key={entry.day}
                className="flex items-center justify-between rounded-xl border border-[color:var(--dash-border)] bg-white px-4 py-3 text-sm"
              >
                <span className="font-semibold">{entry.day}</span>
                <span className="text-[color:var(--dash-muted)]">
                  {entry.hours}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selfieOpen ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Selfie verification
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Capture your {actionLabel} selfie
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Make sure your face is clearly visible before capturing.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-slate-200 text-xs"
                onClick={() => setSelfieAction(null)}
              >
                Close
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              {selfieError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {selfieError}
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {selfieImage ? (
                    <img
                      src={selfieImage}
                      alt="Captured selfie"
                      className="h-72 w-full object-cover"
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      className="h-72 w-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                  )}
                  {overlayTimestamp ? (
                    <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/40 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                      <span className="font-mono">{overlayTimestamp}</span>
                    </div>
                  ) : null}
                </div>
              )}

              {requiresLocation && !isLocationVerified ? (
                <div
                  className={[
                    "rounded-lg border px-3 py-2 text-xs",
                    locationStatus === "error"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-yellow-200 bg-yellow-50 text-yellow-800",
                  ].join(" ")}
                >
                  {locationGateMessage} You cannot take a selfie until your
                  location is verified.
                </div>
              ) : null}

              <canvas ref={canvasRef} className="hidden" />

              {requiresLocation ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Location verification</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-600">
                    {locationStatus === "loading"
                      ? "Verifying..."
                      : locationStatus === "success"
                        ? "Verified"
                        : locationStatus === "error"
                          ? "Unavailable"
                          : "Idle"}
                  </span>
                </div>
                {locationCheck?.matches.length ? (
                  locationStatus === "success" && insideMatch ? (
                    <p className="mt-2 text-[11px] text-slate-600">
                      Location:{" "}
                      <span className="font-semibold text-slate-700">
                        {insideMatch.geofence.name}
                      </span>
                    </p>
                  ) : (
                    <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                      <p className="font-semibold text-slate-600">
                        Allowed locations
                      </p>
                      {locationCheck.matches.map((match) => (
                        <div
                          key={match.geofence.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{match.geofence.name}</span>
                          <span className="shrink-0">
                            {Math.round(match.distanceMeters)}m /{" "}
                            {match.geofence.radiusMeters}m
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                ) : null}
                {locationStatus === "success" &&
                selfieAction &&
                locationCapture[selfieAction]?.coords ? (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Lat {locationCapture[selfieAction]?.coords.lat.toFixed(6)} , Lng{" "}
                    {locationCapture[selfieAction]?.coords.lng.toFixed(6)} at{" "}
                    {locationCapture[selfieAction]?.capturedAt}
                  </p>
                ) : null}
                {locationStatus === "error" ? (
                  <p className="mt-1 text-[11px] text-red-600">
                    {locationError ||
                      "Location verification is required to continue."}
                  </p>
                ) : null}
              </div>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 border-slate-200"
                  onClick={() => setSelfieAction(null)}
                >
                  Cancel
                </Button>
                {selfieError ? null : selfieImage ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 border-slate-200"
                      onClick={() => {
                        setSelfieImage(null)
                        setSelfieOverlayTimestamp(null)
                      }}
                      disabled={!isLocationVerified || isSubmittingSelfie}
                    >
                      Retake
                    </Button>
                    <Button
                      type="button"
                      className="h-10 bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)]"
                      onClick={handleConfirmSelfie}
                      disabled={!isLocationVerified || isSubmittingSelfie}
                    >
                      {isSubmittingSelfie ? "Submitting…" : "Use selfie"}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    className="h-10 bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)]"
                    onClick={handleCaptureSelfie}
                    disabled={!isLocationVerified}
                  >
                    Capture selfie
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {consentOpen ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Consent required
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  {requiresLocation
                    ? "Permission for selfie and location verification"
                    : "Permission for selfie verification"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {requiresLocation
                    ? "We need your consent to use camera and location for attendance verification. Selfies are stored for 7 days."
                    : "We need your consent to use camera for attendance verification. Selfies are stored for 7 days."}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-slate-200 text-xs"
                onClick={handleConsentDecline}
              >
                Close
              </Button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <input
                  type="checkbox"
                  checked={consentForm.camera}
                  onChange={(event) =>
                    setConsentForm((prev) => ({
                      ...prev,
                      camera: event.target.checked,
                    }))
                  }
                  className="mt-1"
                />
                <span>
                  I consent to capture my selfie for attendance verification.
                </span>
              </label>
              {requiresLocation ? (
              <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <input
                  type="checkbox"
                  checked={consentForm.location}
                  onChange={(event) =>
                    setConsentForm((prev) => ({
                      ...prev,
                      location: event.target.checked,
                    }))
                  }
                  className="mt-1"
                />
                <span>
                  I consent to capture my device location during clock-in,
                  breaks, and clock-out.
                </span>
              </label>
              ) : null}
              <p className="text-[11px] text-slate-500">
                You can withdraw consent in your account settings. If you do not
                consent, clock-in, breaks, and clock-out are blocked.
              </p>
              {consentError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {consentError}
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-10 border-slate-200"
                onClick={handleConsentDecline}
              >
                Decline
              </Button>
              <Button
                type="button"
                className="h-10 bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)]"
                onClick={handleConsentConfirm}
              >
                Agree and continue
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
