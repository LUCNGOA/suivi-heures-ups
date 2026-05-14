import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyBatfAt9mi5lso8khq07jkoJCvlbqQieLw",
  authDomain: "upas-57888.firebaseapp.com",
  projectId: "upas-57888",
  storageBucket: "upas-57888.firebasestorage.app",
  messagingSenderId: "690497459628",
  appId: "1:690497459628:web:828beb31b149bfa931d609"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
