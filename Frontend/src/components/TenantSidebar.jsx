import { Link, useLocation } from 'react-router-dom';
import { Home, CreditCard, Wrench, Settings, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'My Home', path: '/tenant/dashboard', icon: Home },
  { name: 'Payments', path: '/tenant/payments', icon: CreditCard },
  { name: 'Maintenance', path: '/tenant/maintenance', icon: Wrench },
  { name: 'Settings', path: '/tenant/settings', icon: Settings },
];

export default function TenantSidebar() {
  const location = useLocation();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 shadow-xl">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-6 bg-slate-950/50 backdrop-blur-sm border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">LeaseLink <span className="text-sm font-normal text-slate-400">Tenant</span></h1>
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
                      layoutId="tenant-sidebar-active"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-indigo-500/5 border-l-4 border-indigo-500 rounded-xl"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={`${
                      isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-300 group-hover:scale-110'
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
