// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail, updateProfile
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setReady(true) }), [])

  const register = async (email, pw, name) => {
    const { user: u } = await createUserWithEmailAndPassword(auth, email, pw)
    await updateProfile(u, { displayName: name })
    await setDoc(doc(db, 'users', u.uid), { uid: u.uid, email, name, createdAt: serverTimestamp() })
    return u
  }

  return (
    <Ctx.Provider value={{
      user, ready,
      register,
      login: (e, p) => signInWithEmailAndPassword(auth, e, p),
      logout: () => signOut(auth),
      resetPw: e => sendPasswordResetEmail(auth, e),
      getToken: () => user?.getIdToken(),
    }}>
      {ready && children}
    </Ctx.Provider>
  )
}
