import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { LayoutDashboard, UserRound, Coins, ReceiptText, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Haptics } from '../lib/haptics';

const BottomNav = () => {
    const { t } = useLanguage();
    const location = useLocation();

    const items = [
        { path: '/',            icon: LayoutDashboard, label: 'Home'       },
        { path: '/devotees',    icon: UserRound,       label: 'Devotees'   },
        { path: '/collections', icon: Coins,           label: 'Collect'    },
        { path: '/expenses',    icon: ReceiptText,     label: 'Expense'    },
        { path: '/settings',    icon: Settings,        label: 'Settings'   },
    ];

    const activeIndex = items.findIndex(item => 
        item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
    );

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden safe-area-bottom select-none">
            {/* iOS-style frosted glass background */}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-3xl border-t border-white/60" />
            
            <div className="relative flex items-stretch justify-around h-20 px-4 pb-2">
                {items.map(({ path, icon: Icon, label }, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <NavLink
                            key={path}
                            to={path}
                            onClick={() => { if (!isActive) Haptics.lightTick(); }}
                            className="relative flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 active:scale-90"
                        >
                            {/* Active squishy pill indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavPill"
                                    className="absolute inset-x-2 bottom-2 h-12 bg-orange-500/10 rounded-2xl -z-10"
                                    initial={false}
                                    transition={{ 
                                        type: "spring", 
                                        stiffness: 400, 
                                        damping: 25,
                                        mass: 0.8
                                    }}
                                />
                            )}

                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavLine"
                                    className="absolute top-0 w-8 h-1 bg-orange-500 rounded-full"
                                    transition={{ 
                                        type: "spring", 
                                        stiffness: 500, 
                                        damping: 30 
                                    }}
                                />
                            )}
                            
                            <motion.div 
                                className={`p-2 rounded-2xl transition-colors duration-300 ${isActive ? 'text-orange-600 bg-orange-50' : 'text-slate-400'}`}
                                animate={{ 
                                    scale: isActive ? 1.15 : 1,
                                    rotate: isActive ? [0, -10, 10, 0] : 0
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            >
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 1.8} />
                            </motion.div>
                            
                            <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-orange-600' : 'text-slate-500'}`}>
                                {label}
                            </span>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
