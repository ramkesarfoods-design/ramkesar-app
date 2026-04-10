"use client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, ShoppingBag, User, X, ChevronRight, Star, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [currentAd, setCurrentAd] = useState(0);
  const [cart, setCart] = useState<any[]>([]);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [address, setAddress] = useState("Detecting location...");
  const [loginForm, setLoginForm] = useState({ name: "", phone: "" });

  const normalize = (str: string) => str?.toLowerCase().replace(/\s/g, "");

  useEffect(() => {
    // 1. Recover Cart
    const savedCart = localStorage.getItem("rk_cart");
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      if (Array.isArray(parsed) && parsed.length > 0) setCart(parsed);
    }

    // 2. Recover User
    const savedUser = localStorage.getItem("rk_user");
    if (savedUser) setUser(JSON.parse(savedUser));

    // 3. Recover Address & Detect
    const savedAddr = localStorage.getItem("rk_address");
    if (savedAddr) {
        setAddress(JSON.parse(savedAddr).text);
    } else {
        detectRealLocation();
    }

    const fetchData = async () => {
      try {
        const menuSnap = await getDocs(collection(db, "menus"));
        const adsSnap = await getDocs(collection(db, "ads"));
        setItems(menuSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setAds(adsSnap.docs.map((doc) => doc.data()));
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem("rk_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (ads.length === 0) return;
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads]);

  const detectRealLocation = () => {
    if (navigator.geolocation) {
      setAddress("Accessing GPS...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`);
            const data = await res.json();
            const formattedAddress = data.address.road || data.address.suburb || data.display_name.split(',')[0];
            const fullAddress = `${formattedAddress}, ${data.address.city || data.address.town || ""}`;
            setAddress(fullAddress);
            localStorage.setItem("rk_address", JSON.stringify({ text: fullAddress, lat: latitude, lng: longitude }));
          } catch (err) { setAddress("Address Fetch Error"); }
        },
        () => setAddress("GPS Permission Denied"),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
        setAddress("Geolocation not supported");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.name && loginForm.phone) {
      const userData = { name: loginForm.name, phone: loginForm.phone };
      setUser(userData);
      localStorage.setItem("rk_user", JSON.stringify(userData));
      setIsLoginOpen(false);
      router.push("/profile"); // Redirect after login
    }
  };

  const handleProfileClick = () => {
    if (user) {
        router.push("/profile");
    } else {
        setIsLoginOpen(true);
    }
  };

  const total = cart.reduce((sum, item) => {
    const p = Number(item.price);
    const d = Number(item.discount) || 0;
    return sum + (p - (p * d) / 100) * item.qty;
  }, 0);

  return (
    <div className="bg-slate-50 min-h-screen pb-32 font-sans select-none overflow-x-hidden">
      
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-red-600 to-orange-500 p-3 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="w-40 shrink-0">
            <h1 className="text-2xl font-black text-white italic tracking-tighter">RamKesar</h1>
            <p className="text-[10px] text-white font-bold italic opacity-90">Swad Jo Dil Jeet Le</p>
          </div>

          <div className="relative flex-1 hidden md:block">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search for food..." className="w-full pl-10 pr-3 py-2 rounded-full text-sm outline-none bg-white text-black" />
          </div>

          <button onClick={handleProfileClick} className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-white border border-white/10 active:scale-95 transition-all">
            <User size={18} />
            {user ? <span className="text-xs font-black uppercase">{user.name.split(' ')[0]}</span> : <span className="text-xs font-black">LOGIN</span>}
          </button>
        </div>
        <div className="mt-3 md:hidden relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search dishes..." className="w-full pl-10 py-2 rounded-xl text-xs outline-none bg-white text-black shadow-inner" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* LOCATION BOX */}
        <div onClick={detectRealLocation} className="bg-white p-3 px-4 flex items-center gap-2 border-b cursor-pointer sticky top-[115px] md:top-[75px] z-40">
          <MapPin size={16} className="text-red-600 shrink-0 animate-bounce" />
          <p className="text-[11px] font-bold text-gray-800 truncate flex-1">{address}</p>
          <ChevronRight size={14} className="text-gray-400" />
        </div>

        {/* ADS SECTION */}
        <div className="p-3 md:p-6 overflow-hidden relative">
          <motion.div 
            className="flex cursor-grab active:cursor-grabbing" 
            drag="x" 
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, info) => {
              if (info.offset.x < -50) setCurrentAd((prev) => (prev + 1) % ads.length);
              if (info.offset.x > 50) setCurrentAd((prev) => (prev === 0 ? ads.length - 1 : prev - 1));
            }}
            animate={{ x: `-${currentAd * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            {ads.map((ad, i) => (
              <div key={i} className="w-full shrink-0 px-1">
                <img src={ad.image} className="w-full h-56 md:h-[400px] object-cover rounded-3xl shadow-lg border border-gray-100" alt="Special Offer" />
              </div>
            ))}
          </motion.div>
          <div className="flex justify-center gap-1.5 mt-3">
            {ads.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${currentAd === i ? "w-6 bg-red-600" : "w-1.5 bg-gray-300"}`} />
            ))}
          </div>
        </div>

        {/* CATEGORIES */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
          {["All", "Snacks", "Sweets", "Drinks", "TopRated"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2.5 rounded-full text-[11px] font-black transition-all whitespace-nowrap ${filter === f ? "bg-red-600 text-white shadow-md scale-105" : "bg-white border text-gray-500"}`}>
              {f}
            </button>
          ))}
        </div>

        {/* ITEMS GRID */}
        <div className="px-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
          {items.filter(i => (filter === "All" || normalize(i.category) === normalize(filter)) && normalize(i.name).includes(normalize(search))).map((item) => {
            const cartItem = cart.find((c) => c.id === item.id);
            const disc = Number(item.discount) || 0;
            const final = Math.round(Number(item.price) - (Number(item.price) * disc) / 100);
            
            return (
              <div key={item.id} className="bg-white rounded-[24px] border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl transition-all group">
                <div className="relative overflow-hidden">
                  <img src={item.image} className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500" alt={item.name} />
                  {disc > 0 && <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg border border-white/20">{disc}% OFF</div>}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-black text-[13px] text-gray-800 truncate">{item.name}</h3>
                  <p className="text-[10px] text-gray-400 line-clamp-2 my-1.5 h-7 leading-tight">{item.description || "Freshly prepared with authentic flavors."}</p>
                  
                  <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 mb-3">
                    <span className="flex items-center gap-0.5 text-orange-500"><Star size={12} fill="currentColor"/> {item.rating}</span>
                    <span className="flex items-center gap-0.5"><Clock size={12}/> {item.time}m</span>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-50 mt-auto">
                    <div>
                      <p className="font-black text-base text-gray-900 leading-none">₹{final}</p>
                      {disc > 0 && <p className="text-[9px] text-gray-400 line-through">₹{item.price}</p>}
                    </div>
                    {cartItem ? (
                      <div className="flex items-center gap-3 bg-red-600 text-white px-3 py-1.5 rounded-xl shadow-md">
                        <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, qty: i.qty - 1} : i).filter(i => i.qty > 0))} className="font-black text-lg">-</button>
                        <span className="text-[12px] font-black">{cartItem.qty}</span>
                        <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, qty: i.qty + 1} : i))} className="font-black text-lg">+</button>
                      </div>
                    ) : (
                      <button onClick={() => setCart([...cart, {...item, qty: 1}])} className="bg-orange-500 text-white px-5 py-2 rounded-xl text-[11px] font-black shadow-md active:scale-90 transition-all">ADD</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-20 py-12 text-center bg-white border-t border-gray-100">
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[3px] mb-2">RamKesar Foods</p>
        <p className="text-[9px] font-bold text-gray-300">© 2026 All Rights Reserved. Swad Jo Dil Jeet Le.</p>
      </footer>

      {/* LOGIN MODAL */}
      <AnimatePresence>
        {isLoginOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-sm rounded-[40px] p-10 relative shadow-2xl">
              <button onClick={() => setIsLoginOpen(false)} className="absolute right-8 top-8 text-gray-300 hover:text-red-500 transition-colors"><X size={24}/></button>
              <h2 className="text-2xl font-black italic mb-2 text-red-600">Namaste!</h2>
              <p className="text-[11px] font-bold text-gray-400 mb-8 uppercase tracking-widest">Login to start ordering</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <input required placeholder="Your Full Name" className="w-full bg-slate-50 p-5 rounded-2xl outline-none text-sm font-bold border border-transparent focus:border-red-100 transition-all" onChange={(e)=>setLoginForm({...loginForm, name: e.target.value})} />
                <input required type="tel" placeholder="Mobile Number" className="w-full bg-slate-50 p-5 rounded-2xl outline-none text-sm font-bold border border-transparent focus:border-red-100 transition-all" onChange={(e)=>setLoginForm({...loginForm, phone: e.target.value})} />
                <button type="submit" className="w-full bg-black text-white p-5 rounded-2xl font-black text-[12px] uppercase tracking-[2px] shadow-xl active:scale-95 transition-all mt-4">Login Now</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHECKOUT POPUP */}
      {cart.length > 0 && (
        <div onClick={() => router.push("/cart")} className="fixed bottom-6 left-4 right-4 bg-black text-white p-4 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[60] flex justify-between items-center max-w-md mx-auto cursor-pointer active:scale-95 transition-all border border-white/10 group">
          <div className="flex items-center gap-4">
            <div className="bg-red-600 p-3 rounded-2xl shadow-lg animate-pulse group-hover:scale-110 transition-transform"><ShoppingBag size={22}/></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{cart.length} Items</p>
              <p className="font-black text-xl">₹{Math.round(total)}</p>
            </div>
          </div>
          <div className="bg-white text-black px-7 py-3.5 rounded-[20px] text-[13px] font-black uppercase flex items-center gap-2 shadow-lg">Checkout <ChevronRight size={16}/></div>
        </div>
      )}

    </div>
  );
}
