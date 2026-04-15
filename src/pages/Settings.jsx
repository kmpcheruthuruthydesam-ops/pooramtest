import { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
    Languages,
    Database,
    RefreshCw,
    Trash2,
    ShieldCheck,
    FileSpreadsheet,
    Upload,
    CheckCircle2,
    XCircle,
    FileDown,
    KeyRound,
    Eye,
    EyeOff
} from 'lucide-react';
import Modal from '../components/Modal';

const Settings = () => {
    const { language, setLanguage, t } = useLanguage();
    const { 
        seedMockData, seedPooramData, seedVilakkuData, purgeData, 
        exportBackup, importBackup, importFromExcel, exportToExcel,
        migrateLocalToCloud 
    } = useData();
    const { userRole, currentUsername, changePassword } = useAuth();

    // Confirm modal state
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [restoreFile, setRestoreFile] = useState(null);

    // Change password state
    const [cpCurrent, setCpCurrent] = useState('');
    const [cpNew, setCpNew] = useState('');
    const [cpConfirm, setCpConfirm] = useState('');
    const [cpErrors, setCpErrors] = useState({});
    const [cpLoading, setCpLoading] = useState(false);
    const [cpSuccess, setCpSuccess] = useState(false);
    const [showCpCurrent, setShowCpCurrent] = useState(false);
    const [showCpNew, setShowCpNew] = useState(false);
    const [showCpConfirm, setShowCpConfirm] = useState(false);

    // Excel import state
    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
    const [excelPreview, setExcelPreview] = useState(null); // { records: [], fileName }
    const [excelBuffer, setExcelBuffer] = useState(null);
    const [importResult, setImportResult] = useState(null); // { success, count, error }
    const excelInputRef = useRef(null);

    // ─── Confirm modal helpers ───────────────────────────────────────────────
    const handleActionTrigger = (type, data = null) => {
        setPendingAction(type);
        if (data) setRestoreFile(data);
        setIsConfirmModalOpen(true);
    };

    const executeAction = async () => {
        setIsConfirmModalOpen(false);
        if (pendingAction === 'purge') await purgeData();
        if (pendingAction === 'seed') await seedMockData();
        if (pendingAction === 'seedPooram') seedPooramData();
        if (pendingAction === 'seedVilakku') seedVilakkuData();
        if (pendingAction === 'restore' && restoreFile) importBackup(restoreFile);
        if (pendingAction === 'migrate') await migrateLocalToCloud();
    };

    const handleFileImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            handleActionTrigger('restore', event.target.result);
        };
        reader.readAsText(file);
    };

    const getModalContent = () => {
        if (pendingAction === 'purge') return {
            title: t.purge_db_title,
            message: t.purge_db_msg,
            btnText: t.purge_confirm_btn,
            icon: <Trash2 size={32} className="text-rose-500" />
        };
        if (pendingAction === 'seed') return {
            title: t.restore_samples_title,
            message: t.restore_samples_msg,
            btnText: t.restore_samples_btn,
            icon: <RefreshCw size={32} className="text-blue-500" />
        };
        if (pendingAction === 'restore') return {
            title: t.restore_backup_title,
            message: t.restore_backup_msg,
            btnText: t.restore_backup_btn,
            icon: <Database size={32} className="text-emerald-500" />
        };
        if (pendingAction === 'migrate') return {
            title: 'Migrate to Cloud',
            message: 'Move all local session data to Supabase? This will merge your browser data into the cloud database.',
            btnText: 'Yes, Migrate to Cloud',
            icon: <Database size={32} className="text-emerald-500" />
        };

        return {};
    };

    const modalData = getModalContent();

    // ─── Password strength ────────────────────────────────────────────────────
    const getPasswordStrength = (pwd) => {
        if (!pwd) return null;
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        if (score <= 1) return { label: 'Weak', color: 'bg-rose-500', width: '20%', text: 'text-rose-500' };
        if (score <= 2) return { label: 'Fair', color: 'bg-amber-400', width: '40%', text: 'text-amber-500' };
        if (score <= 3) return { label: 'Good', color: 'bg-yellow-400', width: '60%', text: 'text-yellow-600' };
        if (score === 4) return { label: 'Strong', color: 'bg-emerald-400', width: '80%', text: 'text-emerald-500' };
        return { label: 'Very Strong', color: 'bg-emerald-600', width: '100%', text: 'text-emerald-600' };
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!cpCurrent) errs.current = t.required;
        if (!cpNew) errs.new = t.required;
        else if (cpNew.length < 6) errs.new = t.min_chars;
        if (!cpConfirm) errs.confirm = t.required;
        else if (cpNew !== cpConfirm) errs.confirm = t.pwd_mismatch;
        if (Object.keys(errs).length) { setCpErrors(errs); return; }
        setCpErrors({});
        setCpLoading(true);
        const result = await changePassword(currentUsername, cpCurrent, cpNew);
        setCpLoading(false);
        if (result.success) {
            setCpSuccess(true);
            setCpCurrent(''); setCpNew(''); setCpConfirm('');
            toast.success(t.pwd_changed);
            setTimeout(() => setCpSuccess(false), 4000);
        } else {
            setCpErrors({ current: result.error });
        }
    };

    // ─── Excel import helpers ─────────────────────────────────────────────────
    const handleExcelFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const buffer = new Uint8Array(event.target.result);
            setExcelBuffer(buffer);
            setImportResult(null);

            // Dynamic import xlsx for preview
            import('xlsx').then(XLSX => {
                try {
                    const workbook = XLSX.read(buffer, { type: 'array' });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                    setExcelPreview({ rows: rows.slice(0, 5), total: rows.length, fileName: file.name });
                    setIsExcelModalOpen(true);
                } catch (err) {
                    toast.error('Failed to read Excel file: ' + err.message);
                }
            });
        };
        reader.readAsArrayBuffer(file);
        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    const handleExcelImportConfirm = () => {
        if (!excelBuffer) return;
        const result = importFromExcel(excelBuffer);
        setImportResult(result);
    };

    const closeExcelModal = () => {
        setIsExcelModalOpen(false);
        setExcelPreview(null);
        setExcelBuffer(null);
        setImportResult(null);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <header className="mb-10">
                <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">{t.settings}</h1>
                <p className="text-slate-400 font-medium">{t.settings_subtitle}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Language Settings */}
                <div className="glass-card p-8 space-y-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                            <Languages size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{t.lang_pref}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t.regional_settings}</p>
                        </div>
                    </div>
                    
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                        <button 
                            onClick={() => setLanguage('en')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${language === 'en' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            English
                        </button>
                        <button 
                            onClick={() => setLanguage('ml')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${language === 'ml' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            മലയാളം
                        </button>
                    </div>
                </div>

                {/* Data Portability — unified 2×2 grid */}
                <div className="glass-card p-8 space-y-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                            <Database size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{t.data_portability}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t.data_mgmt}</p>
                        </div>
                    </div>

                    {/* Hidden file inputs */}
                    <input type="file" id="restore-input" accept=".json" className="hidden" onChange={handleFileImport} />
                    <input ref={excelInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelFileSelect} />

                    <div className="grid grid-cols-2 gap-4">
                        {/* 1 — Backup JSON */}
                        <button 
                            onClick={exportBackup}
                            className="flex items-center gap-4 p-5 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all group shadow-sm text-left"
                        >
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 shrink-0 group-hover:scale-110 transition-transform">
                                <Database size={22} />
                            </div>
                            <div>
                                <p className="font-black text-slate-700 text-sm">{t.backup_json}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{t.backup_json_desc}</p>
                            </div>
                        </button>

                        {/* 2 — Export Excel */}
                        <button 
                            onClick={exportToExcel}
                            className="flex items-center gap-4 p-5 bg-white hover:bg-emerald-50 border border-emerald-100 rounded-2xl transition-all group shadow-sm text-left"
                        >
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
                                <FileDown size={22} />
                            </div>
                            <div>
                                <p className="font-black text-emerald-700 text-sm">{t.export_excel}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{t.export_excel_desc}</p>
                            </div>
                        </button>

                        {/* 3 — Restore JSON Backup */}
                        <button 
                            onClick={() => userRole === 'master' ? document.getElementById('restore-input').click() : toast.error('Permission denied: Master Admin access required')}
                            className={`flex items-center gap-4 p-5 border rounded-2xl transition-all group shadow-sm text-left ${userRole === 'master' ? 'bg-white hover:bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'}`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform ${userRole === 'master' ? 'bg-blue-50 text-blue-500 group-hover:scale-110' : 'bg-slate-200 text-slate-400'}`}>
                                <RefreshCw size={22} />
                            </div>
                            <div>
                                <p className="font-black text-slate-700 text-sm">{t.restore_backup}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{t.restore_json_desc}</p>
                            </div>
                        </button>

                        {/* 4 — Import Excel */}
                        <button 
                            onClick={() => userRole === 'master' ? excelInputRef.current.click() : toast.error('Permission denied: Master Admin access required')}
                            className={`flex items-center gap-4 p-5 border rounded-2xl transition-all group shadow-sm text-left ${userRole === 'master' ? 'bg-white hover:bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'}`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform ${userRole === 'master' ? 'bg-emerald-50 text-emerald-600 group-hover:scale-110' : 'bg-slate-200 text-slate-400'}`}>
                                <Upload size={22} />
                            </div>
                            <div>
                                <p className="font-black text-emerald-700 text-sm">{t.import_excel}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{t.import_excel_desc}</p>
                            </div>
                        </button>
                    </div>

                    {/* Column hint */}
                    <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.excel_expected_cols}</p>
                        <div className="flex flex-wrap gap-2">
                            {['Name', 'Phone', 'Address', 'Expected', 'Paid', 'Status'].map(col => (
                                <span key={col} className="px-3 py-1 bg-white border border-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg uppercase tracking-wider">{col}</span>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-2">{t.excel_import_hint}</p>
                    </div>
                </div>
            </div>

            {/* Change Password — master only */}
            {userRole === 'master' && (
                <div className="glass-card p-8 space-y-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-500">
                            <KeyRound size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{t.change_password}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t.master_only}</p>
                        </div>
                    </div>

                    {cpSuccess ? (
                        <div className="flex items-center gap-3 p-5 bg-emerald-50 rounded-2xl">
                            <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />
                            <p className="font-bold text-emerald-700 text-sm">{t.pwd_updated}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
                            {/* Current Password */}
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">{t.current_password}</label>
                                <div className="relative">
                                    <input
                                        type={showCpCurrent ? 'text' : 'password'}
                                        value={cpCurrent}
                                        onChange={e => { setCpCurrent(e.target.value); setCpErrors(prev => ({ ...prev, current: '' })); }}
                                        autoComplete="current-password"
                                        className={`w-full bg-white border-2 rounded-2xl px-5 pr-12 py-4 text-sm font-bold text-slate-700 outline-none transition-all ${cpErrors.current ? 'border-rose-400 bg-rose-50/20' : 'border-slate-100 focus:border-violet-400/50'}`}
                                        placeholder={t.enter_current_pwd}
                                    />
                                    <button type="button" tabIndex={-1} onClick={() => setShowCpCurrent(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showCpCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {cpErrors.current && <p className="text-xs font-bold text-rose-500 mt-1.5">{cpErrors.current}</p>}
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">{t.new_password}</label>
                                <div className="relative">
                                    <input
                                        type={showCpNew ? 'text' : 'password'}
                                        value={cpNew}
                                        onChange={e => { setCpNew(e.target.value); setCpErrors(prev => ({ ...prev, new: '' })); }}
                                        autoComplete="new-password"
                                        className={`w-full bg-white border-2 rounded-2xl px-5 pr-12 py-4 text-sm font-bold text-slate-700 outline-none transition-all ${cpErrors.new ? 'border-rose-400 bg-rose-50/20' : 'border-slate-100 focus:border-violet-400/50'}`}
                                        placeholder={t.enter_new_pwd}
                                    />
                                    <button type="button" tabIndex={-1} onClick={() => setShowCpNew(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showCpNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {cpErrors.new && <p className="text-xs font-bold text-rose-500 mt-1.5">{cpErrors.new}</p>}
                                {/* Strength indicator */}
                                {cpNew && (() => {
                                    const s = getPasswordStrength(cpNew);
                                    return (
                                        <div className="mt-2 space-y-1">
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-300 ${s.color}`} style={{ width: s.width }} />
                                            </div>
                                            <p className={`text-[11px] font-black ${s.text}`}>{s.label}</p>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">{t.confirm_new_password}</label>
                                <div className="relative">
                                    <input
                                        type={showCpConfirm ? 'text' : 'password'}
                                        value={cpConfirm}
                                        onChange={e => { setCpConfirm(e.target.value); setCpErrors(prev => ({ ...prev, confirm: '' })); }}
                                        autoComplete="new-password"
                                        className={`w-full bg-white border-2 rounded-2xl px-5 pr-12 py-4 text-sm font-bold text-slate-700 outline-none transition-all ${cpErrors.confirm ? 'border-rose-400 bg-rose-50/20' : 'border-slate-100 focus:border-violet-400/50'}`}
                                        placeholder={t.repeat_new_pwd}
                                    />
                                    <button type="button" tabIndex={-1} onClick={() => setShowCpConfirm(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showCpConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {cpErrors.confirm && <p className="text-xs font-bold text-rose-500 mt-1.5">{cpErrors.confirm}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={cpLoading}
                                className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-violet-200 hover:bg-violet-700 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                            >
                                {cpLoading ? t.verifying : t.update_password}
                            </button>
                        </form>
                    )}
                </div>
            )}

            {/* System Maintenance */}
            <div className="glass-card p-8 bg-slate-50/50 border-white/60">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{t.dangerous_actions}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t.dangerous_actions_desc}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button 
                            onClick={() => userRole === 'master' ? handleActionTrigger('seed') : toast.error('Permission denied: Master Admin access required')}
                            className={`px-4 py-3 border rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${userRole === 'master' ? 'bg-white hover:bg-slate-50 border-slate-100 text-slate-700' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                            <RefreshCw size={14} className={userRole === 'master' ? 'text-slate-500' : 'text-slate-400'} /> {t.all_samples}
                        </button>

                        <button 
                            onClick={() => userRole === 'master' ? handleActionTrigger('migrate') : toast.error('Permission denied: Master Admin access required')}
                            className={`px-4 py-3 border rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${userRole === 'master' ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                            <Database size={14} className="text-emerald-500" /> Migrate to Cloud
                        </button>

                        <button 
                            onClick={() => userRole === 'master' ? handleActionTrigger('purge') : toast.error('Permission denied: Master Admin access required')}
                            className={`px-4 py-3 border rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${userRole === 'master' ? 'bg-rose-50/30 hover:bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                            <Trash2 size={14} /> {t.purge_everything}
                        </button>
                    </div>
                </div>
            </div>

            {/* About Card */}
            <div className="glass-card p-8 bg-gradient-to-br from-slate-800 to-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                                <ShieldCheck size={20} className="text-orange-400" />
                            </div>
                            <h3 className="text-lg font-black tracking-tight">{t.quick_action_portal} v2.0</h3>
                        </div>
                        <p className="text-slate-400 text-sm font-medium max-w-lg">
                            {t.privacy_vault_desc}
                        </p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Last Update</p>
                        <p className="text-sm font-bold text-orange-400">{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
            </div>

            {/* ── Confirm Action Modal ─────────────────────────────── */}
            <Modal 
                isOpen={isConfirmModalOpen} 
                onClose={() => setIsConfirmModalOpen(false)} 
                title={modalData.title}
            >
                <div className="text-center p-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        {modalData.icon}
                    </div>
                    <p className="text-slate-600 font-bold mb-8">{modalData.message}</p>
                    <div className="flex gap-4">
                        <button onClick={() => setIsConfirmModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">{t.cancel}</button>
                        <button onClick={executeAction} className={`flex-1 py-4 text-white rounded-2xl font-black shadow-xl hover:scale-[1.02] transition-all ${pendingAction === 'purge' ? 'bg-rose-500 shadow-rose-100 hover:bg-rose-600' : 'bg-slate-800 shadow-slate-200 hover:bg-slate-900'}`}>
                            {modalData.btnText}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Excel Import Preview Modal ───────────────────────── */}
            <Modal
                isOpen={isExcelModalOpen}
                onClose={closeExcelModal}
                title={t.excel_import_preview}
                maxWidth="max-w-2xl"
            >
                <div className="space-y-6">
                    {!importResult ? (
                        <>
                            {excelPreview && (
                                <>
                                    <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl">
                                        <FileSpreadsheet size={20} className="text-emerald-600 shrink-0" />
                                        <div>
                                            <p className="font-black text-slate-800 text-sm">{excelPreview.fileName}</p>
                                            <p className="text-xs font-bold text-emerald-600">{excelPreview.total} rows detected</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Preview (first 5 rows)</p>
                                        <div className="overflow-x-auto rounded-2xl border border-slate-100">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="bg-slate-50">
                                                        {excelPreview.rows.length > 0 && Object.keys(excelPreview.rows[0]).slice(0, 6).map(k => (
                                                            <th key={k} className="px-4 py-3 text-left font-black text-slate-500 uppercase tracking-wider">{k}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {excelPreview.rows.map((row, i) => (
                                                        <tr key={i} className="hover:bg-slate-50">
                                                            {Object.values(row).slice(0, 6).map((val, j) => (
                                                                <td key={j} className="px-4 py-3 text-slate-600 font-medium truncate max-w-[120px]">{String(val)}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <p className="text-xs font-bold text-slate-400 text-center">
                                        ⚡ Records will be <span className="text-emerald-600">added</span> to your existing database (not replaced)
                                    </p>

                                    <div className="flex gap-4">
                                        <button onClick={closeExcelModal} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">
                                            {t.cancel}
                                        </button>
                                        <button onClick={handleExcelImportConfirm} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                            <Upload size={18} /> {t.import_excel} ({excelPreview.total} {t.records_small})
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8">
                            {importResult.success ? (
                                <>
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 size={40} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 mb-2">{t.import_success_title}</h3>
                                    <p className="text-slate-500 font-bold mb-8">
                                        <span className="text-emerald-600 text-3xl font-black">{importResult.count}</span> {t.import_success_msg}
                                    </p>
                                    <button onClick={closeExcelModal} className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all">
                                        {t.done}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <XCircle size={40} className="text-rose-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 mb-2">{t.import_failed_title}</h3>
                                    <p className="text-slate-500 font-bold mb-2">{importResult.error}</p>
                                    <p className="text-xs text-slate-400 mb-8">{t.import_failed_hint}</p>
                                    <button onClick={closeExcelModal} className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-900 transition-all">
                                        {t.close}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default Settings;
