"use client";

import { useState, useEffect } from "react";
import { X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallPopup() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Service Worker Register
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log(err));
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // 🔥 LocalStorage check hata diya! Ab site khulne par popup hamesha aayega jab tak app install na ho.
      setShowPopup(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPopup(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPopup(false);
    // User ne X dabaya toh is session ke liye hatega, background se hata kar fir kholne pe wapas aayega!
  };

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-[9999] p-3 border border-slate-100 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2.5 rounded-xl text-red-600">
              <Smartphone size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">RamKesar App</h3>
              <p className="text-[10px] md:text-[11px] text-slate-500 font-semibold leading-tight">The Pride Of Indian Taste</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleInstall}
              className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-black px-4 py-2.5 rounded-full active:scale-95 transition-all shadow-md shadow-red-200"
            >
              OPEN APP
            </button>
            <button 
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full active:scale-95 transition-all"
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
