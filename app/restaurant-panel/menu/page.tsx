"use client";

import { useEffect, useState } from "react";
import { db } from "../../../firebase/config";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function MenuPage() {
  const [items, setItems] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState("");
  const [rating, setRating] = useState("");

  const fetchItems = async () => {
    const snapshot = await getDocs(collection(db, "menus"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setItems(data);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // ➕ ADD ITEM
  const addItem = async () => {
    if (!name || !price) {
      alert("Name & Price required ❌");
      return;
    }

    await addDoc(collection(db, "menus"), {
      name,
      price: Number(price),
      discount: Number(discount || 0),
      description: desc,
      image,
      rating: Number(rating || 0),
    });

    alert("Item Added ✅");

    setName("");
    setPrice("");
    setDiscount("");
    setDesc("");
    setImage("");
    setRating("");

    fetchItems();
  };

  // ❌ DELETE
  const deleteItem = async (id) => {
    await deleteDoc(doc(db, "menus", id));
    fetchItems();
  };

  // 🔄 UPDATE (simple version)
  const updateItem = async (id) => {
    const newName = prompt("New name?");
    if (!newName) return;

    await updateDoc(doc(db, "menus", id), {
      name: newName,
    });

    fetchItems();
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">🍽️ Menu Management</h1>

      {/* ➕ FORM */}
      <div className="bg-white p-4 rounded shadow mb-4 grid gap-2">
        <input
          placeholder="Item Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2"
        />

        <input
          placeholder="Rate (₹)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border p-2"
        />

        <input
          placeholder="Off %"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          className="border p-2"
        />

        <input
          placeholder="Rating (1-5)"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="border p-2"
        />

        <input
          placeholder="Image URL"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="border p-2"
        />

        <textarea
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="border p-2"
        />

        <button
          onClick={addItem}
          className="bg-green-500 text-white p-2 rounded"
        >
          Add Item
        </button>
      </div>

      {/* 📦 ITEMS */}
      {items.map((item) => {
        const finalPrice =
          item.price - (item.price * item.discount) / 100;

        return (
          <div
            key={item.id}
            className="bg-white p-4 mb-3 rounded shadow"
          >
            <img
              src={item.image}
              alt=""
              className="w-32 h-32 object-cover mb-2"
            />

            <h2 className="font-bold text-lg">{item.name}</h2>

            <p className="text-gray-500">{item.description}</p>

            <p>
              <span className="line-through text-gray-400">
                ₹{item.price}
              </span>{" "}
              <span className="text-green-600 font-bold">
                ₹{finalPrice}
              </span>{" "}
              ({item.discount}% OFF)
            </p>

            <p>⭐ {item.rating}</p>

            <button
              onClick={() => updateItem(item.id)}
              className="bg-blue-500 text-white px-2 py-1 mr-2"
            >
              Edit
            </button>

            <button
              onClick={() => deleteItem(item.id)}
              className="bg-red-500 text-white px-2 py-1"
            >
              Delete
            </button>
          </div>
        );
      })}
    </div>
  );
}
