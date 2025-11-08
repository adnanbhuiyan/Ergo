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

export type AuthContextType = {
  user: UserProfile | null 
  session: SessionData | null 
  isAuthenticated: boolean
  isLoading: boolean
  login: (sessionData: SessionData, userProfile: UserProfile) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<SessionData | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true); 


    //Get user session data and profile
    useEffect(() => {
        try {
            const storedSession = localStorage.getItem("auth_session");
            const storedUser = localStorage.getItem("auth_user");

            if (storedSession && storedUser) {
                const sessionData: SessionData = JSON.parse(storedSession);
                const userData: UserProfile = JSON.parse(storedUser);
                
                setUser(userData);
                setSession(sessionData);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false); 
        }
    }, []);


    //Login the user and get their session and user information
    const login = (sessionData: SessionData, userProfile: UserProfile) => {
        setSession(sessionData);
        setUser(userProfile);
        setIsAuthenticated(true);
        setIsLoading(false);

    
        localStorage.setItem("auth_session", JSON.stringify(sessionData));
        localStorage.setItem("auth_user", JSON.stringify(userProfile));
    };


    //Log the user out and clear localStorage of the session and user information
     const logout = async () => {
        if (session) { 
            try {
                await fetch("http://localhost:8000/auth/logout", {
                    method: "POST",
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
            } catch (error) {
                console.error(error);
            }
        }

        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
        localStorage.removeItem("auth_session");
        localStorage.removeItem("auth_user");
    };

    // Use consistent naming in the context value
    const value = {
        user,
        session,
        isAuthenticated,
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};