import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "PESO OJT Attendance System",
  description:
    "Web-based attendance system for OJT interns with clock-in/out, approvals, and reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full">
      <body className="w-full font-sans antialiased">
        {process.env.NODE_ENV === "development" && (
          <Script src="https://cdn.jsdelivr.net/npm/react-grab" />
        )}
        {children}
      </body>
    </html>
  );
}
