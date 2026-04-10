"use client";

import { useState } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!mobile) return alert("Enter mobile ❌");

    const q = query(
      collection(db, "users"),
      where("mobile", "==", mobile)
    );

    const snapshot = await getDocs(q);

    let user;

    if (!snapshot.empty) {
      // ✅ EXISTING USER
      user = snapshot.docs[0].data();
      alert("Welcome back ✅");
    } else {
      // 🆕 NEW USER
      if (!name) return alert("Enter name for signup ❌");

      user = {
        name,
        mobile,
        points: 0,
        createdAt: new Date(),
      };

      await addDoc(collection(db, "users"), user);

      alert("Account created ✅");
    }

    localStorage.setItem("user", JSON.stringify(user));

    router.push("/");
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      <h1 className="text-xl font-bold">Login / Signup</h1>

      <input
        placeholder="Name (only first time)"
        className="border p-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Mobile Number"
        className="border p-2"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />

      <button
        onClick={handleLogin}
        className="bg-red-500 text-white p-2"
      >
        Continue
      </button>
    </div>
  );
}
