import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { 
    BookOpen, 
    LayoutDashboard, 
    Users, 
    Coins, 
    ReceiptText, 
    ShieldCheck, 
    Keyboard, 
    Printer,
    ArrowLeft,
    Smartphone,
    Database,
    Zap,
    MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserManual = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();

    const sections = [
        {
            id: 'dashboard',
            icon: <LayoutDashboard className="text-orange-500" />,
            title: language === 'ml' ? 'ഡാഷ്ബോർഡ് - പ്രധാന വിവരങ്ങൾ' : 'Dashboard - Key Metrics',
            content: language === 'ml' ? 
                'ക്ഷേത്രത്തിന്റെ സാമ്പത്തിക നില ഒറ്റനോട്ടത്തിൽ മനസ്സിലാക്കാൻ ഡാഷ്ബോർഡ് സഹായിക്കുന്നു. ഇവിടെ ആകെ ഭക്തരുടെ എണ്ണം, ഇതുവരെ ലഭിച്ച തുക, ഇനി ലഭിക്കാനുള്ള കുടിശ്ശിക (Pending) എന്നിവ വ്യക്തമായി കാണാൻ സാധിക്കും. കൂടാതെ വരവ്-ചെലവ് ഗ്രാഫുകളും ഇതിൽ ഉൾപ്പെടുത്തിയിട്ടുണ്ട്.' :
                'The dashboard provides a real-time overview of devotees, total collections, and pending payments with visual charts and metrics.'
        },
        {
            id: 'devotees',
            icon: <Users className="text-blue-500" />,
            title: language === 'ml' ? 'ഭക്തരുടെ മാനേജ്‌മെന്റ്' : 'Devotee Management',
            content: language === 'ml' ? 
                'പുതിയ ഭക്തരെ സിസ്റ്റത്തിൽ ചേർക്കാനും അവരുടെ പേര്, ഫോൺ നമ്പർ, വിലാസം എന്നിവ തിരയാനും ഈ ഭാഗം ഉപയോഗിക്കാം. ഓരോ ഭക്തന്റെയും വ്യക്തിഗത പ്രൊഫൈലിൽ പോയാൽ അവർ ഇതുവരെ നൽകിയ സംഭാവനകളുടെ പൂർണ്ണരൂപം കാണാൻ സാധിക്കും.' :
                'Manage your database by adding new devotees, searching by name/phone, and updating residential addresses or registry details.'
        },
        {
            id: 'collections',
            icon: <Coins className="text-emerald-500" />,
            title: language === 'ml' ? 'പിരിവും ഡിജിറ്റൽ രസീതുകളും' : 'Collections & Digital Receipts',
            content: language === 'ml' ? 
                'പൂരം ട്രാക്കർ (Pooram Tracker), വിളക്ക് ട്രാക്കർ (Vilakku Tracker) എന്നിവ വഴി പ്രത്യേക ഇനങ്ങൾക്കായി പണം രേഖപ്പെടുത്താം. പണം സ്വീകരിച്ചാലുടൻ തന്നെ ഡിജിറ്റൽ രസീതുകൾ പ്രിന്റ് ചെയ്യാനോ വാട്സാപ്പ് വഴി അയക്കാനോ സാധിക്കും.' :
                'Track specific festival contributions (Pooram/Vilakku) and generate professional digital receipts for every transaction.'
        },
        {
            id: 'expenses',
            icon: <ReceiptText className="text-rose-500" />,
            title: language === 'ml' ? 'ക്ഷേത്ര ചെലവുകൾ' : 'Expense Management',
            content: language === 'ml' ? 
                'ക്ഷേത്രത്തിലെ എല്ലാത്തരം ചെലവുകളും (Maintenance, Festival etc.) ഇതിൽ രേഖപ്പെടുത്താം. ഇത് കൃത്യമായ ഓഡിറ്റിംഗിനും പ്രതിമാസ കണക്കുകൾ തയ്യാറാക്കാനും നിങ്ങളെ സഹായിക്കുന്നു.' :
                'Keep a precise record of all temple expenditures, categorized for easier auditing and monthly financial planning.'
        },
        {
            id: 'security',
            icon: <ShieldCheck className="text-indigo-500" />,
            title: language === 'ml' ? 'സുരക്ഷയും ഡാറ്റാ ബാക്കപ്പും' : 'Security & Data Backup',
            content: language === 'ml' ? 
                'നിങ്ങളുടെ വിവരങ്ങൾ സുരക്ഷിതമായി ബാക്കപ്പ് ചെയ്യാനും (Backup), ആവശ്യമെങ്കിൽ എക്സൽ (Excel) ഫയലുകളായി മാറ്റാനും ഇവിടെ സൗകര്യമുണ്ട്. പ്രൈവസി മോഡ് (Privacy Mode) ഓൺ ചെയ്താൽ മറ്റുള്ളവരുടെ മുന്നിൽ വെച്ച് ഡാഷ്ബോർഡ് കാണിക്കുമ്പോൾ സാമ്പത്തിക വിവരങ്ങൾ മറച്ചു വെക്കാം.' :
                'Secure your data with JSON/Excel backups, use Privacy Mode to hide sensitive values, and manage cloud synchronization.'
        }
    ];

    const shortcuts = [
        { key: 'd', desc: language === 'ml' ? 'ഡാഷ്ബോർഡ് തുറക്കാൻ' : 'Dashboard' },
        { key: 'v', desc: language === 'ml' ? 'ഭക്തരുടെ പട്ടിക കാണാൻ' : 'Devotees List' },
        { key: 'c', desc: language === 'ml' ? 'പിരിവ് ചരിത്രം' : 'Collections' },
        { key: 'e', desc: language === 'ml' ? 'ചെലവുകൾ രേഖപ്പെടുത്താൻ' : 'Expenses' },
        { key: 's', desc: language === 'ml' ? 'ക്രമീകരണങ്ങൾ (Settings)' : 'Settings' },
        { key: 'n', desc: language === 'ml' ? 'പുതിയ ആളെ ചേർക്കാൻ' : 'New Devotee' },
        { key: '?', desc: language === 'ml' ? 'സഹായം കാണാൻ' : 'Show Help' }
    ];

    return (
        <div className="space-y-8 pb-20 print:pb-0 print:space-y-6">
            {/* Header - Hidden in Print */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/settings')}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-600 transition-all active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t.user_manual}</h1>
                        <p className="text-sm font-medium text-slate-400">Quick Guide & Help Center</p>
                    </div>
                </div>
                <button 
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                    <Printer size={18} />
                    {language === 'ml' ? 'PDF ആയി സേവ് ചെയ്യുക' : 'Save as PDF'}
                </button>
            </header>

            {/* Print Only Header */}
            <div className="hidden print:block text-center border-b-2 border-slate-100 pb-8 mb-8">
                <h1 className="text-4xl font-black text-slate-900 mb-2">Committee CRM User Manual</h1>
                <p className="text-slate-500 font-bold">Kozhimamparamb Pooram Cheruthuruthy Desam</p>
                <div className="mt-4 text-[10px] uppercase tracking-widest text-slate-400 font-black">Official Documentation</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {sections.map((section, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={section.id}
                            className="glass-card p-8 print:shadow-none print:border-slate-100 print:bg-white"
                        >
                            <div className="flex items-start gap-6">
                                <div className="p-4 bg-slate-50 rounded-2xl print:bg-slate-100 shrink-0">
                                    {section.icon}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-slate-800">{section.title}</h3>
                                    <p className="text-slate-500 leading-relaxed font-medium">
                                        {section.content}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {/* WhatsApp Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass-card p-8 bg-emerald-50 border-emerald-100 print:bg-white print:border-slate-100"
                    >
                        <div className="flex items-start gap-6">
                            <div className="p-4 bg-emerald-500 text-white rounded-2xl shrink-0">
                                <MessageSquare size={24} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-emerald-900">{language === 'ml' ? 'വാട്സാപ്പ് റിമൈൻഡറുകൾ' : 'WhatsApp Reminders'}</h3>
                                <p className="text-emerald-700 leading-relaxed font-medium">
                                    {language === 'ml' ? 
                                        'കുടിശ്ശികയുള്ള ഭക്തർക്ക് നേരിട്ട് വാട്സാപ്പ് സന്ദേശങ്ങൾ അയക്കാം. പ്രൊഫൈലിലെ വാട്സാപ്പ് ഐക്കൺ അമർത്തിയാൽ സന്ദേശം ഓട്ടോമാറ്റിക്കായി തയ്യാറാകും.' :
                                        'Send payment reminders directly to devotees via WhatsApp. The message will be automatically drafted with the pending amount.'
                                    }
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="space-y-8">
                    {/* Shortcuts Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card p-8 bg-slate-900 text-white print:text-slate-900 print:bg-white print:border-slate-100"
                    >
                        <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                            <Keyboard className="text-orange-400" />
                            {language === 'ml' ? 'പെട്ടെന്നുള്ള വഴികൾ' : 'Shortcuts'}
                        </h3>
                        <div className="space-y-3">
                            {shortcuts.map(s => (
                                <div key={s.key} className="flex items-center justify-between p-3 bg-white/10 rounded-xl print:bg-slate-50">
                                    <span className="text-sm font-bold opacity-80">{s.desc}</span>
                                    <kbd className="px-3 py-1 bg-white/20 border border-white/20 rounded-lg text-xs font-black print:bg-white print:border-slate-200">{s.key}</kbd>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick Tips */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white print:hidden"
                    >
                        <h3 className="text-lg font-black mb-4 flex items-center gap-3">
                            <Zap size={20} />
                            {language === 'ml' ? 'പ്രധാനപ്പെട്ട ഒരു കാര്യം' : 'Quick Tip'}
                        </h3>
                        <p className="text-sm font-bold text-orange-50 leading-relaxed">
                            {language === 'ml' ? 
                                'ഏത് സ്ക്രീനിൽ നിന്നും താഴെ വലതുവശത്തുള്ള ഫ്ലോട്ടിംഗ് ബട്ടൺ ഉപയോഗിച്ച് പെട്ടെന്ന് ഭക്തരെ ചേർക്കാനോ പണം രേഖപ്പെടുത്താനോ സാധിക്കും.' :
                                'Use the floating action button at the bottom right of any screen to quickly add devotees or log payments.'
                            }
                        </p>
                    </motion.div>

                    {/* Mobile/Offline Card */}
                    <div className="glass-card p-8 print:shadow-none print:border-slate-100">
                        <div className="flex items-center gap-4 mb-4">
                            <Smartphone className="text-slate-400" />
                            <h3 className="font-bold text-slate-800">PWA Support</h3>
                        </div>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            {language === 'ml' ? 
                                'നിങ്ങളുടെ ഫോണിൽ ഒരു ആപ്പ് പോലെ ഇത് ഇൻസ്റ്റാൾ ചെയ്യാം. ഇന്റർനെറ്റ് ഇല്ലാതെയും (Offline) വിവരങ്ങൾ ചേർക്കാൻ ഇത് സഹായിക്കും.' :
                                'Install this CRM as a mobile app via settings. It works seamlessly even when you are offline.'
                            }
                        </p>
                    </div>

                    <div className="p-8 bg-slate-50 rounded-[28px] border border-slate-100 text-center print:hidden">
                        <Database size={32} className="text-slate-200 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Cloud Sync Active
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="text-center pt-8 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    Committee CRM © 2024 • Kozhimamparamb Pooram
                </p>
            </footer>
        </div>
    );
};

export default UserManual;
