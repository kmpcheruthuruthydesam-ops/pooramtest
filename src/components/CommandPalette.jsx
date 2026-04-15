import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    User, 
    LayoutDashboard, 
    Coins, 
    ReceiptText, 
    Settings, 
    Command
} from 'lucide-react';

const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const { devoteeData = [] } = useData() || {};
    const { t } = useLanguage();
    const navigate = useNavigate();
    const inputRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const filteredDevotees = query.trim().length > 0
        ? devoteeData.filter(d => 
            d.name.toLowerCase().includes(query.toLowerCase()) || 
            d.id.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5)
        : [];

    const pages = [
        { name: t.dashboard, icon: <LayoutDashboard size={18} />, path: '/' },
        { name: t.devotees, icon: <User size={18} />, path: '/devotees' },
        { name: t.collections, icon: <Coins size={18} />, path: '/collections' },
        { name: t.expenses, icon: <ReceiptText size={18} />, path: '/expenses' },
        { name: t.settings, icon: <Settings size={18} />, path: '/settings' },
    ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

    const handleSelect = (path) => {
        navigate(path);
        setIsOpen(false);
        setQuery('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-white/20 dark:border-slate-700"
                    >
                        <div className="relative">
                            <Search className="absolute left-6 top-6 text-slate-400" size={20} />
                            <input
                                ref={inputRef}
                                autoFocus
                                className="w-full h-20 pl-16 pr-6 bg-transparent outline-none text-lg font-bold text-slate-700 dark:text-slate-100 placeholder:text-slate-400"
                                placeholder={t.search}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                            />
                            <div className="absolute right-6 top-7 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-600">
                                ESC
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto px-2 pb-4 custom-scrollbar">
                            {pages.length > 0 && (
                                <div className="mb-4">
                                    <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.navigation}</p>
                                    {pages.map(page => (
                                        <button
                                            key={page.path}
                                            onClick={() => handleSelect(page.path)}
                                            className="w-full px-4 py-3 flex items-center gap-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group"
                                        >
                                            <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-orange-500 transition-colors">
                                                {page.icon}
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{page.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {filteredDevotees.length > 0 && (
                                <div>
                                    <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.devotees}</p>
                                    {filteredDevotees.map(devotee => (
                                        <button
                                            key={devotee.id}
                                            onClick={() => handleSelect(`/profile/${devotee.id}`)}
                                            className="w-full px-4 py-3 flex items-center gap-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group"
                                        >
                                            <div className="w-9 h-9 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center text-orange-500 font-black text-xs">
                                                {devotee.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700 dark:text-slate-200">{devotee.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{devotee.id}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {query && pages.length === 0 && filteredDevotees.length === 0 && (
                                <div className="py-12 text-center">
                                    <Command className="mx-auto text-slate-200 dark:text-slate-700 mb-4" size={48} />
                                    <p className="text-slate-400 font-bold">{t.no_records_found} "{query}"</p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-black text-slate-500 drop-shadow-sm">↵</kbd>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{t.select}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-black text-slate-500 drop-shadow-sm">↑↓</kbd>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{t.navigate}</span>
                                </div>
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                {t.quick_action_portal} v2.0
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
