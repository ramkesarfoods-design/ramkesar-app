"use client";

import { useEffect, useState } from "react";
import { db } from "../../../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function RestaurantPage() {
  const { id } = useParams();
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);

  // Load cart from localStorage
  useEffect(() => {
    const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(existingCart);
  }, []);

  // Fetch menu
  useEffect(() => {
    const fetchMenu = async () => {
      const querySnapshot = await getDocs(collection(db, "menus"));

      const data = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((item) => item.restaurantId === id);

      setMenu(data);
    };

    fetchMenu();
  }, [id]);

  // ✅ ADD TO CART FUNCTION (FINAL)
  const addToCart = (item) => {
    const existingCart = JSON.parse(localStorage.getItem("cart")) || [];

    const updatedCart = [...existingCart, item];

    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCart(updatedCart);

    alert(item.name + " added to cart ✅");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      
      {/* Cart Button */}
      <Link href="/cart">
        <button
          style={{
            marginBottom: "20px",
            background: "black",
            color: "white",
            padding: "8px 12px",
            border: "none",
            borderRadius: "5px",
          }}
        >
          🛒 Go to Cart ({cart.length})
        </button>
      </Link>

      <h1 style={{ color: "red" }}>🍔 Menu</h1>

      {menu.length === 0 ? (
        <p>No items found</p>
      ) : (
        menu.map((item) => (
          <div
            key={item.id}
            style={{
              borderBottom: "1px solid #ccc",
              padding: "10px",
            }}
          >
            <h2>{item.name}</h2>
            <p>₹{item.price}</p>

            <button
              onClick={() => addToCart(item)}
              style={{
                background: "green",
                color: "white",
                padding: "5px 10px",
                border: "none",
                borderRadius: "5px",
              }}
            >
              Add to Cart
            </button>
          </div>
        ))
      )}
    </div>
  );
}
