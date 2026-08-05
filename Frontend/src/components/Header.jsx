import { Bell, Menu, LogOut, DollarSign, Wrench, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useGetActivities } from '../hooks/useGetActivities';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const notificationRef = useRef(null);
  
  const { data: activities = [], isLoading } = useGetActivities();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/landlord');
  };

  // Only landlords (admins) should see these activities based on your requirements
  const isLandlord = user?.role === 'admin';

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50">
      <button type="button" onClick={onMenuClick} className="px-4 border-r border-gray-200/50 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden">
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex"></div>
        <div className="ml-4 flex items-center md:ml-6 gap-3">
          
          {isLandlord && (
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setHasUnread(false);
                }}
                className="bg-slate-100/50 p-2 rounded-full text-gray-400 hover:text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 group relative"
              >
                <span className="sr-only">View notifications</span>
                {hasUnread && activities.length > 0 && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
                )}
                <Bell className="h-5 w-5 group-hover:animate-bounce" aria-hidden="true" />
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-full">
                        {activities.length} New
                      </span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {isLoading ? (
                        <div className="p-4 text-center text-sm text-gray-500">Loading notifications...</div>
                      ) : activities.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-500">
                          <Bell className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                          No new notifications
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {activities.slice(0, 10).map((activity) => (
                            <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3">
                              <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                activity.type === 'payment' ? 'bg-emerald-100 text-emerald-600' :
                                activity.type === 'maintenance' ? 'bg-rose-100 text-rose-600' : 
                                'bg-primary-100 text-primary-600'
                              }`}>
                                {activity.type === 'payment' ? <DollarSign className="h-4 w-4" /> :
                                 activity.type === 'maintenance' ? <Wrench className="h-4 w-4" /> :
                                 <Users className="h-4 w-4" />}
                              </div>
                              <div>
                                <p className="text-sm text-gray-800 font-medium">{activity.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button 
            onClick={handleLogout} 
            className="ml-3 bg-slate-100/50 p-2 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 group relative"
            title="Sign out"
          >
            <span className="sr-only">Sign out</span>
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
