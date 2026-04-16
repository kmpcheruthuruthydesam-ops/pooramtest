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
        setCurrentUsername(session.user.email);
        
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

    const login = async (email, password) => {
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

    const sendPasswordResetEmail = async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        return { success: !error, error: error?.message };
    };

    if (!authReady) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-black text-slate-800 mb-2">Connecting to Cloud...</h2>
                <p className="text-slate-500 text-sm max-w-xs mb-8">
                    If this takes too long, please check your <strong>.env</strong> file and ensure your Supabase URL and Key are correct.
                </p>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-left w-full max-w-md">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-2">Troubleshooting</p>
                    <ul className="text-xs text-amber-900/70 space-y-2 font-medium">
                        <li>• Check if VITE_SUPABASE_URL starts with https://</li>
                        <li>• Ensure VITE_SUPABASE_ANON_KEY is correct</li>
                        <li>• Restart your dev server after editing .env</li>
                    </ul>
                </div>
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
            sendPasswordResetEmail
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
