import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [currentUsername, setCurrentUsername] = useState(null);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        // 1. Initial check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                handleSession(session);
            } else {
                setAuthReady(true);
            }
        });

        // 2. Listen for auth state changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                handleSession(session);
            } else {
                resetAuth();
                setAuthReady(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSession = async (session) => {
        setIsAuthenticated(true);
        // Display username part if it's an internal temple email
        const email = session.user.email;
        const displayUsername = email.endsWith('@temple.internal') 
            ? email.split('@')[0] 
            : email;
        setCurrentUsername(displayUsername);
        
        // Fetch profile to ensure record exists
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();

        // Everyone is an admin now
        setUserRole('admin');

        if (!profile) {
            // If no profile exists, create one
            try {
                await supabase.from('profiles').upsert({
                    id: session.user.id,
                    username: session.user.email
                });
            } catch (err) {
                console.warn('Profile sync failed:', err.message);
            }
        }
        setAuthReady(true);
    };

    const resetAuth = () => {
        setIsAuthenticated(false);
        setUserRole(null);
        setCurrentUsername(null);
    };

    const login = async (credential, password) => {
        // Fix: Map 'admin' specifically to the master email
        let email = credential;
        if (!credential.includes('@')) {
            if (credential.toLowerCase() === 'admin') {
                email = 'cheruthuruthydhesapooram@gmail.com';
            } else {
                email = `${credential.toLowerCase()}@temple.internal`;
            }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        
        if (error) {
            console.error('Login error:', error.message);
            return false;
        }
        return !!data.session;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        resetAuth();
    };

    const changePassword = async (newPassword) => {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        return { success: !error, error: error?.message };
    };

    const sendPasswordResetEmail = async (credential) => {
        // Fix: Map 'admin' specifically to the master email for recovery
        let email = credential;
        if (!credential.includes('@')) {
            if (credential.toLowerCase() === 'admin') {
                email = 'cheruthuruthydhesapooram@gmail.com';
            } else {
                email = `${credential.toLowerCase()}@temple.internal`;
            }
        }
            
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        
        return { success: !error, error: error?.message };
    };

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            }
        });
        if (error) console.error('Google Sign-In Error:', error.message);
    };

    // ── Timeout safety: if Supabase takes > 5s, proceed anyway ──
    useEffect(() => {
        const timeout = setTimeout(() => {
            setAuthReady(true);
        }, 5000);
        return () => clearTimeout(timeout);
    }, []);

    if (!authReady) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            userRole, 
            currentUsername, 
            login, 
            logout, 
            changePassword,
            sendPasswordResetEmail,
            signInWithGoogle
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
