import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { Printer, Search, FileDown, Calendar, X, BadgeIndianRupee } from 'lucide-react';
import Receipt from '../components/Receipt';
import MetricCard from '../components/MetricCard';
import { Haptics } from '../lib/haptics';

const Collections = () => {
    const { devoteeData, exportCollectionsToCSV, maskValue, debugMode } = useData() || {};
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState('all');
    const [activeReceipt, setActiveReceipt] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 25;

    const allEvents = useMemo(() => {
        return (devoteeData || []).flatMap(devotee =>
            (devotee.events || []).map(event => ({
                ...event,
                devoteeName: devotee.name,
                devoteeId: devotee.id
            }))
        ).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [devoteeData]);

    const todaysCollectionAmount = useMemo(() => {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        return allEvents.filter(e => e.date === todayStr).reduce((sum, e) => sum + (Number(e.paid) || 0), 0);
    }, [allEvents]);



    const filteredEvents = useMemo(() => {
        let filtered = allEvents.filter(e =>
            e.devoteeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.type?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (timeFilter !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            filtered = filtered.filter(e => {
                const eventDate = new Date(e.date);
                if (timeFilter === 'today') return eventDate >= today;
                if (timeFilter === 'week') {
                    const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
                    return eventDate >= weekAgo;
                }
                if (timeFilter === 'month') {
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    return eventDate >= monthStart;
                }
                return true;
            });
        }
        return filtered;
    }, [allEvents, searchTerm, timeFilter]);

    // Fix 14: total for current filter
    const filteredTotal = useMemo(
        () => filteredEvents.reduce((sum, e) => sum + (Number(e.paid) || 0), 0),
        [filteredEvents]
    );

    // Fix 6: use Receipt preview modal
    const handlePrint = (event) => setActiveReceipt(event);

    const filters = [
        { id: 'all',   label: t.all_time   },
        { id: 'today', label: t.today      },
        { id: 'week',  label: t.this_week  },
        { id: 'month', label: t.this_month },
    ];

    const filterLabel = filters.find(f => f.id === timeFilter)?.label || '';

    const totalRecords = filteredEvents.length;
    const totalPages = Math.ceil(totalRecords / rowsPerPage);
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredEvents.slice(indexOfFirstRow, indexOfLastRow);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // F: breakdown by event type from filteredEvents
    const typeBreakdown = useMemo(() => {
        const map = {};
        filteredEvents.forEach(e => {
            const key = e.type || 'General';
            if (!map[key]) map[key] = { total: 0, count: 0 };
            map[key].total += Number(e.paid) || 0;
            map[key].count++;
        });
        return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
    }, [filteredEvents]);

    return (
        <div className="space-y-8 pb-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">{t.collections_history}</h1>
                    <p className="text-slate-400 font-medium flex items-center gap-2">
                        <Calendar size={16} /> {t.collections_subtitle}
                    </p>
                </div>
                <button
                    onClick={exportCollectionsToCSV}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <FileDown size={18} className="text-blue-500" /> {t.export_csv}
                </button>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-2">
                <MetricCard 
                    type="green"  
                    icon={<BadgeIndianRupee size={24} />} 
                    label={t.today_collection} 
                    value={`₹${Number(todaysCollectionAmount).toLocaleString()}`} 
                />
            </div>

            {/* ═══ FLOATING SEARCH & FILTERS (iOS Style) ═══ */}
            <div className="glass-search-container md:relative z-[45]">
                <div className="flex flex-col md:flex-row items-center gap-3 bg-white/60 backdrop-blur-3xl p-3 md:p-2 rounded-[28px] border border-white/80 shadow-2xl shadow-slate-200/50">
                    <div className="flex bg-slate-100/50 p-1 rounded-[22px] w-full md:w-auto shrink-0 overflow-x-auto hide-scrollbar">
                        <div className="flex min-w-max">
                            {filters.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => { 
                                    Haptics.lightTick();
                                    setTimeFilter(f.id); 
                                    setCurrentPage(1); 
                                }}
                                    className={`px-4 py-2 rounded-[18px] text-[11px] font-black uppercase tracking-wider transition-all ${timeFilter === f.id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center bg-white px-4 py-2.5 rounded-[22px] border border-slate-100 shadow-sm flex-1 w-full group focus-within:border-orange-500/50 focus-within:shadow-[0_0_20px_rgba(249,115,22,0.1)] transition-all duration-300 relative">
                        <Search className="text-slate-300 group-focus-within:text-orange-500 transition-colors shrink-0" size={18} />
                        <input
                            type="text"
                            aria-label="Search collections"
                            placeholder={t.col_search_placeholder}
                            className="flex-1 bg-transparent border-none outline-none focus:ring-0 pl-3 py-0 text-[15px] md:text-sm font-bold text-slate-900 placeholder:text-slate-300 pr-6"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* F: type breakdown cards */}
            {typeBreakdown.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {typeBreakdown.slice(0, 4).map(([type, data]) => (
                        <div key={type} className="glass-card p-5 border-white/60">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{type}</p>
                            <p className="text-lg font-black text-slate-800">₹{data.total.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{data.count} {t.records_small}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Fix 14: summary bar */}
            <div className="flex flex-wrap items-center gap-4 px-1 text-sm font-bold text-slate-500">
                <span>
                    {t.showing} <span className="text-slate-800">{filteredEvents.length}</span> {t.records_small}
                </span>
                <span className="text-slate-300">·</span>
                <span>
                    {t.total_label || 'Total'}: <span className="text-emerald-600">₹{filteredTotal.toLocaleString()}</span>
                </span>
                {timeFilter !== 'all' && (
                    <>
                        <span className="text-slate-300">·</span>
                        <span className="flex items-center gap-1">
                            {t.filtered_by}: <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">{filterLabel}</span>
                            <button onClick={() => setTimeFilter('all')} className="ml-1 text-slate-400 hover:text-slate-700"><X size={12} /></button>
                        </span>
                    </>
                )}
            </div>

            <div className="glass-card overflow-hidden">
                {/* ═══ MOBILE CARD VIEW (iOS Style) ═══ */}
                <div className="md:hidden">
                    {currentRows.length > 0 ? (
                        <div className="divide-y divide-slate-200/40">
                            {currentRows.map((item, idx) => (
                                <div 
                                    key={item.id ? `col-mob-${item.id}-${idx}` : `col-mob-fb-${idx}`}
                                    className="flex items-center gap-3.5 px-5 py-3.5 active:bg-slate-100/80 transition-colors duration-150"
                                >
                                    {/* Icon based on type */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                        item.type === 'Pooram' ? 'bg-orange-100 text-orange-600' : 
                                        item.type === 'Ayyappan Vilakku' ? 'bg-blue-100 text-blue-600' : 
                                        'bg-purple-100 text-purple-600'
                                    }`}>
                                        <BadgeIndianRupee size={20} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <p className="text-[14px] font-bold text-slate-900 truncate">{item.devoteeName}</p>
                                            <span className="text-[13px] font-black text-emerald-600 tabular-nums">
                                                ₹{(Number(item.paid) || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[12px] text-slate-400 font-medium">
                                            <span>{item.date?.split('-').reverse().join('/')}</span>
                                            <span>•</span>
                                            <span className="truncate">{item.type}</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => { Haptics.lightTick(); handlePrint(item); }}
                                        className="p-2 text-slate-300 active:text-orange-500"
                                    >
                                        <Printer size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-16 text-center text-slate-400 font-medium">
                            {t.no_transactions}
                        </div>
                    )}
                </div>

                {/* ═══ DESKTOP TABLE VIEW ═══ */}
                <div className="hidden md:block overflow-x-auto relative min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-white/20">
                                <th className="px-8 py-6">{t.date}</th>
                                <th className="px-8 py-6">{t.transaction_id}</th>
                                <th className="px-8 py-6">{t.devotee}</th>
                                <th className="px-8 py-6">{t.event_details}</th>
                                <th className="px-8 py-6 text-right">{t.amount} (₹)</th>
                                <th className="px-8 py-6 text-right">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/20">
                                {currentRows.map((item, idx) => (
                                    <tr
                                        key={item.id ? `col-${item.id}-${idx}` : `col-fallback-${idx}`}
                                        className="hover:bg-white/40 transition-colors group"
                                    >
                                        <td className="px-8 py-5 text-xs font-bold text-slate-400">
                                            {item.date?.split('-').reverse().join('/') || '—'}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-mono text-[11px] font-black text-slate-800 bg-slate-100/50 px-2 py-1 rounded w-fit">#{item.id}</span>
                                                {debugMode && (
                                                    <span className="text-[8px] font-bold text-slate-300 font-mono truncate max-w-[80px]" title={item.id_full || item.id}>
                                                        RAW: {item.id}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-black text-slate-800 leading-tight">{item.devoteeName}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: #{item.devoteeId}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${item.type === 'Pooram' ? 'bg-orange-50 text-orange-600' : item.type === 'General' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {item.type}
                                                </span>
                                                {item.book && (
                                                    <span className="text-[10px] font-bold text-slate-400 font-mono">{item.book} / {item.leaf}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="text-[15px] font-black text-emerald-600">₹{(Number(item.paid) || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => handlePrint(item)}
                                                className="p-3 bg-slate-50 text-slate-400 hover:bg-orange-500 hover:text-white rounded-2xl transition-all duration-300 shadow-sm hover:shadow-orange-200"
                                                title="Preview & print receipt"
                                            >
                                                <Printer size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            {filteredEvents.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-8 py-20 text-center">
                                        <div className="max-w-xs mx-auto">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search size={24} className="text-slate-200" />
                                            </div>
                                            <p className="text-slate-400 font-bold text-sm">{t.no_transactions}</p>
                                            {searchTerm && (
                                                <button onClick={() => setSearchTerm('')} className="mt-4 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-100 transition-colors">
                                                    {t.clear_search}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>

                        {/* Fix 14: totals footer row */}
                        {filteredEvents.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-50/50 border-t-2 border-white/40">
                                    <td colSpan="4" className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                                        {t.total_label || 'Total'} ({filteredEvents.length} {t.records_small})
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <span className="text-base font-black text-emerald-600">₹{filteredTotal.toLocaleString()}</span>
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
                            {t.showing} {indexOfFirstRow + 1} {t.to_lowercase || 'to'} {Math.min(indexOfLastRow, totalRecords)} {t.of} {totalRecords} {t.records_small}
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

            {/* Fix 6: Receipt preview modal */}
            <Receipt data={activeReceipt} onClose={() => setActiveReceipt(null)} />
        </div>
    );
};

export default Collections;
