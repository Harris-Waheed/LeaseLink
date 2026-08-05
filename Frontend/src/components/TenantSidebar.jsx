import { Link, useLocation } from 'react-router-dom';
import { Home, CreditCard, Wrench, Settings, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { name: 'My Home', path: '/tenant/dashboard', icon: Home },
  { name: 'Payments', path: '/tenant/payments', icon: CreditCard },
  { name: 'Maintenance', path: '/tenant/maintenance', icon: Wrench },
  { name: 'Settings', path: '/tenant/settings', icon: Settings },
];

export default function TenantSidebar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const location = useLocation();

  const SidebarContent = () => (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="flex items-center justify-between h-16 flex-shrink-0 px-6 bg-slate-950/50 backdrop-blur-sm border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">LeaseLink <span className="text-sm font-normal text-slate-400">Tenant</span></h1>
        </div>
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsMobileMenuOpen?.(false)}
          className="md:hidden text-slate-400 hover:text-white focus:outline-none"
        >
          <X className="h-6 w-6" />
        </button>
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
                onClick={() => setIsMobileMenuOpen?.(false)}
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
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-slate-800 shadow-xl z-20">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[80vw] z-50 md:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
