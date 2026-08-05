import { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Wrench, MapPin } from 'lucide-react';
import { maintenanceService } from '../services/maintenanceService';
import { useQueryClient } from '@tanstack/react-query';
import { useGetMaintenanceTickets } from '../hooks/useGetMaintenanceTickets';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function MaintenancePage() {
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading: isLoadingTickets } = useGetMaintenanceTickets();

  const loading = isLoadingTickets;
  const [visibleCount, setVisibleCount] = useState(10);
  const visibleTickets = tickets.slice(0, visibleCount);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await maintenanceService.updateStatus(id, newStatus);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIsModalOpen(false);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update status', error);
      toast.error('Failed to update status');
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-md bg-amber-100/90 text-amber-800 ring-1 ring-inset ring-amber-600/20"><Clock className="mr-1.5 h-3 w-3" /> Pending</span>;
      case 'In Progress':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-md bg-sky-100/90 text-sky-800 ring-1 ring-inset ring-sky-600/20"><AlertCircle className="mr-1.5 h-3 w-3" /> In Progress</span>;
      case 'Resolved':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-md bg-emerald-100/90 text-emerald-800 ring-1 ring-inset ring-emerald-600/20"><CheckCircle className="mr-1.5 h-3 w-3" /> Resolved</span>;
      default:
        return null;
    }
  };

  const getStatusIconBox = (status) => {
    switch (status) {
      case 'Resolved':
        return (
          <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100 group-hover:bg-emerald-100 transition-colors shrink-0">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
        );
      case 'In Progress':
        return (
          <div className="bg-sky-50 p-3.5 rounded-2xl border border-sky-100 group-hover:bg-sky-100 transition-colors shrink-0">
            <Wrench className="w-6 h-6 text-sky-500" />
          </div>
        );
      default:
        return (
          <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-100 group-hover:bg-amber-100 transition-colors shrink-0">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
        );
    }
  };

  const tableVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Maintenance Requests</h1>
          <p className="mt-1 text-sm text-gray-500">Track and dispatch maintenance issues</p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <Wrench className="h-10 w-10 text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-900">No maintenance tickets found</p>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">When tenants submit maintenance requests, they will appear here for you to review and dispatch.</p>
          </div>
        ) : (
          <motion.div 
            variants={tableVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4"
          >
            {visibleTickets.map((ticket) => (
              <motion.div 
                variants={rowVariants} 
                key={ticket.request_id} 
                className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md border border-slate-100 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 sm:gap-5">
                  {getStatusIconBox(ticket.status)}
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {ticket.issue}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1.5 text-sm font-medium text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {ticket.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700 font-semibold">{ticket.location || 'Unknown Property'}</span> 
                        <span className="text-slate-400">(Unit {ticket.unit_assign})</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100 w-full sm:w-auto">
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                    <span className={`inline-flex justify-center items-center px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm w-full sm:w-auto ${
                      ticket.priority === 'High' ? 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20' : 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-500/20'
                    }`}>
                      {ticket.priority} Priority
                    </span>
                    <div className="w-full sm:w-auto flex justify-center">
                      {renderStatusBadge(ticket.status)}
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedTicket(ticket); setIsModalOpen(true); }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-indigo-600 font-bold text-sm rounded-xl transition-all shadow-sm group-hover:shadow hover:-translate-y-0.5 whitespace-nowrap"
                  >
                    Review Request
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {!loading && visibleCount < tickets.length && (
        <div className="flex justify-center mt-6 z-10 relative">
          <button 
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-xl font-semibold shadow-sm transition-all duration-200 hover:shadow-md"
          >
            View More
          </button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Manage Maintenance Ticket">
        {selectedTicket && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                {renderStatusBadge(selectedTicket.status)}
              </div>
              <div className="pr-20">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{selectedTicket.issue}</h3>
                <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                  <Clock className="h-4 w-4 text-primary-400" />
                  <span>Logged on {selectedTicket.date}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Ticket Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority Level</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold shadow-sm ${
                    selectedTicket.priority === 'High' ? 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20' : 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-500/20'
                  }`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Property</p>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedTicket.location || 'Unknown'} (Unit {selectedTicket.unit_assign})
                  </p>
                </div>
                {selectedTicket.description && (
                  <div className="col-span-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Update Status (Dispatch)</label>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => handleStatusChange(selectedTicket.request_id, 'Pending')}
                  className={`py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1 ${selectedTicket.status === 'Pending' ? 'bg-amber-100 text-amber-800 shadow-inner ring-2 ring-amber-500/20' : 'bg-white border border-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 hover:shadow-md hover:-translate-y-1'}`}
                >
                  <Clock className="h-5 w-5 mb-0.5" />
                  Pending
                </button>
                <button 
                  onClick={() => handleStatusChange(selectedTicket.request_id, 'In Progress')}
                  className={`py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1 ${selectedTicket.status === 'In Progress' ? 'bg-sky-100 text-sky-800 shadow-inner ring-2 ring-sky-500/20' : 'bg-white border border-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 hover:shadow-md hover:-translate-y-1'}`}
                >
                  <AlertCircle className="h-5 w-5 mb-0.5" />
                  In Progress
                </button>
                <button 
                  onClick={() => handleStatusChange(selectedTicket.request_id, 'Resolved')}
                  className={`py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1 ${selectedTicket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 shadow-inner ring-2 ring-emerald-500/20' : 'bg-white border border-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 hover:shadow-md hover:-translate-y-1'}`}
                >
                  <CheckCircle className="h-5 w-5 mb-0.5" />
                  Resolved
                </button>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <button onClick={() => setIsModalOpen(false)} className="bg-white py-2.5 px-6 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors shadow-sm w-full sm:w-auto">
                Close Ticket
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
