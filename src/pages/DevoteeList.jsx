import { useState, useMemo, memo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Download, Edit2, Trash2, ArrowRight, X, ChevronUp, ChevronDown, Check } from 'lucide-react';
import Modal from '../components/Modal';
import DevoteeForm from '../components/DevoteeForm';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

// Fix 4: sortable column header component - Memoized
const SortHeader = memo(({ label, field, sort, onSort, className = '' }) => {
    const active = sort.field === field;
    return (
        <th
            className={`px-8 py-6 cursor-pointer select-none group/header transition-colors ${className}`}
            onClick={() => onSort(field)}
        >
            <span className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${active ? 'text-slate-900' : 'text-slate-500'}`}>
                    {label}
                </span>
                <span className="flex flex-col opacity-30 group-hover/header:opacity-100 transition-opacity">
                    <ChevronUp size={10} className={active && sort.dir === 'asc' ? 'text-orange-500' : 'text-slate-400'} />
                    <ChevronDown size={10} className={active && sort.dir === 'desc' ? 'text-orange-500' : 'text-slate-400'} />
                </span>
            </span>
        </th>
    );
});

const DevoteeList = () => {
    const { devoteeData = [], deleteDevotee, exportToCSV, seedMockData, importFromExcel, maskValue } = useData() || {};
    const excelInputRef = useRef(null);
    const { t } = useLanguage();
    const { userRole } = useAuth();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 12;

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingDevotee, setEditingDevotee] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [devoteeToDelete, setDevoteeToDelete] = useState(null);

    // Fix 4: sort state
    const [sort, setSort] = useState({ field: null, dir: 'asc' });

    const handleSort = (field) => {
        setSort(prev => ({
            field,
            dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc'
        }));
        setCurrentPage(1);
    };

    const handleDeleteClick = (devotee) => {
        setDevoteeToDelete(devotee);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (devoteeToDelete) {
            deleteDevotee(devoteeToDelete.id);
            toast.success(`${devoteeToDelete.name} ${t.record_deleted}`);
            setIsDeleteModalOpen(false);
            setDevoteeToDelete(null);
        }
    };

    const filteredData = useMemo(() => {
        let data = (Array.isArray(devoteeData) ? devoteeData : []).filter(d => {
            const matchesSearch =
                (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (d.phone || '').includes(searchTerm) ||
                (d.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (d.address || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = 
                statusFilter === 'All' || 
                (statusFilter === 'Nirapara' ? d.isNirapara : d.status === statusFilter);
            return matchesSearch && matchesStatus;
        });

        // Fix 4: apply sort
        if (sort.field) {
            data = [...data].sort((a, b) => {
                let av = a[sort.field], bv = b[sort.field];
                if (typeof av === 'number') return sort.dir === 'asc' ? av - bv : bv - av;
                return sort.dir === 'asc'
                    ? String(av || '').localeCompare(String(bv || ''))
                    : String(bv || '').localeCompare(String(av || ''));
            });
        }
        return data;
    }, [devoteeData, searchTerm, statusFilter, sort]);

    const totalRecords = filteredData.length;
    const totalPages = Math.ceil(totalRecords / rowsPerPage);
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 bg-white/50 p-2 rounded-2xl border border-white/60 w-full md:w-auto">
                    <div className="flex items-center bg-white pl-4 pr-10 py-1.5 rounded-2xl border border-slate-100 shadow-sm flex-1 md:w-80 group focus-within:border-orange-500/50 focus-within:shadow-[0_0_20px_rgba(249,115,22,0.15)] transition-all duration-300 relative">
                        <Search className="text-slate-300 group-focus-within:text-orange-500 transition-colors shrink-0" size={18} />
                        <input
                            type="text"
                            aria-label="Search devotees"
                            placeholder={t.search_placeholder}
                            className="w-full bg-transparent border-none focus:ring-0 pl-3 py-1 text-sm font-medium placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="h-8 w-[1px] bg-white/60"></div>
                    <select
                        className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-600 cursor-pointer pr-8"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="All">{t.all_status}</option>
                        <option value="Paid">{t.paid}</option>
                        <option value="Pending">{t.pending}</option>
                        <option value="Nirapara">{t.nirapara}</option>
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={exportToCSV}
                        className="btn btn-outline flex items-center gap-2 px-4 py-2.5 bg-white/50 border border-white/60 rounded-xl font-bold text-sm text-slate-600 hover:bg-white hover:text-orange-600 hover:shadow-lg transition-all"
                    >
                        <Download size={18} /> {t.export_csv}
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn-primary-gradient flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm"
                    >
                        <UserPlus size={18} /> {t.add_devotee}
                    </button>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto relative min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.id_label}</th>
                                <SortHeader label={t.name}         field="name"         sort={sort} onSort={handleSort} />
                                <SortHeader label={t.address}      field="address"      sort={sort} onSort={handleSort} className="hidden lg:table-cell" />
                                <SortHeader label={t.expected_amt} field="totalExpected" sort={sort} onSort={handleSort} className="text-right" />
                                <SortHeader label={t.paid_amt}     field="totalPaid"     sort={sort} onSort={handleSort} className="text-right" />
                                <SortHeader label={t.pending_amt}  field="totalPending"  sort={sort} onSort={handleSort} className="text-right" />
                                <SortHeader label={t.nirapara}     field="isNirapara"    sort={sort} onSort={handleSort} className="text-center" />
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] text-center">{t.all_status}</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] text-right">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/20">
                            <AnimatePresence mode="popLayout">
                                {currentRows.map((devotee) => (

                                    <motion.tr
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.15 }}
                                        key={devotee.id}
                                        className="hover:bg-white/40 transition-colors group"
                                    >
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className="font-mono text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 group-hover:bg-white transition-colors">#{devotee.id}</span>
                                        </td>
                                        <td className="px-8 py-5 min-w-[280px]">
                                            <Link to={`/profile/${devotee.id}`} className="flex flex-col group/name">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[14px] font-black text-slate-900 group-hover/name:text-orange-600 transition-colors whitespace-nowrap">{devotee.name}</span>
                                                    <span className="text-[10px] font-black text-slate-300">/</span>
                                                    <span className="text-[11px] font-extrabold text-slate-400 tracking-tighter">{devotee.phone}</span>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-8 py-5 hidden lg:table-cell max-w-[220px] truncate" title={devotee.address}>
                                            <span className="text-[12px] font-bold text-slate-500/80 tracking-tight italic leading-relaxed">{devotee.address || '—'}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right font-mono tabular-nums">
                                            <span className="text-[14px] font-black text-slate-700">₹{(Number(devotee.totalExpected) || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right font-mono tabular-nums">
                                            <span className="text-[14px] font-black text-emerald-600/90 tracking-tight">₹{(Number(devotee.totalPaid) || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right font-mono tabular-nums">
                                            <span className={`text-[14px] font-black tracking-tight ${Number(devotee.totalPending) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                ₹{(Number(devotee.totalPending) || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            {devotee.isNirapara ? (
                                                <div className="flex items-center justify-center">
                                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm shadow-orange-100">
                                                        <Check size={12} strokeWidth={4} />
                                                        Yes
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] shadow-sm ${devotee.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                                                {devotee.status === 'Paid' ? t.paid : t.pending}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link to={`/profile/${devotee.id}`} className="p-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all" title="View profile">
                                                    <ArrowRight size={16} />
                                                </Link>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setEditingDevotee(devotee); }}
                                                    className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Edit devotee"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                {userRole === 'master' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteClick(devotee); }}
                                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Delete devotee"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                        {filteredData.length > 0 && (() => {
                            const totExp = filteredData.reduce((s, d) => s + (Number(d.totalExpected) || 0), 0);
                            const totPaid = filteredData.reduce((s, d) => s + (Number(d.totalPaid) || 0), 0);
                            const totPend = filteredData.reduce((s, d) => s + (Number(d.totalPending) || 0), 0);
                            return (
                                <tfoot>
                                    <tr className="bg-slate-50/50 border-t-2 border-white/40">
                                        <td colSpan={2} className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {t.total_label || 'Total'} — {filteredData.length} {t.devotees}
                                        </td>
                                        <td className="hidden lg:table-cell px-8 py-4" />
                                        <td className="px-8 py-4 text-right font-mono tabular-nums">
                                            <span className="text-sm font-black text-slate-700">₹{totExp.toLocaleString()}</span>
                                        </td>
                                        <td className="px-8 py-4 text-right font-mono tabular-nums">
                                            <span className="text-sm font-black text-emerald-600">₹{totPaid.toLocaleString()}</span>
                                        </td>
                                        <td className="px-8 py-4 text-right font-mono tabular-nums">
                                            <span className="text-sm font-black text-rose-500">₹{totPend.toLocaleString()}</span>
                                        </td>
                                        <td colSpan={3} />
                                    </tr>
                                </tfoot>
                            );
                        })()}
                    </table>
                    {filteredData.length === 0 && (
                        devoteeData.length === 0 ? (
                            /* Onboarding — database is empty */
                            <div className="p-16 text-center max-w-md mx-auto">
                                <div className="text-5xl mb-4">🕉</div>
                                <h4 className="text-xl font-black text-slate-800 mb-2">{t.no_devotees_yet}</h4>
                                <p className="text-sm text-slate-400 font-medium mb-8">{t.get_started_desc}</p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <input ref={excelInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = ev => importFromExcel(new Uint8Array(ev.target.result));
                                        reader.readAsArrayBuffer(file);
                                        e.target.value = '';
                                    }} />
                                    <button onClick={() => excelInputRef.current?.click()} className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 hover:bg-slate-50 hover:shadow-md transition-all">
                                        <Download size={16} className="text-emerald-500" /> {t.import_excel || 'Import Excel'}
                                    </button>
                                    <button onClick={seedMockData} className="flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 text-white rounded-2xl font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all">
                                        <UserPlus size={16} /> Load Demo Data
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* No results from search/filter */
                            <div className="p-12 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search size={32} className="text-slate-300" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-800">{t.no_devotees_found || 'No devotees found'}</h4>
                                <p className="text-sm text-slate-400">{t.adjust_filters}</p>
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="mt-4 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-100 transition-colors">
                                        {t.clear_search}
                                    </button>
                                )}
                            </div>
                        )
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="px-8 py-6 border-t border-white/40 flex items-center justify-between bg-white/10">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {t.showing} <span className="text-slate-700">{indexOfFirstRow + 1}</span> to <span className="text-slate-700">{Math.min(indexOfLastRow, totalRecords)}</span> {t.of} <span className="text-slate-700">{totalRecords}</span> {t.records_small}
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'bg-white hover:bg-slate-50 text-slate-600 shadow-sm border border-slate-100'}`}
                            >
                                {t.previous}
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
                                {t.next}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t.add_devotee}>
                <DevoteeForm onSuccess={() => setIsAddModalOpen(false)} />
            </Modal>

            <Modal isOpen={!!editingDevotee} onClose={() => setEditingDevotee(null)} title={t.edit_details}>
                <DevoteeForm devotee={editingDevotee} onSuccess={() => setEditingDevotee(null)} />
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t.confirm_del}>
                <div className="text-center p-4">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trash2 size={32} />
                    </div>
                    <p className="text-slate-600 font-bold mb-8">
                        {t.del_confirm_msg} <span className="text-slate-900 border-b-2 border-rose-200">{devoteeToDelete?.name}</span>? {t.del_cannot_undo}
                    </p>
                    <div className="flex gap-4">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">
                            {t.cancel}
                        </button>
                        <button onClick={confirmDelete} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black shadow-xl shadow-rose-100 hover:bg-rose-600 transition-all">
                            {t.delete_record}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DevoteeList;
