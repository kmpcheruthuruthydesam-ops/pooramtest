import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';

// Lazy load page components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DevoteeList = lazy(() => import('./pages/DevoteeList'));
const Collections = lazy(() => import('./pages/Collections'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Other = lazy(() => import('./pages/Other'));

const PageLoader = ({ message = 'Loading Experience' }) => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-md">
        <div className="flex flex-col items-center gap-6">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">{message}</p>
                <div className="h-1 w-32 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 animate-[loading_2s_infinite]"></div>
                </div>
            </div>
        </div>
    </div>
);

const App = () => {
    const { isAuthenticated } = useAuth();
    const { isLoading } = useData();

    return (
        <Suspense fallback={<PageLoader />}>
            {isLoading && <PageLoader message="Syncing with Cloud" />}
            <Routes>
                <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
                
                <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
                    <Route index element={<Dashboard />} />
                    <Route path="devotees" element={<DevoteeList />} />
                    <Route path="collections" element={<Collections />} />
                    <Route path="expenses" element={<Expenses />} />
                    <Route path="other" element={<Other />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="profile/:id" element={<Profile />} />
                </Route>

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Suspense>
    );
};

export default App;
