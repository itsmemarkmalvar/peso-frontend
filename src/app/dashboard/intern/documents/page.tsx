"use client"

import { useEffect, useMemo, useState } from "react"
import { FileText, Printer, ExternalLink } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { InternBackButton } from "@/components/intern/InternBackButton"
import {
  fetchDocumentBlob,
  getDocuments,
  type DocumentRecord,
} from "@/lib/api/documents"

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "-"
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export default function InternDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [documentsError, setDocumentsError] = useState<string | null>(null)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentRecord | null>(null)

  useEffect(() => {
    let active = true
    setIsLoadingDocuments(true)
    setDocumentsError(null)

    getDocuments()
      .then((data) => {
        if (!active) return
        setDocuments(data)
        if (!selectedDocument && data.length > 0) {
          setSelectedDocument(data[0])
        }
      })
      .catch((err) => {
        if (!active) return
        setDocumentsError(
          err instanceof Error ? err.message : "Unable to load documents."
        )
      })
      .finally(() => {
        if (!active) return
        setIsLoadingDocuments(false)
      })

    return () => {
      active = false
    }
  }, [])

  const activeCount = useMemo(
    () => documents.filter((item) => item.is_active).length,
    [documents]
  )

  const openDocumentBlob = async (doc: DocumentRecord) => {
    const blob = await fetchDocumentBlob(doc.id)
    const url = URL.createObjectURL(blob)
    const win = window.open(url, "_blank", "noopener,noreferrer")
    if (win) {
      win.focus()
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  const handleOpen = (doc: DocumentRecord) => {
    openDocumentBlob(doc).catch(() => {})
  }

  const handlePrint = (doc: DocumentRecord) => {
    openDocumentBlob(doc).catch(() => {})
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <InternBackButton href="/dashboard/intern/menu" label="Back to menu" />
      <header className="rounded-2xl border border-(--dash-border) bg-(--dash-card) p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-(--dash-muted)">
              Documents
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Printable resources</h1>
            <p className="mt-1 text-sm text-(--dash-muted)">
              Download or print the forms shared by your coordinator.
            </p>
          </div>
          <Badge variant="secondary">{activeCount} Available</Badge>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="border-(--dash-border) bg-(--dash-card) shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">All documents</CardTitle>
            <CardDescription className="text-(--dash-muted)">
              Files uploaded by admins for your internship.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingDocuments && (
              <p className="text-xs text-(--dash-muted)">
                Loading documents...
              </p>
            )}
            {documentsError && !isLoadingDocuments && (
              <p className="text-xs text-red-600">{documentsError}</p>
            )}
            {!isLoadingDocuments &&
              !documentsError &&
              documents.length === 0 && (
                <p className="text-xs text-(--dash-muted)">
                  No documents yet. We&apos;ll add files here as soon as they
                  are available.
                </p>
              )}
            {!isLoadingDocuments &&
              !documentsError &&
              documents.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDocument(doc)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-xs transition ${
                    selectedDocument?.id === doc.id
                      ? "border-blue-200 bg-blue-50/60"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {doc.title}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        {doc.description || "No description provided."}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-400">
                        <span>{doc.file_name}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
          </CardContent>
        </Card>

        <Card className="border-(--dash-border) bg-(--dash-card) shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Document details</CardTitle>
            <CardDescription className="text-(--dash-muted)">
              Review before you print or download.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDocument ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedDocument.title}
                  </p>
                  <p className="mt-2 text-xs text-slate-600">
                    {selectedDocument.description ||
                      "No description provided."}
                  </p>
                  <div className="mt-3 text-[11px] text-slate-500">
                    <p>File: {selectedDocument.file_name}</p>
                    <p>Size: {formatFileSize(selectedDocument.file_size)}</p>
                    <p>Uploaded: {formatDate(selectedDocument.created_at)}</p>
                    {selectedDocument.uploaded_by?.name && (
                      <p>Uploaded by: {selectedDocument.uploaded_by.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="bg-(--dash-accent) text-white hover:bg-(--dash-accent-strong)"
                    onClick={() => handlePrint(selectedDocument)}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpen(selectedDocument)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open file
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-(--dash-muted)">
                Select a document to view details.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
