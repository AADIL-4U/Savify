import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-oled-black text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-200">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {/* The nested routes (Dashboard, etc.) render here */}
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;