import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, writeBatch } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAWhNkYnC2n4iuHvdp1O_-S5suxivDidgc",
    authDomain: "cash-84acc.firebaseapp.com",
    projectId: "cash-84acc",
    storageBucket: "cash-84acc.appspot.com",
    messagingSenderId: "774737678098",
    appId: "1:774737678098:web:8b918375b4e51692b7edcb",
    measurementId: "G-GRKNPJ45N1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

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
