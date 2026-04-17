import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
    const firstFocusRef = useRef(null);

    // Fix 3a: Escape key closes modal
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    // Fix 3b: Focus first focusable element when modal opens
    useEffect(() => {
        if (isOpen && firstFocusRef.current) {
            setTimeout(() => firstFocusRef.current?.focus(), 50);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        aria-hidden="true"
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={window.innerWidth < 768 ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 20 }}
                        animate={window.innerWidth < 768 ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
                        exit={window.innerWidth < 768 ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ 
                            type: 'spring', 
                            damping: window.innerWidth < 768 ? 32 : 25, 
                            stiffness: window.innerWidth < 768 ? 300 : 300,
                            mass: 0.8
                        }}
                        drag={window.innerWidth < 768 ? 'y' : false}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.4}
                        onDragEnd={(e, info) => {
                            if (info.offset.y > 100) {
                                import('../lib/haptics').then(m => m.Haptics.lightTick());
                                onClose();
                            }
                        }}
                        className={`
                            bg-white/90 backdrop-blur-3xl w-full ${maxWidth} 
                            relative border-t md:border border-white/60 overflow-hidden
                            rounded-t-[32px] md:rounded-[32px] shadow-2xl
                            max-h-[92vh] md:max-h-[85vh] flex flex-col
                        `}
                    >
                        {/* iOS Drag Indicator (Mobile Only) */}
                        <div className="md:hidden flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                            <div className="w-10 h-1.5 bg-slate-200 rounded-full" />
                        </div>

                        <div className="flex items-center justify-between px-8 py-6 md:py-8">
                            <h3 id="modal-title" className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{title}</h3>
                            <button
                                ref={firstFocusRef}
                                onClick={() => { 
                                    import('../lib/haptics').then(m => m.Haptics.lightTick());
                                    onClose(); 
                                }}
                                aria-label="Close dialog"
                                className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors active:scale-90"
                            >
                                <X size={18} />
                            </button>
                        </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="px-8 pb-24 md:pb-8 overflow-y-auto custom-scrollbar safe-area-bottom flex-1">
                            {children}
                        </div>
                    </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
