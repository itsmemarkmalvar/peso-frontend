"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import pesoLogo from "@/assets/images/image-Photoroom.png";

type LandingHeaderProps = {
  links: Array<{ label: string; href: `#${string}` }>;
};

export function LandingHeader({ links }: LandingHeaderProps) {
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState<string>(links[0]?.href ?? "");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function onNavClick(href: `#${string}`) {
    setActiveHref(href);
    const el = document.querySelector(href);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  }

  return (
    <motion.header
      className={[
        "sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur",
        scrolled ? "shadow-sm" : "",
      ].join(" ")}
      animate={reduceMotion ? undefined : { opacity: scrolled ? 0.98 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mx-auto flex w-full max-w-[90%] items-center justify-between gap-6 px-4 py-4 sm:max-w-2xl sm:px-6 lg:max-w-6xl lg:px-8 xl:max-w-7xl xl:px-12 2xl:max-w-[1600px] 2xl:px-16">
        <div className="flex items-center gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-white ring-1 ring-slate-200">
            <Image
              src={pesoLogo}
              alt="Cabuyao PESO seal"
              width={44}
              height={44}
              priority
              className="h-11 w-11 rounded-full object-contain"
            />
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              City Government of Cabuyao
            </p>
            <p className="text-sm font-semibold text-slate-900">
              Public Employment Service Office
            </p>
            <p className="text-xs text-slate-600">OJT Attendance System</p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 text-sm font-medium text-slate-600 md:flex">
          {links.map((l) => {
            const isActive = l.href === activeHref;
            return (
              <button
                key={l.href}
                type="button"
                onClick={() => onNavClick(l.href)}
                className={[
                  "relative rounded-full px-3 py-2 transition-colors",
                  isActive ? "text-blue-800" : "hover:text-blue-700",
                ].join(" ")}
              >
                {!reduceMotion && isActive ? (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-0 rounded-full bg-blue-50 ring-1 ring-blue-200"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                ) : null}
                <span className="relative">{l.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="hidden rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 md:inline-flex"
          >
            Log In
          </a>
          <a
            href="mailto:pesocabuyaocity@gmail.com?subject=PESO%20OJT%20Attendance%20System%20-%20Request%20Demo"
            className="inline-flex rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Request Demo
          </a>
        </div>
      </div>
    </motion.header>
  );
}

