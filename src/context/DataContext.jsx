import { createContext, useContext, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const { t } = useLanguage();
    const { isAuthenticated } = useAuth();
    
    const [devoteeData, setDevoteeData] = useState([]);
    const [islandTip, setIslandTip] = useState({ show: false, title: '', type: 'system' });
    const [expenses, setExpenses] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [privacyMode, setPrivacyMode] = useState(() => {
        return localStorage.getItem('temple_crm_privacy') === 'true';
    });

    const [debugMode, setDebugMode] = useState(() => {
        return localStorage.getItem('temple_crm_debug') === 'true';
    });

    const notifyIsland = (title, type = 'system') => {
        setIslandTip({ show: true, title, type });
        setTimeout(() => setIslandTip(prev => ({ ...prev, show: false })), 4000);
    };

    // Fetch all data from Supabase on mount or authentication change
    useEffect(() => {
        if (isAuthenticated) {
            fetchAllData();
        } else {
            setDevoteeData([]);
            setExpenses([]);
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchDevotees(),
                fetchExpenses(),
                fetchCategories()
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to sync with cloud database');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDevotees = async () => {
        const { data, error } = await supabase
            .from('devotees')
            .select(`
                *,
                events:collections(*)
            `)
            .order('created_at', { ascending: false });

        if (!error && data) {
            // Map table names back to the camelCase used in the UI
            const formatted = data.map(d => {
                const events = (d.events || []).map(e => ({
                    ...e,
                    isNirapara: e.is_nirapara
                })).sort((a, b) => new Date(b.date) - new Date(a.date));

                return {
                    ...d,
                    totalExpected: d.total_expected,
                    totalPaid: d.total_paid,
                    totalPending: d.total_pending,
                    events,
                    isNirapara: events.some(e => e.isNirapara)
                };
            });
            setDevoteeData(formatted);
        }
    };

    const fetchExpenses = async () => {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });
        if (!error && data) setExpenses(data);
    };

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('expense_categories')
            .select('name');
        if (!error && data) setExpenseCategories(data.map(c => c.name));
    };

    const togglePrivacyMode = () => {
        setPrivacyMode(prev => {
            const next = !prev;
            localStorage.setItem('temple_crm_privacy', String(next));
            return next;
        });
    };

    const toggleDebugMode = () => {
        setDebugMode(prev => {
            const next = !prev;
            localStorage.setItem('temple_crm_debug', String(next));
            return next;
        });
    };

    const maskValue = (value) => {
        if (!privacyMode || !value) return value;
        const str = String(value);
        return str.replace(/[0-9]/g, '*');
    };

    const addDevotee = async (devotee) => {
        const { data, error } = await supabase
            .from('devotees')
            .insert([{
                id: devotee.id,
                name: devotee.name,
                phone: devotee.phone,
                address: devotee.address,
                total_expected: devotee.totalExpected,
                total_paid: devotee.totalPaid,
                total_pending: devotee.totalPending,
                status: devotee.status
            }])
            .select()
            .single();

        if (error) {
            toast.error('Failed to add devotee to cloud');
            return;
        }
        setDevoteeData(prev => [{ ...data, events: [] }, ...prev]);
        notifyIsland('Devotee Added', 'success');
    };

    const updateDevotee = async (updated) => {
        // 1. Update main record
        const { error } = await supabase
            .from('devotees')
            .update({
                name: updated.name,
                phone: updated.phone,
                address: updated.address,
                total_expected: updated.totalExpected,
                total_paid: updated.totalPaid,
                total_pending: updated.totalPending,
                status: updated.status
            })
            .eq('id', updated.id);

        if (error) {
            toast.error('Failed to update devotee in cloud');
            return;
        }

        // 2. Sync events (collections)
        // We need to upsert changed ones AND delete removed ones
        const currentDevotee = devoteeData.find(d => d.id === updated.id);
        const currentEventIds = (currentDevotee?.events || []).map(e => e.id);
        const updatedEventIds = (updated.events || []).map(e => e.id);
        
        // Find IDs that were removed
        const deletedIds = currentEventIds.filter(id => !updatedEventIds.includes(id));
        if (deletedIds.length > 0) {
            await supabase.from('collections').delete().in('id', deletedIds);
        }

        const eventsToSync = (updated.events || []).map(e => ({
            id: e.id,
            devotee_id: updated.id,
            date: e.date,
            year: e.year,
            type: e.type,
            book: e.book,
            leaf: e.leaf,
            paid: e.paid,
            unpaid: e.unpaid,
            remark: e.remark,
            is_nirapara: e.isNirapara,
            description: e.description
        }));

        if (eventsToSync.length > 0) {
            await supabase.from('collections').upsert(eventsToSync);
        }

        setDevoteeData(prev => prev.map(d => d.id === updated.id ? updated : d));
    };

    const deleteDevotee = async (id) => {
        const { error } = await supabase.from('devotees').delete().eq('id', id);
        if (error) {
            toast.error('Failed to delete devotee');
            return;
        }
        setDevoteeData(prev => prev.filter(d => d.id !== id));
    };

    const addExpense = async (expense) => {
        const { error } = await supabase.from('expenses').insert([expense]);
        if (error) {
            toast.error('Failed to add expense');
            return;
        }
        setExpenses(prev => [expense, ...prev]);
        notifyIsland('Expense Logged', 'expense');
    };

    const updateExpense = async (updated) => {
        const { error } = await supabase.from('expenses').update(updated).eq('id', updated.id);
        if (error) {
            toast.error('Failed to update expense');
            return;
        }
        setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
    };

    const deleteExpense = async (id) => {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) {
            toast.error('Failed to delete expense');
            return;
        }
        setExpenses(prev => prev.filter(e => e.id !== id));
    };

    const addExpenseCategory = async (name) => {
        if (!name || expenseCategories.includes(name)) return;
        const { error } = await supabase.from('expense_categories').insert([{ name }]);
        if (error) return;
        setExpenseCategories(prev => [...prev.filter(c => c !== 'Other'), name, 'Other']);
    };

    const deleteExpenseCategory = async (name) => {
        if (['Maintenance', 'Electricity', 'Salary', 'Pooja Items', 'Other'].includes(name)) {
            toast.error(t.standard_cat_error || "Standard categories cannot be deleted");
            return;
        }
        const { error } = await supabase.from('expense_categories').delete().eq('name', name);
        if (error) return;
        setExpenseCategories(prev => prev.filter(c => c !== name));
    };

    const purgeData = async () => {
        // Use RPC or individual deletes (restricted by RLS)
        await Promise.all([
            supabase.from('devotees').delete().neq('id', '0'),
            supabase.from('expenses').delete().neq('id', '0')
        ]);
        setDevoteeData([]);
        setExpenses([]);
        toast.success(t.purge_success);
    };

    const getNextDevoteeId = () => {
        if (!devoteeData || devoteeData.length === 0) return 'DEV-1001';
        const ids = devoteeData.map(d => {
            const match = String(d.id)?.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
        });
        const maxId = Math.max(...ids);
        return `DEV-${maxId + 1}`;
    };

    const exportToExcel = () => {
        if (!devoteeData || devoteeData.length === 0) {
            toast.error(t.no_records_found);
            return;
        }

        // Sheet 1 — Devotees
        const devoteeRows = devoteeData.map((d, i) => ({
            'S.No':           i + 1,
            'ID':             d.id || '',
            'Name':           d.name || '',
            'Phone':          d.phone || '',
            'Address':        d.address || '',
            'Total Expected': Number(d.totalExpected) || 0,
            'Total Paid':     Number(d.totalPaid) || 0,
            'Total Pending':  Number(d.totalPending) || 0,
            'Status':         d.status || '',
        }));

        // Sheet 2 — Collections (all events)
        const collectionRows = devoteeData.flatMap(d =>
            (d.events || []).map(e => ({
                'Date':          e.date || '',
                'Receipt ID':    e.id || '',
                'Devotee ID':    d.id || '',
                'Devotee Name':  d.name || '',
                'Type':          e.type || '',
                'Book No':       e.book || '',
                'Leaf No':       e.leaf || '',
                'Amount Paid':   Number(e.paid) || 0,
                'Pending':       Number(e.unpaid) || 0,
                'Remark':        e.remark || '',
            }))
        );

        const wb = XLSX.utils.book_new();

        const ws1 = XLSX.utils.json_to_sheet(devoteeRows);
        ws1['!cols'] = [
            { wch: 6 }, { wch: 12 }, { wch: 24 }, { wch: 14 }, { wch: 30 },
            { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 10 }
        ];
        XLSX.utils.book_append_sheet(wb, ws1, 'Devotees');

        if (collectionRows.length > 0) {
            const ws2 = XLSX.utils.json_to_sheet(collectionRows);
            ws2['!cols'] = [
                { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 24 },
                { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 20 }
            ];
            XLSX.utils.book_append_sheet(wb, ws2, 'Collections');
        }

        const summary = [
            { 'Field': 'Total Devotees',      'Value': devoteeData.length },
            { 'Field': 'Total Expected (₹)',  'Value': devoteeData.reduce((s, d) => s + (Number(d.totalExpected) || 0), 0) },
            { 'Field': 'Total Paid (₹)',      'Value': devoteeData.reduce((s, d) => s + (Number(d.totalPaid) || 0), 0) },
            { 'Field': 'Total Pending (₹)',   'Value': devoteeData.reduce((s, d) => s + (Number(d.totalPending) || 0), 0) },
            { 'Field': 'Paid Members',        'Value': devoteeData.filter(d => d.status === 'Paid').length },
            { 'Field': 'Pending Members',     'Value': devoteeData.filter(d => d.status === 'Pending').length },
            { 'Field': 'Export Date',         'Value': new Date().toLocaleDateString('en-IN') },
        ];
        const ws3 = XLSX.utils.json_to_sheet(summary);
        ws3['!cols'] = [{ wch: 22 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, ws3, 'Summary');

        const fileName = `temple_crm_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast.success(t.excel_export_success);
    };

    const exportToCSV = () => {
        if (!devoteeData || devoteeData.length === 0) {
            toast.error(t.no_records_found);
            return;
        }
        const headers = ['ID', 'Name', 'Phone', 'Address', 'Expected', 'Paid', 'Pending', 'Status'];
        const csvContent = [
            headers.join(','),
            ...devoteeData.map(d => [
                d.id,
                `"${d.name?.replace(/"/g, '""')}"`,
                d.phone,
                `"${d.address?.replace(/"/g, '""')}"`,
                d.totalExpected,
                d.totalPaid,
                d.totalPending,
                d.status
            ].join(','))
        ].join('\n');
        downloadCSV(csvContent, 'temple_devotees');
        toast.success(t.csv_export_success);
    };

    const exportCollectionsToCSV = () => {
        const allEvents = (devoteeData || []).flatMap(d => (d.events || []).map(e => ({
            ...e,
            devoteeName: d.name,
            devoteeId: d.id
        })));

        if (allEvents.length === 0) {
            toast.error(t.no_records_found);
            return;
        }

        const headers = ['Date', 'ID', 'Devotee', 'Type', 'Book', 'Leaf', 'Amount', 'Pending', 'Remark'];
        const csvContent = [
            headers.join(','),
            ...allEvents.map(e => [
                e.date,
                e.id,
                `"${e.devoteeName?.replace(/"/g, '""')}"`,
                e.type,
                e.book || 'N/A',
                e.leaf || 'N/A',
                e.paid,
                e.unpaid || 0,
                `"${(e.remark || '').replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');
        downloadCSV(csvContent, 'temple_collections');
        toast.success(t.excel_export_success);
    };

    const exportExpensesToCSV = () => {
        if (!expenses || expenses.length === 0) {
            toast.error(t.no_records_found);
            return;
        }
        const headers = ['ID', 'Date', 'Name', 'Category', 'Amount'];
        const csvContent = [
            headers.join(','),
            ...expenses.map(e => [
                e.id,
                e.date,
                `"${(e.name || '').replace(/"/g, '""')}"`,
                e.category,
                e.amount
            ].join(','))
        ].join('\n');
        downloadCSV(csvContent, 'temple_expenses');
        toast.success(t.excel_export_success);
    };

    const downloadCSV = (content, filename) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Issue 9: removed window.location.reload()
    // Issue 8: replaced alert() with toast()
    const seedMockData = async () => {
        setIsLoading(true);
        const firstNames = ['Arjun', 'Mohan', 'Gopi', 'Sree', 'Vishnu', 'Rahul', 'Adithi', 'Meera', 'Anandu', 'Pranav', 'Harish', 'Karthik', 'Sujith', 'Deepak', 'Aswin', 'Lakshmi', 'Parvathi', 'Anjali', 'Kavya', 'Deepa', 'Santhosh', 'Ramesh', 'Vineeth', 'Abhijith'];
        const lastNames = ['Nair', 'Das', 'Kumar', 'Menon', 'Pillai', 'Varier', 'Ayyar', 'Sharma', 'Verma', 'Singh', 'Reddy', 'Rao', 'Nambiar', 'Kurup', 'Panicker'];
        const addresses = ['House No. 683, Near Temple', 'Near Mahadeva Temple, Kottayam', 'Temple view Villa, Kochi', 'Santhi Nagar, Thiruvananthapuram', 'Kalpathy, Palakkad', 'Aluva East', 'Muvattupuzha', 'Vaikom', 'Guruvayur Shore'];
        const categories = ['Maintenance', 'Electricity', 'Salary', 'Pooja Items', 'Other'];

        const getSeededValue = (seed, mod) => {
            let h = 0;
            for (let j = 0; j < seed.length; j++) h = (h << 5) - h + seed.charCodeAt(j);
            return Math.abs(h | 0) % mod;
        };

        const batchSize = 100;
        const devotees = [];
        const collections = [];

        for (let i = 1; i <= 1000; i++) {
            const idValue = 1000 + i;
            const id = `DEV-${idValue}`;
            const fn = firstNames[getSeededValue(id + 'fn', firstNames.length)];
            const ln = lastNames[getSeededValue(id + 'ln', lastNames.length)];
            const expected = 1000 + (getSeededValue(id + 'ex', 18) * 500);
            const eventCount = 2 + (getSeededValue(id + 'ec', 2)); // 2 or 3
            let totalPaid = 0;

            for (let j = 1; j <= eventCount; j++) {
                const isPaid = getSeededValue(id + j + 'ispaid', 10) > 2;
                if (isPaid) {
                    const paidAmt = Math.floor(expected / (eventCount + (i % 2 === 0 ? 0 : 1)));
                    const isToday = getSeededValue(id + j + 'today', 20) === 0;
                    const date = isToday ? new Date().toISOString().split('T')[0] : `${new Date().getFullYear()}-${String(1 + (getSeededValue(id + j, 4))).padStart(2, '0')}-${String(1 + (getSeededValue(id + j, 28))).padStart(2, '0')}`;
                    const type = (j + (i % 2)) % 2 === 0 ? 'Pooram' : 'Ayyappan Vilakku';
                    
                    collections.push({
                        id: `REC-${idValue}-${j}`,
                        devotee_id: id,
                        date,
                        type,
                        year: String(new Date().getFullYear()),
                        book: `BK-${String(10 + (getSeededValue(id + j, 50))).padStart(3, '0')}`,
                        leaf: `LF-${String(1 + (getSeededValue(id + j, 99))).padStart(2, '0')}`,
                        paid: paidAmt,
                        unpaid: 0,
                        remark: 'Regular temple collection',
                        description: `${type} collection`
                    });
                    totalPaid += paidAmt;
                }
            }

            const pending = Math.max(0, expected - totalPaid);
            devotees.push({
                id,
                name: `${fn} ${ln}`,
                phone: `9${800000000 + getSeededValue(id + 'ph', 199999999)}`,
                address: addresses[getSeededValue(id + 'ad', addresses.length)],
                total_expected: expected,
                total_paid: totalPaid,
                total_pending: pending,
                status: pending <= 0 ? 'Paid' : 'Pending'
            });
        }

        const mockExpenses = [];
        for (let k = 1; k <= 20; k++) {
            const cat = categories[getSeededValue('exp' + k, categories.length)];
            mockExpenses.push({
                id: `EXP-${String(k).padStart(4, '0')}`,
                date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(1 + getSeededValue('ed' + k, 28)).padStart(2, '0')}`,
                name: ['Trust', 'City Elec', 'Hardware', 'Staff'][k%4],
                category: cat,
                amount: 500 + (getSeededValue('ea' + k, 50) * 100),
                description: `${cat} expense`,
                reference: `REF-${100 + k}`
            });
        }

        try {
            // Bulk insert to Supabase
            await supabase.from('devotees').insert(devotees);
            await supabase.from('collections').insert(collections);
            await supabase.from('expenses').insert(mockExpenses);
            toast.success(`1,000 ${t.demo_gen_success}`);
            fetchAllData();
        } catch (err) {
            toast.error('Failed to seed cloud database');
        } finally {
            setIsLoading(false);
        }
    };

    const migrateLocalToCloud = async () => {
        setIsLoading(true);
        try {
            const localDevs = JSON.parse(localStorage.getItem('temple_crm_devotees') || '[]');
            const localExps = JSON.parse(localStorage.getItem('temple_crm_expenses') || '[]');
            
            if (localDevs.length === 0 && localExps.length === 0) {
                toast.error('No local data found to migrate');
                return;
            }

            const devoteesBulk = localDevs.map(d => ({
                id: d.id,
                name: d.name,
                phone: d.phone,
                address: d.address,
                total_expected: d.totalExpected,
                total_paid: d.totalPaid,
                total_pending: d.totalPending,
                status: d.status
            }));

            const collectionsBulk = localDevs.flatMap(d => (d.events || []).map(e => ({
                id: e.id,
                devotee_id: d.id,
                date: e.date,
                year: e.year,
                type: e.type,
                book: e.book,
                leaf: e.leaf,
                paid: e.paid,
                unpaid: e.unpaid,
                remark: e.remark,
                is_nirapara: e.isNirapara,
                description: e.description
            })));

            if (devoteesBulk.length > 0) await supabase.from('devotees').upsert(devoteesBulk);
            if (collectionsBulk.length > 0) await supabase.from('collections').upsert(collectionsBulk);
            if (localExps.length > 0) await supabase.from('expenses').upsert(localExps);

            toast.success('Migration successful! All local data is now in the cloud.');
            fetchAllData();
        } catch (err) {
            toast.error('Migration failed: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const seedPooramData = async () => {
        setIsLoading(true);
        const firstNames = ['Arjun', 'Mohan', 'Gopi', 'Sree', 'Vishnu', 'Rahul', 'Adithi', 'Meera', 'Anandu', 'Pranav'];
        const lastNames = ['Nair', 'Das', 'Kumar', 'Menon', 'Pillai'];
        const addresses = ['House No. 683, Near Temple', 'Near Mahadeva Temple, Kottayam', 'Temple view Villa, Kochi'];

        const getSeededValue = (seed, mod) => {
            let h = 0;
            for (let j = 0; j < seed.length; j++) h = (h << 5) - h + seed.charCodeAt(j);
            return Math.abs(h | 0) % mod;
        };

        const existingCount = devoteeData.length;
        const newDevotees = [];
        const newCollections = [];

        for (let i = 1; i <= 500; i++) {
            const idValue = 2000 + existingCount + i;
            const id = `DEV-${idValue}`;
            const fn = firstNames[getSeededValue(id + 'fn', firstNames.length)];
            const ln = lastNames[getSeededValue(id + 'ln', lastNames.length)];
            const expected = 2000;
            const paid = 1000 + (getSeededValue(id + 'p', 3) * 500);
            
            newDevotees.push({
                id,
                name: `${fn} ${ln}`,
                phone: `99${8000000 + getSeededValue(id, 1999999)}`,
                address: addresses[getSeededValue(id + 'ad', addresses.length)],
                total_expected: expected,
                total_paid: paid,
                total_pending: Math.max(0, expected - paid),
                status: (expected - paid) <= 0 ? 'Paid' : 'Pending'
            });

            newCollections.push({
                id: `REC-${idValue}-P`,
                devotee_id: id,
                date: new Date().toISOString().split('T')[0],
                type: 'Pooram',
                year: String(new Date().getFullYear()),
                book: 'BK-099',
                leaf: 'LF-09',
                paid: paid,
                unpaid: Math.max(0, expected - paid),
                remark: 'Pooram Special collection'
            });
        }

        try {
            await supabase.from('devotees').insert(newDevotees);
            await supabase.from('collections').insert(newCollections);
            toast.success(`500 ${t.demo_gen_success}`);
            fetchAllData();
        } catch (err) {
            toast.error('Failed to seed Pooram data');
        } finally {
            setIsLoading(false);
        }
    };

    const seedVilakkuData = async () => {
        setIsLoading(true);
        const firstNames = ['Kavya', 'Deepa', 'Santhosh', 'Ramesh', 'Vineeth', 'Abhijith'];
        const lastNames = ['Varier', 'Ayyar', 'Sharma', 'Verma', 'Singh'];
        const addresses = ['Near Mahadeva Temple, Kottayam', 'Temple view Villa, Kochi', 'Aluva East'];

        const getSeededValue = (seed, mod) => {
            let h = 0;
            for (let j = 0; j < seed.length; j++) h = (h << 5) - h + seed.charCodeAt(j);
            return Math.abs(h | 0) % mod;
        };

        const existingCount = devoteeData.length;
        const newDevotees = [];
        const newCollections = [];

        for (let i = 1; i <= 500; i++) {
            const idValue = 3000 + existingCount + i;
            const id = `DEV-${idValue}`;
            const fn = firstNames[getSeededValue(id + 'fn', firstNames.length)];
            const ln = lastNames[getSeededValue(id + 'ln', lastNames.length)];
            const expected = 1500;
            const paid = 500 + (getSeededValue(id + 'p', 3) * 500);
            
            newDevotees.push({
                id,
                name: `${fn} ${ln}`,
                phone: `98${7000000 + getSeededValue(id, 1999999)}`,
                address: addresses[getSeededValue(id + 'ad', addresses.length)],
                total_expected: expected,
                total_paid: paid,
                total_pending: Math.max(0, expected - paid),
                status: (expected - paid) <= 0 ? 'Paid' : 'Pending'
            });

            newCollections.push({
                id: `REC-${idValue}-V`,
                devotee_id: id,
                date: new Date().toISOString().split('T')[0],
                type: 'Ayyappan Vilakku',
                year: String(new Date().getFullYear()),
                book: 'BK-V01',
                leaf: 'LF-01',
                paid: paid,
                unpaid: Math.max(0, expected - paid),
                remark: 'Vilakku Collection'
            });
        }

        try {
            await supabase.from('devotees').insert(newDevotees);
            await supabase.from('collections').insert(newCollections);
            toast.success(`500 ${t.demo_gen_success}`);
            fetchAllData();
        } catch (err) {
            toast.error('Failed to seed Vilakku data');
        } finally {
            setIsLoading(false);
        }
    };


    const exportBackup = () => {
        const data = {
            devotees: devoteeData,
            expenses,
            version: '2.0-react',
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `temple_crm_backup_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t.backup_success);
    };

    // Issue 9: removed window.location.reload()
    // Issue 8: replaced alert() with toast()
    const importBackup = (jsonData) => {
        try {
            const data = JSON.parse(jsonData);
            if (!data.devotees) throw new Error('Invalid backup format');
            setDevoteeData(data.devotees);
            setExpenses(data.expenses || []);
            toast.success(t.restore_success);
        } catch (err) {
            toast.error('Failed to restore backup: ' + err.message);
        }
    };

    const parseExcelFile = (fileBuffer) => {
        const workbook = XLSX.read(fileBuffer, { type: 'array' });
        
        // 1. Parse Devotees Sheet (Sheet 0)
        const devoteeSheet = workbook.Sheets[workbook.SheetNames[0]];
        const devoteeRows = XLSX.utils.sheet_to_json(devoteeSheet, { defval: '' });

        // 2. Parse Collections Sheet if it exists
        let collectionRows = [];
        const collectionSheetName = workbook.SheetNames.find(n => 
            ['collections', 'payments', 'events', 'receipts'].includes(n.toLowerCase())
        ) || workbook.SheetNames[1];
        
        if (collectionSheetName && workbook.Sheets[collectionSheetName]) {
            collectionRows = XLSX.utils.sheet_to_json(workbook.Sheets[collectionSheetName], { defval: '' });
        }

        const normalize = (str) => String(str).toLowerCase().replace(/[\s_\-]/g, '');
        
        const FIELD_MAP = {
            name:          ['name', 'fullname', 'devotee', 'devoteename', 'membername'],
            phone:         ['phone', 'mobile', 'contact', 'phoneno', 'mobileno'],
            address:       ['address', 'addr', 'location', 'place'],
            totalExpected: ['totalexpected', 'expected', 'annualexpected', 'annual', 'amount'],
            totalPaid:     ['totalpaid', 'paid', 'paidamount', 'payment'],
            totalPending:  ['totalpending', 'pending', 'outstanding', 'balance'],
            status:        ['status', 'paymentstatus'],
            id:            ['id', 'devoteeid', 'memberid', 'devid'],
        };

        const EVENT_FIELD_MAP = {
            devoteeId: ['devoteeid', 'memberid', 'devid', 'id'],
            date:      ['date', 'paymentdate', 'entrydate'],
            id:        ['receiptid', 'id', 'recid', 'collectionid'],
            type:      ['type', 'event', 'category'],
            book:      ['bookno', 'book', 'bkno'],
            leaf:      ['leafno', 'leaf', 'lfno'],
            paid:      ['amountpaid', 'paid', 'amount', 'collection'],
            pending:   ['pending', 'unpaid', 'balance'],
            remark:    ['remark', 'note', 'description'],
            year:      ['year', 'period'],
        };

        const findCol = (row, candidates) => {
            const rowKeys = Object.keys(row);
            for (const candidate of candidates) {
                const match = rowKeys.find(k => normalize(k) === candidate);
                if (match !== undefined) return row[match];
            }
            return '';
        };

        // Create a temporary ID mapping to handle potential conflicts or new generations
        const idMap = new Map(); // Old ID -> New ID

        let nextIdNum = devoteeData.length > 0
            ? Math.max(...devoteeData.map(d => parseInt((d.id || '0').replace(/\D/g, '')) || 0)) + 1
            : 1001;

        // Process Devotees
        const records = devoteeRows.map(row => {
            const name = String(findCol(row, FIELD_MAP.name) || '').trim();
            if (!name) return null;

            const oldId = String(findCol(row, FIELD_MAP.id) || '').trim();
            const newId = `DEV-${nextIdNum++}`;
            if (oldId) idMap.set(oldId, newId);

            const phone = String(findCol(row, FIELD_MAP.phone) || '').trim();
            const address = String(findCol(row, FIELD_MAP.address) || '').trim();
            const totalExpected = Number(findCol(row, FIELD_MAP.totalExpected)) || 0;
            const totalPaid = Number(findCol(row, FIELD_MAP.totalPaid)) || 0;
            const totalPending = Number(findCol(row, FIELD_MAP.totalPending)) || Math.max(0, totalExpected - totalPaid);
            const rawStatus = String(findCol(row, FIELD_MAP.status) || '').trim();
            const status = rawStatus || (totalPending <= 0 ? 'Paid' : 'Pending');

            return { 
                id: newId, 
                oldId, // Temporarily keep to link events
                name, phone, address, 
                totalExpected, totalPaid, totalPending, 
                status, 
                events: [] 
            };
        }).filter(Boolean);

        // Process and Link Events
        collectionRows.forEach(row => {
            const devId = String(findCol(row, EVENT_FIELD_MAP.devoteeId) || '').trim();
            if (!devId) return;

            // Find matching devotee by ID
            const devotee = records.find(r => r.oldId === devId || r.id === devId);
            if (!devotee) return;

            const paid = Number(findCol(row, EVENT_FIELD_MAP.paid)) || 0;
            const event = {
                id: String(findCol(row, EVENT_FIELD_MAP.id) || `REC-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(-2)}`),
                date: String(findCol(row, EVENT_FIELD_MAP.date) || new Date().toISOString().split('T')[0]),
                year: String(findCol(row, EVENT_FIELD_MAP.year) || new Date().getFullYear()),
                type: String(findCol(row, EVENT_FIELD_MAP.type) || 'General'),
                book: String(findCol(row, EVENT_FIELD_MAP.book) || ''),
                leaf: String(findCol(row, EVENT_FIELD_MAP.leaf) || ''),
                paid: paid,
                unpaid: Number(findCol(row, EVENT_FIELD_MAP.pending)) || 0,
                remark: String(findCol(row, EVENT_FIELD_MAP.remark) || ''),
                description: `${findCol(row, EVENT_FIELD_MAP.type) || 'Collection'} entry`
            };

            devotee.events.push(event);
        });

        // Clean up: remove temporary oldId and ensure totals are consistent if events were imported
        return records.map(r => {
            const { oldId, ...rest } = r;
            if (r.events.length > 0) {
                // If we imported events, they are the source of truth for paid/pending
                const calcPaid = r.events.reduce((sum, e) => sum + (Number(e.paid) || 0), 0);
                rest.totalPaid = Math.max(rest.totalPaid, calcPaid);
                rest.totalPending = Math.max(0, rest.totalExpected - rest.totalPaid);
                rest.status = rest.totalPending <= 0 ? 'Paid' : 'Pending';
            }
            return rest;
        });
    };

    const importFromExcel = (fileBuffer) => {
        try {
            const records = parseExcelFile(fileBuffer);
            if (records.length === 0) throw new Error('No valid rows found. Check your column headers.');
            
            // Note: Currently appends. We could add a 'Merge' option later.
            setDevoteeData(prev => [...records, ...prev]);
            return { success: true, count: records.length };
        } catch (err) {
            if (import.meta.env.DEV) console.error('Import Error:', err);
            return { success: false, error: err.message };
        }
    };

    return (
        <DataContext.Provider value={{
            devoteeData, setDevoteeData,
            expenses, setExpenses,
            privacyMode, togglePrivacyMode,
            addDevotee, updateDevotee, deleteDevotee,
            addExpense, updateExpense, deleteExpense,
            seedMockData, purgeData,
            getNextDevoteeId, exportToCSV,
            exportCollectionsToCSV, exportExpensesToCSV,
            exportBackup, importBackup, importFromExcel, exportToExcel,
            seedPooramData, seedVilakkuData,
            expenseCategories, addExpenseCategory, deleteExpenseCategory,
            maskValue, isLoading, migrateLocalToCloud,
            debugMode, toggleDebugMode,
            islandTip, notifyIsland
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
