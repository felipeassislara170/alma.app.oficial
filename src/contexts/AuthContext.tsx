import { useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { AuthContext, type HealthConsent } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<import('firebase/auth').User | null>(null)
  const [loading, setLoading] = useState(true)
  const [healthConsent, setHealthConsentState] = useState<HealthConsent>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const stored = localStorage.getItem(`healthConsent:${firebaseUser.uid}`)
        const validConsent: HealthConsent =
          stored === 'granted' || stored === 'denied' ? stored : null
        setHealthConsentState(validConsent)
      } else {
        setHealthConsentState(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const register = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password)
  }

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const setHealthConsent = (consent: HealthConsent) => {
    setHealthConsentState(consent)
    if (user && consent !== null) {
      localStorage.setItem(`healthConsent:${user.uid}`, consent)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, healthConsent, register, login, logout, setHealthConsent }}
    >
      {children}
    </AuthContext.Provider>
  )
}
