import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { BookOpen, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

const CURRENT_YEAR = String(new Date().getFullYear());

const EventForm = ({ devoteeId, initialType = 'Pooram', onSuccess, existingEvent }) => {
    const { devoteeData, updateDevotee } = useData();
    const { t, language } = useLanguage();
    const devotee = devoteeData.find(d => d.id === devoteeId);

    const [year, setYear]     = useState(existingEvent?.year  || CURRENT_YEAR);
    const [date, setDate]     = useState(existingEvent?.date  || new Date().toISOString().split('T')[0]);
    const [book, setBook]     = useState(existingEvent?.book  || 'BK-');
    const [leaf, setLeaf]     = useState(existingEvent?.leaf  || 'LF-');
    const [paid, setPaid]     = useState(existingEvent ? String(existingEvent.paid) : '');
    const [unpaid, setUnpaid] = useState(existingEvent ? String(existingEvent.unpaid ?? 0) : '0');
    const [remark, setRemark] = useState(existingEvent?.remark || '');
    const [type, setType]     = useState(existingEvent?.type  || initialType);
    const [isNirapara, setIsNirapara] = useState(existingEvent?.isNirapara || false);

    // Fix 2: inline errors
    const [errors, setErrors] = useState({});

    // Fix 2: auto-calculate balance when paid amount changes
    const handlePaidChange = (val) => {
        setPaid(val);
        setErrors(p => ({ ...p, paid: '' }));
        const paidNum = parseFloat(val) || 0;
        const pendingBalance = Math.max(0, (Number(devotee?.totalPending) || 0) - paidNum);
        setUnpaid(String(pendingBalance));
    };

    const validate = () => {
        const e = {};
        if (!paid || parseFloat(paid) <= 0) e.paid = t.amt_gt_zero;
        if (!date) e.date = t.date_required;
        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!devotee) return;

        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        const paidAmount   = parseFloat(paid) || 0;
        const unpaidAmount = parseFloat(unpaid) || 0;

        if (existingEvent) {
            // Editing: adjust totals by the diff
            const diff = paidAmount - (existingEvent.paid || 0);
            const updatedEvent = { ...existingEvent, date, year, type, book, leaf, paid: paidAmount, unpaid: unpaidAmount, remark, description: `${type} collection (${year})` };
            const updatedDevotee = {
                ...devotee,
                totalPaid: Math.max(0, (Number(devotee.totalPaid) || 0) + diff),
                totalPending: Math.max(0, (Number(devotee.totalPending) || 0) - diff),
                events: devotee.events.map(ev => ev.id === existingEvent.id ? updatedEvent : ev)
            };
            updateDevotee(updatedDevotee);
            toast.success(t.record_updated || 'Record updated successfully');
        } else {
            const newEvent = {
                id: `REC-${Date.now().toString().slice(-6)}`,
                date, year, type, book, leaf,
                paid: paidAmount, unpaid: unpaidAmount,
                remark,
                isNirapara,
                description: `${type} collection (${year})`
            };
            const updatedDevotee = {
                ...devotee,
                totalPaid: (Number(devotee.totalPaid) || 0) + paidAmount,
                totalPending: Math.max(0, (Number(devotee.totalPending) || 0) - paidAmount),
                events: [newEvent, ...(devotee.events || [])]
            };
            updateDevotee(updatedDevotee);
            toast.success(t.payment_recorded || 'Payment recorded successfully');
        }

        onSuccess?.();
    };

    const fieldClass = (f) =>
        `w-full bg-slate-50 border rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 outline-none transition-all font-bold text-slate-900 ${errors[f] ? 'border-rose-400 bg-rose-50/30' : 'border-slate-100'}`;

    const years = [];
    for (let y = parseInt(CURRENT_YEAR); y >= parseInt(CURRENT_YEAR) - 5; y--) years.push(String(y));

    return (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6" noValidate>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t.event_type}</label>
                    <select
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-orange-500/20 outline-none font-bold text-slate-900 cursor-pointer"
                        value={type}
                        onChange={e => setType(e.target.value)}
                    >
                        <option value="Pooram">{t.pooram_option}</option>
                        <option value="Ayyappan Vilakku">{t.vilakku_option}</option>
                        <option value="General">{t.general_option}</option>
                    </select>
                </div>
                <div>
                    {/* Fix 2: year defaults to current year */}
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Year</label>
                    <select
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-orange-500/20 outline-none font-bold text-slate-900 cursor-pointer"
                        value={year}
                        onChange={e => setYear(e.target.value)}
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t.year}</label>
                    <input
                        type="date"
                        className={`${fieldClass('date')} px-5 py-3.5`}
                        value={date}
                        onChange={e => { setDate(e.target.value); setErrors(p => ({ ...p, date: '' })); }}
                    />
                    {errors.date && <p className="text-rose-500 text-xs font-bold mt-1 px-1">{errors.date}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t.book_no}</label>
                        <input
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-3 py-3.5 focus:ring-2 focus:ring-orange-500/20 outline-none font-bold text-slate-900"
                            value={book}
                            onChange={e => setBook(e.target.value)}
                            placeholder="BK-"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t.leaf_no}</label>
                        <input
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-3 py-3.5 focus:ring-2 focus:ring-orange-500/20 outline-none font-bold text-slate-900"
                            value={leaf}
                            onChange={e => setLeaf(e.target.value)}
                            placeholder="LF-"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t.paid_amt_label} *</label>
                    <div className="relative">
                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            className={`${fieldClass('paid')} pl-10 pr-5 py-3.5`}
                            value={paid}
                            onChange={e => handlePaidChange(e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    {errors.paid && <p className="text-rose-500 text-xs font-bold mt-1 px-1">{errors.paid}</p>}
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t.balance_label}</label>
                    <input
                        type="number"
                        readOnly
                        disabled
                        className="w-full bg-slate-100 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none font-bold text-slate-400 cursor-not-allowed"
                        value={unpaid}
                        placeholder="0"
                    />
                    <p className="text-[10px] text-slate-400 font-bold mt-1 px-1">{t.auto_calc_hint}</p>
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">{t.remark}</label>
                <textarea
                    rows="1"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-orange-500/20 outline-none font-bold text-slate-900 resize-none"
                    value={remark}
                    onChange={e => setRemark(e.target.value)}
                    placeholder={t.remark_placeholder}
                />
            </div>

            <div className="pt-2">
                <label 
                    className="flex items-center gap-4 p-4 bg-orange-50/50 border border-orange-100/50 rounded-2xl cursor-pointer hover:bg-orange-50 transition-colors group"
                >
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={isNirapara}
                            onChange={e => setIsNirapara(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </div>
                    <span className="text-sm font-black text-slate-700 group-hover:text-orange-600 transition-colors">{t.nirapara} {language === 'ml' ? 'ആണോ?' : ''}</span>
                </label>
            </div>

            <button type="submit" className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black shadow-xl shadow-orange-100 hover:bg-orange-600 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4">
                <BookOpen size={20} />
                {existingEvent ? t.update_event : t.save_event}
            </button>
        </form>
    );
};

export default EventForm;
