import { useState, useEffect } from 'react';
import { Plus, Wrench, AlertCircle, Clock, CheckCircle, MapPin, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { tenantService } from '../../services/tenantService';
import { leaseService } from '../../services/leaseService';
import { useGetMaintenanceTickets } from '../../hooks/useGetMaintenanceTickets';
import { useAddMaintenance } from '../../hooks/useAddMaintenance';
import { useDeleteMaintenance } from '../../hooks/useDeleteMaintenance';

export default function TenantMaintenancePage() {
  const { user } = useAuth();
  const [tenantInfo, setTenantInfo] = useState(null);
  const [isTenantLoading, setIsTenantLoading] = useState(true);
  
  const { data: tickets = [], isLoading: isTicketsLoading } = useGetMaintenanceTickets();
  const { mutateAsync: addMaintenance } = useAddMaintenance();
  const { mutateAsync: deleteMaintenance, isPending: isDeleting } = useDeleteMaintenance();
  
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    const loadTenantData = async () => {
      try {
        if (user?.email) {
          // Get portal data for display
          const res = await tenantService.getPortalData(user.email);
          const portalData = res.data?.data || [];
          let currentInfo = portalData.length > 0 ? portalData[0] : null;

          // Now fetch the actual lease_id because portalData doesn't contain it
          const tenantsRes = await tenantService.getAll();
          const allTenants = tenantsRes.data?.data || [];
          const currentTenant = allTenants.find(t => t.tnt_email === user.email);

          if (currentTenant?.tnt_id) {
            const leasesRes = await leaseService.getAll();
            const allLeases = leasesRes.data?.data || [];
            const activeLease = allLeases.find(l => l.tenant_id === currentTenant.tnt_id);
            if (activeLease && currentInfo) {
              currentInfo = { ...currentInfo, lease_id: activeLease.lease_id };
            }
          }

          setTenantInfo(currentInfo);
        }
      } catch (err) {
        console.error("Failed to fetch tenant portal data:", err);
      } finally {
        setIsTenantLoading(false);
      }
    };
    loadTenantData();
  }, [user?.email]);

  // Filter requests for the current tenant based on their unit/property if needed.
  // The backend a_maintenance returns location, so we might want to filter or just show all for this tenant.
  const myRequests = tickets.filter(req => {
    if (!tenantInfo) return true; // Show all if we can't determine tenant info
    // You can filter by location if the backend provides it in a matching format
    // For now, we'll display all tickets if the user wants to see them as provided by the API
    return true; 
  });

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    if (!tenantInfo?.lease_id) {
      toast.error('Could not find your active lease. Cannot submit maintenance request.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      await addMaintenance({
        lease_id: tenantInfo.lease_id,
        issue_title: data.title,
        description: data.description,
        priority: data.priority,
      });
      
      toast.success('Maintenance request submitted successfully!');
      setIsNewRequestModalOpen(false);
    } catch (err) {
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = (requestId) => {
    if (!requestId) return;
    setRequestToDelete(requestId);
  };

  const confirmDelete = async () => {
    if (!requestToDelete) return;
    try {
      await deleteMaintenance(requestToDelete);
      toast.success("Request deleted successfully.");
    } catch (err) {
      toast.error("Failed to delete the request.");
    } finally {
      setRequestToDelete(null);
    }
  };

  const getStatusIcon = (status) => {
    const s = status?.toLowerCase();
    if (s === 'pending') return <Clock className="w-5 h-5 text-amber-500" />;
    if (s === 'in progress' || s === 'assigned') return <Wrench className="w-5 h-5 text-blue-500" />;
    if (s === 'resolved' || s === 'completed') return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <AlertCircle className="w-5 h-5 text-gray-500" />;
  };

  const getPriorityBadge = (priority) => {
    const p = priority?.toLowerCase();
    if (p === 'high') return 'bg-red-100 text-red-800 border-red-200';
    if (p === 'medium') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (p === 'low') return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === 'resolved' || s === 'completed') return 'bg-green-100 text-green-800 border-green-200';
    if (s === 'in progress') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (s === 'pending') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const isLoading = isTenantLoading || isTicketsLoading;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Maintenance</h1>
          <p className="mt-1 text-sm text-gray-500">Submit and track maintenance requests for your unit.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsNewRequestModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            New Request
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center">
             <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
             <div className="text-gray-500 font-medium">Loading requests...</div>
          </div>
        ) : myRequests.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Wrench className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No requests yet</h3>
            <p className="mt-1 text-sm text-gray-500">You haven't submitted any maintenance requests.</p>
            <button onClick={() => setIsNewRequestModalOpen(true)} className="mt-4 text-primary-600 font-medium hover:text-primary-700">
              Submit your first request
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {myRequests.slice(0, visibleCount).map((request, idx) => (
              <li key={idx} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-white p-2 border border-gray-100 rounded-lg shadow-sm">
                      {getStatusIcon(request.status)}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{request.issue}</h4>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Submitted on {request.date || 'N/A'}
                      </p>
                      {request.description && (
                        <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded-md border border-gray-100">
                          {request.description}
                        </p>
                      )}
                      {request.location && (
                        <p className="text-sm text-gray-600 mt-2 flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" /> Location: {request.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(request.status)}`}>
                      Status: {request.status || 'Pending'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadge(request.priority)}`}>
                      {request.priority} Priority
                    </span>
                    
                    <button 
                      onClick={() => handleDeleteRequest(request.request_id)}
                      disabled={isDeleting}
                      className="mt-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                      title="Delete Request"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isLoading && visibleCount < myRequests.length && (
        <div className="flex justify-center mt-6 z-10 relative">
          <button 
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-xl font-semibold shadow-sm transition-all duration-200 hover:shadow-md"
          >
            View More
          </button>
        </div>
      )}

      <Modal isOpen={isNewRequestModalOpen} onClose={() => !isSubmitting && setIsNewRequestModalOpen(false)} title="New Maintenance Request">
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Issue Title</label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Broken Heater"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Priority Level</label>
            <select
              name="priority"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="Low">Low - Not urgent</option>
              <option value="High">High - Urgent (e.g. active leak, no heat)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={4}
              placeholder="Please provide details about the issue..."
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsNewRequestModalOpen(false)}
              disabled={isSubmitting}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !tenantInfo?.lease_id}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 min-w-[120px]"
            >
              {isSubmitting ? 'Requesting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!requestToDelete} onClose={() => !isDeleting && setRequestToDelete(null)} title="Confirm Deletion">
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Are you sure you want to permanently delete this maintenance request? This action cannot be undone.
          </p>
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setRequestToDelete(null)}
              disabled={isDeleting}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 min-w-[100px]"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
