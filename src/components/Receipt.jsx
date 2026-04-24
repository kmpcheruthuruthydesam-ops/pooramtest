import { useRef } from 'react';
import Modal from './Modal';
import { Printer, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import divineLogo from '../assets/divine_logo.jpg';
import { Haptics } from '../lib/haptics';

// Inner receipt layout — used both in preview and during print
const ReceiptContent = ({ data, t }) => (
    <div id="printable-receipt" className="p-10 bg-white text-slate-900 w-full max-w-[580px] mx-auto border-[12px] border-orange-50/50 rounded-3xl font-outfit relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-100 pb-10 mb-10 relative z-10 gap-6">
            <div className="flex-1">
                <div className="flex items-center gap-5 mb-4">
                    <div className="w-16 h-16 bg-white border-2 border-orange-50 rounded-[22px] overflow-hidden shadow-xl shadow-orange-100/50 flex-shrink-0">
                        <img src={divineLogo} alt="Temple Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tighter leading-tight uppercase">
                            Kozhimamparamb Pooram
                        </h1>
                        <h2 className="text-sm font-black text-slate-500 tracking-[0.2em] uppercase mt-0.5">
                            Cheruthuruthy Desam
                        </h2>
                        <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.3em] mt-2">{t.divine_portal}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <p className="text-[9px] font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-wider"><span className="w-1 h-1 bg-orange-500 rounded-full"></span> {t.official_copy}</p>
                    <p className="text-[9px] font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-wider"><span className="w-1 h-1 bg-orange-500 rounded-full"></span> {t.digital_record}</p>
                </div>
            </div>
            
            <div className="text-right shrink-0">
                <div className="bg-slate-50 border border-slate-100 px-5 py-3 rounded-[20px] mb-3 inline-block">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t.receipt_id}</p>
                    <p className="font-mono text-[15px] font-black text-slate-800 tracking-wider">#{data.id}</p>
                </div>
                <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data.date?.split('-').reverse().join('/')}</p>
                    <div className="w-12 h-0.5 bg-orange-500 mt-1 rounded-full opacity-30"></div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12 relative z-10 px-2">
            <div>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.devotee_details}</p>
                </div>
                <p className="font-black text-2xl text-slate-800 leading-tight mb-1">{data.devoteeName || '—'}</p>
                {data.devoteeId && (
                    <p className="inline-flex px-2 py-0.5 bg-slate-50 text-[9px] font-black text-slate-400 rounded uppercase tracking-wider border border-slate-100">
                        {t.reg_id}: #{data.devoteeId}
                    </p>
                )}
            </div>
            
            <div className="text-right">
                <div className="flex items-center justify-end gap-3 mb-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{data.book ? t.reg_reference : t.collection_type}</p>
                    <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                </div>
                
                {data.book ? (
                    <p className="font-mono text-xl font-black text-slate-800 tracking-tight">{data.book} <span className="text-slate-200">/</span> {data.leaf}</p>
                ) : (
                    <p className="font-black text-xl text-slate-800">{data.type || 'General'}</p>
                )}
            </div>
        </div>

        <div className="bg-slate-50/50 border-2 border-slate-100/50 p-10 rounded-[40px] mb-12 relative z-10 backdrop-blur-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 text-center">{t.contribution_summary}</p>
            
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-dashed border-slate-200">
                <div className="flex flex-col">
                    <p className="text-[13px] font-black text-slate-800 leading-none mb-1">{data.description || t.temple_dev_pooja}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Contribution Amount</p>
                </div>
                <p className="text-[15px] font-black text-slate-700">₹{parseFloat(data.paid).toLocaleString()}</p>
            </div>
            
            <div className="flex justify-between items-end pt-2">
                <div className="flex flex-col">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none">{t.total_paid_label}</p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Accepted & Verified</p>
                </div>
                <div className="text-right">
                    <p className="text-5xl font-black text-emerald-700 tracking-tighter tabular-nums leading-none">₹{parseFloat(data.paid).toLocaleString()}</p>
                </div>
            </div>
        </div>

        <div className="flex justify-between items-end border-t-2 border-slate-100 pt-10 relative z-10 px-2 opacity-80">
            <div className="text-[9px] text-slate-400 space-y-2 font-black uppercase tracking-[0.15em]">
                <p className="flex items-center gap-2 text-slate-500"><span className="w-1 h-1 bg-slate-300 rounded-full"></span> {t.computer_generated}</p>
                <p className="flex items-center gap-2"><span className="w-1 h-1 bg-slate-300 rounded-full"></span> {t.payment_method}: <span className="text-slate-700">{data.method || 'Cash'}</span></p>
                <p className="flex items-center gap-2"><span className="w-1 h-1 bg-orange-400 rounded-full"></span> {t.verified_by}</p>
            </div>
            
            <div className="text-center group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-3 mx-auto transition-transform group-hover:scale-110 duration-500 shadow-lg shadow-orange-100 overflow-hidden border-2 border-white ring-2 ring-orange-500/5">
                    <img src={divineLogo} alt="Logo" className="w-full h-full object-cover scale-110" />
                </div>
                <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.3em] animate-pulse">Jai Mahadeva</p>
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
        // Give the browser a moment to update layout for print
        setTimeout(() => {
            window.print();
        }, 150);
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
