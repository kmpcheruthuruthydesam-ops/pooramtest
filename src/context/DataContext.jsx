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
    const [cloudStatus, setCloudStatus] = useState('connecting');

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
            
            // Step: Initialize Realtime Sync with Throttling
            let fetchTimer = null;
            const throttledFetch = () => {
                if (fetchTimer) clearTimeout(fetchTimer);
                fetchTimer = setTimeout(() => {
                    fetchDevotees();
                    fetchExpenses();
                }, 500); // Wait 500ms for more changes
            };

            const channel = supabase
                .channel('db-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'collections' }, () => {
                    console.log('Realtime update: collections changed');
                    throttledFetch();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'devotees' }, () => {
                    console.log('Realtime update: devotees changed');
                    throttledFetch();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
                    throttledFetch();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } else {
            setDevoteeData([]);
            setExpenses([]);
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    const fetchAllData = async () => {
        setIsLoading(true);
        setCloudStatus('connecting');
        try {
            await Promise.all([
                fetchDevotees(),
                fetchExpenses(),
                fetchCategories()
            ]);
            setCloudStatus('online');
        } catch (error) {
            console.error('Error fetching data:', error);
            setCloudStatus('offline');
            // Only toast if it's a real error, not just a cancelled request
            if (error.message !== 'Fetch is aborted') {
                toast.error('Failed to sync with cloud database');
            }
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
        // Prevent manual duplicates by phone
        if (devotee.phone) {
            const exists = devoteeData.find(d => d.phone === devotee.phone);
            if (exists) {
                toast.error(`Devotee already exists with this phone number: ${exists.name}`);
                return;
            }
        }

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
            setCloudStatus('offline');
            toast.error('Failed to add devotee to cloud');
            return;
        }
        setCloudStatus('online');
        setDevoteeData(prev => [{ ...data, events: [] }, ...prev]);
        notifyIsland('Devotee Added', 'success');
    };

    const updateDevotee = async (updated) => {
        // 1. Recalculate totals from events for consistency
        const sanitizedEvents = updated.events || [];
        const derivedPaid = sanitizedEvents.reduce((sum, e) => sum + (Number(e.paid) || 0), 0);
        const derivedPending = Math.max(0, (Number(updated.totalExpected) || 0) - derivedPaid);
        const derivedStatus = derivedPending <= 0 ? 'Paid' : 'Pending';

        const { error } = await supabase
            .from('devotees')
            .update({
                name: updated.name,
                phone: updated.phone,
                address: updated.address,
                total_expected: updated.totalExpected,
                total_paid: derivedPaid,
                total_pending: derivedPending,
                status: derivedStatus
            })
            .eq('id', updated.id);

        if (error) {
            toast.error('Failed to update devotee in cloud');
            return;
        }

        // 2. Sync events (collections)
        const currentDevotee = devoteeData.find(d => d.id === updated.id);
        const currentEventIds = (currentDevotee?.events || []).map(e => e.id);
        const updatedEventIds = (updated.events || []).map(e => e.id);
        
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

        setDevoteeData(prev => prev.map(d => d.id === updated.id ? {
            ...updated,
            totalPaid: derivedPaid,
            totalPending: derivedPending,
            status: derivedStatus
        } : d));
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
        const { error } = await supabase.from('expense_categories').delete().eq('name', name);
        if (error) return;
        setExpenseCategories(prev => prev.filter(c => c !== name));
    };

    const purgeData = async () => {
        await Promise.all([
            supabase.from('collections').delete().neq('id', '0'),
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

    const seedMockData = async () => {
        setIsLoading(true);
        const firstNames = ['Arjun', 'Mohan', 'Gopi', 'Sree', 'Vishnu', 'Rahul', 'Adithi', 'Meera', 'Anandu', 'Pranav', 'Harish', 'Karthik', 'Sujith', 'Deepak', 'Aswin', 'Lakshmi', 'Parvathi', 'Anjali', 'Kavya', 'Deepa', 'Santhosh', 'Ramesh', 'Vineeth', 'Abhijith'];
        const lastNames = ['Nair', 'Das', 'Kumar', 'Menon', 'Pillai', 'Varier', 'Ayyar', 'Sharma', 'Verma', 'Singh', 'Reddy', 'Rao', 'Nambiar', 'Kurup', 'Panicker'];
        const addresses = ['House No. 683, Near Temple', 'Near Mahadeva Temple, Kottayam', 'Temple view Villa, Kochi', 'Santhi Nagar, Thiruvananthapuram', 'Kalpathy, Palakkad', 'Aluva East', 'Muvattupuzha', 'Vaikom', 'Guruvayur Shore'];
        const categories = [];

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
            const cat = categories.length > 0 ? categories[getSeededValue('exp' + k, categories.length)] : 'General';
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
        const workbook = XLSX.read(fileBuffer, { type: 'array', cellDates: true });

        const formatDate = (val) => {
            if (!val) return new Date().toISOString().split('T')[0];
            if (val instanceof Date) return val.toISOString().split('T')[0];
            if (typeof val === 'number') {
                const date = new Date(Math.round((val - 25569) * 86400 * 1000));
                return date.toISOString().split('T')[0];
            }
            const str = String(val).trim();
            if (!str) return new Date().toISOString().split('T')[0];
            if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str;
            const d = new Date(str);
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
            return new Date().toISOString().split('T')[0];
        };
        
        const devoteeSheetName = workbook.SheetNames.find(n => 
            ['devotees', 'members', 'devotee', 'data'].includes(n.toLowerCase())
        ) || workbook.SheetNames[0];
        const devoteeSheet = workbook.Sheets[devoteeSheetName];
        const devoteeRows = XLSX.utils.sheet_to_json(devoteeSheet, { defval: '' });

        const collectionSheetName = workbook.SheetNames.find(n => 
            ['collections', 'payments', 'events', 'receipts'].includes(n.toLowerCase())
        ) || workbook.SheetNames[1];
        
        let collectionRows = [];
        if (collectionSheetName && workbook.Sheets[collectionSheetName]) {
            collectionRows = XLSX.utils.sheet_to_json(workbook.Sheets[collectionSheetName], { defval: '' });
        } else if (workbook.SheetNames.length === 1) {
            collectionRows = devoteeRows;
        }

        const normalize = (str) => String(str).toLowerCase().replace(/[\s_\-]/g, '');
        
        const FIELD_MAP = {
            name:          ['name', 'fullname', 'devotee', 'devoteename', 'membername', 'പേര്', 'ഭക്തൻ'],
            phone:         ['phone', 'mobile', 'contact', 'phoneno', 'mobileno', 'ഫോൺ', 'മൊബൈൽ'],
            address:       ['address', 'addr', 'location', 'place', 'വിലാസം', 'സ്ഥലം'],
            totalExpected: ['totalexpected', 'expected', 'annualexpected', 'annual', 'amount', 'പ്രതീക്ഷിക്കുന്ന തുക', 'പ്രതീക്ഷ'],
            totalPaid:     ['totalpaid', 'paid', 'paidamount', 'payment', 'അടച്ച തുക', 'പിരിവ്'],
            totalPending:  ['totalpending', 'pending', 'outstanding', 'balance', 'കുടിശ്ശിക', 'ബാക്കി'],
            status:        ['status', 'paymentstatus', 'അവസ്ഥ'],
            id:            ['id', 'devoteeid', 'memberid', 'devid'],
        };

        const EVENT_FIELD_MAP = {
            devoteeId: ['devoteeid', 'memberid', 'devid', 'id'],
            date:      ['date', 'paymentdate', 'entrydate', 'തിയതി', 'തിയ്യതി'],
            id:        ['receiptid', 'id', 'recid', 'collectionid', 'രസീത്'],
            type:      ['type', 'event', 'category', 'ഇനം'],
            book:      ['bookno', 'book', 'bkno', 'ബുക്ക്'],
            leaf:      ['leafno', 'leaf', 'lfno', 'പേജ്'],
            paid:      ['amountpaid', 'paid', 'amount', 'collection', 'അടച്ച തുക', 'തുക'],
            pending:   ['pending', 'unpaid', 'balance', 'ബാക്കി'],
            remark:    ['remark', 'note', 'description', 'വിവരണം', 'കുറിപ്പ്'],
            year:      ['year', 'period', 'വർഷം'],
        };

        const findCol = (row, candidates) => {
            const rowKeys = Object.keys(row);
            for (const candidate of candidates) {
                const match = rowKeys.find(k => normalize(k) === candidate);
                if (match !== undefined) return row[match];
            }
            return '';
        };

        let nextIdNum = devoteeData.length > 0
            ? Math.max(...devoteeData.map(d => parseInt((d.id || '0').replace(/\D/g, '')) || 0)) + 1
            : 1001;

        const devoteeMap = new Map();
        
        devoteeRows.forEach(row => {
            const name = String(findCol(row, FIELD_MAP.name) || '').trim();
            if (!name) return;
            const oldId = String(findCol(row, FIELD_MAP.id) || '').trim();
            const phone = String(findCol(row, FIELD_MAP.phone) || '').trim();
            const address = String(findCol(row, FIELD_MAP.address) || '').trim();
            
            let existingId = null;
            if (oldId && devoteeData.some(d => d.id === oldId)) existingId = oldId;
            
            const lookupKey = oldId ? oldId.toUpperCase() : name.toLowerCase();

            if (!devoteeMap.has(lookupKey)) {
                const newId = existingId || oldId || `DEV-${nextIdNum++}`;
                const totalExpected = Number(findCol(row, FIELD_MAP.totalExpected)) || 0;
                const totalPaidFromSheet = Number(findCol(row, FIELD_MAP.totalPaid)) || 0;
                const totalPendingFromSheet = Number(findCol(row, FIELD_MAP.totalPending)) || Math.max(0, totalExpected - totalPaidFromSheet);
                const rawStatus = String(findCol(row, FIELD_MAP.status) || '').trim();
                const status = rawStatus || (totalPendingFromSheet <= 0 ? 'Paid' : 'Pending');

                devoteeMap.set(lookupKey, {
                    id: newId,
                    oldId: oldId,
                    name, phone, address,
                    totalExpected,
                    totalPaid: totalPaidFromSheet,
                    totalPending: totalPendingFromSheet,
                    status,
                    events: []
                });
            }
        });

        const records = Array.from(devoteeMap.values());

        collectionRows.forEach(row => {
            const devId = String(findCol(row, EVENT_FIELD_MAP.devoteeId) || '').trim().toUpperCase();
            const devName = String(findCol(row, FIELD_MAP.name) || '').trim();
            if (!devId && !devName) return;

            let devotee = records.find(r => 
                (devId && r.oldId && r.oldId.toUpperCase() === devId) || 
                (devId && r.id && r.id.toUpperCase() === devId) ||
                (devName && r.name.toLowerCase() === devName.toLowerCase())
            );
            
            if (!devotee) {
                const newId = devId || `DEV-${nextIdNum++}`;
                devotee = {
                    id: newId,
                    name: devName || `Devotee ${newId}`,
                    phone: '', address: '',
                    totalExpected: 0, totalPaid: 0, totalPending: 0,
                    status: 'Pending',
                    events: []
                };
                records.push(devotee);
            }

            const paid = Number(findCol(row, EVENT_FIELD_MAP.paid)) || 0;
            const rawType = String(findCol(row, EVENT_FIELD_MAP.type) || '').trim();
            let type = 'General';
            if (/pooram/i.test(rawType)) type = 'Pooram';
            else if (/ayyappan|vilakku/i.test(rawType)) type = 'Ayyappan Vilakku';
            else if (rawType) type = rawType;

            const event = {
                id: String(findCol(row, EVENT_FIELD_MAP.id) || 
                    `REC-${devotee.id}-${type.slice(0,2).toUpperCase()}-${formatDate(findCol(row, EVENT_FIELD_MAP.date)).replace(/-/g,'')}-${paid}`
                ).trim(),
                date: formatDate(findCol(row, EVENT_FIELD_MAP.date)),
                year: String(findCol(row, EVENT_FIELD_MAP.year) || new Date().getFullYear()).trim(),
                type: type,
                book: String(findCol(row, EVENT_FIELD_MAP.book) || '').trim(),
                leaf: String(findCol(row, EVENT_FIELD_MAP.leaf) || '').trim(),
                paid: paid,
                unpaid: Number(findCol(row, EVENT_FIELD_MAP.pending)) || 0,
                remark: String(findCol(row, EVENT_FIELD_MAP.remark) || '').trim(),
                description: `${type} collection (${findCol(row, EVENT_FIELD_MAP.year) || new Date().getFullYear()})`
            };

            if (!devotee.events.some(e => e.id === event.id)) {
                devotee.events.push(event);
            }
        });

        return records.map(r => {
            const { oldId, ...rest } = r;
            if (r.events.length > 0) {
                const calcPaid = r.events.reduce((sum, e) => sum + (Number(e.paid) || 0), 0);
                rest.totalPaid = Math.max(rest.totalPaid, calcPaid);
                rest.totalPending = Math.max(0, rest.totalExpected - rest.totalPaid);
                rest.status = rest.totalPending <= 0 ? 'Paid' : 'Pending';
            }
            return rest;
        });

    };

    const importFromExcel = async (fileBuffer) => {
        try {
            const records = parseExcelFile(fileBuffer);
            if (records.length === 0) throw new Error('No valid rows found. Check your column headers.');
            
            // 1. Prepare data for Supabase
            // Map keys to snake_case for the database
            const devoteesToInsert = records.map(r => ({
                id: r.id,
                name: r.name,
                phone: r.phone,
                address: r.address,
                total_expected: r.totalExpected,
                total_paid: r.totalPaid,
                total_pending: r.totalPending,
                status: r.status
            }));

            const collectionsToInsert = [];
            records.forEach(r => {
                if (r.events && r.events.length > 0) {
                    r.events.forEach(e => {
                        collectionsToInsert.push({
                            id: e.id,
                            devotee_id: r.id,
                            date: e.date,
                            year: e.year,
                            type: e.type,
                            book: e.book,
                            leaf: e.leaf,
                            paid: e.paid,
                            unpaid: e.unpaid,
                            remark: e.remark,
                            description: e.description
                        });
                    });
                }
            });

            // 2. Upsert into Supabase (handle existing records)
            const { error: devError } = await supabase.from('devotees').upsert(devoteesToInsert, { onConflict: 'id' });
            if (devError) throw new Error(`Devotee import failed: ${devError.message}`);

            if (collectionsToInsert.length > 0) {
                const { error: collError } = await supabase.from('collections').upsert(collectionsToInsert, { onConflict: 'id' });
                if (collError) throw new Error(`Collections import failed: ${collError.message}`);
            }
            
            // 3. Refresh local state
            await fetchAllData();
            
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
            islandTip, notifyIsland,
            cloudStatus
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
