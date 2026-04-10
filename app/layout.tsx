"use client";

import "./globals.css";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <body>

        {/* MAIN CONTENT */}
        <div className="pb-16">{children}</div>

        {/* 🔥 BOTTOM NAV */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around p-2">

          <button
            onClick={() => (window.location.href = "/")}
            className={pathname === "/" ? "text-red-500" : ""}
          >
            🏠 Home
          </button>

          <button
            onClick={() => (window.location.href = "/orders")}
            className={pathname === "/orders" ? "text-red-500" : ""}
          >
            📦 Orders
          </button>

          <button
            onClick={() => (window.location.href = "/profile")}
            className={pathname === "/profile" ? "text-red-500" : ""}
          >
            👤 Profile
          </button>

        </div>

      </body>
    </html>
  );
}
