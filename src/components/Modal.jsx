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
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
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
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`bg-white/90 backdrop-blur-2xl rounded-[32px] p-8 w-full ${maxWidth} shadow-2xl relative border border-white/60 overflow-hidden`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 id="modal-title" className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h3>
                            {/* Fix 3c: Bigger, clearer close button */}
                            <button
                                ref={firstFocusRef}
                                onClick={onClose}
                                aria-label="Close dialog"
                                className="p-3 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
