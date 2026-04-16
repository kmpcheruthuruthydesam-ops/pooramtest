import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import MetricCard from '../components/MetricCard';
import { Users, IndianRupee, Clock, Wallet, TrendingUp, PieChart as PieIcon, UserPlus, BadgeIndianRupee, AlertCircle, MessageSquare } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import PendingPayments from '../components/PendingPayments';
import ActivityFeed from '../components/ActivityFeed';
import { useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
    const { devoteeData = [], privacyMode, maskValue } = useData() || {};
    const { t } = useLanguage();
    const navigate = useNavigate();

    // Fix 10: chart date range state — '3m' | '6m' | '1y' | 'all'
    const [chartRange, setChartRange] = useState('6m');

    // Safeguard stats calculation
    const stats = useMemo(() => {
        const data = Array.isArray(devoteeData) ? devoteeData : [];
        return {
            totalDevotees: data.length,
            totalExpected: data.reduce((sum, d) => sum + (Number(d?.totalExpected) || 0), 0),
            totalPaid:     data.reduce((sum, d) => sum + (Number(d?.totalPaid) || 0), 0),
            totalPending:  data.reduce((sum, d) => sum + (Number(d?.totalPending) || 0), 0)
        };
    }, [devoteeData]);

    // Fix 10 + Issue 5: build real monthly collection data filtered by chartRange
    const monthlyCollectionData = useMemo(() => {
        const monthMap = {};
        (Array.isArray(devoteeData) ? devoteeData : []).forEach(d => {
            (d.events || []).forEach(e => {
                if (!e.date || !e.paid) return;
                const [year, month] = e.date.split('-');
                if (!year || !month) return;
                const key = `${year}-${month}`;
                monthMap[key] = (monthMap[key] || 0) + (Number(e.paid) || 0);
            });
        });

        const sorted = Object.keys(monthMap).sort();

        // Apply range filter
        let slice = sorted;
        if (chartRange === '3m') slice = sorted.slice(-3);
        else if (chartRange === '6m') slice = sorted.slice(-6);
        else if (chartRange === '1y') slice = sorted.slice(-12);

        const labels = slice.map(k => {
            const [y, m] = k.split('-');
            return `${new Date(0, parseInt(m) - 1).toLocaleString('default', { month: 'short' })} '${y.slice(2)}`;
        });
        const data = slice.map(k => monthMap[k]);

        if (slice.length === 0) return { labels: ['—'], data: [0] };
        return { labels, data };
    }, [devoteeData, chartRange]);

    const lineData = useMemo(() => ({
        labels: monthlyCollectionData.labels,
        datasets: [{
            label: 'Collections (₹)',
            data: monthlyCollectionData.data,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#f97316',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
        }]
    }), [monthlyCollectionData]);

    const doughnutData = useMemo(() => ({
        labels: [t.paid, t.pending],
        datasets: [{
            data: [stats.totalPaid, stats.totalPending],
            backgroundColor: ['#10b981', '#f43f5e'],
            borderWidth: 0,
            hoverOffset: 15
        }]
    }), [t.paid, t.pending, stats.totalPaid, stats.totalPending]);

    // E: month-over-month trend
    const momTrend = useMemo(() => {
        const d = monthlyCollectionData.data;
        if (d.length < 2) return null;
        const prev = d[d.length - 2];
        const curr = d[d.length - 1];
        if (!prev) return null;
        const pct = Math.round(((curr - prev) / prev) * 100);
        return { pct, up: curr >= prev };
    }, [monthlyCollectionData]);

    // B: top 3 overdue devotees
    const topOverdue = useMemo(() =>
        (Array.isArray(devoteeData) ? devoteeData : [])
            .filter(d => (Number(d.totalPending) || 0) > 0)
            .sort((a, b) => (Number(b.totalPending) || 0) - (Number(a.totalPending) || 0))
            .slice(0, 3),
    [devoteeData]);

    // Issue 4 fix: gather real recent transactions across all devotees, sorted by date desc
    const recentTransactions = useMemo(() => {
        const all = [];
        (Array.isArray(devoteeData) ? devoteeData : []).forEach(d => {
            (d.events || []).forEach(e => {
                all.push({ ...e, devoteeName: d.name, devoteeId: d.id });
            });
        });
        return all
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
    }, [devoteeData]);

    return (
        <div className="space-y-10 pb-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <h1 className="text-5xl md:text-6xl font-serif text-slate-800 tracking-tight leading-tight mb-3">
                        {t.welcome_title} <span className="text-orange-500 italic">Om.</span>
                    </h1>
                    <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-lg">{t.welcome_subtitle}</p>
                </motion.div>


            </header>

            {/* ═══ Hyper-Premium Bento Grid ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-2 md:row-span-2"
                >
                    <MetricCard 
                        allowPrivacy={false} 
                        type="blue" 
                        icon={<Users size={32} />} 
                        label={t.total_devotees} 
                        value={Number(stats.totalDevotees).toLocaleString()} 
                        trendData={[800, 850, 900, 920, 950, Number(stats.totalDevotees)]}
                        change={5.2}
                        large
                    />
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="md:col-span-2 md:row-span-1"
                >
                    <MetricCard 
                        type="green" 
                        icon={<BadgeIndianRupee size={24} />} 
                        label={t.total_collected} 
                        value={`₹${Number(stats.totalPaid).toLocaleString()}`} 
                        trendData={monthlyCollectionData.data}
                        change={momTrend?.pct || 0}
                    />
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="md:col-span-1 md:row-span-1"
                >
                    <MetricCard 
                        type="red" 
                        icon={<Clock size={24} />} 
                        label={t.total_pending} 
                        value={`₹${Number(stats.totalPending).toLocaleString()}`} 
                        trendData={[1500000, 1800000, 2000000, 2100000, Number(stats.totalPending)]}
                    />
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="md:col-span-1 md:row-span-1"
                >
                    <MetricCard 
                        type="orange" 
                        icon={<Wallet size={24} />} 
                        label={t.total_expected} 
                        value={`₹${Number(stats.totalExpected).toLocaleString()}`} 
                    />
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-8 dashboard-chart">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <TrendingUp className="text-orange-500" /> {t.collection_trend}
                            </h3>
                            {momTrend ? (
                                <p className={`text-sm font-bold flex items-center gap-1 mt-0.5 ${momTrend.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {momTrend.up ? '↑' : '↓'} {Math.abs(momTrend.pct)}% {t.from_last_month}
                                </p>
                            ) : (
                                <p className="text-sm text-slate-400 font-medium">{t.revenue_analysis}</p>
                            )}
                        </div>
                        {/* Fix 10: date range segmented control */}
                        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                            {[['3m','3M'],['6m','6M'],['1y','1Y'],['all','All']].map(([val, lbl]) => (
                                <button
                                    key={val}
                                    onClick={() => setChartRange(val)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${chartRange === val ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {lbl}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <Line data={lineData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="glass-card p-8 dashboard-chart">
                    <div className="text-center mb-8">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-3">
                            <PieIcon className="text-emerald-500" /> {t.status_distribution}
                        </h3>
                        <p className="text-sm text-slate-400 font-medium">{t.fulfillment_ratio}</p>
                    </div>
                    <div className="h-[250px] relative">
                        <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, cutout: '75%' }} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-3xl font-black text-slate-800">
                                {Math.round((Number(stats.totalPaid) / (Number(stats.totalExpected) || 1)) * 100)}%
                            </p>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">{t.collection_rate}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <ActivityFeed />
                </div>
                <div className="lg:col-span-1">
                    <PendingPayments />
                </div>
                <div className="lg:col-span-1 flex flex-col gap-6">
                    {topOverdue.length > 0 ? (
                        /* B: Top overdue devotees card */
                        <div className="glass-card p-8 flex-1 flex flex-col">
                            <h3 className="text-base font-black text-slate-800 flex items-center gap-2 mb-5">
                                <AlertCircle size={18} className="text-rose-500" /> {t.urgent_collections}
                            </h3>
                            <div className="space-y-3 flex-1">
                                {topOverdue.map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => navigate(`/profile/${d.id}`)}
                                        className="w-full flex items-center justify-between p-3 bg-rose-50/50 hover:bg-rose-50 rounded-2xl transition-all group/item"
                                    >
                                        <div className="text-left">
                                            <p className="text-sm font-black text-slate-800 group-hover/item:text-rose-600 transition-colors">{d.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{d.phone}</p>
                                        </div>
                                        <span className="text-sm font-black text-rose-500">₹{Number(d.totalPending).toLocaleString()}</span>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => navigate('/devotees?status=Pending')}
                                className="mt-5 w-full py-3 bg-rose-500 text-white rounded-2xl font-bold text-sm hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                            >
                                <MessageSquare size={15} /> {t.view_all_pending}
                            </button>
                        </div>
                    ) : (
                        /* Quick Tip fallback when nothing is overdue */
                        <div className="glass-card p-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white flex-1 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                            <h3 className="text-xl font-black mb-4">{t.quick_tip}</h3>
                            <p className="text-sm font-bold text-orange-50 leading-relaxed mb-6">{t.quick_tip_body}</p>
                            <button onClick={() => navigate('/devotees')} className="px-6 py-3 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl font-bold text-sm transition-all">
                                {t.view_devotees}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Issue 4 fix: show real recent transactions */}
            <div className="glass-card overflow-hidden">
                <div className="px-8 py-6 border-b border-white/40 flex items-center justify-between bg-white/20">
                    <h3 className="text-xl font-bold text-slate-800">{t.recent_collections}</h3>
                    <button onClick={() => navigate('/collections')} className="text-orange-600 text-[13px] font-black hover:underline">{t.view_all_records}</button>
                </div>

                {/* Mobile View (Cards) */}
                <div className="md:hidden divide-y divide-slate-100/30">
                    {recentTransactions.map((txn, idx) => (
                        <div key={`txn-mob-${idx}`} className="p-5 active:bg-slate-50 transition-colors flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                <IndianRupee size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <p className="text-[14px] font-bold text-slate-900 truncate">{txn.devoteeName}</p>
                                    <span className="text-[14px] font-black text-emerald-600">
                                        {maskValue(`₹${Number(txn.paid || 0).toLocaleString()}`)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-medium text-slate-400">
                                    <span>{txn.date}</span>
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter">#{txn.id || '—'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {recentTransactions.length === 0 && (
                        <div className="p-12 text-center text-slate-400 text-sm font-medium">
                            {t.no_transactions_yet}
                        </div>
                    )}
                </div>

                {/* Desktop View (Table) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-bold uppercase tracking-widest px-8">
                                <th className="px-8 py-4">{t.receipt_id}</th>
                                <th className="px-8 py-4">{t.date}</th>
                                <th className="px-8 py-4">{t.devotee_name}</th>
                                <th className="px-8 py-4">{t.type}</th>
                                <th className="px-8 py-4 text-right">{t.amount}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/20">
                            {recentTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-8 text-center text-sm text-slate-400 font-medium">
                                        {t.no_transactions_yet}
                                    </td>
                                </tr>
                            ) : recentTransactions.map((txn, idx) => (
                                <motion.tr
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={txn.id ? `txn-${txn.id}-${idx}` : `txn-fallback-${idx}`}
                                    className="hover:bg-white/40 transition-colors group"
                                >
                                    <td className="px-8 py-4 font-mono text-xs text-slate-400 group-hover:text-orange-500 transition-colors">#{txn.id || '—'}</td>
                                    <td className="px-8 py-4 text-sm font-medium text-slate-600">{txn.date || '—'}</td>
                                    <td className="px-8 py-4 text-sm font-bold text-slate-800">{txn.devoteeName || '—'}</td>
                                    <td className="px-8 py-4 text-xs font-bold text-slate-500">{txn.type || '—'}</td>
                                    <td className="px-8 py-4 text-sm font-black text-emerald-600 text-right">
                                        {maskValue(`₹${Number(txn.paid || 0).toLocaleString()}`)}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
