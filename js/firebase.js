import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// --- تم تحديث بيانات الاتصال هنا ---
const firebaseConfig = {
  apiKey: "AIzaSyCfOzC8gkqkVSNZ3frtnnCMxbeq-v7yaTY",
  authDomain: "almas-store-a51eb.firebaseapp.com",
  projectId: "almas-store-a51eb",
  storageBucket: "almas-store-a51eb.appspot.com", // تم تصحيح الخطأ هنا firebasestorage.app -> appspot.com
  messagingSenderId: "502522968593",
  appId: "1:502522968593:web:52dc253f8ea12f4d5bcfb0",
  measurementId: "G-G0WC9BJ6JW"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// --- باقي الدوال المساعدة كما هي ---
export const addDocument = async (collectionName, data) => await addDoc(collection(db, collectionName), { ...data, createdAt: serverTimestamp() });
export const readCollection = (collectionName, callback, orderByField = "name", orderDirection = "asc") => {
    const q = query(collection(db, collectionName), orderBy(orderByField, orderDirection));
    return onSnapshot(q, snapshot => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
};
export const updateDocument = async (collectionName, docId, data) => await updateDoc(doc(db, collectionName, docId), data);
export const deleteDocument = async (collectionName, docId) => await deleteDoc(doc(db, collectionName, docId));
export const getDocument = async (collectionName, docId) => {
    const docSnap = await getDoc(doc(db, collectionName, docId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};
