import { useMemo, memo } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const PendingPayments = memo(() => {
    const { devoteeData = [] } = useData() || {};
    const { t } = useLanguage();

    // Get top 5 pending devotees - Memoized
    const pendingDevotees = useMemo(() => {
        return [...devoteeData]
            .filter(d => Number(d.totalPending) > 0)
            .sort((a, b) => Number(b.totalPending) - Number(a.totalPending))
            .slice(0, 5);
    }, [devoteeData]);

    return (
        <div className="glass-card p-8 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">{t.pending_payments || 'Pending Payments'}</h3>
                    <p className="text-sm text-slate-400 font-medium">{t.top_pending_desc}</p>
                </div>
                <Link to="/devotees" className="p-2 bg-slate-50 text-slate-400 hover:text-orange-500 rounded-xl transition-all">
                    <ArrowRight size={20} />
                </Link>
            </div>

            <div className="space-y-6 flex-1">
                {pendingDevotees.map((devotee, idx) => {
                    const progress = Math.min(100, (Number(devotee.totalPaid) / (Number(devotee.totalExpected) || 1)) * 100);
                    return (
                        <div key={devotee.id} className="group cursor-pointer">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <h4 className="text-sm font-black text-slate-800 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{devotee.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{devotee.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-rose-500 tracking-tight">₹{Number(devotee.totalPending).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, delay: idx * 0.1 }}
                                    className={`h-full rounded-full ${progress < 30 ? 'bg-rose-500' : progress < 70 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                />
                            </div>
                        </div>
                    );
                })}

                {pendingDevotees.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">🎉</span>
                        </div>
                        <p className="text-slate-400 font-bold text-sm">{t.all_payments_cleared}</p>
                    </div>
                )}
            </div>
        </div>
    );
});

export default PendingPayments;
