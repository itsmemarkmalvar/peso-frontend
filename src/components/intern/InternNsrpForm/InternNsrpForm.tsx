"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InternBackButton } from "@/components/intern/InternBackButton"
import {
  getMyNsrpForm,
  saveNsrpDraft,
  submitNsrpForm,
  type NsrpFormData,
  type NsrpFormPayload,
} from "@/lib/api/nsrp"

const STEPS = [
  "I. Personal Information",
  "II. Job Preference",
  "III. Language Proficiency",
  "IV. Educational Background",
  "V. Technical/Vocational and Other Training",
  "VI. Eligibility/Professional License",
  "VII. Work Experience",
  "VIII. Other Skills Acquired Without Certificate",
] as const

const OTHER_SKILLS = [
  "Auto Mechanic",
  "Beautician",
  "Carpentry Work",
  "Computer Literate",
  "Domestic Chores",
  "Driver",
  "Electrician",
  "Embroidery",
  "Gardening",
  "Masonry",
  "Painter/Artist",
  "Painting Jobs",
  "Photography",
  "Plumbing",
  "Sewing Dresses",
  "Stenography",
  "Tailoring",
]

function toPayload(form: NsrpFormData): NsrpFormPayload {
  return {
    personal_information: form.personal_information,
    job_preferences: form.job_preferences,
    language_proficiency: form.language_proficiency,
    educational_background: form.educational_background,
    technical_vocational_training: form.technical_vocational_training,
    eligibility_license: form.eligibility_license,
    work_experience: form.work_experience,
    other_skills: form.other_skills,
    certification: form.certification,
  }
}

function na(value: string): string {
  const t = value.trim()
  if (t.length === 0) return "N/A"
  // Treat user-typed n/a (any casing) as valid and normalize it.
  if (t.toLowerCase() === "n/a") return "N/A"
  return t
}

