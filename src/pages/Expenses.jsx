import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Plus, Trash2, Receipt, ReceiptText, Calendar, FileDown, Filter, ChevronUp, ChevronDown, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../components/Modal';

const getCategoryStyle = (cat) => CATEGORY_STYLES[cat] || 'bg-slate-100 text-slate-500';

const CATEGORY_STYLES = {
    'General': 'bg-slate-50 text-slate-600',
};

const CATEGORY_BAR = {
    'General': 'bg-slate-400',
};

const SortHeader = ({ label, field, sort, onSort, className = '' }) => (
    <th
        className={`px-8 py-6 cursor-pointer select-none group ${className}`}
        onClick={() => onSort(field)}
    >
        <span className="flex items-center gap-1.5">
            {label}
            <span className="flex flex-col opacity-0 group-hover:opacity-60 transition-opacity">
                <ChevronUp size={10} className={sort.field === field && sort.dir === 'asc' ? 'opacity-100 text-orange-500' : ''} />
                <ChevronDown size={10} className={sort.field === field && sort.dir === 'desc' ? 'opacity-100 text-orange-500' : ''} />
            </span>
        </span>
    </th>
);

const Expenses = () => {
    const { 
        expenses, addExpense, deleteExpense, updateExpense, exportExpensesToCSV,
        expenseCategories, addExpenseCategory, deleteExpenseCategory, maskValue, isLoading
    } = useData() || {};
    const { t } = useLanguage();
    const { userRole } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);
    const [sort, setSort] = useState({ field: 'date', dir: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 25;

    const handleSort = (field) => {
        setSort(prev => prev.field === field
            ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
            : { field, dir: 'asc' }
        );
        setCurrentPage(1);
    };

    const handleDeleteClick = (expense) => {
        setExpenseToDelete(expense);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (expenseToDelete) {
            deleteExpense(expenseToDelete.id);
            toast.success(`Expense deleted`);
            setIsDeleteModalOpen(false);
            setExpenseToDelete(null);
        }
    };
    const [formData, setFormData] = useState({ 
        date: new Date().toISOString().split('T')[0], 
        name: '',
        category: 'General', 
        amount: ''
    });


    const metrics = useMemo(() => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        return (expenses || []).reduce((acc, curr) => {
            const amt = Number(curr.amount) || 0;
            acc.total += amt;
            if (new Date(curr.date) >= monthStart) {
                acc.thisMonth += amt;
            }
            return acc;
        }, { total: 0, thisMonth: 0 });
    }, [expenses]);

    // G: category totals for bar chart
    const categoryTotals = useMemo(() => {
        const map = {};
        (expenses || []).forEach(e => {
            const cat = e.category || 'General';
            map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
        });
        const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
        return (expenseCategories || []).map(cat => ({
            cat,
            amount: map[cat] || 0,
            pct: Math.round(((map[cat] || 0) / total) * 100)
        })).filter(c => c.amount > 0);
    }, [expenses]);

    const filteredExpenses = useMemo(() => {
        return [...(expenses || [])].sort((a, b) => {
            let av, bv;
            if (sort.field === 'date') { av = a.date || ''; bv = b.date || ''; }
            else if (sort.field === 'name') { av = a.name || ''; bv = b.name || ''; }
            else if (sort.field === 'category') { av = a.category || ''; bv = b.category || ''; }
            else if (sort.field === 'amount') { av = Number(a.amount) || 0; bv = Number(b.amount) || 0; }
            else { av = a[sort.field] || ''; bv = b[sort.field] || ''; }
            if (av < bv) return sort.dir === 'asc' ? -1 : 1;
            if (av > bv) return sort.dir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [expenses, sort]);

    const totalRecords = filteredExpenses.length;
    const totalPages = Math.ceil(totalRecords / rowsPerPage);
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredExpenses.slice(indexOfFirstRow, indexOfLastRow);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = { ...formData, amount: Number(formData.amount) };

        if (editingExpense) {
            updateExpense({ ...data, id: editingExpense.id });
            toast.success('Expense updated');
        } else {
            addExpense({ ...data, id: `EXP-${Date.now().toString().slice(-6)}` });
            toast.success('Expense added');
        }

        // Automatically add new category to suggestions if not already there
        if (data.category) {
            addExpenseCategory(data.category);
        }

        handleCloseModal();
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setFormData(expense);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
        setFormData({ 
            date: new Date().toISOString().split('T')[0], 
            name: '',
            category: expenseCategories[0] || 'General', 
            amount: ''
        });
    };

    return (
        <div className="space-y-8 pb-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">{t.expenses_mgmt}</h1>
                    <p className="text-slate-400 font-medium flex items-center gap-2">
                        <ReceiptText size={16} /> Track and manage temple expenditures and maintenance
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={exportExpensesToCSV}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <FileDown size={18} className="text-rose-500" /> Export
                    </button>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex-[2] md:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-xl shadow-rose-100 active:scale-95"
                    >
                        <Plus size={18} /> {t.add_expense}
                    </button>
                </div>
            </header>

            {/* ═══ CATEGORY FILTERS (Floating iOS Style) ═══ */}
            <div className="glass-search-container z-[45]">
                <div className="flex flex-wrap items-center gap-2 bg-white/60 backdrop-blur-3xl p-4 md:p-2 rounded-[28px] border border-white/80 shadow-2xl shadow-slate-200/50 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-2 min-w-max">
                        <div className="flex items-center bg-white px-4 py-2.5 rounded-[22px] border border-slate-100 shadow-sm transition-all focus-within:border-rose-500/50">
                            <Filter size={14} className="text-slate-400 mr-2" />
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mr-4">Categories</span>
                            <div className="flex flex-wrap gap-1.5">
                                {(expenseCategories || []).slice(0, 5).map(cat => (
                                    <span key={cat} className={`px-3 py-1 rounded-[14px] text-[10px] font-black uppercase tracking-tighter ${CATEGORY_STYLES[cat] || CATEGORY_STYLES['Other']}`}>
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 md:mt-6">
                <div className="glass-card p-8 bg-white border-white/60 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.total_expenses}</p>
                    <p className="text-3xl font-black text-rose-600 tracking-tight leading-none">₹{metrics.total.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-300 mt-4 flex items-center gap-1.5 uppercase">
                        <Calendar size={12} /> Full Cycle Records
                    </p>
                </div>

                <div className="glass-card p-8 bg-white border-white/60 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t.monthly_exp}</p>
                    <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">₹{metrics.thisMonth.toLocaleString()}</p>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (metrics.thisMonth / (metrics.total || 1)) * 100)}%` }}
                                className="h-full bg-rose-500 shadow-sm shadow-rose-200"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* G: category breakdown bar chart */}
            {categoryTotals.length > 0 && (
                <div className="glass-card p-8">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-5">{t.distribution_by_type}</h3>
                    <div className="space-y-3">
                        {categoryTotals.map(({ cat, amount, pct }) => (
                            <div key={cat} className="flex items-center gap-4">
                                <span className="text-xs font-black text-slate-600 w-28 shrink-0">{cat}</span>
                                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${CATEGORY_BAR[cat] || 'bg-slate-400'}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className="text-xs font-black text-slate-500 w-12 text-right">{pct}%</span>
                                <span className="text-xs font-black text-slate-700 w-24 text-right">₹{amount.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="glass-card overflow-hidden">
                {/* ═══ MOBILE CARD VIEW (iOS Style) ═══ */}
                <div className="md:hidden">
                    {isLoading ? (
                        <div className="divide-y divide-slate-200/40">
                             {Array.from({ length: 5 }).map((_, i) => (
                                <div key={`mob-skeleton-${i}`} className="flex items-center gap-3.5 px-5 py-3.5 animate-pulse">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0"></div>
                                    <div className="flex-1">
                                        <div className="h-4 w-32 bg-slate-100 rounded mb-2"></div>
                                        <div className="h-3 w-20 bg-slate-50 rounded"></div>
                                    </div>
                                    <div className="h-4 w-12 bg-slate-100 rounded"></div>
                                </div>
                             ))}
                        </div>
                    ) : currentRows.length > 0 ? (
                        <div className="divide-y divide-slate-200/40">
                            {currentRows.map((expense) => (
                                <div 
                                    key={expense.id}
                                    className="flex items-center gap-3.5 px-5 py-3.5 active:bg-slate-100/80 transition-colors duration-150"
                                >
                                    {/* Category Icon */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${CATEGORY_STYLES[expense.category] || CATEGORY_STYLES['Other']}`}>
                                        <ReceiptText size={18} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <p className="text-[14px] font-bold text-slate-900 truncate">{expense.name || '—'}</p>
                                            <span className="text-[13px] font-black text-rose-500 tabular-nums">
                                                ₹{(Number(expense.amount) || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[12px] text-slate-400 font-medium">
                                            <span>{expense.date?.split('-').reverse().join('/')}</span>
                                            <span>•</span>
                                            <span className="truncate">{expense.category}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => handleEdit(expense)}
                                            className="p-2 text-slate-300 active:text-blue-500"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(expense)}
                                            className="p-2 text-slate-300 active:text-rose-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-16 text-center text-slate-400 font-medium whitespace-pre-wrap">
                            {t.no_transactions}
                        </div>
                    )}
                </div>

                {/* ═══ DESKTOP TABLE VIEW ═══ */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-white/20">
                                <th className="px-8 py-6">{t.expense_id}</th>
                                <SortHeader label={t.date}       field="date"     sort={sort} onSort={handleSort} />
                                <SortHeader label={t.name}       field="name"     sort={sort} onSort={handleSort} />
                                <SortHeader label={t.category}   field="category" sort={sort} onSort={handleSort} />
                                <SortHeader label={`${t.amount} (₹)`} field="amount" sort={sort} onSort={handleSort} className="text-right" />
                                <th className="px-8 py-6 text-right">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/20">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`skeleton-${i}`} className="animate-pulse">
                                        <td className="px-8 py-5"><div className="h-4 w-16 bg-slate-100 rounded"></div></td>
                                        <td className="px-8 py-5"><div className="h-4 w-20 bg-slate-100 rounded"></div></td>
                                        <td className="px-8 py-5"><div className="h-4 w-40 bg-slate-100 rounded"></div></td>
                                        <td className="px-8 py-5"><div className="h-6 w-24 bg-slate-50 rounded-full"></div></td>
                                        <td className="px-8 py-5 text-right"><div className="h-6 w-16 bg-slate-100 rounded ml-auto"></div></td>
                                        <td className="px-8 py-5 text-right"><div className="h-6 w-20 bg-slate-100 rounded ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : currentRows.length > 0 ? (
                                currentRows.map((expense, idx) => (
                                    <tr 
                                        key={expense.id} 
                                        className="hover:bg-white/40 transition-colors group"
                                    >
                                        <td className="px-8 py-5 text-[10px] font-mono font-black text-slate-400">
                                            {expense.id}
                                        </td>
                                        <td className="px-8 py-5 text-xs font-bold text-slate-400">
                                            {expense.date?.split('-').reverse().join('/')}
                                        </td>
                                        <td className="px-8 py-5 text-[13px] font-bold text-slate-700">
                                            {expense.name || '—'}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${CATEGORY_STYLES[expense.category] || CATEGORY_STYLES['Other']}`}>
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="text-[15px] font-black text-rose-500">₹{(Number(expense.amount) || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEdit(expense)}
                                                    className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        handleDeleteClick(expense);
                                                    }}
                                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-8 py-20 text-center">
                                        <div className="max-w-xs mx-auto">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Receipt size={24} className="text-slate-200" />
                                            </div>
                                            <p className="text-slate-400 font-bold text-sm">{t.no_transactions}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {filteredExpenses.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-50/50 border-t-2 border-white/40">
                                    <td colSpan="4" className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                        {t.total_label || 'Total'} ({filteredExpenses.length} {t.records_small || 'records'})
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="text-lg font-black text-rose-600">₹{filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0).toLocaleString()}</span>
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 border-t border-slate-100/50 bg-slate-50/50">
                        <div className="text-sm font-bold text-slate-500">
                            {t.showing} {indexOfFirstRow + 1} {t.to_lowercase || 'to'} {Math.min(indexOfLastRow, totalRecords)} {t.of} {totalRecords} {t.records_small || 'records'}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'bg-white hover:bg-slate-50 text-slate-600 shadow-sm border border-slate-100'}`}
                            >
                                {t.previous || 'Previous'}
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum = i + 1;
                                    if (totalPages > 5 && currentPage > 3) {
                                        pageNum = currentPage - 3 + i + 1;
                                        if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                    }
                                    if (pageNum < 1) return null;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-9 h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center ${currentPage === pageNum ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white hover:bg-orange-50 text-slate-500 border border-slate-100'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'bg-white hover:bg-slate-50 text-slate-600 shadow-sm border border-slate-100'}`}
                            >
                                {t.next || 'Next'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingExpense ? "Edit Expense Entry" : t.add_expense}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t.date}</label>
                            <input 
                                required 
                                type="date"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all font-bold text-slate-900"
                                value={formData.date} 
                                onChange={e => setFormData({...formData, date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t.payee_name}</label>
                            <input 
                                required 
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400"
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. Hardware Store"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t.category}</label>
                            <input 
                                list="category-suggestions"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400"
                                value={formData.category} 
                                onChange={e => setFormData({...formData, category: e.target.value})}
                                placeholder="Search or type new category..."
                            />
                            <datalist id="category-suggestions">
                                {(expenseCategories || []).map(cat => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t.amount} (₹)</label>
                            <input 
                                required 
                                type="number" 
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none transition-all font-black text-rose-600 text-lg"
                                value={formData.amount} 
                                onChange={e => setFormData({...formData, amount: e.target.value})}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4.5 bg-rose-500 text-white rounded-2xl font-black shadow-xl shadow-rose-100 hover:bg-rose-600 hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                        <Receipt size={20} />
                        {editingExpense ? t.update_records : t.save_expense}
                    </button>
                </form>
            </Modal>
            <Modal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                title="Confirm Deletion"
            >
                <div className="text-center p-4">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trash2 size={32} />
                    </div>
                    <p className="text-slate-600 font-bold mb-8">
                        Are you sure you want to delete this expense record for <span className="text-slate-900 border-b-2 border-rose-200">{expenseToDelete?.name}</span>?
                    </p>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmDelete}
                            className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black shadow-xl shadow-rose-100 hover:bg-rose-600 transition-all"
                        >
                            Delete Expense
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default Expenses;
