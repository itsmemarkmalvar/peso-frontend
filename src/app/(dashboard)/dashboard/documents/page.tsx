"use client";

import { useEffect, useState } from "react";
import { FileText, Trash2, UploadCloud, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteDocument,
  fetchDocumentBlob,
  getDocuments,
  uploadDocument,
  type DocumentRecord,
} from "@/lib/api/documents";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export default function DocumentsAdminPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let active = true;

    getDocuments()
      .then((data) => {
        if (!active) return;
        setDocuments(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load documents.");
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleUpload = async () => {
    setError(null);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Please enter a document title.");
      return;
    }
    if (!file) {
      setError("Please choose a document file to upload.");
      return;
    }

    const payload = new FormData();
    payload.append("title", trimmedTitle);
    if (description.trim()) {
      payload.append("description", description.trim());
    }
    payload.append("file", file);

    setIsUploading(true);
    try {
      const uploaded = await uploadDocument(payload);
      setDocuments((prev) => [uploaded, ...prev]);
      setTitle("");
      setDescription("");
      setFile(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload document."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: DocumentRecord) => {
    setError(null);
    try {
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove document."
      );
    }
  };

  const handleOpen = (doc: DocumentRecord) => {
    fetchDocumentBlob(doc.id)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const win = window.open(url, "_blank", "noopener,noreferrer");
        if (win) {
          win.focus();
        }
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      })
      .catch(() => {});
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
              Documents
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Admin uploads</h1>
            <p className="mt-1 text-sm text-[color:var(--dash-muted)]">
              Upload printable forms so interns can download and print them.
            </p>
          </div>
          <Badge variant="secondary">{documents.length} Total</Badge>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="border-[color:var(--dash-border)] bg-[color:var(--dash-card)] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Upload a document</CardTitle>
            <CardDescription className="text-[color:var(--dash-muted)]">
              PDFs are recommended for consistent printing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-title">Title</Label>
              <Input
                id="document-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Internship clearance form"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-description">Description (optional)</Label>
              <textarea
                id="document-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Short note for interns..."
                className="min-h-[96px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-file">File</Label>
              <Input
                id="document-file"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-[color:var(--dash-muted)]">
                Max 10MB. Allowed: PDF, Word, Excel, PNG, JPG.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)]"
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload document"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[color:var(--dash-border)] bg-[color:var(--dash-card)] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Uploaded documents</CardTitle>
            <CardDescription className="text-[color:var(--dash-muted)]">
              Manage files visible to interns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && (
              <p className="text-xs text-[color:var(--dash-muted)]">
                Loading documents...
              </p>
            )}
            {!isLoading && documents.length === 0 && (
              <p className="text-xs text-[color:var(--dash-muted)]">
                No documents uploaded yet.
              </p>
            )}
            {!isLoading &&
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 text-xs shadow-sm"
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
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpen(doc)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
