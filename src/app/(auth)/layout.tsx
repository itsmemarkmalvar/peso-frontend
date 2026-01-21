"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Users, FileText, Mail } from "lucide-react";

import pesoLogo from "@/assets/images/image-Photoroom.png";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const prevPathRef = useRef<string>(pathname);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    const prev = prevPathRef.current;
    if (prev === pathname) return;

    // Direction rules:
    // - Login -> Register: slide left (enter from right)
    // - Register -> Login: slide right (enter from left)
    if (prev === "/login" && pathname === "/register") setDirection(1);
    else if (prev === "/register" && pathname === "/login") setDirection(-1);
    else setDirection(1);

    prevPathRef.current = pathname;
  }, [pathname]);

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[90%] items-center justify-between px-4 py-4 sm:max-w-2xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl xl:px-12 2xl:max-w-[1600px] 2xl:px-16">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-slate-200">
              <Image
                src={pesoLogo}
                alt="Cabuyao PESO seal"
                width={40}
                height={40}
                priority
                className="h-10 w-10 rounded-full object-contain"
              />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                City Government of Cabuyao
              </p>
              <p className="text-sm font-semibold text-slate-900">
                Public Employment Service Office
              </p>
            </div>
          </div>
          <a
            href="/"
            className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Back to Home
          </a>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-[90%] grid-cols-1 items-center gap-10 px-4 py-10 sm:max-w-2xl sm:px-6 md:grid-cols-2 lg:max-w-6xl lg:px-8 xl:max-w-7xl xl:px-12 2xl:max-w-[1600px] 2xl:px-16">
        <div className="hidden md:flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Official System Access
          </p>
          <h2 className="mt-2 text-3xl font-bold leading-tight text-slate-900 lg:text-4xl">
            OJT Attendance Management
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-700">
            Sign in using your assigned account. Access is role-based and
            actions are recorded for accountability.
          </p>

          <div className="mt-8 grid max-w-md gap-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-700" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Secure & auditable
                </p>
                <p className="text-sm leading-6 text-slate-700">
                  Authentication and activity tracking support transparency and
                  service excellence.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Users className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Role-based access
                </p>
                <p className="text-sm leading-6 text-slate-700">
                  Interns, supervisors, coordinators, and admins have
                  appropriate permissions.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <FileText className="mt-0.5 h-5 w-5 text-blue-700" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Report-ready records
                </p>
                <p className="text-sm leading-6 text-slate-700">
                  Attendance logs support DTR generation and hours-rendered
                  tracking.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-500" />
              <p className="text-sm">
                Need help?{" "}
                <a
                  className="font-semibold text-blue-700 hover:underline"
                  href="mailto:pesocabuyaocity@gmail.com?subject=PESO%20OJT%20Attendance%20System%20-%20Access%20Support"
                >
                  pesocabuyaocity@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-lg">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={pathname}
              custom={direction}
              initial={
                reduceMotion
                  ? { opacity: 1 }
                  : { opacity: 0, x: direction === 1 ? 28 : -28 }
              }
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={
                reduceMotion
                  ? { opacity: 1 }
                  : { opacity: 0, x: direction === 1 ? -28 : 28 }
              }
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}