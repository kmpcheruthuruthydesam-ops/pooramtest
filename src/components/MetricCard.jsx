import { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import Sparkline from './Sparkline';

const MetricCard = memo(({ icon, label, value, type = 'orange', allowPrivacy = true, onClick, large = false, trendData = [], change = 0 }) => {
    const { privacyMode, togglePrivacyMode } = useData() || {};

    const colorConfigs = {
        blue: { text: 'text-blue-600', bg: 'bg-blue-50/50', iconBg: 'from-blue-100 to-blue-50', spark: '#3b82f6' },
        green: { text: 'text-emerald-600', bg: 'bg-emerald-50/50', iconBg: 'from-emerald-100 to-emerald-50', spark: '#10b981' },
        red: { text: 'text-rose-600', bg: 'bg-rose-50/50', iconBg: 'from-rose-100 to-rose-50', spark: '#f43f5e' },
        orange: { text: 'text-orange-600', bg: 'bg-orange-50/50', iconBg: 'from-orange-100 to-orange-50', spark: '#f97316' },
    };

    const colors = colorConfigs[type] || colorConfigs.orange;

    const maskedValue = useMemo(() => {
        if (!privacyMode || !value || !allowPrivacy) return value;
        return value.toString().replace(/[0-9]/g, '∗'); 
    }, [value, privacyMode, allowPrivacy]);

    return (
        <motion.div 
            whileHover={window.innerWidth > 768 ? { y: -4, scale: 1.005 } : {}}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`
                glass-card flex flex-col justify-between h-full transition-all duration-500 group relative overflow-hidden
                ${large ? 'p-8 gap-8' : 'p-6 gap-4'}
            `}
            onClick={onClick}
        >
            {/* Background Decorative Sparkline for Large Cards */}
            {large && trendData.length > 0 && (
                <div className="absolute bottom-0 right-0 left-0 h-1/2 opacity-20 pointer-events-none translate-y-4">
                    <Sparkline data={trendData} color={colors.spark} width={400} height={100} />
                </div>
            )}

            <div className="flex justify-between items-start z-10">
                <div className={`
                    rounded-2xl flex items-center justify-center bg-gradient-to-br ${colors.iconBg} ${colors.text} shadow-sm shrink-0
                    ${large ? 'w-16 h-16' : 'w-12 h-12'}
                `}>
                    <div className={large ? 'scale-125' : 'scale-90'}>{icon}</div>
                </div>

                {!large && trendData.length > 0 && (
                    <div className="mt-2">
                        <Sparkline data={trendData} color={colors.spark} width={80} height={30} />
                    </div>
                )}
            </div>
            
            <div className="flex-1 min-w-0 z-10">
                <div className="flex items-center justify-between mb-1">
                    <p className={`font-black text-slate-400 uppercase tracking-[0.12em] ${large ? 'text-xs' : 'text-[10px]'}`}>{label}</p>
                    {change !== 0 && (
                        <div className={`flex items-center gap-0.5 font-black text-[10px] ${change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {Math.abs(change)}%
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-1.5">
                    <p className={`font-black tracking-tight leading-none text-slate-900 ${large ? 'text-4xl md:text-5xl' : 'text-[24px]'}`}>
                        {maskedValue || '0'}
                    </p>
                    {allowPrivacy && (
                        <button
                            onClick={(e) => { e.stopPropagation(); togglePrivacyMode(); }}
                            className="p-1 text-slate-300 hover:text-orange-500 rounded-md transition-all opacity-0 group-hover:opacity-100"
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
