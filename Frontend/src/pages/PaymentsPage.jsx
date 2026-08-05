import { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, ChevronDown, Mail, Phone, MoreVertical, CreditCard } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { useQueryClient } from '@tanstack/react-query';
import { useGetPayments } from '../hooks/useGetPayments';
import { useGetTenants } from '../hooks/useGetTenants';
import { useGetProperties } from '../hooks/useGetProperties';
import { useGetDueAmount } from '../hooks/useGetDueAmount';
import Modal from '../components/Modal';
import Drawer from '../components/Drawer';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function PaymentsPage() {
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading: isLoadingPayments } = useGetPayments();
  const { data: tenants = [], isLoading: isLoadingTenants } = useGetTenants();
  const { data: properties = [], isLoading: isLoadingProperties } = useGetProperties();

  const loading = isLoadingPayments || isLoadingTenants || isLoadingProperties;
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  
  const filteredPayments = payments.filter((payment) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const tenant = tenants.find(t => 
      (payment.tenantId && t.id === payment.tenantId) || 
      (payment.tenant_id && t.id === payment.tenant_id) ||
      (payment.tenant_name && (t.tnt_name === payment.tenant_name || t.name === payment.tenant_name))
    );
    const tName = (payment.tenant_name || tenant?.tnt_name || tenant?.name || '').toLowerCase();
    const tEmail = (payment.tenant_email || tenant?.tnt_email || tenant?.email || '').toLowerCase();
    const status = (payment.status || '').toLowerCase();
    const date = (payment.date || '').toLowerCase();
    
    return tName.includes(term) || tEmail.includes(term) || status.includes(term) || date.includes(term);
  });
  
  const visiblePayments = filteredPayments.slice(0, visibleCount);
  
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedTenantDetails, setSelectedTenantDetails] = useState(null);
  
  const [tenantSearchTerm, setTenantSearchTerm] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [amount, setAmount] = useState('');

  const { data: dueAmount = 0, isLoading: isLoadingDueAmount } = useGetDueAmount(selectedTenantId);

  useEffect(() => {
    if (selectedTenantId && !isLoadingDueAmount) {
      setAmount(dueAmount || '');
    } else {
      setAmount('');
    }
  }, [selectedTenantId, dueAmount, isLoadingDueAmount]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (activeDropdown !== null) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeDropdown]);

  const handleStatusChange = async (payment) => {
    try {
      await api.patch(`/pay/status/${payment.pay_id || payment.id}`);
      const newStatus = payment.status === 'Paid' ? 'Due' : 'Paid';
      toast.success(`Payment status updated to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    } catch (error) {
      console.error('Failed to update status', error);
      // toast.error is already handled by the axios interceptor
    }
  };

  // Data is fetched via React Query

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const submitData = new FormData();
    submitData.append('tenant_id', formData.get('tenantId'));
    submitData.append('amount', formData.get('amount'));
    
    const file = formData.get('reference_image');
    if (!file || file.size === 0) {
      toast.error("Please attach a reference image.");
      return;
    }
    submitData.append('reference_image', file);

    setIsSubmitting(true);
    try {
      await paymentService.create(submitData);
      toast.success("Payment logged successfully!");
      setIsLogModalOpen(false);
      setSelectedTenantId('');
      setTenantSearchTerm('');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    } catch (error) {
      console.error('Failed to log payment', error);
    } finally {
      setIsSubmitting(false);
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
          <h1 className="text-2xl font-semibold text-gray-900">Rent Collection</h1>
          <p className="mt-1 text-sm text-gray-500">Track and log tenant payments</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-4">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <DollarSign className="-ml-1 mr-2 h-5 w-5" />
            Log Payment
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-visible">
        <div className="overflow-x-visible">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <motion.tbody 
              variants={tableVariants}
              initial="hidden"
              animate="show"
              className="bg-white divide-y divide-gray-200"
            >
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                    <div className="flex flex-col items-center justify-center">
                      <CreditCard className="h-10 w-10 text-gray-300 mb-3" />
                      <p className="text-sm font-medium text-gray-900">No payments found</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms.</p>
                    </div>
                  </td>
                </tr>
              ) : visiblePayments.map((payment) => {
                const tenant = tenants.find(t => 
                  (payment.tenantId && t.id === payment.tenantId) || 
                  (payment.tenant_id && t.id === payment.tenant_id) ||
                  (payment.tenant_name && (t.name === payment.tenant_name || t.tnt_name === payment.tenant_name))
                );
                return (
                  <motion.tr variants={rowVariants} key={payment.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.date}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors cursor-pointer"
                      onClick={() => {
                        if (tenant) {
                          setSelectedTenantDetails(tenant);
                          setIsDetailsDrawerOpen(true);
                        }
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="block font-medium">{payment.tenant_name || tenant?.tnt_name || tenant?.name || 'Unknown'}</span>
                        <span className="block text-xs text-gray-500 mt-0.5">{payment.tenant_email || tenant?.tnt_email || tenant?.email || 'No email provided'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold tracking-tight">
                      ${payment.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.reference_image ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); window.open(payment.reference_image, '_blank'); }}
                          className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-1 font-medium bg-primary-50 px-2 py-1 rounded-md transition-colors"
                        >
                          <Search className="w-3.5 h-3.5" /> View Receipt
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm backdrop-blur-md ${
                        payment.status === 'Paid' ? 'bg-emerald-100/90 text-emerald-800 ring-1 ring-inset ring-emerald-600/20' : 
                        payment.status === 'Due' ? 'bg-amber-100/90 text-amber-800 ring-1 ring-inset ring-amber-600/20' : 'bg-rose-100/90 text-rose-800 ring-1 ring-inset ring-rose-600/20'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                      <div className="relative inline-block text-left">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setActiveDropdown(activeDropdown === payment.id ? null : payment.id); 
                          }}
                          className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        
                        {activeDropdown === payment.id && (
                          <div 
                            className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50"
                          >
                            <div className="py-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(payment); setActiveDropdown(null); }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                              >
                                Mark as {payment.status === 'Paid' ? 'Due' : 'Paid'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
      </div>

      {!loading && visibleCount < filteredPayments.length && (
        <div className="flex justify-center mt-6 z-10 relative">
          <button 
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-xl font-semibold shadow-sm transition-all duration-200 hover:shadow-md"
          >
            View More
          </button>
        </div>
      )}

      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title="Log New Payment">
        <form onSubmit={handleLogSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
            <div 
              className="mt-1 relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="block truncate">
                {isLoadingTenants ? <span className="text-gray-400">Loading tenants...</span> :
                 selectedTenantId ? (() => {
                  const t = tenants.find(t => (t.tnt_id || t.id) == selectedTenantId);
                  return t ? `${t.tnt_name || t.name} (or ${t.tnt_email || t.email})` : 'Select tenant...';
                })() : 'Select tenant...'}
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </span>
            </div>
            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                <div className="px-2 pb-2">
                  <input
                    type="text"
                    className="w-full border-b border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-primary-500"
                    placeholder="Search name or email..."
                    value={tenantSearchTerm}
                    onChange={(e) => setTenantSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {tenants.filter(t => {
                  const tName = (t.tnt_name || t.name || '').toLowerCase();
                  const tEmail = (t.tnt_email || t.email || '').toLowerCase();
                  const sTerm = tenantSearchTerm.toLowerCase();
                  return tName.includes(sTerm) || tEmail.includes(sTerm);
                }).map(t => (
                  <div
                    key={t.tnt_id || t.id}
                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary-50 transition-colors ${selectedTenantId == (t.tnt_id || t.id) ? 'bg-primary-100 text-primary-900' : 'text-gray-900'}`}
                    onClick={() => {
                      setSelectedTenantId(t.tnt_id || t.id);
                      setIsDropdownOpen(false);
                      setTenantSearchTerm('');
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="block truncate font-medium">{t.tnt_name || t.name}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{t.tnt_email || t.email}</span>
                    </div>
                  </div>
                ))}
                {tenants.filter(t => (t.tnt_name || t.name || '').toLowerCase().includes(tenantSearchTerm.toLowerCase())).length === 0 && (
                  <div className="py-2 pl-3 pr-9 text-sm text-gray-500 italic">No tenants found</div>
                )}
              </div>
            )}
            <input type="hidden" name="tenantId" value={selectedTenantId} required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                Amount Received ($)
                {selectedTenantId && (
                  <span className={`text-xs font-semibold ${dueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isLoadingDueAmount ? '...' : `Due: $${Number(dueAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                  </span>
                )}
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input 
                  type="number" 
                  name="amount" 
                  min="0.01" 
                  step="0.01" 
                  required 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                  placeholder="0.00" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reference Image</label>
              <input type="file" name="reference_image" accept="image/*" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsLogModalOpen(false)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Cancel
            </button>
            <button type="submit" disabled={isLoadingTenants || isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
              {isSubmitting ? 'Please wait...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </Modal>
      
      <Drawer isOpen={isDetailsDrawerOpen} onClose={() => setIsDetailsDrawerOpen(false)} title="Tenant Details">
        {selectedTenantDetails && (
          <div className="space-y-6">
            <div className="flex flex-col items-center p-6 bg-gradient-to-b from-primary-50/50 to-white rounded-3xl border border-primary-100/50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${selectedTenantDetails.status === 'Active' || !selectedTenantDetails.status ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                  {selectedTenantDetails.status || 'Active'}
                </span>
              </div>
              <div className="h-24 w-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-primary-500/30 mb-4 ring-4 ring-white overflow-hidden">
                {selectedTenantDetails.image ? (
                  <img src={selectedTenantDetails.image} alt={selectedTenantDetails.name || selectedTenantDetails.tnt_name} className="w-full h-full object-cover" />
                ) : (
                  (selectedTenantDetails.tnt_name || selectedTenantDetails.name || 'T').charAt(0)
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedTenantDetails.tnt_name || selectedTenantDetails.name}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Tenant ID: {selectedTenantDetails.tnt_id || selectedTenantDetails.id || 'N/A'}</p>
              <div className="mt-4 flex gap-3 text-sm">
                <div className="flex items-center text-slate-600 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                  <Mail className="h-4 w-4 mr-2 text-primary-400" />
                  {selectedTenantDetails.tnt_email || selectedTenantDetails.email}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Contact & Personal</h4>
              <div className="grid gap-3">
                <div className="bg-white p-4 rounded-2xl flex items-center shadow-sm border border-slate-100">
                  <div className="bg-primary-50 p-2.5 rounded-xl mr-4 text-primary-500">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Phone Number</p>
                    <p className="text-sm font-bold text-slate-700">{selectedTenantDetails.tnt_number || selectedTenantDetails.phone}</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl flex items-center shadow-sm border border-slate-100">
                  <div className="bg-indigo-50 p-2.5 rounded-xl mr-4 text-indigo-500">
                    <span className="font-bold text-lg leading-none">ID</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">National ID</p>
                    <p className="text-sm font-bold text-slate-700">{selectedTenantDetails.tnt_national_id || selectedTenantDetails.nationalId || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Lease Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Property</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">
                    {selectedTenantDetails.prop_name || (properties.length ? properties.find(p => p.id === selectedTenantDetails.propertyId)?.name : 'N/A') || 'N/A'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedTenantDetails.tnt_unit_assign || selectedTenantDetails.unit || 'Unassigned'}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lease Term</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{selectedTenantDetails.lease_start || 'Jan 1, 25'} - <br/>{selectedTenantDetails.lease_end || 'Dec 31, 25'}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider">Rent Amount</p>
                  <p className="text-lg font-black text-emerald-700 mt-0.5">${selectedTenantDetails.rent_amount || selectedTenantDetails.rentAmount || '1,500.00'}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button onClick={() => setIsDetailsDrawerOpen(false)} className="bg-white py-2.5 px-6 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors shadow-sm w-full sm:w-auto">
                Close
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
