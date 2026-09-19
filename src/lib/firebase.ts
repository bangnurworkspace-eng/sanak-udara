import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, set, get } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyCYpc6RSzK7LSZacWSLttt7FEn8TMby9lY",
  authDomain: "sanak-udara.firebaseapp.com",
  databaseURL: "https://sanak-udara-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sanak-udara",
  storageBucket: "sanak-udara.firebasestorage.app",
  messagingSenderId: "610639186962",
  appId: "1:610639186962:web:49d00bedf8b8d1c123dccb",
  measurementId: "G-HCYE1L5134"
};

// Initialize Firebase only if config is provided to avoid crashing the preview
let app: any;
let database: ReturnType<typeof getDatabase> | null = null;
let storage: ReturnType<typeof getStorage> | null = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.databaseURL) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    // Explicitly pass databaseURL to getDatabase to avoid region defaults failing on non-us-central regions
    database = getDatabase(app, firebaseConfig.databaseURL);
    
    if (firebaseConfig.storageBucket) {
      try {
        storage = getStorage(app);
      } catch (err) {
        console.warn("Storage could not be initialized:", err);
      }
    }
  } else {
    console.warn("Firebase configuration is missing. Running in simulated mode for preview purposes.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
}

export { database, storage, ref, onValue, off, set, get, storageRef, uploadBytes, getDownloadURL, deleteObject };
