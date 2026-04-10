export const addToCart = (item) => {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart.push(item);
  localStorage.setItem("cart", JSON.stringify(cart));
};

export const getCart = () => {
  return JSON.parse(localStorage.getItem("cart") || "[]");
};

export const clearCart = () => {
  localStorage.removeItem("cart");
};
