import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewCorrectionPage from './pages/NewCorrectionPage';
import StudentHistoryPage from './pages/StudentHistoryPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<DashboardPage />} />
                        <Route path="corectare" element={<NewCorrectionPage />} />
                        <Route path="istoric" element={<StudentHistoryPage />} />
                        <Route path="statistici" element={<StatisticsPage />} />
                        <Route path="setari" element={<SettingsPage />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
