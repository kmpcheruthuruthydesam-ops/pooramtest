import { useMemo, memo } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { History, Receipt, UserPlus } from 'lucide-react';

const ActivityFeed = memo(() => {
    const { devoteeData = [] } = useData() || {};
    const { t } = useLanguage();
    const combinedActivity = useMemo(() => {
        // Generate pseudo-activity from data
        const activities = (devoteeData || [])
            .flatMap(d => (d.events || []).map(e => ({
                id: e.id,
                title: t.payment_received,
                description: `₹${Number(e.paid).toLocaleString()} ${t.rec_from} ${d.name}`,
                time: e.date,
                icon: <Receipt size={16} />,
                color: 'bg-emerald-50 text-emerald-600'
            })));

        // Add some "New Devotee" entries
        const newDevotees = (devoteeData || []).slice(0, 2).map(d => ({
            id: `NEW-${d.id}`,
            title: t.new_devotee_added_msg,
            description: `${d.name} ${t.added_to_db}`,
            time: t.today_small,
            icon: <UserPlus size={16} />,
            color: 'bg-blue-50 text-blue-600'
        }));

        return [...newDevotees, ...activities]
            .sort((a, b) => {
                if (a.time === t.today_small) return -1;
                if (b.time === t.today_small) return 1;
                return new Date(b.time) - new Date(a.time);
            })
            .slice(0, 4);
    }, [devoteeData, t]);

    return (
        <div className="glass-card p-8 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-8">
                <History className="text-orange-500" size={22} />
                <div>
                    <h3 className="text-xl font-bold text-slate-800">{t.recent_activity}</h3>
                    <p className="text-sm text-slate-400 font-medium">{t.last_system_events}</p>
                </div>
            </div>

            <div className="space-y-6 flex-1">
                {combinedActivity.map((activity, idx) => (
                    <div key={activity.id ? `activity-${activity.id}-${idx}` : `activity-fallback-${idx}`} className="flex gap-4">
                        <div className={`w-10 h-10 ${activity.color} rounded-xl flex items-center justify-center shrink-0`}>
                            {activity.icon}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-black text-slate-800 leading-tight">{activity.title}</h4>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">{activity.description}</p>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter mt-1">{activity.time}</p>
                        </div>
                    </div>
                ))}

                {combinedActivity.length === 0 && (
                    <p className="text-center text-slate-400 font-medium italic mt-12">{t.no_recent_events}</p>
                )}
            </div>
        </div>
    );
});

export default ActivityFeed;
