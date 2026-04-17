import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useMemo, memo, useState, useEffect } from 'react';
import {
    LayoutDashboard,
    UserRound,
    Coins,
    ReceiptText,
    Settings as SettingsIcon,
    LogOut,
    ChevronRight,
    Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Haptics } from '../lib/haptics';

const Sidebar = memo(({ isOpen, setIsOpen, isInstallable, onInstall }) => {
    const { t } = useLanguage();
    const { logout, userRole } = useAuth();
    const { devoteeData = [], maskValue } = useData() || {};
    const navigate = useNavigate();

    const handleLogout = () => {
        Haptics.heavyTap();
        logout();
        navigate('/login');
    };

    // Fix 9: pending count badge
    const pendingCount = useMemo(
        () => (Array.isArray(devoteeData) ? devoteeData : []).filter(d => d.status === 'Pending').length,
        [devoteeData]
    );

    // C: this month's total collected
    const monthlyTotal = useMemo(() => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        let total = 0;
        (Array.isArray(devoteeData) ? devoteeData : []).forEach(d => {
            (d.events || []).forEach(e => {
                if (e.date && new Date(e.date) >= monthStart) total += Number(e.paid) || 0;
            });
        });
        return total;
    }, [devoteeData]);

    const navItems = [
        { path: '/',           icon: <LayoutDashboard size={20} />, label: t.dashboard  },
        { path: '/devotees',   icon: <UserRound size={20} />,       label: t.devotees, badge: pendingCount },
        { path: '/collections',icon: <Coins size={20} />,           label: t.collections },
        { path: '/expenses',   icon: <ReceiptText size={20} />,     label: t.expenses  },
        { path: '/other',      icon: <Layers size={20} />,          label: t.other_nav },
        { path: '/settings',   icon: <SettingsIcon size={20} />,    label: t.settings  },
    ];

    return (
        <aside className={`
            w-72 h-screen fixed left-0 top-0 bg-white/70 lg:bg-white/40 backdrop-blur-3xl border-r border-white/60 p-6 flex flex-col z-50 overflow-hidden
            transition-transform duration-300 lg:translate-x-0
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            {/* Fix 9: logo links to dashboard */}
            <div className="flex items-center justify-between mb-8 px-2">
                <Link to="/" onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }} className="flex items-center gap-4 group transition-all duration-500">
                    <div className="w-14 h-14 bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 rounded-[22px] flex items-center justify-center text-white text-2xl shadow-[0_15px_35px_-10px_rgba(234,88,12,0.35)] group-hover:shadow-[0_20px_45px_-10px_rgba(234,88,12,0.5)] group-hover:scale-105 group-hover:-rotate-3 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative z-10 filter drop-shadow-md">🕉</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-[900] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tighter leading-none mb-1.5">TEMPLE</h2>
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-80">{t.divine_portal}</p>
                            {userRole && (
                                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter bg-orange-500/10 backdrop-blur-md border border-orange-200/50 text-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.05)]">
                                    {t.administrator}
                                </span>
                            )}
                        </div>
                    </div>
                </Link>
                <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close sidebar"
                    className="p-2 text-slate-400 hover:text-slate-600 lg:hidden"
                >
                    <ChevronRight className="rotate-180" size={24} />
                </button>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar -mx-2 px-2" aria-label="Main navigation">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        aria-current={undefined}
                        onClick={() => { 
                            Haptics.lightTick();
                            if (window.innerWidth < 1024) setIsOpen(false); 
                        }}
                        className={({ isActive }) => `
                            flex items-center gap-4 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300
                            ${isActive
                                ? 'bg-white shadow-xl shadow-slate-200/50 text-orange-600 active-nav-glow'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                {item.icon}
                                <span className="flex-1">{item.label}</span>
                                {/* Fix 9: pending badge on Devotees nav */}
                                {item.badge > 0 && (
                                    <span className="ml-auto px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-black rounded-full">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                )}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabMarker"
                                        className="w-1.5 h-1.5 rounded-full bg-orange-500"
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="pt-4 border-t border-white/60 relative z-10">
                {isInstallable && (
                    <button
                        onClick={onInstall}
                        className="w-full flex items-center gap-4 px-5 py-3 mb-2 rounded-2xl font-bold text-sm bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all duration-300 relative z-20"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        Install App
                    </button>
                )}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-5 py-3 rounded-2xl font-bold text-sm text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-300 relative z-20"
                >
                    <LogOut size={22} />
                    {t.logout}
                </button>
                <div className="mt-4 p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[24px] text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-2xl rounded-full -mr-10 -mt-10 group-hover:bg-white/10 transition-colors"></div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t.this_month_small}</p>
                    <p className="text-xl font-black text-white mb-2">₹{monthlyTotal.toLocaleString()}</p>
                    <p className="text-sm font-bold flex items-center gap-2 text-slate-400">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${pendingCount > 0 ? 'bg-rose-400' : 'bg-emerald-500'}`}></span>
                        {pendingCount > 0 ? `${pendingCount} ${t.pending_small}` : t.all_clear}
                    </p>
                </div>
            </div>
        </aside>
    );
});

export default Sidebar;
