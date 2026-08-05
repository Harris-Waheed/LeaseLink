import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Drawer({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-y-0 right-0 z-50 flex max-w-full pl-10 pointer-events-none">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md pointer-events-auto"
            >
              <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl ring-1 ring-black/5">
                <div className="px-4 py-6 sm:px-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">{title}</h2>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <span className="sr-only">Close panel</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="relative flex-1 px-4 py-6 sm:px-6">
                  {children}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
