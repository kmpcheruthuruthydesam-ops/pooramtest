import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, MapPin, Receipt as ReceiptIcon, MessageSquare, Printer, Plus, Edit2, Trash2, UserCheck, Check } from 'lucide-react';
import Modal from '../components/Modal';
import EventForm from '../components/EventForm';
import Receipt from '../components/Receipt';
import { toast } from 'sonner';

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { devoteeData, updateDevotee } = useData() || {};
    const { t, language } = useLanguage();
    const { userRole } = useAuth();
    const devotee = (devoteeData || []).find(d => d.id === id);

    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({ type: 'Pooram' });
    const [activeReceipt, setActiveReceipt] = useState(null);

    // Global FAB Event Listener
    useEffect(() => {
        const handleOpenModal = (e) => {
            const { type } = e.detail;
            setModalConfig({ type });
            setIsEventModalOpen(true);
        };

        window.addEventListener('open-event-modal', handleOpenModal);
        return () => window.removeEventListener('open-event-modal', handleOpenModal);
    }, []);

    // Fix 7: edit event state
    const [editingEvent, setEditingEvent] = useState(null);
    const [isEditEventOpen, setIsEditEventOpen] = useState(false);

    // Fix 7: delete event confirmation
    const [deletingEvent, setDeletingEvent] = useState(null);
    const [isDeleteEventOpen, setIsDeleteEventOpen] = useState(false);

    // Fix 6: avatar loading state
    const [avatarLoaded, setAvatarLoaded] = useState(false);

    if (!devotee) return (
        <div className="p-12 text-center glass-card max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ReceiptIcon size={32} className="text-slate-200" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">{t.record_not_found}</h2>
            <p className="text-slate-400 mt-2 font-medium">{t.no_records_found_desc || 'The record you are looking for may have been deleted or moved.'}</p>
            <button onClick={() => navigate('/devotees')} className="mt-8 px-8 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all">{t.back_to_directory}</button>
        </div>
    );

    // Fix 6: use Receipt preview modal (no direct window.print())
    const handlePrint = (event) => {
        setActiveReceipt({ ...event, devoteeName: devotee.name });
    };

    // Fix 13: WhatsApp message always visible + pre-filled with amount
    const handleWhatsApp = () => {
        const pending = Number(devotee.totalPending);
        const msg = t.whatsapp_msg
            .replace('{name}', devotee.name)
            .replace('{temple}', t.temple_name)
            .replace('{amount}', pending.toLocaleString());
        window.open(`https://wa.me/${devotee.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const openEventModal = (type) => {
        setModalConfig({ type });
        setIsEventModalOpen(true);
    };

    // Fix 7: delete individual event
    const handleDeleteEvent = (event) => {
        setDeletingEvent(event);
        setIsDeleteEventOpen(true);
    };

    const confirmDeleteEvent = () => {
        if (!deletingEvent) return;
        const paidRefund = Number(deletingEvent.paid) || 0;
        const newTotalPaid = Math.max(0, (Number(devotee.totalPaid) || 0) - paidRefund);
        const updated = {
            ...devotee,
            totalPaid: newTotalPaid,
            totalPending: Math.max(0, (Number(devotee.totalExpected) || 0) - newTotalPaid),
            events: devotee.events.filter(e => e.id !== deletingEvent.id)
        };
        updated.status = updated.totalPending <= 0 ? 'Paid' : 'Pending';
        updateDevotee(updated);
        toast.success('Event record deleted');
        setIsDeleteEventOpen(false);
        setDeletingEvent(null);
    };

    const pooramEvents  = (devotee.events || []).filter(e => e.type?.toLowerCase().includes('pooram'));
    const ayyappanEvents = (devotee.events || []).filter(e => e.type?.toLowerCase().includes('ayyappan') || e.type?.toLowerCase().includes('vilakku'));

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <button
                    onClick={() => navigate('/devotees')}
                    className="flex items-center gap-2 text-slate-400 hover:text-orange-600 font-bold transition-colors group w-fit"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> {t.back_to_directory}
                </button>

                <div className="flex items-center gap-3">
                    {/* Fix 13: always visible WhatsApp button */}
                    <button
                        onClick={handleWhatsApp}
                        className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all duration-300"
                        title={`Send WhatsApp reminder — Pending: ₹${Number(devotee.totalPending).toLocaleString()}`}
                    >
                        <MessageSquare size={18} /> {t.whatsapp_reminder}
                        {Number(devotee.totalPending) > 0 && (
                            <span className="ml-1 bg-white/20 text-white px-2 py-0.5 rounded-lg text-xs font-black">
                                ₹{Number(devotee.totalPending).toLocaleString()}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Profile Identity Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6 md:p-8 text-center relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-orange-500/10 to-blue-500/10 group-hover:opacity-70 transition-opacity"></div>
                        <div className="relative pt-4">
                            {/* simplified letter-based avatar fallback */}
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[28px] bg-gradient-to-br from-orange-400 to-orange-600 shadow-2xl mx-auto mb-6 flex items-center justify-center border-4 border-white relative active:scale-95 transition-transform duration-300">
                                <span className="text-3xl md:text-4xl font-black text-white drop-shadow-md">
                                    {devotee.name?.charAt(0)?.toUpperCase()}
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">{devotee.name}</h3>
                            <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full font-black text-[10px] tracking-tighter uppercase">ID: #{devotee.id}</span>
                                <span className={`px-3 py-1 rounded-full font-black text-[10px] tracking-tighter uppercase ${devotee.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                    {devotee.status === 'Paid' ? t.paid : t.pending}
                                </span>
                                {devotee.isNirapara && (
                                    <span className="px-3 py-1 bg-orange-500 text-white rounded-full font-black text-[10px] tracking-tighter uppercase shadow-sm">
                                        {t.nirapara}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4 mt-8 pt-8 border-t border-slate-100 text-left">
                                <div className="flex items-start gap-4">
                                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                                        <Phone size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t.phone}</p>
                                        <p className="text-sm font-bold text-slate-700">{devotee.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                                        <MapPin size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t.address}</p>
                                        <p className="text-xs font-bold text-slate-600 leading-relaxed">{devotee.address}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tracking & Journals */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: t.expectation, val: devotee.totalExpected, color: 'text-slate-400', valColor: 'text-slate-800', bg: 'bg-white' },
                            { label: t.collection,  val: devotee.totalPaid,     color: 'text-emerald-500', valColor: 'text-emerald-600', bg: 'bg-emerald-50/30' },
                            { label: t.pending,     val: devotee.totalPending,  color: 'text-rose-500',   valColor: 'text-rose-600',   bg: 'bg-rose-50/30' }
                        ].map(stat => (
                            <div key={stat.label} className={`glass-card p-6 border-white/60 ${stat.bg}`}>
                                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${stat.color}`}>{stat.label}</p>
                                <p className={`text-2xl font-black ${stat.valColor}`}>₹{(Number(stat.val) || 0).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tracker 1: Pooram */}
                    <div className="glass-card overflow-hidden">
                        <div className="px-8 py-5 border-b border-white/40 flex items-center justify-between bg-orange-50/30">
                            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                                <span className="w-2 h-6 bg-orange-500 rounded-full mr-1"></span>
                                {t.pooram_tracker_title}
                            </h4>
                            <button
                                onClick={() => openEventModal('Pooram')}
                                className="flex items-center gap-2 bg-white text-orange-600 font-bold text-xs hover:bg-orange-600 hover:text-white px-4 py-2 rounded-xl transition-all border border-orange-100"
                            >
                                <Plus size={14} /> {t.log_pooram}
                            </button>
                        </div>
                        <TrackerTable
                            events={pooramEvents}
                            onPrint={handlePrint}
                            onEdit={(ev) => { setEditingEvent(ev); setIsEditEventOpen(true); }}
                            onDelete={handleDeleteEvent}
                            userRole={userRole}
                        />
                    </div>

                    {/* Tracker 2: Ayyappan Vilakku */}
                    <div className="glass-card overflow-hidden">
                        <div className="px-8 py-5 border-b border-white/40 flex items-center justify-between bg-blue-50/30">
                            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                                <span className="w-2 h-6 bg-blue-500 rounded-full mr-1"></span>
                                {t.vilakku_tracker_title}
                            </h4>
                            <button
                                onClick={() => openEventModal('Ayyappan Vilakku')}
                                className="flex items-center gap-2 bg-white text-blue-600 font-bold text-xs hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl transition-all border border-blue-100"
                            >
                                <Plus size={14} /> {t.log_vilakku}
                            </button>
                        </div>
                        <TrackerTable
                            events={ayyappanEvents}
                            onPrint={handlePrint}
                            onEdit={(ev) => { setEditingEvent(ev); setIsEditEventOpen(true); }}
                            onDelete={handleDeleteEvent}
                            userRole={userRole}
                        />
                    </div>
                </div>
            </div>

            {/* Add event modal */}
            <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title={`${t.add_receipt} - ${modalConfig.type}`}>
                <EventForm devoteeId={devotee.id} initialType={modalConfig.type} onSuccess={() => setIsEventModalOpen(false)} />
            </Modal>

            {/* Fix 7: Edit event modal */}
            <Modal isOpen={isEditEventOpen} onClose={() => setIsEditEventOpen(false)} title={t.edit_details}>
                <EventForm
                    devoteeId={devotee.id}
                    existingEvent={editingEvent}
                    initialType={editingEvent?.type || 'Pooram'}
                    onSuccess={() => { setIsEditEventOpen(false); setEditingEvent(null); }}
                />
            </Modal>

            {/* Fix 7: Delete event confirmation modal */}
            <Modal isOpen={isDeleteEventOpen} onClose={() => setIsDeleteEventOpen(false)} title={t.confirm_del}>
                <div className="text-center p-4">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trash2 size={32} />
                    </div>
                    <p className="text-slate-600 font-bold mb-2">
                        {t.delete_event_confirm.replace('{id}', deletingEvent?.id || '')}
                    </p>
                    <p className="text-sm text-slate-400 font-medium mb-8">
                        {t.delete_event_warn.replace('{amount}', (Number(deletingEvent?.paid) || 0).toLocaleString())}
                    </p>
                    <div className="flex gap-4">
                        <button onClick={() => setIsDeleteEventOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">{t.cancel}</button>
                        <button onClick={confirmDeleteEvent} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black shadow-xl shadow-rose-100 hover:bg-rose-600 transition-all">{t.delete_record}</button>
                    </div>
                </div>
            </Modal>

            {/* Fix 6: Receipt preview modal */}
            <Receipt data={activeReceipt} onClose={() => setActiveReceipt(null)} />
        </div>
    );
};

// Fix 7: TrackerTable accepts onEdit + onDelete props; remark has title tooltip
const TrackerTable = ({ events, onPrint, onEdit, onDelete, userRole }) => {
    const { t } = useLanguage();
    return (
        <div className="overflow-hidden">
            {/* ═══ MOBILE CARDS (iOS Style) ═══ */}
            <div className="md:hidden divide-y divide-slate-100/50">
                {events.map((event, idx) => (
                    <div key={event.id || idx} className="p-5 active:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h5 className="text-[15px] font-black text-slate-800">{event.year || '—'} {t.year}</h5>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{event.date?.split('-').reverse().join('/')}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => onPrint(event)} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl active:bg-orange-500 active:text-white transition-all"><Printer size={16} /></button>
                                <button onClick={() => onEdit(event)}  className="p-2.5 bg-slate-100 text-slate-500 rounded-xl active:bg-blue-500 active:text-white transition-all"><Edit2 size={16} /></button>
                                <button onClick={() => onDelete(event)} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl active:bg-rose-500 active:text-white transition-all"><Trash2 size={16} /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100/50">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">{t.paid_amt_label}</p>
                                <p className="text-sm font-black text-emerald-600">₹{(Number(event.paid) || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100/50">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">{t.pending}</p>
                                <p className="text-sm font-black text-rose-500">₹{(Number(event.unpaid) || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100/50">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">{t.book_no} / {t.leaf_no}</p>
                                <p className="text-xs font-mono font-bold text-slate-600">{event.book || '—'} / {event.leaf || '—'}</p>
                            </div>
                            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100/50 flex flex-col justify-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">{t.nirapara}</p>
                                {event.isNirapara ? <Check size={14} className="text-orange-500" strokeWidth={4} /> : <span className="text-[10px] font-bold text-slate-300">NO</span>}
                            </div>
                        </div>

                        {event.remark && (
                            <div className="p-3 bg-blue-50/30 rounded-xl border border-blue-100/30">
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-tighter mb-1">{t.remark}</p>
                                <p className="text-xs font-medium text-slate-600 leading-relaxed italic">"{event.remark}"</p>
                            </div>
                        )}
                    </div>
                ))}
                {events.length === 0 && (
                    <div className="p-12 text-center text-slate-400 text-sm font-medium italic">
                        {t.no_records_tracker}
                    </div>
                )}
            </div>

            {/* ═══ DESKTOP TABLE ═══ */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-8 py-4">{t.year}</th>
                            <th className="px-8 py-4">{t.date}</th>
                            <th className="px-8 py-4">{t.book_no}</th>
                            <th className="px-8 py-4">{t.leaf_no}</th>
                            <th className="px-8 py-4 text-right">{t.paid_amt_label}</th>
                            <th className="px-8 py-4 text-right">{t.pending} (₹)</th>
                            <th className="px-8 py-4 text-center">{t.nirapara}</th>
                            <th className="px-8 py-4">{t.remark}</th>
                            <th className="px-8 py-4 text-right">{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20">
                        {events.map((event, idx) => (
                            <tr key={event.id || idx} className="hover:bg-white/40 transition-colors group text-sm">
                                <td className="px-8 py-4 font-bold text-slate-800">{event.year || '—'}</td>
                                <td className="px-8 py-4 font-bold text-slate-500 whitespace-nowrap">{event.date?.split('-').reverse().join('/')}</td>
                                <td className="px-8 py-4">
                                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-tighter bg-white px-2 py-1 rounded border border-slate-100">{event.book || 'N/A'}</span>
                                </td>
                                <td className="px-8 py-4">
                                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-tighter bg-white px-2 py-1 rounded border border-slate-100">{event.leaf || 'N/A'}</span>
                                </td>
                                <td className="px-8 py-4 font-black text-emerald-600 text-right">₹{(Number(event.paid) || 0).toLocaleString()}</td>
                                <td className="px-8 py-4 font-black text-rose-500 text-right">₹{(Number(event.unpaid) || 0).toLocaleString()}</td>
                                <td className="px-8 py-4 text-center">
                                    {event.isNirapara ? (
                                        <div className="flex justify-center">
                                            <span className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-sm shadow-orange-100">
                                                <Check size={16} strokeWidth={4} />
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t.no}</span>
                                    )}
                                </td>
                                <td className="px-8 py-4 text-xs font-medium text-slate-400 max-w-[140px] truncate cursor-help" title={event.remark || ''}>
                                    {event.remark || '—'}
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => onPrint(event)} className="p-2 bg-slate-50 text-slate-400 hover:bg-orange-500 hover:text-white rounded-lg transition-all" title="Preview & print receipt"><Printer size={15} /></button>
                                        <button onClick={() => onEdit(event)}  className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Edit event"><Edit2 size={15} /></button>
                                        <button onClick={() => onDelete(event)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Delete event"><Trash2 size={15} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {events.length === 0 && (
                            <tr>
                                <td colSpan="9" className="px-8 py-12 text-center text-slate-400 text-sm font-medium italic">
                                    {t.no_records_tracker}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Profile;
