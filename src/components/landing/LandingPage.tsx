"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

import pesoLogo from "@/assets/images/image-Photoroom.png";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { Reveal } from "@/components/landing/Reveal";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.06,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function LandingPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-900">
      <LandingHeader
        links={[
          { label: "Features", href: "#features" },
          { label: "Office Profile", href: "#about" },
          { label: "Process", href: "#how-it-works" },
        ]}
      />

      <main className="w-full">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-slate-50" />

          <div className="mx-auto grid w-full max-w-[90%] grid-cols-1 gap-10 px-4 py-16 sm:max-w-2xl sm:px-6 md:max-w-4xl md:grid-cols-2 md:items-center md:py-24 lg:max-w-6xl lg:px-8 xl:max-w-7xl xl:px-12 2xl:max-w-[1600px] 2xl:px-16">
            <motion.div
              variants={reduceMotion ? undefined : container}
              initial={reduceMotion ? undefined : "hidden"}
              animate={reduceMotion ? undefined : "show"}
            >
              <motion.p
                className="text-xs font-semibold uppercase tracking-wide text-blue-700"
                variants={reduceMotion ? undefined : item}
              >
                OJT Attendance System
              </motion.p>
              <motion.h1
                className="mt-3 text-4xl font-bold leading-tight text-slate-900 md:text-5xl lg:text-6xl"
                variants={reduceMotion ? undefined : item}
              >
                Reliable attendance records for OJT interns.
              </motion.h1>
              <motion.p
                className="mt-4 text-lg text-slate-700 lg:text-xl"
                variants={reduceMotion ? undefined : item}
              >
                A secure, web-based system for clock-in/out recording, approvals,
                and reporting—aligned with transparency and service excellence.
              </motion.p>

              <motion.div
                className="mt-8 flex flex-col gap-3 sm:flex-row"
                variants={reduceMotion ? undefined : item}
              >
                <a
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Get Started
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Features
                </a>
              </motion.div>

              <motion.div
                className="mt-8 grid gap-3 text-sm text-slate-700"
                variants={reduceMotion ? undefined : item}
              >
                {[
                  "Web-based access (desktop + mobile browsers)",
                  "Role-based access for interns, supervisors, coordinators, and admins",
                  "Export-ready reports for DTR and hours rendered",
                ].map((t) => (
                  <div
                    key={t}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    {t}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <Reveal className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Overview
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  Attendance dashboard snapshot
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Sample indicators shown for presentation only.
                </p>
              </div>
              <div className="mt-6 grid gap-4">
                {[
                  { label: "Clocked In", value: "48", color: "text-blue-700" },
                  {
                    label: "Pending Approvals",
                    value: "7",
                    color: "text-red-600",
                  },
                  { label: "Late Arrivals", value: "3", color: "text-blue-700" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm text-slate-600">{stat.label}</span>
                    <span className={`text-lg font-semibold ${stat.color}`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Verification options (location/selfie) can be enabled per program
                policy.
              </div>
            </Reveal>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto w-full max-w-[90%] scroll-mt-24 px-4 py-16 sm:max-w-2xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl xl:px-12 2xl:max-w-[1600px] 2xl:px-16"
        >
          <Reveal>
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                Key Features
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 lg:text-4xl">
                Attendance management with accountability
              </h2>
              <p className="mt-3 max-w-3xl text-slate-700">
                Designed for PESO operations—simple for interns to use and easy
                for supervisors and coordinators to monitor and approve.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Clock In/Out",
                desc: "Web-based time tracking with geolocation and selfie verification.",
              },
              {
                title: "Approval Workflow",
                desc: "Supervisors can review and approve daily attendance logs.",
              },
              {
                title: "Reports & DTR",
                desc: "Generate DTRs, hours rendered, and attendance summaries.",
              },
            ].map((feature, idx) => (
              <Reveal key={feature.title} delay={reduceMotion ? 0 : idx * 0.06}>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {feature.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section
          id="about"
          className="mx-auto w-full max-w-[90%] scroll-mt-24 px-4 pb-6 pt-4 sm:max-w-2xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl xl:px-12 2xl:max-w-[1600px] 2xl:px-16"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Reveal>
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Mission
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Upliftment of the quality of lives of Cabuyeños through the
                  sustainable delivery of efficient and effective economic,
                  educational, ecological, physical and all basic social and
                  cultural services in an industrial and entrepreneurial
                  community setting.
                </p>
              </div>
            </Reveal>
            <Reveal delay={reduceMotion ? 0 : 0.06}>
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                  Vision
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  An entrepreneurial industrialized, progressive, service-driven
                  and environment-friendly Cabuyao with God-loving citizens.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal className="mt-6">
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Corporate Values
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Cabuyao PESO connects job seekers and employment prospects by
                upholding honesty, innovation, and service excellence.
                Transparency and moral principles guide all office dealings,
                while technology is continuously adapted to enhance service
                delivery. Collaboration with employers, government agencies, and
                community stakeholders strengthens meaningful employment
                linkages and inclusive growth for all sectors, especially
                vulnerable populations. These values reflect professionalism,
                respect, and a commitment to workforce empowerment.
              </p>
            </div>
          </Reveal>
        </section>

        <section
          id="how-it-works"
          className="mx-auto w-full max-w-[90%] scroll-mt-24 px-4 py-16 sm:max-w-2xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl xl:px-12 2xl:max-w-[1600px] 2xl:px-16"
        >
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <Reveal>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  How It Works
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900 lg:text-4xl">
                  Simple flow for interns and supervisors
                </h2>
                <p className="mt-3 text-slate-700">
                  Interns clock in from any browser. Supervisors review
                  attendance, add notes, and approve records. Coordinators can
                  generate reports at any time.
                </p>
              </div>
            </Reveal>

            <div className="grid gap-4">
              {[
                {
                  step: "01",
                  title: "Intern clocks in",
                  desc: "Location + selfie captured for verification.",
                },
                {
                  step: "02",
                  title: "Supervisor reviews",
                  desc: "Approve or flag irregularities with comments.",
                },
                {
                  step: "03",
                  title: "Generate reports",
                  desc: "Export DTR and hours rendered instantly.",
                },
              ].map((s, idx) => (
                <Reveal key={s.step} delay={reduceMotion ? 0 : idx * 0.06}>
                  <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <span className="text-lg font-bold tabular-nums text-red-600">
                      {s.step}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{s.title}</p>
                      <p className="text-sm leading-6 text-slate-700">{s.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section
          id="history"
          className="mx-auto w-full max-w-[90%] scroll-mt-24 px-4 py-16 sm:max-w-2xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl xl:px-12 2xl:max-w-[1600px] 2xl:px-16"
        >
          <Reveal>
            <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                History and Profile
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Under Republic Act No. 8759 (PESO Act of 1999), the Cabuyao Public
                Employment Service Office (PESO) was founded to institutionalize
                employment facilitation services for local government units.
                Based in Cabuyao City, Laguna, it serves as a bridge between
                employers, job seekers, and national employment initiatives in a
                rapidly industrializing community.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Cabuyao PESO offers livelihood training, career counseling, job
                matching, and programs such as job fairs, TUPAD, and SPES. It
                partners with private businesses, government agencies (DOLE,
                TESDA), and academic institutions to strengthen workforce
                development.
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                By leveraging digital channels for recruitment and job
                advertising, Cabuyao PESO supports inclusive employment for youth,
                displaced workers, persons with disabilities (PWDs), and other
                vulnerable groups in line with sustainable economic growth goals.
              </p>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[90%] px-4 py-10 sm:max-w-2xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl xl:px-12 2xl:max-w-[1600px] 2xl:px-16">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-slate-200">
                  <Image
                    src={pesoLogo}
                    alt="Cabuyao PESO seal"
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-contain"
                  />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-900">
                    Cabuyao PESO
                  </p>
                  <p className="text-xs text-slate-600">OJT Attendance System</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Public Employment Service Office, City Government of Cabuyao,
                Laguna.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Quick Links
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a
                    href="#features"
                    className="text-slate-700 hover:text-blue-700 hover:underline"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#about"
                    className="text-slate-700 hover:text-blue-700 hover:underline"
                  >
                    Office Profile
                  </a>
                </li>
                <li>
                  <a
                    href="/login"
                    className="text-slate-700 hover:text-blue-700 hover:underline"
                  >
                    Log In
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contact
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p>
                  Email:{" "}
                  <a
                    href="mailto:pesocabuyaocity@gmail.com"
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    pesocabuyaocity@gmail.com
                  </a>
                </p>
                <p>Office: 3/F Government Office, Cabuyao Retail Plaza</p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>© 2026 City of Cabuyao PESO. All rights reserved.</p>
            <p className="text-xs">
              For official use. Data handling and access are subject to office
              policies.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

