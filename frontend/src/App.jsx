import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';

// Phase 15
import CheckEmail from './pages/CheckEmail';
import VerifyEmail from './pages/VerifyEmail';

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        
                        <Route path="/check-email" element={<CheckEmail />} />
                        <Route path="/verify-email/:token" element={<VerifyEmail />} />
                        
                        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                            <Route index element={<Dashboard />} />
                            <Route path="categories" element={<Categories />} />
                            <Route path="transactions" element={<Transactions />} />
                            <Route path="settings" element={<Settings />} /> 
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;