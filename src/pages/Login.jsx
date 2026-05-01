import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, ArrowRight, Loader2, Eye, EyeOff, Sparkle, Mail, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Haptics } from '../lib/haptics';
import divineLogo from '../assets/divine_logo.jpg';

const Login = () => {
    const { login, sendPasswordResetEmail } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Forgot Password States
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [isForgotLoading, setIsForgotLoading] = useState(false);
    const [forgotStatus, setForgotStatus] = useState({ type: '', message: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        Haptics.lightTick();
        
        const success = await login(username, password);
        setIsLoading(false);
        
        if (success) {
            Haptics.heavyTap();
            navigate('/');
        } else {
            Haptics.heavyTap();
            setError(t.invalid_login);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsForgotLoading(true);
        setForgotStatus({ type: '', message: '' });
        Haptics.lightTick();

        const { success, error } = await sendPasswordResetEmail(forgotEmail);
        setIsForgotLoading(false);

        if (success) {
            Haptics.heavyTap();
            setForgotStatus({ 
                type: 'success', 
                message: t.reset_link_sent || 'Reset link sent to your email!' 
            });
        } else {
            Haptics.heavyTap();
            setForgotStatus({ 
                type: 'error', 
                message: error || 'Failed to send reset email.' 
            });
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-slate-50 font-inter relative overflow-hidden">
            {/* ═══ ULTRA-PREMIUM AURA BACKGROUND ═══ */}
            <div className="aura-mesh">
                <motion.div 
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="aura-blob -top-1/4 -left-1/4 bg-orange-200/40" 
                />
                <motion.div 
                    animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                    transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                    className="aura-blob -bottom-1/4 -right-1/4 bg-blue-100/30" 
                />
                <div className="noise-overlay" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[460px] relative z-10"
            >
                {/* ═══ DOUBLE-BORDER GLASS CARD ═══ */}
                <div className="relative group">
                    {/* External Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-tr from-orange-500/20 via-transparent to-blue-500/10 rounded-[48px] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
                    
                    <div className="relative bg-white/70 backdrop-blur-3xl border border-white p-8 md:p-12 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] light-sweep">
                        
                        <header className="flex flex-col items-center text-center mb-10">
                            {/* Halo Logo */}
                            <div className="relative mb-8">
                                <motion.div 
                                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="absolute inset-0 bg-orange-400 rounded-full blur-2xl"
                                />
                                <div className="relative w-24 h-24 bg-white rounded-full p-1 shadow-2xl ring-4 ring-white/50 overflow-hidden">
                                    <img 
                                        src={divineLogo} 
                                        alt="Committee Logo" 
                                        className="w-full h-full object-cover rounded-full" 
                                    />
                                </div>
                            </div>

                            <h1 className="font-serif text-4xl md:text-5xl text-slate-900 tracking-tight leading-none mb-4">
                                Kozhimamparamb <span className="text-orange-500">Pooram</span>
                            </h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4">
                                Cheruthuruthy Desam
                            </p>
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/5 rounded-full">
                                <ShieldCheck size={12} className="text-orange-500" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Committee Management Portal</span>
                            </div>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="relative">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type="text"
                                        placeholder={t.username}
                                        className="w-full bg-slate-50/50 border border-slate-100 focus:border-orange-500/30 focus:bg-white rounded-2xl pl-14 pr-6 py-4 outline-none transition-all font-bold text-slate-700 text-[15px] placeholder:text-slate-300"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="relative">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder={t.password}
                                        className="w-full bg-slate-50/50 border border-slate-100 focus:border-orange-500/30 focus:bg-white rounded-2xl pl-14 pr-14 py-4 outline-none transition-all font-bold text-slate-700 text-[15px] placeholder:text-slate-300"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { Haptics.lightTick(); setShowPassword(v => !v); }}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                <div className="flex justify-between items-center px-1">
                                    <div />
                                    <button
                                        type="button"
                                        onClick={() => { 
                                            Haptics.lightTick(); 
                                            setForgotStatus({ type: '', message: '' });
                                            setForgotEmail('');
                                            setShowForgotModal(true); 
                                        }}
                                        className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-orange-500 transition-all flex items-center gap-1 group/forgot"
                                    >
                                        <Sparkle size={10} className="group-hover/forgot:rotate-12 transition-transform" />
                                        {t.forgot_password || 'Forgot Password?'}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-2 p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100"
                                    >
                                        <Sparkle size={14} />
                                        <p className="text-[10px] font-black uppercase tracking-wider">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4.5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3 disabled:opacity-70 transition-all hover:bg-slate-800"
                            >
                                {isLoading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        <span className="text-sm uppercase tracking-widest">{t.enter_portal || 'Access Portal'}</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <footer className="mt-12 text-center">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                Secure Identity Access • 2026 Admin
                            </p>
                        </footer>
                    </div>
                </div>
            </motion.div>

            {/* ═══ FORGOT PASSWORD MODAL ═══ */}
            <AnimatePresence>
                {showForgotModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="w-full max-w-[420px] bg-white rounded-[40px] p-10 md:p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] relative z-10 border border-white"
                        >
                            <AnimatePresence mode="wait">
                                {forgotStatus.type === 'success' ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col items-center text-center py-6"
                                    >
                                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[28px] flex items-center justify-center mb-8 shadow-inner">
                                            <ShieldCheck size={40} />
                                        </div>
                                        <h3 className="font-serif text-3xl text-slate-900 mb-4">{t.reset_link_sent || 'Link Sent!'}</h3>
                                        <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                                            {t.reset_success_desc || 'We have sent a secure password reset link to your email address. Please check your inbox and spam folder.'}
                                        </p>
                                        <button
                                            onClick={() => {
                                                setShowForgotModal(false);
                                                setForgotStatus({ type: '', message: '' });
                                                setForgotEmail('');
                                            }}
                                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20"
                                        >
                                            {t.done || 'Done'}
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div key="form" exit={{ opacity: 0, y: -10 }}>
                                        <div className="flex flex-col items-center text-center mb-10">
                                            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6">
                                                <Mail size={32} />
                                            </div>
                                            <h3 className="font-serif text-2xl md:text-3xl text-slate-800 mb-3">{t.reset_password || 'Reset Password'}</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                {t.reset_desc || 'Identify your account to continue'}
                                            </p>
                                        </div>

                                        <form onSubmit={handleForgotPassword} className="space-y-6">
                                            <div className="relative">
                                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder={t.username || 'Username'}
                                                    className="w-full bg-slate-50 border border-slate-100 focus:border-orange-500/30 focus:bg-white rounded-2xl pl-14 pr-6 py-5 outline-none transition-all font-bold text-slate-700 text-[15px]"
                                                    value={forgotEmail}
                                                    onChange={(e) => setForgotEmail(e.target.value)}
                                                    required
                                                    disabled={isForgotLoading}
                                                />
                                            </div>

                                            <div className="px-2 py-1">
                                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">
                                                    * Reset link will be sent to the Master Email: <span className="text-orange-500">cheruthuruthydhesapooram@gmail.com</span>
                                                </p>
                                            </div>

                                            {forgotStatus.message && forgotStatus.type === 'error' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="p-4 rounded-2xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 border border-rose-100"
                                                >
                                                    <Sparkle size={14} />
                                                    {forgotStatus.message}
                                                </motion.div>
                                            )}

                                            <div className="flex flex-col gap-4 pt-2">
                                                <button
                                                    type="submit"
                                                    disabled={isForgotLoading}
                                                    className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black shadow-xl shadow-orange-500/25 flex items-center justify-center gap-3 group transition-all hover:bg-orange-600"
                                                >
                                                    {isForgotLoading ? (
                                                        <Loader2 size={20} className="animate-spin" />
                                                    ) : (
                                                        <>
                                                            <span className="uppercase tracking-widest text-sm">{t.send_link || 'Send Reset Link'}</span>
                                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowForgotModal(false)}
                                                    className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                                >
                                                    {t.cancel || 'Cancel'}
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Login;
