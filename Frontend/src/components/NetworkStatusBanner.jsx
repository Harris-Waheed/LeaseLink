import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NetworkStatusBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-rose-500 text-white px-4 py-2 flex items-center justify-center shadow-lg backdrop-blur-md bg-opacity-90"
        >
          <WifiOff className="h-5 w-5 mr-3 animate-pulse" />
          <span className="font-semibold text-sm tracking-wide">
            Please check your internet connection.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
