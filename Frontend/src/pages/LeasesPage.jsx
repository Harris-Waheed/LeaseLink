import { useState, useEffect } from 'react';
import { Plus, Search, FileText, MoreVertical } from 'lucide-react';
import { leaseService } from '../services/leaseService';
import { useQueryClient } from '@tanstack/react-query';
import TenantCombobox from '../components/TenantCombobox';
import { useGetLeases } from '../hooks/useGetLeases';
import { useGetTenants } from '../hooks/useGetTenants';
import { useGetProperties } from '../hooks/useGetProperties';
import Modal from '../components/Modal';
import Drawer from '../components/Drawer';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function LeasesPage() {
  const queryClient = useQueryClient();

  const { data: leases = [], isLoading: isLoadingLeases } = useGetLeases();
  const { data: tenants = [], isLoading: isLoadingTenants } = useGetTenants();
  const { data: properties = [], isLoading: isLoadingProperties } = useGetProperties();

  const loading = isLoadingLeases || isLoadingTenants || isLoadingProperties;
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  const filteredLeases = leases.filter((lease) => {
    const tenant = tenants.find(t => t.id === (lease.tenant_id || lease.tenantId));
    const property = properties.find(p => p.id === (lease.prop_id || lease.propertyId));
    const tenantName = (lease.tenant_name || tenant?.name || 'Unknown').toLowerCase();
    const propName = (lease.prop_name || property?.name || 'Unknown').toLowerCase();
    const unitAssign = (lease.unit_assign || lease.unit || '').toString().toLowerCase();
    
    const term = searchTerm.toLowerCase();
    return tenantName.includes(term) || propName.includes(term) || unitAssign.includes(term);
  });
  const visibleLeases = filteredLeases.slice(0, visibleCount);
  const [isGlobalUpdateModalOpen, setIsGlobalUpdateModalOpen] = useState(false);
  const [globalUpdateLeaseData, setGlobalUpdateLeaseData] = useState(null);
  const [globalUpdateDocFile, setGlobalUpdateDocFile] = useState(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedLeaseDetails, setSelectedLeaseDetails] = useState(null);
  const [isSubmittingGlobal, setIsSubmittingGlobal] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [globalSelectedPropId, setGlobalSelectedPropId] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [leaseToEdit, setLeaseToEdit] = useState(null);
  const [leaseDocFile, setLeaseDocFile] = useState(null);

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

  // Data is fetched via React Query

  const openLeaseDetails = (lease, tenant, property) => {
    setSelectedLeaseDetails({
      ...lease,
      tenantName: lease.tenant_name || tenant?.name || 'Unknown Tenant',
      propName: lease.prop_name || property?.name || 'Unknown Property',
      createdAt: lease.created_at || lease.createdAt || 'N/A', // fallback if data is missing
    });
    setIsDetailsDrawerOpen(true);
  };

  const handleGlobalUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!globalUpdateLeaseData) {
      toast.error('Please select a tenant with an active lease first.');
      return;
    }
    
    if (!globalUpdateDocFile) {
      toast.error('Please attach a lease document (PDF).');
      return;
    }
    
    setIsSubmittingGlobal(true);
    const formData = new FormData(e.target);
    const submitData = new FormData();
    submitData.append('tenant_id', formData.get('tenantId'));
    submitData.append('prop_id', formData.get('prop_id'));
    submitData.append('unit_assign', formData.get('unit_assign'));
    submitData.append('lease_start', formData.get('lease_start'));
    submitData.append('lease_end', formData.get('lease_end'));
    submitData.append('rent_amount', formData.get('rent_amount'));
    submitData.append('lease_doc', globalUpdateDocFile);
    
    try {
      const targetLeaseId = globalUpdateLeaseData.lease_id || globalUpdateLeaseData.id;
      await leaseService.update(targetLeaseId, submitData);
      toast.success('Lease updated successfully!');
      setIsGlobalUpdateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['leases'] });
    } catch (error) {
      console.error('Failed to update lease', error);
      toast.error('Failed to update lease');
    } finally {
      setIsSubmittingGlobal(false);
    }
  };

  const handleGlobalTenantChange = (e) => {
    const tenantId = e.target.value;
    const activeLease = leases.find(l => (l.tenant_id == tenantId || l.tenantId == tenantId) && (l.lease_status === 'Active' || l.status === 'Active'));
    setGlobalUpdateLeaseData(activeLease || null);
    
    const selectedTenantObj = tenants.find(t => t.id == tenantId || t.tnt_id == tenantId);
    setGlobalSelectedPropId(selectedTenantObj ? (selectedTenantObj.propertyId || selectedTenantObj.prop_id || activeLease?.prop_id || activeLease?.propertyId || '') : '');
  };

  const handleViewDoc = (lease) => {
    const docUrl = lease.lease_doc_url || lease.documentUrl;
    if (docUrl) {
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(docUrl)}`;
      window.open(viewerUrl, '_blank');
    } else {
      toast('No document attached to this lease.', { icon: '📄' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!leaseDocFile) {
      toast.error('Please attach a lease document (PDF) to update the lease.');
      return;
    }
    
    setIsSubmittingEdit(true);
    const formData = new FormData(e.target);
    
    const submitData = new FormData();
    submitData.append('unit_assign', formData.get('unit_assign'));
    submitData.append('lease_start', formData.get('lease_start'));
    submitData.append('lease_end', formData.get('lease_end'));
    submitData.append('rent_amount', formData.get('rent_amount'));
    submitData.append('lease_doc', leaseDocFile);
    
    try {
      const targetLeaseId = leaseToEdit.lease_id || leaseToEdit.id;
      await leaseService.update(targetLeaseId, submitData);
      toast.success('Lease updated successfully!');
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['leases'] });
    } catch (error) {
      console.error('Failed to update lease', error);
      toast.error('Failed to update lease');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleChangeStatus = async (lease) => {
    try {
      const leaseId = lease.lease_id || lease.id;
      await leaseService.updateStatus(leaseId);
      
      const newStatus = (lease.lease_status || lease.status) === 'Active' ? 'Terminated' : 'Active';
      toast.success(`Lease status changed to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['leases'] });
    } catch (error) {
      console.error('Failed to update status', error);
      toast.error('Failed to update status');
    }
  };

  const openLeaseIndex = visibleLeases.findIndex(l => (l.lease_id || l.id) === activeDropdown);
  const isDropdownNearBottom = openLeaseIndex !== -1 && openLeaseIndex >= visibleLeases.length - 2;

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
          <h1 className="text-2xl font-semibold text-gray-900">Lease Agreements</h1>
          <p className="mt-1 text-sm text-gray-500">Manage active and expired leases</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-4">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="Search leases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setGlobalUpdateLeaseData(null);
              setGlobalUpdateDocFile(null);
              setIsGlobalUpdateModalOpen(true);
            }}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Update Lease
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className={`overflow-x-auto min-w-full transition-all duration-200 ${isDropdownNearBottom ? 'pb-40' : ''}`}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lease Period</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rent</th>
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
                  <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    Loading leases...
                  </td>
                </tr>
              ) : filteredLeases.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-10 w-10 text-gray-300 mb-3" />
                      <p className="text-sm font-medium text-gray-900">No leases found</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search or add a new lease.</p>
                    </div>
                  </td>
                </tr>
              ) : visibleLeases.map((lease) => {
                const leaseId = lease.lease_id || lease.id;
                const tenant = tenants.find(t => t.id === (lease.tenant_id || lease.tenantId));
                const property = properties.find(p => p.id === (lease.prop_id || lease.propertyId));
                const tenantName = lease.tenant_name || tenant?.name || 'Unknown';
                const propName = lease.prop_name || property?.name || 'Unknown';
                const unitAssign = lease.unit_assign || lease.unit;
                const leaseStart = lease.lease_start || lease.startDate;
                const leaseEnd = lease.lease_end || lease.endDate;
                const rentAmount = lease.rent_amount || lease.rentAmount;
                const leaseStatus = lease.lease_status || lease.status;

                return (
                  <motion.tr variants={rowVariants} key={leaseId} className="hover:bg-slate-50 transition-colors group">
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors cursor-pointer" 
                      onClick={() => openLeaseDetails(lease, tenant, property)}
                    >
                      {tenantName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="text-gray-900">{propName}</span> (Unit {unitAssign})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {leaseStart} to {leaseEnd}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ${rentAmount}/mo
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm backdrop-blur-md ${
                        leaseStatus === 'Active' ? 'bg-emerald-100/90 text-emerald-800 ring-1 ring-inset ring-emerald-600/20' : 'bg-red-100/90 text-red-800 ring-1 ring-inset ring-red-600/20'
                      }`}>
                        {leaseStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                      <div className="relative inline-block text-left">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setActiveDropdown(activeDropdown === leaseId ? null : leaseId); 
                          }}
                          className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        
                        {activeDropdown === leaseId && (
                          <div 
                            className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50"
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby="options-menu"
                          >
                            <div className="py-1" role="none">
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setLeaseToEdit(lease);
                                  setLeaseDocFile(null);
                                  setIsEditModalOpen(true); 
                                  setActiveDropdown(null); 
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                role="menuitem"
                              >
                                Update Lease
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleChangeStatus(lease); setActiveDropdown(null); }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                role="menuitem"
                              >
                                {leaseStatus === 'Active' ? 'Terminate' : 'Activate'}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleViewDoc(lease); setActiveDropdown(null); }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                role="menuitem"
                              >
                                View Lease
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

      {!loading && visibleCount < filteredLeases.length && (
        <div className="flex justify-center mt-6 z-10 relative">
          <button 
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-xl font-semibold shadow-sm transition-all duration-200 hover:shadow-md"
          >
            View More
          </button>
        </div>
      )}

      <Modal isOpen={isGlobalUpdateModalOpen} onClose={() => setIsGlobalUpdateModalOpen(false)} title="Update Lease">
        <form onSubmit={handleGlobalUpdateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tenant</label>
              <TenantCombobox 
                tenants={tenants}
                name="tenantId"
                required
                onChange={handleGlobalTenantChange}
                defaultValue=""
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Property</label>
              <input type="hidden" name="prop_id" value={globalSelectedPropId} />
              <select 
                value={globalSelectedPropId}
                disabled
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-gray-100 text-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="" disabled>{isLoadingProperties ? 'Loading properties...' : 'Select property...'}</option>
                {properties.map(p => (
                  <option key={p.id || p.prop_id} value={p.id || p.prop_id}>{p.name || p.prop_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Number</label>
              <input type="text" name="unit_assign" key={`unit-${globalUpdateLeaseData?.id}`} defaultValue={globalUpdateLeaseData?.unit || ''} required maxLength={50} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monthly Rent ($)</label>
              <input type="number" name="rent_amount" key={`rent-${globalUpdateLeaseData?.id}`} defaultValue={globalUpdateLeaseData?.rentAmount || ''} min="0" step="0.01" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" name="lease_start" key={`start-${globalUpdateLeaseData?.id}`} defaultValue={globalUpdateLeaseData?.startDate || ''} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input type="date" name="lease_end" key={`end-${globalUpdateLeaseData?.id}`} defaultValue={globalUpdateLeaseData?.endDate || ''} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
          </div>
          
          <div>
            <span className="block text-sm font-medium text-gray-700">Lease Document <span className="text-red-500">*</span></span>
            <label 
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors cursor-pointer relative block ${globalUpdateDocFile ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-500'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  setGlobalUpdateDocFile(e.dataTransfer.files[0]);
                }
              }}
            >
              <div className="space-y-1 text-center">
                <FileText className="mx-auto h-10 w-10 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <span className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                    <span>Upload a PDF</span>
                    <input 
                      type="file" 
                      name="lease_doc" 
                      className="sr-only" 
                      accept="application/pdf" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setGlobalUpdateDocFile(e.target.files[0]);
                        }
                      }} 
                    />
                  </span>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">{globalUpdateDocFile ? globalUpdateDocFile.name : 'PDF only, up to 10MB'}</p>
              </div>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsGlobalUpdateModalOpen(false)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Cancel
            </button>
            <button type="submit" disabled={isSubmittingGlobal} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
              {isSubmittingGlobal ? 'Please wait...' : 'Update Lease'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Lease">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tenant</label>
              <TenantCombobox
                tenants={tenants}
                name="tenant_id"
                required
                defaultValue={leaseToEdit?.tenant_id || leaseToEdit?.tenantId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Property</label>
              <select 
                name="prop_id" 
                defaultValue={leaseToEdit?.prop_id || leaseToEdit?.propertyId} 
                required 
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 bg-gray-100 text-gray-500 focus:outline-none sm:text-sm rounded-md pointer-events-none cursor-not-allowed"
                tabIndex="-1"
                aria-readonly="true"
              >
                <option value="" disabled>Select property...</option>
                {properties.map(p => <option key={p.id || p.prop_id} value={p.id || p.prop_id}>{p.name || p.prop_name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Number</label>
              <input type="text" name="unit_assign" defaultValue={leaseToEdit?.unit} required maxLength={50} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monthly Rent ($)</label>
              <input type="number" name="rent_amount" defaultValue={leaseToEdit?.rentAmount} min="0" step="0.01" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" name="lease_start" defaultValue={leaseToEdit?.startDate} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input type="date" name="lease_end" defaultValue={leaseToEdit?.endDate} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
          </div>
          
          <div>
            <span className="block text-sm font-medium text-gray-700">Lease Document <span className="text-red-500">*</span></span>
            <label 
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors cursor-pointer relative block ${leaseDocFile ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-500'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  setLeaseDocFile(e.dataTransfer.files[0]);
                }
              }}
            >
              <div className="space-y-1 text-center">
                <FileText className="mx-auto h-10 w-10 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <span className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                    <span>Upload a PDF</span>
                    <input 
                      type="file" 
                      name="lease_doc" 
                      className="sr-only" 
                      accept="application/pdf" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setLeaseDocFile(e.target.files[0]);
                        }
                      }} 
                    />
                  </span>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">{leaseDocFile ? leaseDocFile.name : 'PDF only, up to 10MB'}</p>
              </div>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Cancel
            </button>
            <button type="submit" disabled={isSubmittingEdit} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
              {isSubmittingEdit ? 'Please wait...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <Drawer isOpen={isDetailsDrawerOpen} onClose={() => setIsDetailsDrawerOpen(false)} title="Lease Details">
        {selectedLeaseDetails && (
          <div className="space-y-6">
            <div className="flex flex-col items-center p-6 bg-gradient-to-b from-primary-50/50 to-white rounded-3xl border border-primary-100/50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${selectedLeaseDetails.lease_status === 'Active' || selectedLeaseDetails.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedLeaseDetails.lease_status || selectedLeaseDetails.status}
                </span>
              </div>
              <div className="h-20 w-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-primary-500/30 mb-4 ring-4 ring-white overflow-hidden">
                {(selectedLeaseDetails.tenant_image || selectedLeaseDetails.image) ? (
                  <img src={selectedLeaseDetails.tenant_image || selectedLeaseDetails.image} alt="Tenant" className="w-full h-full object-cover" />
                ) : (
                  selectedLeaseDetails.tenant_name ? selectedLeaseDetails.tenant_name.charAt(0) : selectedLeaseDetails.tenantName?.charAt(0)
                )}
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight text-center">{selectedLeaseDetails.tenant_name || selectedLeaseDetails.tenantName}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1 text-center">Lease ID: {selectedLeaseDetails.lease_id || selectedLeaseDetails.id}</p>
              {selectedLeaseDetails.national_id && <p className="text-xs font-semibold text-slate-400 mt-1 text-center uppercase tracking-wider">ID: {selectedLeaseDetails.national_id}</p>}
            </div>
            
            <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Lease Terms</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Property</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{selectedLeaseDetails.prop_name || selectedLeaseDetails.propName}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedLeaseDetails.unit_assign || selectedLeaseDetails.unit}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedLeaseDetails.lease_start || selectedLeaseDetails.startDate}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedLeaseDetails.lease_end || selectedLeaseDetails.endDate}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100 space-y-4">
              <div className="bg-emerald-50 p-4 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider">Rent Amount</p>
                  <p className="text-2xl font-black text-emerald-700 mt-0.5">${selectedLeaseDetails.rent_amount || selectedLeaseDetails.rentAmount}</p>
                </div>
                <button onClick={() => handleViewDoc(selectedLeaseDetails)} className="bg-white p-3 rounded-xl text-emerald-600 shadow-sm border border-emerald-100/50 hover:bg-emerald-100 hover:scale-105 transition-all">
                  <FileText className="h-6 w-6" />
                </button>
              </div>
              <div className="text-center pt-2">
                <p className="text-xs font-medium text-slate-400">Created At: {selectedLeaseDetails.createdAt}</p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
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
