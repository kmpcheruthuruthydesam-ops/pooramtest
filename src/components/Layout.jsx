import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import FAB from './FAB';
import Modal from './Modal';
import DevoteeForm from './DevoteeForm';
import PaymentForm from './PaymentForm';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import CommandPalette from './CommandPalette';

const Layout = () => {
    const location = useLocation();
    const { t } = useLanguage();

    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAddDevoteeOpen, setIsAddDevoteeOpen] = useState(false);
    const [isLogPaymentOpen, setIsLogPaymentOpen] = useState(false);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

    // H: global keyboard shortcuts
    useEffect(() => {
        const handler = (e) => {
            // Skip if user is typing in an input/textarea/select
            if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            switch (e.key) {
                case 'd': navigate('/'); break;
                case 'v': navigate('/devotees'); break;
                case 'c': navigate('/collections'); break;
                case 'e': navigate('/expenses'); break;
                case 's': navigate('/settings'); break;
                case 'n': setIsAddDevoteeOpen(true); break;
                case 'p': setIsLogPaymentOpen(true); break;
                case '?': setIsShortcutsOpen(true); break;
                default: break;
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [navigate]);

    const getTitle = () => {
        const path = location.pathname;
        if (path === '/') return t.dashboard;
        if (path.includes('/devotees')) return t.devotees;
        if (path.includes('/collections')) return t.collections;
        if (path.includes('/expenses')) return t.expenses;
        if (path.includes('/settings')) return t.settings;
        return 'Temple CRM';
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden relative">
            <CommandPalette />
            {/* Overlay for mobile sidebar */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:pl-72 focus:outline-none">
                <Header title={getTitle()} onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="max-w-7xl mx-auto"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            <FAB 
                onAddDevotee={() => setIsAddDevoteeOpen(true)}
                onLogPayment={() => setIsLogPaymentOpen(true)}
                onAddExpense={() => {/* This is handled by navigation in FAB.jsx */}}
            />

            <Modal 
                isOpen={isAddDevoteeOpen} 
                onClose={() => setIsAddDevoteeOpen(false)} 
                title={t.add_devotee}
            >
                <DevoteeForm onSuccess={() => setIsAddDevoteeOpen(false)} />
            </Modal>

            <Modal
                isOpen={isLogPaymentOpen}
                onClose={() => setIsLogPaymentOpen(false)}
                title={t.log_payment}
            >
                <PaymentForm onSuccess={() => setIsLogPaymentOpen(false)} />
            </Modal>

            {/* H: keyboard shortcuts help modal */}
            <Modal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} title="Keyboard Shortcuts">
                <div className="space-y-2 pb-2">
                    {[
                        ['d', 'Go to Dashboard'],
                        ['v', 'Go to Devotees'],
                        ['c', 'Go to Collections'],
                        ['e', 'Go to Expenses'],
                        ['s', 'Go to Settings'],
                        ['n', 'New Devotee'],
                        ['p', 'Log Payment'],
                        ['Ctrl + K', 'Command Palette'],
                        ['?', 'Show this help'],
                    ].map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl">
                            <span className="text-sm font-bold text-slate-600">{label}</span>
                            <kbd className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-700 shadow-sm">{key}</kbd>
                        </div>
                    ))}
                    <p className="text-[10px] font-bold text-slate-400 text-center pt-2 uppercase tracking-widest">Shortcuts inactive while typing</p>
                </div>
            </Modal>
        </div>
    );
};

export default Layout;
