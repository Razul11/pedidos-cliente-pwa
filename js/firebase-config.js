// Importamos las funciones necesarias directamente desde la CDN oficial de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA8ZAdaXEuylbkUAovdzKP4hdWvX86kVHE",
    authDomain: "sistema-pedidos-pwa-ucr.firebaseapp.com",
    projectId: "sistema-pedidos-pwa-ucr",
    storageBucket: "sistema-pedidos-pwa-ucr.firebasestorage.app",
    messagingSenderId: "318680169189",
    appId: "1:318680169189:web:63e89a9ed345db3eb2b20c"
};

// Inicializamos la app y exportamos Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);