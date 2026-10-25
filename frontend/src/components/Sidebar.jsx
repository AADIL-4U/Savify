import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, PieChart, Settings } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Transactions', path: '/transactions', icon: Receipt },
        { name: 'Categories', path: '/categories', icon: PieChart },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-oled-base border-r border-gray-200 dark:border-oled-border transition-colors">
            <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-oled-border gap-2 transition-colors">
                <LayoutDashboard className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xl font-bold text-gray-800 dark:text-gray-100">Savify</span>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.name}
                            to={item.path}
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
        </aside>
    );
};

export default Sidebar;