import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, Loader2, Eye, EyeOff, Sparkle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Haptics } from '../lib/haptics';
import divineLogo from '../assets/divine_logo.jpg';

const ResetPassword = () => {
    const { changePassword } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setStatus({ type: '', message: '' });

        if (password !== confirmPassword) {
            setError(t.passwords_dont_match || 'Passwords do not match');
            Haptics.heavyTap();
            return;
        }

        if (password.length < 6) {
            setError(t.password_too_short || 'Password must be at least 6 characters');
            Haptics.heavyTap();
            return;
        }

        setIsLoading(true);
        Haptics.lightTick();
        
        const { success, error: authError } = await changePassword(password);
        setIsLoading(false);
        
        if (success) {
            Haptics.heavyTap();
            setStatus({ 
                type: 'success', 
                message: t.password_reset_success || 'Password updated successfully! Redirecting...' 
            });
            setTimeout(() => navigate('/login'), 3000);
        } else {
            Haptics.heavyTap();
            setError(authError || 'Failed to update password.');
        }
    };

    return (
        <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc] font-outfit relative overflow-hidden">
            {/* ═══ LIQUID MESH BACKGROUND ═══ */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <motion.div
                    animate={{
                        x: [0, 40, 0],
                        y: [0, -60, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange-400/20 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        x: [0, -50, 0],
                        y: [0, 70, 0],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-400/10 rounded-full blur-[120px]"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-[92%] sm:w-full max-w-[480px] p-4 md:p-6 relative z-10"
            >
                <div className="bg-white/80 backdrop-blur-3xl p-8 md:p-14 rounded-[32px] md:rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/60 space-y-8 md:space-y-10 relative overflow-hidden">
                    <header className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-[24px] md:rounded-[32px] flex items-center justify-center shadow-2xl shadow-orange-500/20 mb-6 md:mb-8 border-4 border-white rotate-3">
                            <img src={divineLogo} alt="Committee Logo" className="w-full h-full object-cover scale-110" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
                            Set New Password
                        </h1>
                        <p className="text-[10px] font-black text-slate-400 mt-4 tracking-[0.2em] uppercase">
                            Secure your access portal
                        </p>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <div className="group relative">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="New Password"
                                    className="w-full bg-slate-50 border-2 border-slate-50 focus:border-orange-500/20 focus:bg-white rounded-[20px] pl-16 pr-14 py-4 md:py-5 outline-none transition-all font-bold text-slate-700 shadow-sm text-[15px]"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => { Haptics.lightTick(); setShowPassword(v => !v); }}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            <div className="group relative">
                                <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    className="w-full bg-slate-50 border-2 border-slate-50 focus:border-orange-500/20 focus:bg-white rounded-[20px] pl-16 pr-6 py-4 md:py-5 outline-none transition-all font-bold text-slate-700 shadow-sm text-[15px]"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {(error || status.message) && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className={`flex items-center gap-2 p-4 rounded-xl border ${
                                        status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                    }`}
                                >
                                    <Sparkle size={14} className="shrink-0" />
                                    <p className="text-[11px] font-black uppercase tracking-wider">{error || status.message}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading || status.type === 'success'}
                            type="submit"
                            className="w-full py-4.5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3 disabled:opacity-70 transition-all hover:bg-slate-800"
                        >
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : (
                                <>
                                    <span className="text-sm uppercase tracking-widest">{t.update_password || 'Update Password'}</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <footer className="mt-10 text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-orange-500 transition-colors"
                        >
                            {t.back_to_login || 'Back to Login'}
                        </button>
                    </footer>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