export function InternNsrpForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<NsrpFormData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    let active = true
    getMyNsrpForm()
      .then((data) => {
        if (!active) return
        const sanitizeNA = (value: string) => (value === "N/A" ? "" : value)
        const sanitizeEdu = (value?: string) => sanitizeNA(value ?? "")
        const sanitizeEduBasic = (row?: { school_attended?: string; year_graduated?: string; course?: string }) => ({
          // Backward compatible: older data used `course` for school attended.
          school_attended: sanitizeEdu(row?.school_attended ?? row?.course ?? ""),
          year_graduated: sanitizeEdu(row?.year_graduated ?? ""),
        })
        const sanitizeEduSenior = (row?: { strand?: string; school_attended?: string; year_graduated?: string; course?: string; level_reached?: string }) => ({
          // Backward compatible: older data used `course` for strand; and sometimes `level_reached` for school.
          strand: sanitizeEdu(row?.strand ?? row?.course ?? ""),
          school_attended: sanitizeEdu(row?.school_attended ?? row?.level_reached ?? ""),
          year_graduated: sanitizeEdu(row?.year_graduated ?? ""),
        })
        const sanitizeEduHigher = (row?: { course?: string; school_attended?: string; year_graduated?: string; level_reached?: string; year_last_attended?: string }) => ({
          course: sanitizeEdu(row?.course ?? ""),
          school_attended: sanitizeEdu(row?.school_attended ?? ""),
          year_graduated: sanitizeEdu(row?.year_graduated ?? ""),
          level_reached: sanitizeEdu(row?.level_reached ?? ""),
          year_last_attended: sanitizeEdu(row?.year_last_attended ?? ""),
        })
        const ensureMinRows = <T,>(rows: T[], min: number, makeRow: () => T) => {
          const next = [...rows]
          while (next.length < min) next.push(makeRow())
          return next
        }
        const sanitizeTVRow = (r: {
          course: string
          hours: number
          institution: string
          skills_acquired: string
          certificates_received: string
        }) => ({
          course: sanitizeNA(r.course),
          hours: r.hours ?? 0,
          institution: sanitizeNA(r.institution),
          skills_acquired: sanitizeNA(r.skills_acquired),
          certificates_received: sanitizeNA(r.certificates_received),
        })
        const sanitizeWeRow = (r: { company_name: string; address: string; position: string; months_worked: number; employment_status: string }) => ({
          company_name: sanitizeNA(r.company_name),
          address: sanitizeNA(r.address),
          position: sanitizeNA(r.position),
          months_worked: r.months_worked ?? 0,
          employment_status: sanitizeNA(r.employment_status),
        })
        const rawEligibility = (() => {
          const val = (data as unknown as { eligibility_license?: unknown }).eligibility_license
          if (Array.isArray(val)) return val as any[]
          if (val && typeof val === "object") return [val as any]
          return []
        })()
        setForm({
          ...data,
          personal_information: {
            ...data.personal_information,
            middle_name: sanitizeNA(data.personal_information.middle_name),
            suffix: sanitizeNA(data.personal_information.suffix),
            civil_status: sanitizeNA(data.personal_information.civil_status),
            religion: sanitizeNA(data.personal_information.religion),
            tin: sanitizeNA(data.personal_information.tin),
            height: sanitizeNA(data.personal_information.height),
            disability: sanitizeNA(data.personal_information.disability),
            address: {
              house_no: sanitizeNA(data.personal_information.address.house_no),
              barangay: sanitizeNA(data.personal_information.address.barangay),
              city: sanitizeNA(data.personal_information.address.city),
              province: sanitizeNA(data.personal_information.address.province),
            },
            employment_status: {
              ...data.personal_information.employment_status,
              employed_details: {
                ...data.personal_information.employment_status.employed_details,
                self_employed_other: sanitizeNA(data.personal_information.employment_status.employed_details.self_employed_other),
              },
              unemployed_details: {
                ...data.personal_information.employment_status.unemployed_details,
                months_looking: sanitizeNA(data.personal_information.employment_status.unemployed_details.months_looking),
                others_specify: sanitizeNA(data.personal_information.employment_status.unemployed_details.others_specify),
              },
            },
            ofw: {
              ...data.personal_information.ofw,
              country: sanitizeNA(data.personal_information.ofw.country),
              country_of_destination: sanitizeNA(data.personal_information.ofw.country_of_destination),
              latest_country_of_deployment: sanitizeNA(data.personal_information.ofw.latest_country_of_deployment),
              return_month_year: sanitizeNA(data.personal_information.ofw.return_month_year),
            },
            four_ps: {
              ...data.personal_information.four_ps,
              household_id: sanitizeNA(data.personal_information.four_ps.household_id),
            },
          },
          job_preferences: {
            ...data.job_preferences,
            preferred_occupations: data.job_preferences.preferred_occupations.map(sanitizeNA) as [
              string,
              string,
              string
            ],
            preferred_locations: data.job_preferences.preferred_locations.map(sanitizeNA) as [
              string,
              string,
              string
            ],
          },
          educational_background: {
            ...data.educational_background,
            elementary: sanitizeEduBasic(data.educational_background.elementary as any),
            secondary: sanitizeEduBasic(data.educational_background.secondary as any),
            secondary_k12: sanitizeEduBasic(data.educational_background.secondary_k12 as any),
            senior_high: sanitizeEduSenior(data.educational_background.senior_high as any),
            tertiary: sanitizeEduHigher(data.educational_background.tertiary as any),
            graduate: sanitizeEduHigher(data.educational_background.graduate as any),
          },
          technical_vocational_training: ensureMinRows(
            (data.technical_vocational_training ?? []).map(sanitizeTVRow),
            3,
            () => ({
              course: "",
              hours: 0,
              institution: "",
              skills_acquired: "",
              certificates_received: "",
            })
          ),
          eligibility_license: ensureMinRows(
            rawEligibility.map((r) => ({
              civil_service_eligibility: sanitizeNA(r.civil_service_eligibility ?? ""),
              civil_service_date_taken: sanitizeNA(r.civil_service_date_taken ?? ""),
              prc_license: sanitizeNA(r.prc_license ?? ""),
              prc_validity: sanitizeNA(r.prc_validity ?? ""),
            })),
            2,
            () => ({
              civil_service_eligibility: "",
              civil_service_date_taken: "",
              prc_license: "",
              prc_validity: "",
            })
          ),
          work_experience: ensureMinRows(
            (data.work_experience ?? []).map(sanitizeWeRow),
            3,
            () => ({
              company_name: "",
              address: "",
              position: "",
              months_worked: 0,
              employment_status: "",
            })
          ),
          other_skills: {
            ...data.other_skills,
            others: sanitizeNA(data.other_skills.others),
          },
        })
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load NSRP form.")
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!dirty || !form || form.is_completed) return
    const timer = window.setTimeout(() => {
      saveNsrpDraft(toPayload(form)).then((updated) => {
        setForm(updated)
        setDirty(false)
      }).catch(() => {})
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [dirty, form])

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step])

  const update = (updater: (prev: NsrpFormData) => NsrpFormData) => {
    setForm((prev) => (prev ? updater(prev) : prev))
    setDirty(true)
    setError(null)
    setSuccess(null)
  }

  const saveDraftNow = async () => {
    if (!form || isSaving) return
    setIsSaving(true)
    setError(null)
    try {
      const updated = await saveNsrpDraft(toPayload(form))
      setForm(updated)
      setDirty(false)
      setSuccess("NSRP draft saved.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft.")
    } finally {
      setIsSaving(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form || isSubmitting) return
    if (!form.certification.certify_true) {
      setError("You must certify that the information is true before submission.")
      return
    }
    const payload = toPayload({
      ...form,
      personal_information: {
        ...form.personal_information,
        middle_name: na(form.personal_information.middle_name),
        suffix: na(form.personal_information.suffix),
        civil_status: na(form.personal_information.civil_status),
        religion: na(form.personal_information.religion),
        tin: na(form.personal_information.tin),
        height: na(form.personal_information.height),
        disability: na(form.personal_information.disability),
        address: {
          ...form.personal_information.address,
          house_no: na(form.personal_information.address.house_no),
          barangay: na(form.personal_information.address.barangay),
          city: na(form.personal_information.address.city),
          province: na(form.personal_information.address.province),
        },
        employment_status: {
          ...form.personal_information.employment_status,
          employed_details: {
            ...form.personal_information.employment_status.employed_details,
            self_employed_other: na(form.personal_information.employment_status.employed_details.self_employed_other),
          },
          unemployed_details: {
            ...form.personal_information.employment_status.unemployed_details,
            months_looking:
              form.personal_information.employment_status.status === "unemployed"
                ? na(form.personal_information.employment_status.unemployed_details.months_looking)
                : "N/A",
            others_specify: na(form.personal_information.employment_status.unemployed_details.others_specify),
          },
        },
        ofw: {
          ...form.personal_information.ofw,
          country: na(form.personal_information.ofw.country),
          country_of_destination: na(form.personal_information.ofw.country_of_destination),
          latest_country_of_deployment: na(form.personal_information.ofw.latest_country_of_deployment),
          return_month_year: na(form.personal_information.ofw.return_month_year),
        },
        four_ps: {
          ...form.personal_information.four_ps,
          household_id: na(form.personal_information.four_ps.household_id),
        },
      },
      other_skills: {
        ...form.other_skills,
        others: na(form.other_skills.others),
      },
      language_proficiency: {
        ...form.language_proficiency,
        others_label: na(form.language_proficiency.others_label),
      },
      job_preferences: {
        ...form.job_preferences,
        preferred_occupations: form.job_preferences.preferred_occupations.map(na) as [string, string, string],
        preferred_locations: form.job_preferences.preferred_locations.map(na) as [string, string, string],
      },
      educational_background: {
        ...form.educational_background,
        elementary: {
          ...form.educational_background.elementary,
          school_attended: na(form.educational_background.elementary.school_attended),
          year_graduated: na(form.educational_background.elementary.year_graduated),
        },
        secondary: {
          ...form.educational_background.secondary,
          school_attended: na(form.educational_background.secondary.school_attended),
          year_graduated: na(form.educational_background.secondary.year_graduated),
        },
        // Keep Non-K12 and K-12 aligned (single input in UI).
        secondary_k12: {
          ...form.educational_background.secondary_k12,
          school_attended: na(form.educational_background.secondary.school_attended || form.educational_background.secondary_k12.school_attended),
          year_graduated: na(form.educational_background.secondary.year_graduated || form.educational_background.secondary_k12.year_graduated),
        },
        senior_high: {
          ...form.educational_background.senior_high,
          strand: na(form.educational_background.senior_high.strand),
          school_attended: na(form.educational_background.senior_high.school_attended),
          year_graduated: na(form.educational_background.senior_high.year_graduated),
        },
        tertiary: {
          ...form.educational_background.tertiary,
          course: na(form.educational_background.tertiary.course),
          school_attended: na(form.educational_background.tertiary.school_attended),
          year_graduated: na(form.educational_background.tertiary.year_graduated),
          level_reached: na(form.educational_background.tertiary.level_reached),
          year_last_attended: na(form.educational_background.tertiary.year_last_attended),
        },
        graduate: {
          ...form.educational_background.graduate,
          course: na(form.educational_background.graduate.course),
          school_attended: na(form.educational_background.graduate.school_attended),
          year_graduated: na(form.educational_background.graduate.year_graduated),
          level_reached: na(form.educational_background.graduate.level_reached),
          year_last_attended: na(form.educational_background.graduate.year_last_attended),
        },
      },
      technical_vocational_training: form.technical_vocational_training.map((row) => ({
        ...row,
        course: na(row.course),
        institution: na(row.institution),
        skills_acquired: na(row.skills_acquired),
        certificates_received: na(row.certificates_received),
        hours: Number.isFinite(row.hours) ? row.hours : 0,
      })),
      eligibility_license: form.eligibility_license.map((row) => ({
        ...row,
        civil_service_eligibility: na(row.civil_service_eligibility),
        civil_service_date_taken: na(row.civil_service_date_taken),
        prc_license: na(row.prc_license),
        prc_validity: na(row.prc_validity),
      })),
      work_experience: form.work_experience.map((row) => ({
        ...row,
        company_name: na(row.company_name),
        address: na(row.address),
        position: na(row.position),
        employment_status: na(row.employment_status),
        months_worked: Number.isFinite(row.months_worked) ? row.months_worked : 0,
      })),
    })
    setIsSubmitting(true)
    setError(null)
    try {
      await submitNsrpForm(payload)
      router.replace("/dashboard/intern")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit NSRP form.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div className="text-sm text-slate-600">Loading NSRP form...</div>
  if (!form) return <div className="text-sm text-red-600">Unable to load NSRP form.</div>

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <InternBackButton href="/dashboard/intern" label="Back to dashboard" />
      <Card className="border-(--dash-border) bg-(--dash-card) shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-(--dash-ink)">NSRP Form 1</CardTitle>
          <CardDescription className="text-(--dash-muted)">Required after onboarding.</CardDescription>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Step {step + 1} of {STEPS.length}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-(--dash-accent)" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={submit} className="space-y-6">
        {error ? <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
        {success ? <Alert><AlertTitle>Saved</AlertTitle><AlertDescription>{success}</AlertDescription></Alert> : null}

        <Card className="border-(--dash-border) bg-(--dash-card) shadow-sm">
          <CardHeader><CardTitle className="text-lg">{STEPS[step]}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-1"><Label>Surname *</Label><Input value={form.personal_information.surname} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, surname: e.target.value } }))} required /></div>
                  <div className="space-y-1"><Label>First Name *</Label><Input value={form.personal_information.first_name} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, first_name: e.target.value } }))} required /></div>
                  <div className="space-y-1"><Label>Middle Name</Label><Input value={form.personal_information.middle_name} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, middle_name: e.target.value } }))} /></div>
                  <div className="space-y-1"><Label>Suffix</Label><Input value={form.personal_information.suffix} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, suffix: e.target.value } }))} /></div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Date of Birth *</Label>
                      <Input type="date" value={form.personal_information.date_of_birth ?? ""} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, date_of_birth: e.target.value || null } }))} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Sex</Label>
                      <div className="flex flex-wrap gap-6 pt-1">
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.personal_information.sex === "male"}
                            onChange={(e) => {
                              if (!e.target.checked) return
                              update((p) => ({ ...p, personal_information: { ...p.personal_information, sex: "male" } }))
                            }}
                          />
                          <span>Male</span>
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.personal_information.sex === "female"}
                            onChange={(e) => {
                              if (!e.target.checked) return
                              update((p) => ({ ...p, personal_information: { ...p.personal_information, sex: "female" } }))
                            }}
                          />
                          <span>Female</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Religion</Label>
                      <Input value={form.personal_information.religion} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, religion: e.target.value } }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Civil Status *</Label>
                      <div className="grid gap-2 sm:grid-cols-3 pt-1">
                        {(["Single", "Married", "Widowed"] as const).map((status) => (
                          <label key={status} className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={form.personal_information.civil_status.toLowerCase() === status.toLowerCase()}
                              onChange={(e) => {
                                if (!e.target.checked) return
                                update((p) => ({ ...p, personal_information: { ...p.personal_information, civil_status: status } }))
                              }}
                            />
                            <span>{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
                    <Label>Present Address *</Label>
                    <div className="grid gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">House No. / Street / Village</Label>
                        <Input value={form.personal_information.address.house_no} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, address: { ...p.personal_information.address, house_no: e.target.value } } }))} required />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Barangay</Label>
                          <Input value={form.personal_information.address.barangay} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, address: { ...p.personal_information.address, barangay: e.target.value } } }))} required />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Municipality/City</Label>
                          <Input value={form.personal_information.address.city} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, address: { ...p.personal_information.address, city: e.target.value } } }))} required />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Province</Label>
                        <Input value={form.personal_information.address.province} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, address: { ...p.personal_information.address, province: e.target.value } } }))} required />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-1"><Label>TIN</Label><Input value={form.personal_information.tin} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, tin: e.target.value } }))} /></div>
                  <div className="space-y-1"><Label>Height</Label><Input value={form.personal_information.height} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, height: e.target.value } }))} /></div>
                  <div className="space-y-1">
                    <Label>Disability</Label>
                    <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-2 sm:grid-cols-3">
                      {(["Visual", "Hearing", "Speech", "Physical", "Mental"] as const).map((opt) => {
                        const raw = form.personal_information.disability === "N/A" ? "" : form.personal_information.disability
                        const tokens = raw.split(",").map((t) => t.trim()).filter(Boolean)
                        const other = tokens.find((t) => t.toLowerCase().startsWith("others:"))
                        const selected = new Set(tokens.filter((t) => !t.toLowerCase().startsWith("others:")))
                        return (
                          <label key={opt} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selected.has(opt)}
                              onChange={(e) => {
                                const next = new Set(selected)
                                if (e.target.checked) next.add(opt)
                                else next.delete(opt)
                                const out = Array.from(next)
                                if (other) out.push(other)
                                update((p) => ({ ...p, personal_information: { ...p.personal_information, disability: out.join(", ") } }))
                              }}
                            />
                            <span>{opt}</span>
                          </label>
                        )
                      })}
                      {(() => {
                        const raw = form.personal_information.disability === "N/A" ? "" : form.personal_information.disability
                        const tokens = raw.split(",").map((t) => t.trim()).filter(Boolean)
                        const hasOthers = tokens.some((t) => t.toLowerCase().startsWith("others:"))
                        return (
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={hasOthers}
                              onChange={(e) => {
                                const keep = tokens.filter((t) => !t.toLowerCase().startsWith("others:"))
                                const out = e.target.checked ? [...keep, "Others:"] : keep
                                update((p) => ({ ...p, personal_information: { ...p.personal_information, disability: out.join(", ") } }))
                              }}
                            />
                            <span>Others</span>
                          </label>
                        )
                      })()}
                    </div>
                    {(() => {
                      const raw = form.personal_information.disability === "N/A" ? "" : form.personal_information.disability
                      const tokens = raw.split(",").map((t) => t.trim()).filter(Boolean)
                      const otherToken = tokens.find((t) => t.toLowerCase().startsWith("others:"))
                      if (!otherToken) return null
                      const otherText = otherToken.slice("others:".length).trim()
                      return (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-sm">
                          <span>Others (Please specify):</span>
                          <Input
                            className="h-8 max-w-[320px]"
                            value={otherText}
                            onChange={(e) => {
                              const keep = tokens.filter((t) => !t.toLowerCase().startsWith("others:"))
                              const out = [...keep, `Others: ${e.target.value}`]
                              update((p) => ({ ...p, personal_information: { ...p.personal_information, disability: out.join(", ") } }))
                            }}
                          />
                        </div>
                      )
                    })()}
                  </div>
                  <div className="space-y-1"><Label>Contact Number *</Label><Input value={form.personal_information.contact_number} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, contact_number: e.target.value } }))} required /></div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1"><Label>Email *</Label><Input type="email" value={form.personal_information.email} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, email: e.target.value } }))} required /></div>
                  <div className="space-y-1">
                    <Label>Employment Status</Label>
                    <div className="flex flex-wrap gap-6 pt-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.personal_information.employment_status.status === "employed"}
                          onChange={(e) => {
                            if (!e.target.checked) return
                            update((p) => ({
                              ...p,
                              personal_information: {
                                ...p.personal_information,
                                employment_status: {
                                  ...p.personal_information.employment_status,
                                  status: "employed",
                                },
                              },
                            }))
                          }}
                        />
                        <span>Employed</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.personal_information.employment_status.status === "unemployed"}
                          onChange={(e) => {
                            if (!e.target.checked) return
                            update((p) => ({
                              ...p,
                              personal_information: {
                                ...p.personal_information,
                                employment_status: {
                                  ...p.personal_information.employment_status,
                                  status: "unemployed",
                                },
                              },
                            }))
                          }}
                        />
                        <span>Unemployed</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="rounded-md border border-slate-200 p-3 space-y-3">
                  <p className="text-sm font-semibold">Employment Status</p>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={form.personal_information.employment_status.status === "employed"}
                      onChange={(e) => {
                        if (!e.target.checked) return
                        update((p) => ({
                          ...p,
                          personal_information: {
                            ...p.personal_information,
                            employment_status: {
                              ...p.personal_information.employment_status,
                              status: "employed",
                            },
                          },
                        }))
                      }}
                    />
                    <span>Employed</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.personal_information.employment_status.employed_details.wage_employed}
                      onChange={(e) => update((p) => ({
                        ...p,
                        personal_information: {
                          ...p.personal_information,
                          employment_status: {
                            ...p.personal_information.employment_status,
                            employed_details: {
                              ...p.personal_information.employment_status.employed_details,
                              wage_employed: e.target.checked,
                            },
                          },
                        },
                      }))}
                    />
                    <span>Wage employed</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.personal_information.employment_status.employed_details.self_employed}
                      onChange={(e) => update((p) => ({
                        ...p,
                        personal_information: {
                          ...p.personal_information,
                          employment_status: {
                            ...p.personal_information.employment_status,
                            employed_details: {
                              ...p.personal_information.employment_status.employed_details,
                              self_employed: e.target.checked,
                            },
                          },
                        },
                      }))}
                    />
                    <span>Self-employed</span>
                  </label>
                  <div className="ml-4 grid gap-2 md:grid-cols-2">
                    {[
                      "Fisherman/Fisherfolk",
                      "Vendor/Retailer",
                      "Home-based worker",
                      "Transport",
                      "Domestic Worker",
                      "Freelancer",
                      "Artisan/Craft Worker",
                    ].map((category) => (
                      <label key={category} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.personal_information.employment_status.employed_details.self_employed_categories.includes(category)}
                          onChange={() => update((p) => ({
                            ...p,
                            personal_information: {
                              ...p.personal_information,
                              employment_status: {
                                ...p.personal_information.employment_status,
                                employed_details: {
                                  ...p.personal_information.employment_status.employed_details,
                                  self_employed_categories: p.personal_information.employment_status.employed_details.self_employed_categories.includes(category)
                                    ? p.personal_information.employment_status.employed_details.self_employed_categories.filter((c) => c !== category)
                                    : [...p.personal_information.employment_status.employed_details.self_employed_categories, category],
                                },
                              },
                            },
                          }))}
                        />
                        <span>{category}</span>
                      </label>
                    ))}
                    <div className="space-y-1 md:col-span-2">
                      <Label>Others (Please Specify)</Label>
                      <Input
                        placeholder="Self-employed: Others, please specify"
                        value={form.personal_information.employment_status.employed_details.self_employed_other}
                        onChange={(e) => update((p) => ({
                          ...p,
                          personal_information: {
                            ...p.personal_information,
                            employment_status: {
                              ...p.personal_information.employment_status,
                              employed_details: {
                                ...p.personal_information.employment_status.employed_details,
                                self_employed_other: e.target.value,
                              },
                            },
                          },
                        }))}
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={form.personal_information.employment_status.status === "unemployed"}
                      onChange={(e) => {
                        if (!e.target.checked) return
                        update((p) => ({
                          ...p,
                          personal_information: {
                            ...p.personal_information,
                            employment_status: {
                              ...p.personal_information.employment_status,
                              status: "unemployed",
                            },
                          },
                        }))
                      }}
                    />
                    <span>Unemployed</span>
                  </label>
                  {form.personal_information.employment_status.status === "unemployed" ? (
                    <div className="ml-6 space-y-1">
                      <Label>How long have you been looking for work? (months)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        placeholder="0"
                        value={form.personal_information.employment_status.unemployed_details.months_looking}
                        onChange={(e) => update((p) => ({
                          ...p,
                          personal_information: {
                            ...p.personal_information,
                            employment_status: {
                              ...p.personal_information.employment_status,
                              unemployed_details: {
                                ...p.personal_information.employment_status.unemployed_details,
                                months_looking: e.target.value,
                              },
                            },
                          },
                        }))}
                      />
                    </div>
                  ) : null}
                  <div className="grid gap-2 md:grid-cols-2">
                    {[
                      "New Entrant/Fresh Graduate",
                      "Finished Contract",
                      "Resigned",
                      "Retired",
                      "Terminated/Laid off due to calamity",
                      "Terminated/Laid off (local)",
                      "Terminated/Laid off (abroad)",
                    ].map((reason) => (
                      <label key={reason} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.personal_information.employment_status.unemployed_details.reasons.includes(reason)}
                          onChange={() => update((p) => ({
                            ...p,
                            personal_information: {
                              ...p.personal_information,
                              employment_status: {
                                ...p.personal_information.employment_status,
                                unemployed_details: {
                                  ...p.personal_information.employment_status.unemployed_details,
                                  reasons: p.personal_information.employment_status.unemployed_details.reasons.includes(reason)
                                    ? p.personal_information.employment_status.unemployed_details.reasons.filter((r) => r !== reason)
                                    : [...p.personal_information.employment_status.unemployed_details.reasons, reason],
                                },
                              },
                            },
                          }))}
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <Label>Others, please specify:</Label>
                    <Input
                      value={form.personal_information.employment_status.unemployed_details.others_specify}
                      onChange={(e) =>
                        update((p) => ({
                          ...p,
                          personal_information: {
                            ...p.personal_information,
                            employment_status: {
                              ...p.personal_information.employment_status,
                              unemployed_details: {
                                ...p.personal_information.employment_status.unemployed_details,
                                others_specify: e.target.value,
                              },
                            },
                          },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="rounded-md border border-slate-200 p-3 space-y-3">
                  <p className="text-sm font-semibold">OFW / 4Ps</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Are you an OFW?</Label>
                      <div className="flex gap-2">
                        <Button type="button" variant={form.personal_information.ofw.is_ofw ? "default" : "outline"} onClick={() => update((p) => ({ ...p, personal_information: { ...p.personal_information, ofw: { ...p.personal_information.ofw, is_ofw: true } } }))}>Yes</Button>
                        <Button type="button" variant={!form.personal_information.ofw.is_ofw ? "default" : "outline"} onClick={() => update((p) => ({ ...p, personal_information: { ...p.personal_information, ofw: { ...p.personal_information.ofw, is_ofw: false } } }))}>No</Button>
                      </div>
                      <div className="space-y-1">
                        <Label>Specify country</Label>
                        <Input
                          placeholder="Specify country"
                          value={form.personal_information.ofw.country}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              personal_information: {
                                ...p.personal_information,
                                ofw: {
                                  ...p.personal_information.ofw,
                                  country: e.target.value,
                                  country_of_destination: e.target.value,
                                },
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Are you a former OFW?</Label>
                      <div className="flex gap-2">
                        <Button type="button" variant={form.personal_information.ofw.former_ofw ? "default" : "outline"} onClick={() => update((p) => ({ ...p, personal_information: { ...p.personal_information, ofw: { ...p.personal_information.ofw, former_ofw: true } } }))}>Yes</Button>
                        <Button type="button" variant={!form.personal_information.ofw.former_ofw ? "default" : "outline"} onClick={() => update((p) => ({ ...p, personal_information: { ...p.personal_information, ofw: { ...p.personal_information.ofw, former_ofw: false } } }))}>No</Button>
                      </div>
                      <div className="space-y-1">
                        <Label>Latest country of deployment</Label>
                        <Input placeholder="Latest country of deployment" value={form.personal_information.ofw.latest_country_of_deployment} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, ofw: { ...p.personal_information.ofw, latest_country_of_deployment: e.target.value } } }))} />
                      </div>
                      <div className="space-y-1">
                        <Label>Month and year of return to Philippines</Label>
                        <Input placeholder="Month and year of return to Philippines" value={form.personal_information.ofw.return_month_year} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, ofw: { ...p.personal_information.ofw, return_month_year: e.target.value } } }))} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Are you a 4Ps beneficiary?</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant={form.personal_information.four_ps.is_beneficiary ? "default" : "outline"} onClick={() => update((p) => ({ ...p, personal_information: { ...p.personal_information, four_ps: { ...p.personal_information.four_ps, is_beneficiary: true } } }))}>Yes</Button>
                      <Button type="button" variant={!form.personal_information.four_ps.is_beneficiary ? "default" : "outline"} onClick={() => update((p) => ({ ...p, personal_information: { ...p.personal_information, four_ps: { ...p.personal_information.four_ps, is_beneficiary: false } } }))}>No</Button>
                    </div>
                    <div className="space-y-1">
                      <Label>If yes, please provide Household ID No.</Label>
                      <Input placeholder="Household ID No." value={form.personal_information.four_ps.household_id} onChange={(e) => update((p) => ({ ...p, personal_information: { ...p.personal_information, four_ps: { ...p.personal_information.four_ps, household_id: e.target.value } } }))} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="overflow-auto rounded-md border border-slate-200 bg-white">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th colSpan={2} className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Preferred Occupation
                        </th>
                        <th colSpan={2} className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Preferred Work Location
                        </th>
                      </tr>
                      <tr className="bg-slate-50 border-t border-slate-200">
                        <th colSpan={2} className="p-2 text-left align-top">
                          <div className="flex flex-wrap gap-6">
                            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                              <input
                                type="checkbox"
                                checked={form.job_preferences.work_type.includes("part-time")}
                                onChange={() =>
                                  update((p) => ({
                                    ...p,
                                    job_preferences: {
                                      ...p.job_preferences,
                                      work_type: p.job_preferences.work_type.includes("part-time")
                                        ? p.job_preferences.work_type.filter((v) => v !== "part-time")
                                        : [...p.job_preferences.work_type, "part-time"],
                                    },
                                  }))
                                }
                              />
                              <span>Part-time</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                              <input
                                type="checkbox"
                                checked={form.job_preferences.work_type.includes("full-time")}
                                onChange={() =>
                                  update((p) => ({
                                    ...p,
                                    job_preferences: {
                                      ...p.job_preferences,
                                      work_type: p.job_preferences.work_type.includes("full-time")
                                        ? p.job_preferences.work_type.filter((v) => v !== "full-time")
                                        : [...p.job_preferences.work_type, "full-time"],
                                    },
                                  }))
                                }
                              />
                              <span>Full-time</span>
                            </label>
                          </div>
                        </th>
                        <th colSpan={2} className="p-2 text-left align-top">
                          <div className="flex flex-wrap gap-6">
                            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                              <input
                                type="checkbox"
                                checked={form.job_preferences.work_type.includes("local")}
                                onChange={() =>
                                  update((p) => ({
                                    ...p,
                                    job_preferences: {
                                      ...p.job_preferences,
                                      work_type: p.job_preferences.work_type.includes("local")
                                        ? p.job_preferences.work_type.filter((v) => v !== "local")
                                        : [...p.job_preferences.work_type, "local"],
                                    },
                                  }))
                                }
                              />
                              <span>Local (specify cities/municipalities)</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                              <input
                                type="checkbox"
                                checked={form.job_preferences.work_type.includes("overseas")}
                                onChange={() =>
                                  update((p) => ({
                                    ...p,
                                    job_preferences: {
                                      ...p.job_preferences,
                                      work_type: p.job_preferences.work_type.includes("overseas")
                                        ? p.job_preferences.work_type.filter((v) => v !== "overseas")
                                        : [...p.job_preferences.work_type, "overseas"],
                                    },
                                  }))
                                }
                              />
                              <span>Overseas (specify countries)</span>
                            </label>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {([0, 1, 2] as const).map((i) => (
                        <tr key={`jobpref-${i}`} className="border-t border-slate-200">
                          <td className="w-10 p-2 text-slate-600">{i + 1}.</td>
                          <td className="p-2">
                            <Input
                              value={form.job_preferences.preferred_occupations[i]}
                              onChange={(e) =>
                                update((p) => {
                                  const next = [...p.job_preferences.preferred_occupations] as [string, string, string]
                                  next[i] = e.target.value
                                  return {
                                    ...p,
                                    job_preferences: {
                                      ...p.job_preferences,
                                      preferred_occupations: next,
                                    },
                                  }
                                })
                              }
                            />
                          </td>
                          <td className="w-10 p-2 text-slate-600">{i + 1}.</td>
                          <td className="p-2">
                            <Input
                              value={form.job_preferences.preferred_locations[i]}
                              onChange={(e) =>
                                update((p) => {
                                  const next = [...p.job_preferences.preferred_locations] as [string, string, string]
                                  next[i] = e.target.value
                                  return {
                                    ...p,
                                    job_preferences: {
                                      ...p.job_preferences,
                                      preferred_locations: next,
                                    },
                                  }
                                })
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="overflow-auto rounded-md border border-slate-200">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50"><th className="p-2 text-left">Language</th><th>Read</th><th>Write</th><th>Speak</th><th>Understand</th></tr></thead>
                    <tbody>
                      {(["english", "filipino", "mandarin", "others"] as const).map((lang) => (
                        <tr key={lang} className="border-t border-slate-200">
                          <td className="p-2 capitalize">
                            {lang === "others" ? (
                              <div className="flex items-center gap-2">
                                <span>Others</span>
                                <Input
                                  className="h-8 max-w-[220px]"
                                  placeholder="Specify"
                                  value={form.language_proficiency.others_label}
                                  onChange={(e) =>
                                    update((p) => ({
                                      ...p,
                                      language_proficiency: {
                                        ...p.language_proficiency,
                                        others_label: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                            ) : (
                              lang
                            )}
                          </td>
                          {(["read", "write", "speak", "understand"] as const).map((skill) => (
                            <td key={`${lang}-${skill}`} className="text-center">
                              <input type="checkbox" checked={form.language_proficiency.languages[lang][skill]} onChange={(e) => update((p) => ({ ...p, language_proficiency: { ...p.language_proficiency, languages: { ...p.language_proficiency.languages, [lang]: { ...p.language_proficiency.languages[lang], [skill]: e.target.checked } } } }))} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-md border border-slate-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-800">Currently in school?</p>
                  <div className="mt-2 flex flex-wrap gap-6">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.educational_background.currently_in_school === true}
                        onChange={(e) => {
                          if (!e.target.checked) return
                          update((p) => ({
                            ...p,
                            educational_background: {
                              ...p.educational_background,
                              currently_in_school: true,
                            },
                          }))
                        }}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.educational_background.currently_in_school === false}
                        onChange={(e) => {
                          if (!e.target.checked) return
                          update((p) => ({
                            ...p,
                            educational_background: {
                              ...p.educational_background,
                              currently_in_school: false,
                            },
                          }))
                        }}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-800">Elementary Education</p>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label>School Attended</Label>
                        <Input
                          value={form.educational_background.elementary.school_attended}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                elementary: { ...p.educational_background.elementary, school_attended: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Year Graduated</Label>
                        <Input
                          placeholder="YYYY"
                          value={form.educational_background.elementary.year_graduated}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                elementary: { ...p.educational_background.elementary, year_graduated: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-800">Secondary Education (High School)</p>
                    <p className="mt-1 text-xs text-slate-500">(Applies to both Non-K12 and K-12)</p>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label>School Attended</Label>
                        <Input
                          value={form.educational_background.secondary.school_attended}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                secondary: { ...p.educational_background.secondary, school_attended: e.target.value },
                                secondary_k12: { ...p.educational_background.secondary_k12, school_attended: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Year Graduated</Label>
                        <Input
                          placeholder="YYYY"
                          value={form.educational_background.secondary.year_graduated}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                secondary: { ...p.educational_background.secondary, year_graduated: e.target.value },
                                secondary_k12: { ...p.educational_background.secondary_k12, year_graduated: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-800">Senior High School</p>
                    <div className="mt-2 grid gap-3 md:grid-cols-3">
                      <div className="space-y-1 md:col-span-1">
                        <Label>Strand</Label>
                        <Input
                          value={form.educational_background.senior_high.strand}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                senior_high: { ...p.educational_background.senior_high, strand: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1 md:col-span-1">
                        <Label>School Attended</Label>
                        <Input
                          value={form.educational_background.senior_high.school_attended}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                senior_high: { ...p.educational_background.senior_high, school_attended: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1 md:col-span-1">
                        <Label>Year Graduated</Label>
                        <Input
                          placeholder="YYYY"
                          value={form.educational_background.senior_high.year_graduated}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                senior_high: { ...p.educational_background.senior_high, year_graduated: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-800">Tertiary Education</p>
                    <p className="mt-1 text-xs text-slate-500">
                      If graduated, fill Year Graduated. If not graduated, fill Level Reached and Year Last Attended.
                    </p>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Course/Degree</Label>
                        <Input
                          value={form.educational_background.tertiary.course}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                tertiary: { ...p.educational_background.tertiary, course: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>School Attended</Label>
                        <Input
                          value={form.educational_background.tertiary.school_attended}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                tertiary: { ...p.educational_background.tertiary, school_attended: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Year Graduated</Label>
                        <Input
                          placeholder="YYYY (if applicable)"
                          value={form.educational_background.tertiary.year_graduated}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                tertiary: { ...p.educational_background.tertiary, year_graduated: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Level Reached</Label>
                        <Input
                          placeholder="(if not graduated)"
                          value={form.educational_background.tertiary.level_reached}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                tertiary: { ...p.educational_background.tertiary, level_reached: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label>Year Last Attended</Label>
                        <Input
                          placeholder="(if not graduated)"
                          value={form.educational_background.tertiary.year_last_attended}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                tertiary: { ...p.educational_background.tertiary, year_last_attended: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-800">Graduate Studies / Post-Graduate</p>
                    <p className="mt-1 text-xs text-slate-500">
                      If graduated, fill Year Graduated. If not graduated, fill Level Reached and Year Last Attended.
                    </p>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Course/Degree</Label>
                        <Input
                          value={form.educational_background.graduate.course}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                graduate: { ...p.educational_background.graduate, course: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>School Attended</Label>
                        <Input
                          value={form.educational_background.graduate.school_attended}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                graduate: { ...p.educational_background.graduate, school_attended: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Year Graduated</Label>
                        <Input
                          placeholder="YYYY (if applicable)"
                          value={form.educational_background.graduate.year_graduated}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                graduate: { ...p.educational_background.graduate, year_graduated: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Level Reached</Label>
                        <Input
                          placeholder="(if not graduated)"
                          value={form.educational_background.graduate.level_reached}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                graduate: { ...p.educational_background.graduate, level_reached: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label>Year Last Attended</Label>
                        <Input
                          placeholder="(if not graduated)"
                          value={form.educational_background.graduate.year_last_attended}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              educational_background: {
                                ...p.educational_background,
                                graduate: { ...p.educational_background.graduate, year_last_attended: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Include courses taken as part of college education.
                </p>
                <div className="overflow-auto rounded-md border border-slate-200 bg-white">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700" style={{ width: 44 }} />
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Training/Vocational Course
                        </th>
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700" style={{ width: 140 }}>
                          Hours of Training
                        </th>
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Training Institution
                        </th>
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Skills Acquired
                        </th>
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Certificates Received
                          <span className="ml-1 font-normal normal-case text-slate-500">(NC I, NC II, NC III, NC IV, etc.)</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.technical_vocational_training.map((row, index) => (
                        <tr key={`tv-${index}`} className="align-top">
                          <td className="border border-slate-200 p-2 text-center text-xs font-semibold text-slate-600">{index + 1}.</td>
                          <td className="border border-slate-200 p-2">
                            <Input
                              placeholder=""
                              value={row.course}
                              onChange={(e) =>
                                update((p) => {
                                  const n = [...p.technical_vocational_training]
                                  n[index] = { ...n[index], course: e.target.value }
                                  return { ...p, technical_vocational_training: n }
                                })
                              }
                            />
                          </td>
                          <td className="border border-slate-200 p-2">
                            <Input
                              placeholder=""
                              type="number"
                              min={0}
                              value={row.hours}
                              onChange={(e) =>
                                update((p) => {
                                  const n = [...p.technical_vocational_training]
                                  n[index] = { ...n[index], hours: Number(e.target.value || 0) }
                                  return { ...p, technical_vocational_training: n }
                                })
                              }
                            />
                          </td>
                          <td className="border border-slate-200 p-2">
                            <Input
                              placeholder=""
                              value={row.institution}
                              onChange={(e) =>
                                update((p) => {
                                  const n = [...p.technical_vocational_training]
                                  n[index] = { ...n[index], institution: e.target.value }
                                  return { ...p, technical_vocational_training: n }
                                })
                              }
                            />
                          </td>
                          <td className="border border-slate-200 p-2">
                            <Input
                              placeholder=""
                              value={row.skills_acquired}
                              onChange={(e) =>
                                update((p) => {
                                  const n = [...p.technical_vocational_training]
                                  n[index] = { ...n[index], skills_acquired: e.target.value }
                                  return { ...p, technical_vocational_training: n }
                                })
                              }
                            />
                          </td>
                          <td className="border border-slate-200 p-2">
                            <Input
                              placeholder=""
                              value={row.certificates_received}
                              onChange={(e) =>
                                update((p) => {
                                  const n = [...p.technical_vocational_training]
                                  n[index] = { ...n[index], certificates_received: e.target.value }
                                  return { ...p, technical_vocational_training: n }
                                })
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    update((p) => ({
                      ...p,
                      technical_vocational_training: [
                        ...p.technical_vocational_training,
                        { course: "", hours: 0, institution: "", skills_acquired: "", certificates_received: "" },
                      ],
                    }))
                  }
                >
                  Add Training Entry
                </Button>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-3">
                <div className="overflow-auto rounded-md border border-slate-200 bg-white">
                  <table className="w-full min-w-[920px] text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700" style={{ width: 44 }} />
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Eligibility (Civil Service)
                        </th>
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700" style={{ width: 160 }}>
                          Date Taken
                        </th>
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700" style={{ width: 44 }} />
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Professional License (PRC)
                        </th>
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700" style={{ width: 160 }}>
                          Valid Until
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.eligibility_license.map((row, index) => (
                        <tr key={`el-${index}`} className="align-top">
                          <td className="border border-slate-200 p-2 text-center text-xs font-semibold text-slate-600">{index + 1}.</td>
                          <td className="border border-slate-200 p-2">
                            <Input
                              placeholder=""
                              value={row.civil_service_eligibility}
                              onChange={(e) =>
                                update((p) => {
                                  const next = [...p.eligibility_license]
                                  next[index] = { ...next[index], civil_service_eligibility: e.target.value }
                                  return { ...p, eligibility_license: next }
                                })
                              }
                            />
                          </td>
                          <td className="border border-slate-200 p-2">
                            <Input
                              placeholder=""
                              value={row.civil_service_date_taken}
                              onChange={(e) =>
                                update((p) => {
                                  const next = [...p.eligibility_license]
                                  next[index] = { ...next[index], civil_service_date_taken: e.target.value }
                                  return { ...p, eligibility_license: next }
                                })
                              }
                            />
                          </td>
                          <td className="border border-slate-200 p-2 text-center text-xs font-semibold text-slate-600">{index + 1}.</td>
                          <td className="border border-slate-200 p-2">
                            <Input
                              placeholder=""
                              value={row.prc_license}
                              onChange={(e) =>
                                update((p) => {
                                  const next = [...p.eligibility_license]
                                  next[index] = { ...next[index], prc_license: e.target.value }
                                  return { ...p, eligibility_license: next }
                                })
                              }
                            />
                          </td>
                          <td className="border border-slate-200 p-2">
                            <Input
                              placeholder=""
                              value={row.prc_validity}
                              onChange={(e) =>
                                update((p) => {
                                  const next = [...p.eligibility_license]
                                  next[index] = { ...next[index], prc_validity: e.target.value }
                                  return { ...p, eligibility_license: next }
                                })
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    update((p) => ({
                      ...p,
                      eligibility_license: [
                        ...p.eligibility_license,
                        { civil_service_eligibility: "", civil_service_date_taken: "", prc_license: "", prc_validity: "" },
                      ],
                    }))
                  }
                >
                  Add Row
                </Button>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">Limit to 10 year period, start with the most recent employment.</p>
                <div className="overflow-auto rounded-md border border-slate-200 bg-white">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">Company Name</th>
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
                          Address <span className="ml-1 font-normal normal-case text-slate-500">(City/Municipality)</span>
                        </th>
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">Position</th>
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700" style={{ width: 170 }}>
                          Number of Months
                        </th>
                        <th className="border border-slate-200 p-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700" style={{ width: 240 }}>
                          Status
                          <span className="ml-1 font-normal normal-case text-slate-500">(Permanent, Contractual, Part-time, Probationary)</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.work_experience.map((row, index) => (
                        <tr key={`we-${index}`} className="align-top">
                          <td className="border border-slate-200 p-2">
                            <Input
                              placeholder=""
                              value={row.company_name}
                              onChange={(e) =>
                                update((p) => {
                                  const n = [...p.work_experience]
                                  n[index] = { ...n[index], company_name: e.target.value }
                                  return { ...p, work_experience: n }
                                })
                              }
                            />
                          </td>
                          <td className="border border-slate-200 p-2">
                            <Input
                              placeholder=""
                              value={row.address}
                              onChange={(e) =>
                                update((p) => {
                                  const n = [...p.work_experience]
                                  n[index] = { ...n[index], address: e.target.value }
                                  return { ...p, work_experience: n }
                                })
                              }
                            />
                          </td>
                          <td className="border border-slate-200 p-2">
                            <Input
                              placeholder=""
                              value={row.position}
                              onChange={(e) =>
                                update((p) => {
                                  const n = [...p.work_experience]
                                  n[index] = { ...n[index], position: e.target.value }
                                  return { ...p, work_experience: n }
                                })
                              }
                            />
                          </td>
                          <td className="border border-slate-200 p-2">
                            <Input
                              placeholder=""
                              type="number"
                              min={0}
                              value={row.months_worked}
                              onChange={(e) =>
                                update((p) => {
                                  const n = [...p.work_experience]
                                  n[index] = { ...n[index], months_worked: Number(e.target.value || 0) }
                                  return { ...p, work_experience: n }
                                })
                              }
                            />
                          </td>
                          <td className="border border-slate-200 p-2">
                            <Input
                              placeholder=""
                              value={row.employment_status}
                              onChange={(e) =>
                                update((p) => {
                                  const n = [...p.work_experience]
                                  n[index] = { ...n[index], employment_status: e.target.value }
                                  return { ...p, work_experience: n }
                                })
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    update((p) => ({
                      ...p,
                      work_experience: [
                        ...p.work_experience,
                        { company_name: "", address: "", position: "", months_worked: 0, employment_status: "" },
                      ],
                    }))
                  }
                >
                  Add Work Experience
                </Button>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-3">
                <div className="rounded-md border border-slate-200 bg-white p-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {OTHER_SKILLS.map((skill) => (
                      <label key={skill} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.other_skills.selected_skills.includes(skill)}
                          onChange={(e) =>
                            update((p) => ({
                              ...p,
                              other_skills: {
                                ...p.other_skills,
                                selected_skills: e.target.checked
                                  ? [...p.other_skills.selected_skills, skill]
                                  : p.other_skills.selected_skills.filter((s) => s !== skill),
                              },
                            }))
                          }
                        />
                        <span className="uppercase">{skill}</span>
                      </label>
                    ))}
                    <div className="sm:col-span-3 flex flex-wrap items-center gap-2 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.other_skills.others.trim().length > 0 && form.other_skills.others !== "N/A"}
                          onChange={(e) => {
                            if (e.target.checked) return
                            update((p) => ({ ...p, other_skills: { ...p.other_skills, others: "" } }))
                          }}
                        />
                        <span className="uppercase">Others:</span>
                      </label>
                      <Input
                        className="h-8 max-w-[420px]"
                        placeholder="Specify"
                        value={form.other_skills.others}
                        onChange={(e) => update((p) => ({ ...p, other_skills: { ...p.other_skills, others: e.target.value } }))}
                      />
                    </div>
                  </div>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={form.certification.certify_true} onChange={(e) => update((p) => ({ ...p, certification: { ...p.certification, certify_true: e.target.checked } }))} />
                  <span>I certify that the information is true.</span>
                </label>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input placeholder="Typed Name / Signature" value={form.certification.typed_name} onChange={(e) => update((p) => ({ ...p, certification: { ...p.certification, typed_name: e.target.value } }))} />
                  <Input type="date" value={form.certification.date} onChange={(e) => update((p) => ({ ...p, certification: { ...p.certification, date: e.target.value } }))} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">{dirty ? "Unsaved changes" : "All changes saved"}</div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={saveDraftNow} disabled={isSaving || isSubmitting}>{isSaving ? "Saving..." : "Save Draft"}</Button>
            <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || isSubmitting}>Previous</Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} disabled={isSubmitting}>Next</Button>
            ) : (
              <Button type="submit" disabled={isSubmitting || !form.certification.certify_true}>{isSubmitting ? "Submitting..." : "Submit NSRP Form"}</Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
