import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { 
    Layers, Plus, Search, Calendar, Info, Package, 
    Trash2, Smartphone, Receipt, User
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';

const Other = () => {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const { userRole } = useAuth();
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        receipt: '',
        name: '',
        amount: '',
        gpay: false,
        np: false
    });

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('collections')
            .select('*')
            .is('devotee_id', null)
            .order('date', { ascending: false });
        
        if (error) {
            toast.error('Failed to load records: ' + error.message);
        } else {
            setRecords(data || []);
        }
        setIsLoading(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const newRecord = {
            id: formData.receipt || `RC-${Date.now().toString().slice(-4)}`,
            date: new Date().toISOString().split('T')[0],
            description: formData.name, // Mapping name to description for misc entries
            paid: Number(formData.amount),
            unpaid: 0,
            devotee_id: null,
            type: 'Other',
            remark: formData.gpay ? 'GPay' : 'Cash',
            year: String(new Date().getFullYear())
        };
        
        const { error } = await supabase
            .from('collections')
            .insert([newRecord]);
        
        if (error) {
            toast.error('Failed to add record: ' + error.message);
        } else {
            toast.success('Record added successfully');
            fetchRecords();
            setIsModalOpen(false);
            setFormData({ receipt: '', name: '', amount: '', gpay: false, np: false });
        }
    };

    const handleDelete = async (id) => {

        const { error } = await supabase
            .from('collections')
            .delete()
            .eq('id', id);
        
        if (error) {
            toast.error('Failed to delete: ' + error.message);
        } else {
            toast.success('Record deleted');
            fetchRecords();
        }
    };

    const filteredRecords = records.filter(r => 
        (r.description || '').toLowerCase().includes(search.toLowerCase()) || 
        (r.id || '').toLowerCase().includes(search.toLowerCase())
    );

    const totalAmount = records.reduce((sum, r) => sum + (Number(r.paid) || 0), 0);

    return (
        <div className="space-y-8 pb-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">{t.other_nav}</h1>
                    <p className="text-slate-400 font-medium flex items-center gap-2">
                        <Layers size={16} /> Manage miscellaneous temple collections and activities
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-xl shadow-orange-100"
                    >
                        <Plus size={18} /> {t.add_receipt || 'Add Receipt'}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-8 group">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Package size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Records</p>
                    <p className="text-3xl font-black text-slate-800 tracking-tight">{records.length}</p>
                </div>
                <div className="glass-card p-8 group">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Calendar size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Amount</p>
                    <p className="text-3xl font-black text-slate-800 tracking-tight">₹{totalAmount.toLocaleString()}</p>
                </div>
                <div className="glass-card p-8 group">
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Smartphone size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">GPay Transactions</p>
                    <p className="text-3xl font-black text-slate-800 tracking-tight">{records.filter(r => r.remark === 'GPay').length}</p>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Find records..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-3.5 focus:ring-2 focus:ring-orange-500/20 outline-none font-bold text-slate-900 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-white/20">
                                <th className="px-8 py-6">Receipt</th>
                                <th className="px-8 py-6">Date</th>
                                <th className="px-8 py-6">Record Name</th>
                                <th className="px-8 py-6">Amount</th>
                                <th className="px-8 py-6">Method</th>
                                <th className="px-8 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/20">
                            {filteredRecords.map((act) => (
                                <tr key={act.id} className="hover:bg-white/40 transition-colors group">
                                    <td className="px-8 py-5 text-[10px] font-mono font-black text-slate-400">{act.id}</td>
                                    <td className="px-8 py-5 text-xs font-bold text-slate-400">{act.date}</td>
                                    <td className="px-8 py-5 text-[13px] font-bold text-slate-700">{act.description}</td>
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-black text-slate-900">₹{(Number(act.paid) || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        {act.remark === 'GPay' ? (
                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-tight">GPay</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-tight">Cash</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button 
                                            onClick={() => handleDelete(act.id)}
                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredRecords.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-8 py-20 text-center text-slate-400 font-bold">No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Miscellaneous Entry">
                <form onSubmit={handleAdd} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Receipt No</label>
                            <div className="relative">
                                <Receipt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-3.5 focus:ring-2 focus:ring-orange-500/20 outline-none font-bold text-slate-900"
                                    value={formData.receipt}
                                    onChange={e => setFormData({...formData, receipt: e.target.value})}
                                    placeholder="Auto-gen"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input 
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-3.5 focus:ring-2 focus:ring-orange-500/20 outline-none font-bold text-slate-900"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="Enter Name"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Amount (₹)</label>
                        <input 
                            required
                            type="number"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-orange-500/20 outline-none font-black text-slate-900 text-lg"
                            value={formData.amount}
                            onChange={e => setFormData({...formData, amount: e.target.value})}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all group">
                            <input 
                                type="checkbox"
                                className="peer sr-only"
                                checked={formData.gpay}
                                onChange={e => setFormData({...formData, gpay: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                            <span className="text-xs font-black text-slate-600 group-hover:text-blue-600">GPay</span>
                        </label>
                        <label className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all group">
                            <input 
                                type="checkbox"
                                className="peer sr-only"
                                checked={formData.np}
                                onChange={e => setFormData({...formData, np: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                            <span className="text-xs font-black text-slate-600 group-hover:text-orange-600">NP</span>
                        </label>
                    </div>

                    <button type="submit" className="w-full py-4.5 bg-orange-500 text-white rounded-2xl font-black shadow-xl shadow-orange-100 hover:bg-orange-600 hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                        <Plus size={20} /> Add Record
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Other;
