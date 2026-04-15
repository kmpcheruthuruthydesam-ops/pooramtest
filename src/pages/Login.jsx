import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight, Loader2, Eye, EyeOff, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
    const { login } = useAuth();
    const { t, setLanguage, language } = useLanguage();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const success = await login(username, password);
        setIsLoading(false);
        if (success) {
            navigate('/');
        } else {
            setError(t.invalid_login);
        }
    };

    return (
        <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0a1d37] to-[#16213e] font-outfit relative overflow-hidden">
            {/* Background Texture/Glow */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-blue-400 rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[440px] p-6 relative z-10 text-center"
            >

                <div className="bg-[#e8ebf2] rounded-[40px] p-12 shadow-2xl space-y-8 border border-white/20">
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-4xl shadow-xl shadow-orange-500/30 mb-6 border-4 border-white/50">
                            🕉
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t.login_title}</h2>
                        <p className="text-sm font-bold text-slate-400/80 mt-1 uppercase tracking-wider">{t.divine_portal}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder={t.username}
                                autoComplete="username"
                                className="w-full bg-white border-2 border-white focus:border-orange-500/30 rounded-2xl pl-14 pr-6 py-4 outline-none transition-all font-bold text-slate-700 shadow-sm"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        {/* Fix 11: password show/hide toggle */}
                        <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t.password}
                                autoComplete="current-password"
                                className="w-full bg-white border-2 border-white focus:border-orange-500/30 rounded-2xl pl-14 pr-12 py-4 outline-none transition-all font-bold text-slate-700 shadow-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {error && (
                            <p className="text-xs font-bold text-rose-500 mt-2">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4.5 bg-gradient-to-r from-[#ff7e21] to-[#d64a13] text-white rounded-2xl font-black shadow-xl shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition-all text-[15px] flex items-center justify-center gap-3 mt-4 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            {isLoading ? (
                                <><Loader2 size={20} className="animate-spin" /> {t.verifying}</>
                            ) : (
                                <>{t.enter_portal} <ArrowRight size={20} /></>
                            )}
                        </button>
                    </form>

                    <p className="text-[11px] font-bold text-slate-400/60 uppercase tracking-widest pt-4">
                        © 2026 {t.temple_name}
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
