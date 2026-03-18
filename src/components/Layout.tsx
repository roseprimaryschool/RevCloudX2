import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../firebase';
import { BookOpen, PlusCircle, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Create', path: '/create', icon: PlusCircle },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar / Topbar */}
      <nav className="bg-white border-b md:border-b-0 md:border-r border-slate-200 w-full md:w-64 flex-shrink-0">
        <div className="p-4 flex items-center justify-between md:flex-col md:items-start md:h-full">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl mb-0 md:mb-8">
            <BookOpen className="w-6 h-6" />
            <span>RevCloud</span>
          </div>
          
          <div className="hidden md:flex flex-col gap-2 w-full flex-grow">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={twMerge(
                  clsx(
                    "flex items-center gap-3 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors",
                    location.pathname === item.path && "bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100"
                  )
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile Nav */}
          <div className="flex md:hidden items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={twMerge(
                  clsx(
                    "text-slate-500 hover:text-indigo-600 transition-colors",
                    location.pathname === item.path && "text-indigo-600"
                  )
                )}
              >
                <item.icon className="w-6 h-6" />
              </Link>
            ))}
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 transition-colors">
              <LogOut className="w-6 h-6" />
            </button>
          </div>

          <div className="hidden md:block w-full mt-auto pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3 px-4 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
              <div className="text-sm truncate text-slate-700">
                {user?.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
