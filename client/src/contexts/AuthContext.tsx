import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface UserProfile {
    id: string,
    email: string,
    first_name: string,
    last_name: string,
    username: string,
    position: string,
    profile_photo_url: string
}

interface SessionData {
    access_token: string,
    refresh_token: string,
    expires_in: number,
}

interface AuthState {
    user: UserProfile | null,
    session: SessionData | null,
    isAuthenticated: boolean,
    isLoading: boolean
}

interface AuthContextType {
    login: (sessionData: SessionData, userProfile: UserProfile) => void
    logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [sessionData, setSessionData] = useState<SessionData | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true) // Initially true - we're checking localStorage

    const login = (SessionData: any, UserProfile: any) => {
        setUserProfile(userProfile)
        setSessionData(sessionData)
        setIsAuthenticated(true)

        localStorage.setItem("auth_session", JSON.stringify(SessionData))
        localStorage.setItem("auth_user", JSON.stringify(UserProfile))
    }
}   
