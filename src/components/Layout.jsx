import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import FAB from './FAB';
import Modal from './Modal';
import DevoteeForm from './DevoteeForm';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import CommandPalette from './CommandPalette';
import BottomNav from './BottomNav';
import { Flame, Zap } from 'lucide-react';
import { toast } from 'sonner';

const Layout = () => {
    const location = useLocation();
    const { t } = useLanguage();

    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAddDevoteeOpen, setIsAddDevoteeOpen] = useState(false);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);

    // Dynamic FAB Actions logic
    const isProfilePage = location.pathname.startsWith('/profile/');
    
    const extraFabActions = isProfilePage ? [
        {
            icon: <Zap size={20} />,
            label: t.log_pooram || 'Pooram Entry',
            onClick: () => {
                window.dispatchEvent(new CustomEvent('open-event-modal', { detail: { type: 'Pooram' } }));
            },
            color: 'bg-orange-500'
        },
        {
            icon: <Flame size={20} />,
            label: t.log_vilakku || 'Vilakku Entry',
            onClick: () => {
                window.dispatchEvent(new CustomEvent('open-event-modal', { detail: { type: 'Ayyappan Vilakku' } }));
            },
            color: 'bg-indigo-600'
        }
    ] : [];

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null);
            setIsInstallable(false);
        });

        // PWA: Listen for service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            setUpdateAvailable(true);
                            toast('System Update Available', {
                                description: 'A new version of the CRM is ready. Refresh to update.',
                                action: {
                                    label: 'Update Now',
                                    onClick: () => window.location.reload()
                                },
                                duration: Infinity,
                            });
                        }
                    });
                });
            });
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleUpdate = () => {
        window.location.reload();
    };

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstallable(false);
            setDeferredPrompt(null);
        }
    };

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
        <div className="flex h-screen bg-[#f8f9fc] overflow-hidden relative">
            {/* ═══ Hyper-Premium Mesh Gradient Background ═══ */}
            <div className="mesh-container">
                <div className="mesh-blob w-[500px] h-[500px] bg-orange-200 top-[-10%] left-[-10%]" />
                <div className="mesh-blob w-[600px] h-[600px] bg-sky-100 top-[20%] right-[-10%] animasi-delay-2000" />
                <div className="mesh-blob w-[400px] h-[400px] bg-rose-100 bottom-[-5%] left-[20%]" />
                <div className="mesh-blob w-[500px] h-[500px] bg-indigo-50 top-[40%] left-[40%]" />
            </div>

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

            <Sidebar 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen} 
                isInstallable={isInstallable}
                onInstall={handleInstallClick}
            />

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:pl-72 focus:outline-none">
                <Header title={getTitle()} onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-48 lg:pb-12 custom-scrollbar overflow-x-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                            className="max-w-7xl mx-auto w-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            <BottomNav />

            {(location.pathname.includes('/devotees') || location.pathname.includes('/profile/')) && (
                <FAB 
                    onAddDevotee={() => setIsAddDevoteeOpen(true)}
                    onAddExpense={() => {/* This is handled by navigation in FAB.jsx */}}
                    extraActions={extraFabActions}
                />
            )}

            <Modal 
                isOpen={isAddDevoteeOpen} 
                onClose={() => setIsAddDevoteeOpen(false)} 
                title={t.add_devotee}
            >
                <DevoteeForm onSuccess={() => setIsAddDevoteeOpen(false)} />
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
