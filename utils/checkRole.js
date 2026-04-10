import { auth } from "../firebase/auth";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

export const checkUserRole = async () => {
  const user = auth.currentUser;

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data().role;
  }

  return null;
};
