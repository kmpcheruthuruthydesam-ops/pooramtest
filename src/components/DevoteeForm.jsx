import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { UserPlus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Haptics } from '../lib/haptics';

const DevoteeForm = ({ devotee, onSuccess }) => {
    const { addDevotee, updateDevotee, getNextDevoteeId } = useData() || {};
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        phone: '',
        address: '',
        totalExpected: '',
        totalPaid: 0,
        totalPending: 0,
        status: 'Pending',
        isNirapara: false,
        events: []
    });

    // Fix 2: inline validation errors
    const [errors, setErrors] = useState({});
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        if (devotee) {
            setFormData(devotee);
        } else if (getNextDevoteeId) {
            setFormData(prev => ({ ...prev, id: getNextDevoteeId() }));
        }
    }, [devotee, getNextDevoteeId]);

    const validate = () => {
        const e = {};
        if (!formData.name.trim()) e.name = t.name_required;
        if (!formData.phone.trim()) {
            e.phone = t.phone_required;
        } else if (!/^\+?[\d\s\-]{7,15}$/.test(formData.phone.trim())) {
            e.phone = t.invalid_phone;
        }
        if (!formData.totalExpected || Number(formData.totalExpected) <= 0) {
            e.totalExpected = t.amount_required;
        }
        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            Haptics.errorBuzz();
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 400);
            return;
        }
        setErrors({});

        const expected = parseFloat(formData.totalExpected) || 0;
        const paid = parseFloat(formData.totalPaid) || 0;
        const pending = expected - paid;

        const finalData = {
            ...formData,
            totalExpected: expected,
            totalPaid: paid,
            totalPending: pending,
            status: pending <= 0 ? 'Paid' : 'Pending'
        };

        if (devotee) {
            updateDevotee(finalData);
            toast.success(t.record_updated);
            Haptics.successDouble();
        } else {
            addDevotee(finalData);
            toast.success(t.record_created);
            Haptics.successDouble();
        }

        setTimeout(() => onSuccess?.(), 50);
    };

    const fieldClass = (field) =>
        `w-full bg-white border rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 outline-none transition-all font-bold text-slate-900 shadow-sm ${errors[field] ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'}`;

    return (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-1">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">ID</label>
                        <input
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none transition-all font-mono text-xs font-bold text-slate-400"
                            value={formData.id}
                            onChange={e => setFormData({ ...formData, id: e.target.value })}
                            placeholder="DEV-0000"
                            readOnly={!!devotee}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">{t.name} *</label>
                        <input
                            className={fieldClass('name')}
                            value={formData.name}
                            onChange={e => { setFormData({ ...formData, name: e.target.value }); setErrors(p => ({ ...p, name: '' })); }}
                            placeholder={t.full_name_placeholder}
                        />
                        {errors.name && <p className="text-rose-500 text-xs font-bold mt-1 px-1">{errors.name}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">{t.phone} *</label>
                        <input
                            type="tel"
                            className={fieldClass('phone')}
                            value={formData.phone}
                            onChange={e => { setFormData({ ...formData, phone: e.target.value }); setErrors(p => ({ ...p, phone: '' })); }}
                            placeholder={t.phone_placeholder}
                        />
                        {errors.phone && <p className="text-rose-500 text-xs font-bold mt-1 px-1">{errors.phone}</p>}
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">{t.expected_amt_label} *</label>
                        <input
                            type="number"
                            min="1"
                            className={fieldClass('totalExpected')}
                            value={formData.totalExpected}
                            onChange={e => { setFormData({ ...formData, totalExpected: e.target.value }); setErrors(p => ({ ...p, totalExpected: '' })); }}
                            placeholder="₹ 0.00"
                        />
                        {errors.totalExpected && <p className="text-rose-500 text-xs font-bold mt-1 px-1">{errors.totalExpected}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">{t.address}</label>
                    <textarea
                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 outline-none transition-all font-bold text-slate-900 resize-none shadow-sm"
                        rows="3"
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        placeholder={t.address_placeholder}
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
                                checked={formData.isNirapara}
                                onChange={e => {
                                    Haptics.lightTick();
                                    setFormData({ ...formData, isNirapara: e.target.checked });
                                }}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </div>
                        <span className="text-sm font-black text-slate-700 group-hover:text-orange-600 transition-colors">{t.nirapara}</span>
                    </label>
                </div>
            </div>

            <button 
                type="submit" 
                className={`w-full py-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl font-bold shadow-xl shadow-orange-100 hover:shadow-2xl transition-all flex items-center justify-center gap-2 mt-4 ${isShaking ? 'animate-shake' : ''}`}
            >
                {devotee ? <Save size={20} /> : <UserPlus size={20} />}
                {devotee ? t.update_records : t.register_devotee}
            </button>
        </form>
    );
};

export default DevoteeForm;
