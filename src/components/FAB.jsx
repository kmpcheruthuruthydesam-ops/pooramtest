import { useState } from 'react';
import { Plus, UserPlus, Receipt, ReceiptText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Haptics } from '../lib/haptics';

const FAB = ({ onAddDevotee, onAddExpense, extraActions = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const baseActions = [
        { 
            icon: <UserPlus size={20} />, 
            label: 'Add Devotee', 
            onClick: () => { Haptics.heavyTap(); onAddDevotee(); setIsOpen(false); },
            color: 'bg-blue-500'
        },
    ];

    const actions = [...extraActions, ...baseActions];

    return (
        <div className="fixed bottom-24 lg:bottom-8 right-6 lg:right-8 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <div className="flex flex-col items-end gap-3 mb-2">
                        {actions.map((action, idx) => (
                            <motion.button
                                key={idx}
                                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={action.onClick}
                                className="flex items-center gap-3 group"
                            >
                                <span className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                                    {action.label}
                                </span>
                                <div className={`w-12 h-12 ${action.color} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200 hover:scale-110 transition-transform`}>
                                    {action.icon}
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { Haptics.lightTick(); setIsOpen(!isOpen); }}
                className={`w-14 h-14 rounded-[22px] flex items-center justify-center text-white shadow-2xl transition-all duration-300 ${isOpen ? 'bg-slate-800 rotate-45' : 'bg-orange-500 shadow-orange-200'}`}
            >
                {isOpen ? <X size={24} /> : <Plus size={24} />}
            </motion.button>
        </div>
    );
};

export default FAB;
