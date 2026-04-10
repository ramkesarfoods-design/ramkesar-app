import { db } from "@/firebase/config";
import { addDoc, collection } from "firebase/firestore";

const placeOrder = async () => {
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

  const address = localStorage.getItem("address") || "";
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  if (!user) return alert("Login required ❌");
  if (!address) return alert("Add address ❌");

  await addDoc(collection(db, "orders"), {
    items: cart,
    user,
    address,
    createdAt: new Date(),
  });

  localStorage.removeItem("cart");
  alert("Order placed ✅");
};
