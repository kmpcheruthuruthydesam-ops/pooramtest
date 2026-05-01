import { useRef } from 'react';
import Modal from './Modal';
import { Printer, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import divineLogo from '../assets/divine_logo.jpg';
import { Haptics } from '../lib/haptics';

// Inner receipt layout — used both in preview and during print
const ReceiptContent = ({ data, t }) => (
    <div id="printable-receipt" className="p-8 md:p-12 bg-white text-slate-900 w-full max-w-[620px] mx-auto border-[16px] border-orange-50/30 rounded-[48px] font-outfit relative overflow-hidden print:border-none print:p-0">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-100/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        {/* Header Section */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-10 mb-10 relative z-10 gap-8">
            <div className="flex items-center gap-6 flex-1">
                <div className="w-14 h-14 bg-white border border-orange-100 rounded-[20px] overflow-hidden shadow-lg shadow-orange-100/50 flex-shrink-0 p-1 ring-4 ring-orange-50/50">
                    <img src={divineLogo} alt="Temple Logo" className="w-full h-full object-cover rounded-[16px]" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-tight uppercase mb-0.5">
                        Kozhimamparamb <span className="text-orange-500">Pooram</span>
                    </h1>
                    <h2 className="text-[10px] font-bold text-slate-400 tracking-[0.25em] uppercase leading-none">
                        Cheruthuruthy Desam
                    </h2>
                    <div className="flex gap-3 mt-3">
                        <span className="px-2 py-0.5 bg-orange-50 text-[8px] font-black text-orange-500 uppercase tracking-[0.1em] rounded-md border border-orange-100/50">Official Copy</span>
                        <span className="px-2 py-0.5 bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] rounded-md border border-slate-100">Digital Record</span>
                    </div>
                </div>
            </div>
            
            <div className="text-right shrink-0">
                <div className="bg-slate-50/80 border border-slate-100 px-5 py-3 rounded-[24px] mb-3 inline-block backdrop-blur-sm">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">{t.receipt_id}</p>
                    <p className="font-mono text-sm font-bold text-slate-800 tracking-widest">#{data.id}</p>
                </div>
                <div className="flex flex-col items-end pr-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.date?.split('-').reverse().join('/')}</p>
                    <div className="w-8 h-1 bg-orange-500 mt-1.5 rounded-full opacity-30"></div>
                </div>
            </div>
        </div>

        {/* Devotee Info Grid */}
        <div className="grid grid-cols-2 gap-10 mb-10 relative z-10 px-2">
            <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-1 h-3.5 bg-orange-500 rounded-full"></div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.devotee_details}</p>
                </div>
                <div>
                    <p className="font-black text-2xl text-slate-900 leading-tight mb-1.5 tracking-tight">{data.devoteeName || '—'}</p>
                    {data.devoteeId && (
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] flex items-center gap-1.5">
                            <span className="text-orange-500">#</span> {t.reg_id}: {data.devoteeId}
                        </p>
                    )}
                </div>
            </div>
            
            <div className="text-right space-y-3">
                <div className="flex items-center justify-end gap-2.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{data.book ? t.reg_reference : t.collection_type}</p>
                    <div className="w-1 h-3.5 bg-orange-500 rounded-full"></div>
                </div>
                <div>
                    {data.book ? (
                        <p className="font-mono text-xl font-bold text-slate-900 tracking-tight">
                            BK-{data.book.replace('BK-', '')} 
                            <span className="text-slate-200 mx-1.5">/</span> 
                            LF-{data.leaf.replace('LF-', '')}
                        </p>
                    ) : (
                        <p className="font-black text-xl text-slate-900">{data.type || 'General'}</p>
                    )}
                </div>
            </div>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-50/30 border-2 border-slate-100/50 p-10 rounded-[40px] mb-10 relative z-10">
            <div className="flex justify-center mb-8">
                <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] shadow-sm">{t.contribution_summary}</span>
            </div>
            
            <div className="flex justify-between items-center mb-8 pb-8 border-b border-dashed border-slate-200">
                <div className="flex flex-col gap-1.5">
                    <p className="text-base font-black text-slate-900 leading-none">{data.description || t.temple_dev_pooja}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-80">Category / Event Note</p>
                </div>
                <p className="text-lg font-bold text-slate-700 tabular-nums">₹{parseFloat(data.paid).toLocaleString()}</p>
            </div>
            
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{t.total_paid_label}</p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none">Accepted & Verified</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-5xl font-black text-emerald-700 tracking-tighter tabular-nums leading-none">
                        <span className="text-3xl mr-1 opacity-50 font-black">₹</span>
                        {parseFloat(data.paid).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>

        {/* Footer Meta */}
        <div className="flex justify-between items-end border-t border-slate-100 pt-10 relative z-10 px-2">
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.computer_generated}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.payment_method}: <span className="text-slate-800">{data.method || 'Cash'}</span></p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-orange-400/50 rounded-full animate-pulse"></div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.verified_by}</p>
                </div>
            </div>
        </div>
        
        {/* Subtle watermark background icon */}
        <div className="absolute bottom-[-15%] left-[-10%] w-72 h-72 opacity-5 pointer-events-none select-none grayscale -rotate-12 border-[20px] border-white rounded-[60px] overflow-hidden">
            <img src={divineLogo} alt="Watermark" className="w-full h-full object-cover scale-150" />
        </div>
    </div>
);

// Fix 6: Receipt preview modal — shows receipt before sending to printer
const Receipt = ({ data, onClose }) => {
    const { t } = useLanguage();
    const printRef = useRef(null);

    if (!data) return null;

    const handlePrint = () => {
        const printContent = document.getElementById('printable-receipt');
        if (!printContent) return;
        
        Haptics.lightTick();
        
        // Fix: Set automatic filename for PDF saving
        const originalTitle = document.title;
        const fileName = `Receipt_${data.devoteeName || 'Devotee'}_${data.id || 'ID'}`;
        document.title = fileName;

        // Give the browser a moment to update layout for print and finish animations
        setTimeout(() => {
            window.print();
            // Restore original title after a short delay
            setTimeout(() => {
                document.title = originalTitle;
            }, 1000);
        }, 500);
    };

    return (
        <Modal isOpen={!!data} onClose={onClose} title={t.receipt_preview} maxWidth="max-w-2xl">
            <div className="space-y-6">
                <div ref={printRef}>
                    <ReceiptContent data={data} t={t} />
                </div>
                <div className="sticky bottom-0 left-0 right-0 pt-6 pb-2 bg-gradient-to-t from-white via-white to-transparent md:bg-none md:relative md:pt-2">
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95"
                        >
                            {t.close}
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black shadow-xl shadow-orange-200 hover:bg-orange-600 transition-all flex items-center justify-center gap-2 active:scale-95 print-button"
                        >
                            <Printer size={18} /> {t.print_receipt}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default Receipt;
