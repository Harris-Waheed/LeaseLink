import { Link, useLocation } from 'react-router-dom';
import { Home, Building2, Users, FileText, CreditCard, Wrench, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: Home },
  { name: 'Properties', path: '/admin/properties', icon: Building2 },
  { name: 'Tenants', path: '/admin/tenants', icon: Users },
  { name: 'Leases', path: '/admin/leases', icon: FileText },
  { name: 'Payments', path: '/admin/payments', icon: CreditCard },
  { name: 'Maintenance', path: '/admin/maintenance', icon: Wrench },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 shadow-xl">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-6 bg-slate-950/50 backdrop-blur-sm border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">LeaseLink</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  } group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-primary-500/5 border-l-4 border-primary-500 rounded-xl"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={`${
                      isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-primary-300 group-hover:scale-110'
                    } mr-3 flex-shrink-0 h-5 w-5 transition-all duration-200 relative z-10`}
                    aria-hidden="true"
                  />
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
