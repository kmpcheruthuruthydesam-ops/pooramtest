import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
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
    EyeOff,
    Users,
    Shield
} from 'lucide-react';
import Modal from '../components/Modal';

const Settings = () => {
    const { language, setLanguage, t } = useLanguage();
    const { 
        seedMockData, seedPooramData, seedVilakkuData, purgeData, 
        exportBackup, importBackup, importFromExcel, exportToExcel,
        migrateLocalToCloud, debugMode, toggleDebugMode, devoteeData 
    } = useData();
    const { userRole, currentUsername, changePassword } = useAuth();
    const isMaster = true; // Everyone is master now
    const isAnyAdmin = !!userRole;

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
    const [excelPreview, setExcelPreview] = useState(null); 
    const [excelBuffer, setExcelBuffer] = useState(null);
    const [importResult, setImportResult] = useState(null); 
    const excelInputRef = useRef(null);

    // Team management state
    const [profiles, setProfiles] = useState([]);
    const [isProfilesLoading, setIsProfilesLoading] = useState(false);

    useEffect(() => {
        if (isMaster) {
            fetchProfiles();
        }
    }, [isMaster]);

    const fetchProfiles = async () => {
        setIsProfilesLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('username', { ascending: true });
        
        if (error) {
            toast.error('Failed to load team: ' + error.message);
        } else {
            setProfiles(data || []);
        }
        setIsProfilesLoading(false);
    };

    const handleRoleUpdate = async (userId, newRole) => {
        const { error } = await supabase
            .from('profiles')
            .update({ master: newRole })
            .eq('id', userId);
        
        if (error) {
            toast.error('Failed to update role: ' + error.message);
        } else {
            toast.success(t.role_updated);
            fetchProfiles(); // Refresh list
        }
    };

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
        if (pendingAction === 'seedPooram') return {
            title: t.pooram_gen_title || 'Seed Pooram Data',
            message: t.pooram_gen_msg || 'Generate 500 sample records for Pooram Festival?',
            btnText: t.pooram_gen_btn || 'Yes, Seed Pooram',
            icon: <RefreshCw size={32} className="text-orange-500" />
        };
        if (pendingAction === 'seedVilakku') return {
            title: t.vilakku_gen_title || 'Seed Vilakku Data',
            message: t.vilakku_gen_msg || 'Generate 500 sample records for Ayyappan Vilakku?',
            btnText: t.vilakku_gen_btn || 'Yes, Seed Vilakku',
            icon: <RefreshCw size={32} className="text-emerald-500" />
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

    const handleExcelImportConfirm = async () => {
        if (!excelBuffer) return;
        const result = await importFromExcel(excelBuffer);
        setImportResult(result);
    };

    const closeExcelModal = () => {
        setIsExcelModalOpen(false);
        setExcelPreview(null);
        setExcelBuffer(null);
        setImportResult(null);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-10 pb-16 px-4">
            <header className="pt-8 mb-4">
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-2">{t.settings}</h1>
                <p className="text-sm font-medium text-slate-400">{t.settings_subtitle}</p>
            </header>

            {/* General Section */}
            <div className="space-y-3">
                <h2 className="px-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">{t.regional_settings || 'Regional Settings'}</h2>
                <div className="ios-section">
                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-500 rounded-[10px] flex items-center justify-center text-white shadow-sm shadow-orange-100">
                                <Languages size={20} />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-900">{t.lang_pref}</h3>
                                <p className="text-[11px] font-medium text-slate-400">{t.regional_settings}</p>
                            </div>
                        </div>
                        
                        <div className="flex bg-slate-100/60 p-1.5 rounded-[12px]">
                            <button 
                                onClick={() => setLanguage('en')}
                                className={`flex-1 py-2.5 rounded-[9px] font-bold text-xs transition-all ${language === 'en' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                English
                            </button>
                            <button 
                                onClick={() => setLanguage('ml')}
                                className={`flex-1 py-2.5 rounded-[9px] font-bold text-xs transition-all ${language === 'ml' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                മലയാളം
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Management Section */}
            <div className="space-y-3">
                <h2 className="px-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">{t.data_mgmt}</h2>
                <div className="ios-section divide-y divide-slate-100/50">
                    {/* JSON Data */}
                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-500 rounded-[10px] flex items-center justify-center text-white shadow-sm shadow-blue-100">
                                <Database size={20} />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-900">{t.data_portability}</h3>
                                <p className="text-[11px] font-medium text-slate-400">{t.backup_json_desc}</p>
                            </div>
                        </div>

                        <input type="file" id="restore-input" accept=".json" className="hidden" onChange={handleFileImport} />
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={exportBackup} className="py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs text-slate-700 active:scale-[0.98] transition-all">
                                {t.backup_json}
                            </button>
                            <button onClick={() => document.getElementById('restore-input').click()} className="py-3 bg-white border border-slate-100 rounded-xl font-bold text-xs text-slate-700 active:scale-[0.98] transition-all">
                                {t.restore_backup}
                            </button>
                        </div>
                    </div>

                    {/* Excel Data */}
                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-500 rounded-[10px] flex items-center justify-center text-white shadow-sm shadow-emerald-100">
                                <FileSpreadsheet size={20} />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-900">{t.excel_mgmt}</h3>
                                <p className="text-[11px] font-medium text-slate-400">{t.excel_mgmt_desc}</p>
                            </div>
                        </div>

                        <input ref={excelInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelFileSelect} />
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={exportToExcel} className="py-3 bg-white border border-emerald-100 rounded-xl font-bold text-xs text-emerald-700 active:scale-[0.98] transition-all">
                                {t.export_excel}
                            </button>
                            <button onClick={() => excelInputRef.current.click()} className="py-3 bg-white border border-emerald-100 rounded-xl font-bold text-xs text-emerald-700 active:scale-[0.98] transition-all">
                                {t.import_excel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account & Team Section */}
            <div className="space-y-3">
                <h2 className="px-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">{t.administrator}</h2>
                <div className="ios-section divide-y divide-slate-100/50">
                    {/* Team Members List */}
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-500 rounded-[10px] flex items-center justify-center text-white shadow-sm shadow-indigo-100">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-bold text-slate-900">{t.team_mgmt}</h3>
                                    <p className="text-[11px] font-medium text-slate-400">{profiles.length} Active Admins</p>
                                </div>
                            </div>
                            <button onClick={fetchProfiles} className={`p-2 text-slate-400 ${isProfilesLoading ? 'animate-spin' : ''}`}>
                                <RefreshCw size={16} />
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            {profiles.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">{p.username}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Full Access Admin</p>
                                    </div>
                                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md uppercase">Master</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Password Change */}
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-violet-500 rounded-[10px] flex items-center justify-center text-white shadow-sm shadow-violet-100">
                                <KeyRound size={20} />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-900">{t.change_password}</h3>
                                <p className="text-[11px] font-medium text-slate-400">Security & Credentials</p>
                            </div>
                        </div>

                        {cpSuccess ? (
                            <div className="p-4 bg-emerald-50 rounded-xl flex items-center gap-3">
                                <CheckCircle2 size={18} className="text-emerald-500" />
                                <p className="text-xs font-bold text-emerald-700">{t.pwd_updated}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="space-y-3">
                                    <input 
                                        type={showCpCurrent ? 'text' : 'password'}
                                        placeholder={t.current_password}
                                        value={cpCurrent}
                                        onChange={e => setCpCurrent(e.target.value)}
                                        className="w-full bg-slate-100/50 border-none rounded-xl px-4 py-3 text-xs font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500/20"
                                    />
                                    <input 
                                        type={showCpNew ? 'text' : 'password'}
                                        placeholder={t.new_password}
                                        value={cpNew}
                                        onChange={e => setCpNew(e.target.value)}
                                        className="w-full bg-slate-100/50 border-none rounded-xl px-4 py-3 text-xs font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500/20"
                                    />
                                </div>
                                <button className="w-full py-3 bg-violet-600 text-white rounded-xl font-black text-xs shadow-lg shadow-violet-100 active:scale-[0.98] transition-all">
                                    {cpLoading ? t.verifying : t.update_password}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Advanced Section/Developer Hub */}
            <div className="space-y-3">
                <h2 className="px-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">{t.dev_hub}</h2>
                <div className="ios-section divide-y divide-slate-100/50">
                    <div className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-800 rounded-[10px] flex items-center justify-center text-white">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-900">{t.debug_mode}</h3>
                                <p className="text-[11px] font-medium text-slate-400">Developer diagnostics</p>
                            </div>
                        </div>
                        <div className="relative flex items-center">
                            <input type="checkbox" className="peer sr-only" checked={debugMode} onChange={toggleDebugMode} id="debug-toggle" />
                            <label htmlFor="debug-toggle" className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 cursor-pointer"></label>
                        </div>
                    </div>

                    <div className="p-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Database Maintenance</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <button 
                                onClick={() => handleActionTrigger('seed')}
                                className="py-3.5 bg-white border border-slate-100 rounded-xl font-bold text-xs text-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={16} className="text-blue-500" /> All Samples (1000)
                            </button>
                            <button 
                                onClick={() => handleActionTrigger('seedPooram')}
                                className="py-3.5 bg-white border border-slate-100 rounded-xl font-bold text-xs text-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={16} className="text-orange-500" /> Pooram Samples (500)
                            </button>
                            <button 
                                onClick={() => handleActionTrigger('seedVilakku')}
                                className="py-3.5 bg-white border border-slate-100 rounded-xl font-bold text-xs text-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={16} className="text-emerald-500" /> Vilakku Samples (500)
                            </button>
                            <button 
                                onClick={() => handleActionTrigger('purge')}
                                className="py-3.5 bg-rose-50 text-rose-500 rounded-xl font-black text-xs hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} /> {t.purge_everything}
                            </button>
                        </div>
                        <p className="text-[10px] font-medium text-slate-300 text-center uppercase tracking-tight">Warning: Purging deletes all cloud records permanently.</p>
                    </div>
                </div>
            </div>

            {/* Footer Brand */}
            <div className="text-center pt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100/50 rounded-full mb-2">
                    <ShieldCheck size={14} className="text-orange-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.quick_action_portal} v2.8</span>
                </div>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tight">Kozhimamparamb pooram cheruthuruthy desam</p>
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
