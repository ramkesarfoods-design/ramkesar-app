"use client";

import { useState, useEffect } from "react";

export default function AddressPage() {
  const [address, setAddress] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("address");
    if (saved) setAddress(saved);
  }, []);

  const saveAddress = () => {
    localStorage.setItem("address", address);
    alert("Address saved ✅");
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">📍 Address</h1>

      <textarea
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="border w-full p-2 mt-2"
        placeholder="Enter full address"
      />

      <button
        onClick={saveAddress}
        className="bg-green-500 text-white p-2 mt-2"
      >
        Save Address
      </button>
    </div>
  );
}
