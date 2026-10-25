import { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, User, Menu, X, LayoutDashboard, Receipt, PieChart, Settings, Sun, Moon } from 'lucide-react';

const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Categories', path: '/categories', icon: PieChart },
    { name: 'Settings', path: '/settings', icon: Settings },
];

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleLogoutConfirm = () => {
        setIsLogoutModalOpen(false);
        logout();
    };

    return (
        <>
            <header className="h-16 bg-white dark:bg-oled-base border-b border-gray-200 dark:border-oled-border flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm transition-colors">
                {/* Mobile Title & Hamburger */}
                <div className="md:hidden flex items-center gap-3">
                    <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        aria-label="Open main menu"
                        aria-expanded={isMobileMenuOpen}
                        className="text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 focus:outline-none transition-colors"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Savify</span>
                </div>
                
                {/* Spacer for desktop */}
                <div className="hidden md:block flex-1"></div>

                {/* Actions: Theme Toggle, Profile & Logout Button */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <button
                        onClick={toggleTheme}
                        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                        className="p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 rounded-full hover:bg-gray-100 dark:hover:bg-oled-popover transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:focus:ring-offset-oled-base"
                    >
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>

                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-oled-popover px-3 py-1.5 rounded-full border border-gray-200 dark:border-oled-border transition-colors">
                        <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium truncate max-w-[100px] sm:max-w-none">{user?.name}</span>
                    </div>
                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </header>

            {/* Mobile Navigation Drawer Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Dark Background Overlay (Clicking it closes the menu) */}
                    <div 
                        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></div>
                    
                    {/* Sliding Drawer */}
                    <div className="relative flex flex-col w-64 max-w-xs bg-white dark:bg-oled-base h-full shadow-xl transition-colors">
                        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-oled-border transition-colors">
                            <div className="flex items-center gap-2">
                                <LayoutDashboard className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xl font-bold text-gray-800 dark:text-gray-100">Savify</span>
                            </div>
                            <button 
                                onClick={() => setIsMobileMenuOpen(false)} 
                                aria-label="Close main menu"
                                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                                                isActive
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-oled-popover dark:hover:text-gray-100'
                                            }`
                                        }
                                    >
                                        <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                                        {item.name}
                                    </NavLink>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {isLogoutModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-oled-card rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-transparent dark:border-oled-border transition-colors">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Log out of Savify?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Are you sure you want to log out of your account?</p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 dark:bg-oled-base border-t border-gray-200 dark:border-oled-border flex justify-end gap-3 transition-colors">
                            <button
                                onClick={() => setIsLogoutModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-oled-popover border border-gray-300 dark:border-oled-border rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-oled-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-oled-base transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogoutConfirm}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-oled-base transition-colors"
                            >
                                Log out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;