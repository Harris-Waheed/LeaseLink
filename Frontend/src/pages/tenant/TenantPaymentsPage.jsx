import { useState } from 'react';
import { Download, CreditCard, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useGetPayments } from '../../hooks/useGetPayments';
import { useGetTenants } from '../../hooks/useGetTenants';
import { paymentService } from '../../services/paymentService';
import { useQueryClient } from '@tanstack/react-query';

import { useGetDueAmount } from '../../hooks/useGetDueAmount';

export default function TenantPaymentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: allPayments = [], isLoading: loadingPayments } = useGetPayments();
  const { data: allTenants = [], isLoading: loadingTenants } = useGetTenants();
  
  const payments = allPayments.filter(p => p.tenant_email === user?.email);
  const currentTenant = allTenants.find(t => (t.tnt_email || t.email) === user?.email);
  const tenantId = currentTenant?.tnt_id || currentTenant?.id;
  
  const { data: dueAmount = 0, isLoading: loadingDueAmount } = useGetDueAmount(tenantId);
  const loading = loadingPayments || loadingTenants;
  const [visibleCount, setVisibleCount] = useState(10);
  const visiblePayments = payments.slice(0, visibleCount);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayRent = async (e) => {
    e.preventDefault();
    if (!currentTenant) {
      toast.error('Tenant profile not found. Cannot make payment.');
      return;
    }
    
    setIsProcessing(true);
    try {
      const formData = new FormData(e.target);
      const submitData = new FormData();
      submitData.append('tenant_id', tenantId);
      submitData.append('amount', formData.get('amount'));
      
      const file = formData.get('reference_image');
      if (!file || file.size === 0) {
        toast.error("Please attach a reference image.");
        setIsProcessing(false);
        return;
      }
      submitData.append('reference_image', file);
      
      await paymentService.create(submitData);
      
      toast.success('Rent payment successful!');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dueAmount'] });
      setIsPayModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your rent and view payment history.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsPayModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <CreditCard className="-ml-1 mr-2 h-5 w-5" />
            Make a Payment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-500">Loading payment history...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                    <div className="flex flex-col items-center justify-center">
                      <CreditCard className="h-10 w-10 text-gray-300 mb-3" />
                      <p className="text-sm font-medium text-gray-900">No payment history found</p>
                      <p className="text-xs text-gray-400 mt-1">There are no payment records to display.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                visiblePayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${payment.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                        payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status === 'Paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {payment.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.reference_image ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); window.open(payment.reference_image, '_blank'); }}
                          className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-1 font-medium bg-primary-50 px-2 py-1 rounded-md transition-colors"
                        >
                          <Search className="w-3.5 h-3.5" /> View Image
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && visibleCount < payments.length && (
        <div className="flex justify-center mt-6 z-10 relative">
          <button 
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-xl font-semibold shadow-sm transition-all duration-200 hover:shadow-md"
          >
            View More
          </button>
        </div>
      )}

      <Modal isOpen={isPayModalOpen} onClose={() => !isProcessing && setIsPayModalOpen(false)} title="Make a Payment">
        <form onSubmit={handlePayRent} className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-500">Current Balance</span>
              <span className={`text-xl font-bold ${dueAmount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {loadingDueAmount ? '...' : `$${Number(dueAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Amount</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="amount"
                defaultValue={dueAmount}
                min="0.01"
                step="0.01"
                required
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reference Image (Proof of Payment)</label>
            <input
              type="file"
              name="reference_image"
              accept="image/*"
              required
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              disabled={isProcessing}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 min-w-[120px]"
            >
              {isProcessing ? 'Processing...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
