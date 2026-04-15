import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { BadgeIndianRupee, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

const PAYMENT_METHODS = ['Cash', 'Cheque', 'Online Transfer', 'Other'];

const PaymentForm = ({ devoteeId, onSuccess }) => {
    const { devoteeData, updateDevotee } = useData();
    const { t } = useLanguage();
    const PAYMENT_METHODS = [
        { id: 'Cash', label: t.cash },
        { id: 'Cheque', label: t.cheque },
        { id: 'Online Transfer', label: t.online_transfer },
        { id: 'Other', label: t.other }
    ];

    const [selectedId, setSelectedId] = useState(devoteeId || '');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('Donation');
    const [method, setMethod] = useState('Cash');
    const [description, setDescription] = useState('');
    const [errors, setErrors] = useState({});

    // Fix 8: show selected devotee's pending balance
    const selectedDevotee = useMemo(
        () => devoteeData.find(d => d.id === (selectedId || devoteeId)),
        [devoteeData, selectedId, devoteeId]
    );

    // Auto-fill amount with pending balance when devotee is selected
    const handleDevoteeChange = (id) => {
        setSelectedId(id);
        const d = devoteeData.find(dev => dev.id === id);
        if (d && Number(d.totalPending) > 0) {
            setAmount(String(d.totalPending));
        } else {
            setAmount('');
        }
        setErrors({});
    };

    const validate = () => {
        const e = {};
        if (!selectedDevotee) e.devotee = t.select_devotee;
        if (!amount || parseFloat(amount) <= 0) e.amount = t.amount_required;
        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        const devotee = selectedDevotee;
        const paidAmount = parseFloat(amount);
        const newPending = Math.max(0, (devotee.totalPending || 0) - paidAmount);

        const newEvent = {
            id: `REC-${Date.now().toString().slice(-6)}`,
            date: new Date().toISOString().split('T')[0],
            type,
            method,
            description,
            paid: paidAmount,
            unpaid: 0
        };

        const updatedDevotee = {
            ...devotee,
            totalPaid: (devotee.totalPaid || 0) + paidAmount,
            totalPending: newPending,
            status: newPending <= 0 ? 'Paid' : 'Pending',
            events: [newEvent, ...(devotee.events || [])]
        };

        updateDevotee(updatedDevotee);
        toast.success(`${t.payment_recorded_for} ${devotee.name}: ₹${paidAmount.toLocaleString()}`);
        onSuccess?.();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {!devoteeId && (
                <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">{t.select_devotee} *</label>
                    <select
                        className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-orange-500/20 outline-none font-bold cursor-pointer ${errors.devotee ? 'border-rose-400' : 'border-slate-100'}`}
                        value={selectedId}
                        onChange={e => handleDevoteeChange(e.target.value)}
                    >
                        <option value="">— {t.select_devotee} —</option>
                        {devoteeData.map(d => (
                            <option key={d.id} value={d.id}>{d.name} (#{d.id})</option>
                        ))}
                    </select>
                    {errors.devotee && <p className="text-rose-500 text-xs font-bold mt-1 px-1">{errors.devotee}</p>}

                    {/* Fix 8: pending balance hint */}
                     {selectedDevotee && (
                        <div className={`mt-2 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${Number(selectedDevotee.totalPending) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            <IndianRupee size={14} />
                            {Number(selectedDevotee.totalPending) > 0
                                ? `${t.pending}: ₹${Number(selectedDevotee.totalPending).toLocaleString()}`
                                : t.no_pending_amount}
                        </div>
                    )}
                </div>
            )}

            {/* Show pending hint when devoteeId is pre-set */}
             {devoteeId && selectedDevotee && Number(selectedDevotee.totalPending) > 0 && (
                <div className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-rose-50 text-rose-600">
                    <IndianRupee size={14} />
                    {t.pending}: ₹{Number(selectedDevotee.totalPending).toLocaleString()}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">{t.paid} (₹) *</label>
                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className={`w-full bg-slate-50 border rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-orange-500/20 outline-none font-bold ${errors.amount ? 'border-rose-400 bg-rose-50/30' : 'border-slate-100'}`}
                        value={amount}
                        onChange={e => { setAmount(e.target.value); setErrors(p => ({ ...p, amount: '' })); }}
                        placeholder="₹ 0.00"
                    />
                    {errors.amount && <p className="text-rose-500 text-xs font-bold mt-1 px-1">{errors.amount}</p>}
                </div>
                 <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">{t.type}</label>
                    <select
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-orange-500/20 outline-none font-bold cursor-pointer"
                        value={type}
                        onChange={e => setType(e.target.value)}
                    >
                        <option value="Donation">{t.donation}</option>
                        <option value="Monthly Contribution">{t.monthly_contribution}</option>
                    </select>
                </div>
            </div>

            {/* Fix 8: payment method field */}
             <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">{t.payment_method}</label>
                <div className="flex gap-2 flex-wrap">
                    {PAYMENT_METHODS.map(m => (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => setMethod(m.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${method === m.id ? 'bg-orange-500 text-white shadow-md shadow-orange-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">{t.purpose_note}</label>
                 <input
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-orange-500/20 outline-none font-bold"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={t.purpose_placeholder}
                />
            </div>

            <button type="submit" className="w-full py-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-100 hover:shadow-2xl transition-all flex items-center justify-center gap-2 mt-4">
                <BadgeIndianRupee size={20} />
                {t.confirm_payment}
            </button>
        </form>
    );
};

export default PaymentForm;
