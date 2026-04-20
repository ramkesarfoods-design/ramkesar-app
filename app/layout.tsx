"use client";

import "./globals.css";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ClipboardList, UserCircle2 } from "lucide-react";
import InstallPopup from "./InstallPopup";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // 🔥 CUSTOMER PAGES ONLY
  const customerPages = ["/", "/orders", "/profile", "/cart"];
  const showNavbar = customerPages.includes(pathname);

  const navItems = [
    { name: "HOME", path: "/", icon: Home },
    { name: "ORDERS", path: "/orders", icon: ClipboardList },
    { name: "PROFILE", path: "/profile", icon: UserCircle2 },
  ];

  return (
    <html lang="en">
      {/* 🔥 SEO AND KEYWORDS - ADDED SAFELY WITHOUT TOUCHING UI CODE 🔥 */}
      <head>
        <title>RamKesar Foods | Swad Jo Dil Jeet Le</title>
        <meta name="description" content="Order the best Samosas, hot Jalebis, and authentic Indian snacks online from RamKesar Foods. Fresh, hygienic, and perfectly spiced." />
        <meta name="keywords" content="RamKesar, RamKesar Foods, Swad Jo dil jeet le, Classic Aloo Samosa, Punjabi Samosa, Paneer Samosa, Cheese Corn Samosa, Sweet Meetha Samosa, Plain Regular Jalebi, Urad Dal Jalebi, Imarti, Kesar Jalebi, Dal Kachori, Rajasthani Kachori, Khaman Dhokla, White Khatta Dhokla, Indori Poha, Maharashtrian Poha, Gulab Jamun, Kala Jamun, Kesar Rajbhog, Kesar Lassi, Rose Lassi, Kesar Milk, Cold Coffee, Kesar Rabri, best samosa online, order jalebi online, buy snacks online, QSR Indian snacks" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        
        {/* 🔥 PWA MANIFEST & APP ICONS ADDED HERE 🔥 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ff5722" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>

      <body className="bg-[#F8FAFC] text-slate-900 antialiased">
        
        {/* MAIN CONTENT AREA */}
        <div className={`min-h-screen transition-all duration-300 ${showNavbar ? "pb-20 md:pb-24" : ""}`}>
          <InstallPopup />
          {children}
        </div>

        {/* 🔥 RAMKESAR WIDE NAV - 100% LOCKED & FINAL HEIGHT (40px) */}
        {showNavbar && (
          <div className="fixed bottom-0 left-0 w-full flex justify-center items-end z-[999] pointer-events-none md:px-10">
            <nav 
              style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }} 
              className="pointer-events-auto bg-white/95 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] flex items-center justify-around w-full md:max-w-[900px] h-[40px] md:h-[44px] rounded-t-2xl md:rounded-full md:mb-5 px-1 transition-all duration-300"
            >
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className="relative flex flex-row items-center justify-center gap-1.5 md:gap-2 flex-1 h-full transition-all active:scale-95 outline-none group"
                  >
                    {/* 3D Active Glow Background */}
                    {isActive && (
                      <motion.div 
                        layoutId="navActiveBg"
                        className="absolute inset-x-1 inset-y-1 bg-red-600 rounded-full z-0 shadow-md shadow-red-200/50"
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}

                    {/* 3D Styled Icon - Final size adjusted for 40px height */}
                    <Icon 
                      size={14} 
                      className={`z-10 transition-all duration-300 ${
                        isActive 
                        ? "text-white scale-110 drop-shadow-sm" 
                        : "text-slate-400 opacity-80 group-hover:text-red-500"
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    
                    {/* Brand Typography */}
                    <span className={`text-[9px] md:text-[11px] font-black italic uppercase tracking-tighter z-10 transition-colors ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                    }`}>
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        <style jsx global>{`
          body {
            -webkit-tap-highlight-color: transparent;
          }
          html {
            scroll-behavior: smooth;
          }
        `}</style>
      </body>
    </html>
  );
}
