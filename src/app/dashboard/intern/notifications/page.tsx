"use client"

import { useEffect, useMemo, useState } from "react"

import { InternBackButton } from "@/components/intern/InternBackButton"
import {
  getNotifications,
  markNotificationRead,
  respondToScheduleAvailability,
  type NotificationRecord,
} from "@/lib/api/notifications"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

export default function InternNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null
  )
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationRecord | null>(null)
  const [isResponding, setIsResponding] = useState(false)

  useEffect(() => {
    let active = true
    setIsLoadingNotifications(true)
    setNotificationsError(null)

    getNotifications()
      .then((data) => {
        if (!active) return
        setNotifications(data)
        if (!selectedNotification && data.length > 0) {
          setSelectedNotification(data[0])
        }
      })
      .catch((err) => {
        if (!active) return
        setNotificationsError(
          err instanceof Error
            ? err.message
            : "Unable to load notifications."
        )
      })
      .finally(() => {
        if (!active) return
        setIsLoadingNotifications(false)
      })

    return () => {
      active = false
    }
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  )

  const selectedNotificationData =
    (selectedNotification?.data as Record<string, unknown> | null) ?? null
  const scheduleDayLabel =
    (selectedNotificationData?.day_label as string | undefined) ?? "Saturday"
  const scheduleStart = selectedNotificationData?.start_time as
    | string
    | undefined
  const scheduleEnd = selectedNotificationData?.end_time as string | undefined
  const adminNotes = selectedNotificationData?.admin_notes as string | undefined
  const responseData = selectedNotificationData?.response as
    | { status?: string }
    | undefined
  const responseStatus = responseData?.status

  const handleOpenNotification = async (item: NotificationRecord) => {
    setSelectedNotification(item)
    if (item.is_read) {
      return
    }
    try {
      const updated = await markNotificationRead(item.id)
      setNotifications((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry))
      )
      setSelectedNotification((current) =>
        current && current.id === updated.id ? updated : current
      )
    } catch {
      // Non-blocking: keep UI responsive even if read status fails
    }
  }

  const handleRespond = async (status: "available" | "not_available") => {
    if (!selectedNotification) return
    setIsResponding(true)
    try {
      const updated = await respondToScheduleAvailability(
        selectedNotification.id,
        status
      )
      setNotifications((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      )
      setSelectedNotification(updated)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save response.")
    } finally {
      setIsResponding(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <InternBackButton href="/dashboard/intern/menu" label="Back to menu" />
      <header className="rounded-2xl border border-(--dash-border) bg-(--dash-card) p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-(--dash-muted)">
              Notifications
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Your updates</h1>
            <p className="mt-1 text-sm text-(--dash-muted)">
              All your alerts are saved here for easy reference.
            </p>
          </div>
          <Badge variant="secondary">{unreadCount} Unread</Badge>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="border-(--dash-border) bg-(--dash-card) shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">All notifications</CardTitle>
            <CardDescription className="text-(--dash-muted)">
              Schedule changes, approvals, and system updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingNotifications && (
              <p className="text-xs text-(--dash-muted)">
                Loading notifications...
              </p>
            )}
            {notificationsError && !isLoadingNotifications && (
              <p className="text-xs text-red-600">{notificationsError}</p>
            )}
            {!isLoadingNotifications &&
              !notificationsError &&
              notifications.length === 0 && (
                <p className="text-xs text-(--dash-muted)">
                  No notifications yet. We&apos;ll let you know when something
                  needs your attention.
                </p>
              )}
            {!isLoadingNotifications &&
              !notificationsError &&
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleOpenNotification(item)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-xs transition ${
                    item.is_read
                      ? "border-slate-100 bg-white hover:border-slate-200"
                      : "border-blue-200 bg-blue-50/60 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        {item.message}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                </button>
              ))}
          </CardContent>
        </Card>

        <Card className="border-(--dash-border) bg-(--dash-card) shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
            <CardDescription className="text-(--dash-muted)">
              Review and respond to important updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedNotification ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedNotification.title}
                  </p>
                  <p className="mt-2 text-xs text-slate-600">
                    {selectedNotification.message}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {formatDate(selectedNotification.created_at)}
                  </p>
                </div>

                {selectedNotification.type ===
                  "schedule_availability_request" && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                      <p className="font-semibold text-slate-700">
                        Schedule change: {scheduleDayLabel}
                      </p>
                      {scheduleStart && scheduleEnd && (
                        <p className="mt-1">
                          {scheduleStart} - {scheduleEnd}
                        </p>
                      )}
                    </div>
                    {adminNotes && (
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase text-slate-500">
                          Admin notes
                        </p>
                        <p className="mt-1 text-xs text-slate-700">
                          {adminNotes}
                        </p>
                      </div>
                    )}
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase text-slate-500">
                        Are you available?
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full border-green-200 bg-green-50 text-green-800 hover:bg-green-100"
                          onClick={() => handleRespond("available")}
                          disabled={isResponding}
                        >
                          Available
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
                          onClick={() => handleRespond("not_available")}
                          disabled={isResponding}
                        >
                          Not available
                        </Button>
                        {responseStatus && (
                          <span className="text-[11px] text-slate-500">
                            Current response: {responseStatus.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-(--dash-muted)">
                Select a notification to see the details.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
