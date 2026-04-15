import { useRef } from 'react';
import Modal from './Modal';
import { Printer, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Inner receipt layout — used both in preview and during print
const ReceiptContent = ({ data, t }) => (
    <div id="printable-receipt" className="p-10 bg-white text-slate-900 w-full max-w-[580px] mx-auto border-[12px] border-orange-50 rounded-3xl font-outfit relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/30 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8 relative z-10">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
                    <span className="text-orange-500 text-4xl">🕉</span> {t.temple_name}
                </h1>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{t.divine_portal}</p>
                <div className="flex gap-4 mt-3">
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><X size={10} className="text-orange-500" /> {t.official_copy}</p>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><X size={10} className="text-orange-500" /> {t.digital_record}</p>
                </div>
            </div>
            <div className="text-right">
                <div className="bg-slate-900 text-white px-4 py-2 rounded-xl mb-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.receipt_id}</p>
                    <p className="font-mono text-sm font-black">#{data.id}</p>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.date?.split('-').reverse().join('/')}</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-10 relative z-10">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-l-2 border-orange-500 pl-3">{t.devotee_details}</p>
                <p className="font-black text-xl text-slate-800 leading-tight">{data.devoteeName || '—'}</p>
                {data.devoteeId && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{t.reg_id}: #{data.devoteeId}</p>}
            </div>
            {data.book ? (
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-r-2 border-orange-500 pr-3">{t.reg_reference}</p>
                    <p className="font-mono text-lg font-black text-slate-800">{data.book} / {data.leaf}</p>
                </div>
            ) : (
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-r-2 border-orange-500 pr-3">{t.collection_type}</p>
                    <p className="font-bold text-lg text-slate-800">{data.type || 'General'}</p>
                </div>
            )}
        </div>

        <div className="bg-slate-50 border-2 border-slate-100 p-8 rounded-[32px] mb-10 relative z-10">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">{t.contribution_summary}</p>
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200/50">
                <p className="text-sm font-bold text-slate-500">{data.description || t.temple_dev_pooja}</p>
                <p className="text-base font-black text-slate-700">₹{parseFloat(data.paid).toLocaleString()}</p>
            </div>
            <div className="flex justify-between items-center">
                <p className="text-lg font-black text-slate-800 uppercase tracking-tight">{t.total_paid_label}</p>
                <p className="text-4xl font-black text-emerald-600 tracking-tighter shadow-emerald-50">₹{parseFloat(data.paid).toLocaleString()}</p>
            </div>
        </div>

        <div className="flex justify-between items-end border-t-2 border-slate-100 pt-8 relative z-10">
            <div className="text-[10px] text-slate-400 space-y-1.5 font-bold uppercase tracking-wider">
                <p className="text-slate-500">• {t.computer_generated}</p>
                <p>• {t.payment_method}: {data.method || 'Cash'}</p>
                <p>• {t.verified_by}</p>
            </div>
            <div className="text-center">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <span className="text-2xl">🕉</span>
                </div>
                <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Jai Mahadeva</p>
            </div>
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
        const win = window.open('', '_blank', 'width=700,height=600');
        win.document.write(`
            <html>
                <head>
                    <title>Receipt #${data.id}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap" rel="stylesheet">
                    <style>
                        body { margin: 0; font-family: 'Outfit', sans-serif; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body onload="window.print();window.close()">
                    ${printContent.outerHTML}
                </body>
            </html>
        `);
        win.document.close();
    };

    return (
        <Modal isOpen={!!data} onClose={onClose} title={t.receipt_preview} maxWidth="max-w-2xl">
            <div className="space-y-6">
                <div ref={printRef}>
                    <ReceiptContent data={data} t={t} />
                </div>
                <div className="flex gap-4 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                    >
                        {t.close}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 py-3 bg-orange-500 text-white rounded-2xl font-black shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                    >
                        <Printer size={18} /> {t.print_receipt}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default Receipt;
