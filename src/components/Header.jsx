import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Menu, Phone, MapPin, Eye, EyeOff, UserRound, Settings, LogOut } from 'lucide-react';
import { Haptics } from '../lib/haptics';

const Header = memo(({ title, onMenuClick }) => {
    const { language, setLanguage, t } = useLanguage();
    const { isDarkMode, toggleTheme } = useTheme();
    const { devoteeData = [], privacyMode, togglePrivacyMode, cloudStatus } = useData() || {};
    const { userRole, currentUsername, logout } = useAuth();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedTerm, setDebouncedTerm] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const searchRef = useRef(null);
    const profileRef = useRef(null);

    // Fix 1a: Debounce search by 200ms
    useEffect(() => {
        const t = setTimeout(() => setDebouncedTerm(searchTerm), 200);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        if (debouncedTerm.trim().length > 1) {
            const q = debouncedTerm.toLowerCase();
            const filtered = devoteeData.filter(d =>
                (d.name || '').toLowerCase().includes(q) ||
                (d.phone || '').includes(debouncedTerm) ||
                (d.id || '').toLowerCase().includes(q) ||
                (d.address || '').toLowerCase().includes(q)
            ).slice(0, 10);
            setResults(filtered);
            setShowResults(true);
        } else {
            setResults([]);
            setShowResults(false);
        }
    }, [debouncedTerm, devoteeData]);

    // Click outside closes dropdowns
    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowResults(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);



    // Close search on escape
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') setShowResults(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const handleSelectDevotee = (id) => {
        Haptics.lightTick();
        navigate(`/profile/${id}`);
        setSearchTerm('');
        setShowResults(false);
        setIsMobileSearchOpen(false);
    };

    // Fix 1b: Helper to highlight matching substring
    const highlight = (text, query) => {
        if (!query || !text) return text;
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark className="bg-orange-100 text-orange-700 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
                {text.slice(idx + query.length)}
            </>
        );
    };

    const clearSearch = useCallback(() => {
        Haptics.lightTick();
        setSearchTerm('');
        setShowResults(false);
    }, []);

    return (
        <header className="h-20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 bg-slate-50/60 backdrop-blur-md border-b border-white/40">
            <div className="flex items-center gap-4 md:gap-8 flex-1">
                <button
                    onClick={() => { Haptics.lightTick(); onMenuClick(); }}
                    aria-label="Open navigation menu"
                    className="p-2 -ml-2 text-slate-500 hover:text-orange-600 hover:bg-white/50 rounded-xl transition-all lg:hidden active:scale-90"
                >
                    <Menu size={24} />
                </button>
                <h2 className="text-lg md:text-2xl font-bold text-slate-800 line-clamp-1 min-w-max flex items-center gap-3">
                    {title}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/50 border border-white/60 rounded-full shadow-sm">
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                            cloudStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                            cloudStatus === 'connecting' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            {cloudStatus === 'online' ? t.cloud_sync_active : 
                             cloudStatus === 'connecting' ? t.connecting : t.offline_mode}
                        </span>
                    </div>
                </h2>

                {/* Desktop Search */}
                <div className="relative group hidden md:block flex-1 max-w-lg ml-4" ref={searchRef}>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                        <input
                            type="text"
                            aria-label="Search devotees"
                            placeholder={t.search_placeholder}
                            className="pl-11 pr-10 py-2.5 bg-white/50 border border-white/60 rounded-2xl outline-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 w-full transition-all placeholder:text-slate-400 text-sm font-bold text-slate-800"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => debouncedTerm.trim().length > 1 && setShowResults(true)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && results.length > 0) handleSelectDevotee(results[0].id);
                                if (e.key === 'Escape') clearSearch();
                            }}
                        />
                        {/* Fix 1c: Clear button */}
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <AnimatePresence>
                        {showResults && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                role="listbox"
                                className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden z-50 py-2"
                            >
                                {results.length > 0 ? results.map((devotee) => (
                                    <button
                                        key={devotee.id}
                                        role="option"
                                        onClick={() => handleSelectDevotee(devotee.id)}
                                        className="w-full px-4 py-3 hover:bg-orange-50/50 flex items-center gap-3 transition-colors text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-orange-100/50 text-orange-500 flex items-center justify-center font-bold text-sm shrink-0">
                                            {devotee.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-black text-slate-800 truncate group-hover:text-orange-600 transition-colors">
                                                    {highlight(devotee.name, debouncedTerm)}
                                                </p>
                                                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{devotee.id}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                    <Phone size={10} /> {devotee.phone}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 truncate max-w-[150px]">
                                                    <MapPin size={10} /> {devotee.address}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                )) : (
                                    <div className="px-4 py-8 text-center">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Search size={20} className="text-slate-300" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400">{t.no_records_found}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
                {/* Mobile Search Toggle */}
                <button
                    onClick={() => { Haptics.lightTick(); setIsMobileSearchOpen(true); }}
                    aria-label="Open search"
                    className="p-2.5 text-slate-500 hover:text-orange-500 transition-colors md:hidden active:scale-90"
                >
                    <Search size={20} />
                </button>

                {/* Premium Segmented Language Switcher */}
                <div className="premium-segmented-pill flex items-center p-1 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm relative isolate overflow-hidden select-none">
                    <motion.div
                        initial={false}
                        animate={{ x: language === 'en' ? 0 : 40 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="pill-indicator absolute inset-y-1 left-1 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl -z-10 shadow-lg shadow-orange-500/20"
                    />
                    <button
                        onClick={() => { Haptics.lightTick(); setLanguage('en'); }}
                        className={`w-10 h-7 flex items-center justify-center rounded-xl text-[11px] font-black transition-all relative z-10 ${language === 'en' ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => { Haptics.lightTick(); setLanguage('ml'); }}
                        className={`w-10 h-7 flex items-center justify-center rounded-xl text-[11px] font-black transition-all relative z-10 ${language === 'ml' ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        മല
                    </button>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { Haptics.lightTick(); togglePrivacyMode(); }}
                    aria-label={privacyMode ? t.disable_privacy : t.enable_privacy}
                    className={`relative p-2.5 bg-white/50 border border-white/60 rounded-xl transition-colors hidden sm:block ${privacyMode ? 'text-orange-600' : 'text-slate-500 hover:text-orange-500'}`}
                >
                    {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
                </motion.button>

                {/* Premium Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            Haptics.lightTick();
                            setIsProfileOpen(!isProfileOpen);
                        }}
                        className="flex items-center gap-3 pl-3 border-l border-white/40 focus:outline-none"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-[11px] font-black text-slate-800 capitalize leading-tight">
                                {currentUsername?.split('@')[0] || 'User'}
                            </p>
                            <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">
                                {t.administrator || 'Admin'}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden ring-2 ring-orange-500/10 hover:ring-orange-500/30 transition-all">
                            <img
                                src={`https://ui-avatars.com/api/?name=${currentUsername || userRole}&background=f8fafc&color=f97316&bold=true`}
                                alt="avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </motion.button>

                    <AnimatePresence>
                        {isProfileOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className="absolute right-0 mt-3 w-64 bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden z-[110]"
                            >
                                {/* User Header */}
                                <div className="p-5 border-b border-slate-100/50 bg-gradient-to-br from-orange-50/50 to-transparent">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${currentUsername || userRole}&background=fff&color=f97316&bold=true`}
                                                alt="profile"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-slate-900 truncate">
                                                {currentUsername || 'Administrator'}
                                            </p>
                                            <div className="inline-flex items-center px-2 py-0.5 mt-1 bg-orange-500/10 text-orange-600 rounded-lg">
                                                <span className="text-[10px] font-black uppercase tracking-wider">{t.administrator || 'Admin'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Actions */}
                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            Haptics.lightTick();
                                            setIsProfileOpen(false);
                                            navigate('/settings');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-white flex items-center justify-center transition-colors">
                                            <UserRound size={16} />
                                        </div>
                                        <span className="text-xs font-bold">{t.profile || 'Profile'}</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            Haptics.lightTick();
                                            setIsProfileOpen(false);
                                            navigate('/settings');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-white flex items-center justify-center transition-colors">
                                            <Settings size={16} />
                                        </div>
                                        <span className="text-xs font-bold">{t.settings || 'Settings'}</span>
                                    </button>

                                    <div className="my-2 border-t border-slate-100/50" />

                                    <button
                                        onClick={() => {
                                            Haptics.heavyTap();
                                            setIsProfileOpen(false);
                                            logout();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-red-50 group-hover:bg-white flex items-center justify-center transition-colors">
                                            <LogOut size={16} />
                                        </div>
                                        <span className="text-xs font-black">{t.logout || 'Logout'}</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Mobile Search Overlay */}
            <AnimatePresence>
                {isMobileSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl flex flex-col p-6"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-800">{t.search_devotees || 'Search Devotees'}</h3>
                            <button
                                onClick={() => setIsMobileSearchOpen(false)}
                                aria-label="Close search"
                                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                autoFocus
                                type="text"
                                aria-label="Search devotees"
                                placeholder={t.search_placeholder}
                                className="pl-11 pr-10 py-4 bg-slate-50 border-none rounded-2xl w-full outline-none focus:ring-2 focus:ring-orange-500/20 text-lg font-bold text-slate-900"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={clearSearch}
                                    aria-label="Clear search"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3">
                            {results.map((devotee) => (
                                <button
                                    key={devotee.id}
                                    onClick={() => handleSelectDevotee(devotee.id)}
                                    className="w-full p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 text-left shadow-sm active:scale-95 transition-all"
                                >
                                    <div className="w-12 h-12 bg-orange-100/50 text-orange-500 flex items-center justify-center font-black rounded-xl">
                                        {devotee.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-slate-800">{highlight(devotee.name, debouncedTerm)}</p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{devotee.id} • {devotee.phone}</p>
                                    </div>
                                </button>
                            ))}
                            {searchTerm.length > 1 && results.length === 0 && (
                                <div className="text-center py-20 text-slate-400 font-bold">{t.no_records_found}</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
});

export default Header;
