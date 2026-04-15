import { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Eye, EyeOff } from 'lucide-react';

const MetricCard = memo(({ icon, label, value, type = 'orange', allowPrivacy = true, onClick }) => {
    const { privacyMode, togglePrivacyMode } = useData() || {};

    const colorConfigs = {
        blue: { text: 'text-blue-600', bg: 'bg-blue-50' },
        green: { text: 'text-emerald-600', bg: 'bg-emerald-50' },
        red: { text: 'text-rose-600', bg: 'bg-rose-50' },
        orange: { text: 'text-orange-600', bg: 'bg-orange-50' },
    };

    const colors = colorConfigs[type] || colorConfigs.orange;

    // Mask value if privacy mode is active
    const maskedValue = useMemo(() => {
        if (!privacyMode || !value || !allowPrivacy) return value;
        // Keep symbols like ₹ and commas, mask digits
        return value.replace(/[0-9]/g, '*');
    }, [value, privacyMode, allowPrivacy]);

    return (
        <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            className="glass-card p-6 flex items-center gap-6 cursor-pointer hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group"
            onClick={onClick}
        >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${colors.text} ${colors.bg}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <p className="text-2xl font-extrabold text-slate-800 tracking-tight">
                        {maskedValue || '0'}
                    </p>
                    {allowPrivacy && (
                        <button
                            onClick={(e) => { e.stopPropagation(); togglePrivacyMode(); }}
                            className="p-1.5 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all opacity-40 group-hover:opacity-100"
                            title={privacyMode ? "Show Amount" : "Hide Amount"}
                        >
                            {privacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

export default MetricCard;
