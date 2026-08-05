import { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical, Phone, Mail, Building, Calendar, Users } from 'lucide-react';
import { tenantService } from '../services/tenantService';
import { leaseService } from '../services/leaseService';
import { propertyService } from '../services/propertyService';
import { useQueryClient } from '@tanstack/react-query';
import { useGetTenants } from '../hooks/useGetTenants';
import { useGetProperties } from '../hooks/useGetProperties';
import Modal from '../components/Modal';
import { toast } from 'react-hot-toast';
import Drawer from '../components/Drawer';
import { motion } from 'framer-motion';

export default function TenantsPage() {
  const queryClient = useQueryClient();

  const { data: tenants = [], isLoading: isLoadingTenants } = useGetTenants();
  const { data: properties = [], isLoading: isLoadingProperties } = useGetProperties();

  const loading = isLoadingTenants || isLoadingProperties;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [tenantToAssign, setTenantToAssign] = useState(null);
  const [selectedTenantDetails, setSelectedTenantDetails] = useState(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isEditTenantModalOpen, setIsEditTenantModalOpen] = useState(false);
  const [tenantToEdit, setTenantToEdit] = useState(null);
  const [tenantImageFile, setTenantImageFile] = useState(null);
  const [tenantLeaseFile, setTenantLeaseFile] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  const [isPropDropdownOpen, setIsPropDropdownOpen] = useState(false);
  const [propSearchTerm, setPropSearchTerm] = useState('');
  const [selectedPropId, setSelectedPropId] = useState('');

  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false);
  const [tenantSearchTerm, setTenantSearchTerm] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const openTenantDetails = (tenant) => {
    setSelectedTenantDetails(tenant);
    setIsDetailsDrawerOpen(true);
  };
  
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Data is fetched via React Query

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    const formElement = new FormData(e.target);
    try {
      const payload = new FormData();
      payload.append('propertyId', parseInt(formElement.get('propertyId'), 10));
      payload.append('unit', formElement.get('unit'));

      await tenantService.update(tenantToAssign.id, payload);
      setIsAssignModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    } catch (error) {
      console.error('Failed to assign unit', error);
    }
  };

  const handleAddTenantSubmit = async (e) => {
    e.preventDefault();
    if (!tenantImageFile) {
      toast.error('Tenant photo is required.');
      return;
    }
    if (!tenantLeaseFile) {
      toast.error('Lease document is required.');
      return;
    }
    
    const formData = new FormData(e.target);
    const rawPropId = formData.get('prop_id');
    if (!rawPropId) {
      toast.error('Please select a property.');
      return;
    }
    
    const propId = parseInt(rawPropId, 10);

    const leaseStart = formData.get('lease_start');
    const leaseEnd = formData.get('lease_end');
    if (leaseStart && leaseEnd && new Date(leaseEnd) <= new Date(leaseStart)) {
      toast.error('Lease end date must be after the lease start date.');
      return;
    }
    
    setIsSubmitting(true);
    
    // 1. Create Tenant Payload
    const tenantPayload = new FormData();
    tenantPayload.append('tnt_name', formData.get('tnt_name'));
    tenantPayload.append('tnt_email', formData.get('tnt_email'));
    tenantPayload.append('tnt_number', formData.get('tnt_number'));
    tenantPayload.append('tnt_national_id', formData.get('tnt_national_id'));
    if (tenantImageFile) {
      tenantPayload.append('tenant_image', tenantImageFile);
    }
    
    try {
      const tenantLogObject = Object.fromEntries(tenantPayload.entries());
      console.log("Attempting to submit tenant payload:", tenantLogObject);
      
      // POST to add tenant
      const tenantRes = await tenantService.addTenant(tenantPayload);
      const newTenantId = tenantRes.data?.data?.tenant_id || tenantRes.data?.tenant_id || tenantRes.data?.data?.tnt_id || tenantRes.data?.tnt_id;
      
      if (!newTenantId) {
        throw new Error("Failed to retrieve tenant ID from add tenant response");
      }

      const tenantIdInt = parseInt(newTenantId, 10);
      const rentAmountFloat = parseFloat(formData.get('rent_amount'));

      // 2. Create Lease Payload
      const leasePayload = new FormData();
      leasePayload.append('tenant_id', tenantIdInt);
      leasePayload.append('prop_id', propId);
      leasePayload.append('unit_assign', formData.get('unit_assign'));
      leasePayload.append('rent_amount', rentAmountFloat);
      leasePayload.append('lease_start', leaseStart);
      leasePayload.append('lease_end', leaseEnd);
      if (tenantLeaseFile) {
        leasePayload.append('lease_doc', tenantLeaseFile);
      }

      const leaseLogObject = Object.fromEntries(leasePayload.entries());
      console.log("Attempting to submit lease payload:", leaseLogObject);

      // POST to add lease
      await leaseService.addLease(leasePayload);
      
      toast.success('Tenant and lease created successfully!');
      setIsAddTenantModalOpen(false);
      setTenantLeaseFile(null);
      setTenantImageFile(null);
      setSelectedPropId('');
      setPropSearchTerm('');
      e.target.reset();
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    } catch (error) {
      console.error('Failed to submit form', error);
      
      if (error.response?.data) {
        console.error("Validation Errors from Backend:", error.response.data);
      }

      if (!error.isAxiosError) {
        toast.error('Failed to process submission. Please check your details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTenantSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    
    const payload = new FormData();
    payload.append('tnt_name', formData.get('tnt_name'));
    payload.append('tnt_email', formData.get('tnt_email'));
    payload.append('tnt_number', formData.get('tnt_number'));
    payload.append('tnt_national_id', formData.get('tnt_national_id'));
    
    if (tenantImageFile) {
      payload.append('tenant_image', tenantImageFile);
    }

    try {
      // Call backend API to update tenant
      await tenantService.update(tenantToEdit.tnt_id || tenantToEdit.id, payload);
      toast.success('Tenant updated successfully!');
      setIsEditTenantModalOpen(false);
      setTenantImageFile(null);
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    } catch (error) {
      console.error('Failed to update tenant', error);
      toast.error('Failed to update tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmProceed = async () => {
    const { action, tenant } = confirmAction;
    setIsConfirming(true);
    try {
      if (action === 'delete') {
        const tenantEmail = tenant.tnt_email || tenant.email;
        await tenantService.delete(tenantEmail);
        toast.success('Tenant deleted successfully');
      } else {
        await tenantService.updateStatus(tenant.tnt_id || tenant.id);
        toast.success('Status updated successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    } catch (error) {
      console.error('Failed to proceed with action', error);
      toast.error('Failed to perform action');
    } finally {
      setIsConfirming(false);
      setConfirmAction(null);
    }
  };

  const filteredTenants = tenants.filter(t => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const tntName = (t.tnt_name || t.name || '').toLowerCase();
    const tntEmail = (t.tnt_email || t.email || '').toLowerCase();
    const property = properties.find(p => p.id === t.propertyId);
    const propName = (t.prop_name || (property ? property.name : '')).toLowerCase();
    const unitName = (t.unit_assign || t.unit || '').toString().toLowerCase();
    const status = (t.status || 'Active').toLowerCase();
    
    return tntName.includes(term) || tntEmail.includes(term) || propName.includes(term) || unitName.includes(term) || status.includes(term);
  });

  const visibleTenants = filteredTenants.slice(0, visibleCount);

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
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Invisible overlay to close dropdown when clicking outside */}
      {openDropdownId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)}></div>
      )}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tenants</h1>
          <p className="mt-1 text-sm text-gray-500">Manage tenant profiles and assignments</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-4">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="Search tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => setIsAddTenantModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add Tenant
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-visible">
        <div className="overflow-visible">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property & Unit</th>
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
                    Loading tenants...
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-10 w-10 text-gray-300 mb-3" />
                      <p className="text-sm font-medium text-gray-900">No tenants found</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search or add a new tenant.</p>
                    </div>
                  </td>
                </tr>
              ) : visibleTenants.map((tenant) => {
                const property = properties.find(p => p.id === tenant.propertyId);
                const tntId = tenant.tnt_id || tenant.id;
                const tntName = tenant.tnt_name || tenant.name;
                const tntEmail = tenant.tnt_email || tenant.email;
                const tntNumber = tenant.tnt_number || tenant.phone;
                const tntImage = tenant.tenant_image || tenant.image;
                const propName = tenant.prop_name || (property ? property.name : null);
                const unitName = tenant.unit_assign || tenant.unit;
                
                return (
                  <motion.tr variants={rowVariants} key={tntId} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold shadow-sm transition-transform group-hover:scale-110 overflow-hidden">
                            {tntImage ? (
                              <img src={tntImage} alt={tntName} className="w-full h-full object-cover" />
                            ) : (
                              tntName.charAt(0)
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 cursor-pointer hover:text-primary-600 transition-colors" onClick={() => openTenantDetails(tenant)}>
                            {tntName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center"><Mail className="h-3 w-3 mr-1 text-gray-400 group-hover:text-primary-500 transition-colors" /> {tntEmail}</div>
                      <div className="text-sm text-gray-500 flex items-center mt-1"><Phone className="h-3 w-3 mr-1 text-gray-400 group-hover:text-primary-500 transition-colors" /> {tntNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {propName ? (
                        <>
                          <div className="text-sm text-gray-900">{propName}</div>
                          <div className="text-sm text-gray-500">Unit {unitName}</div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm backdrop-blur-md ${
                        tenant.status === 'Active' ? 'bg-emerald-100/90 text-emerald-800 ring-1 ring-inset ring-emerald-600/20' : 'bg-red-100/90 text-red-800 ring-1 ring-inset ring-red-600/20'
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block text-left">
                        <button 
                          onClick={() => setOpenDropdownId(openDropdownId === tntId ? null : tntId)}
                          className="text-gray-400 hover:text-gray-600 relative z-20 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {openDropdownId === tntId && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1 origin-top-right animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                            <button
                              onClick={() => { setOpenDropdownId(null); setTenantToEdit(tenant); setIsEditTenantModalOpen(true); }}
                              className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => { setOpenDropdownId(null); setConfirmAction({ action: 'status', tenant }); }}
                              className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-50 transition-colors"
                            >
                              {tenant.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => { setOpenDropdownId(null); setConfirmAction({ action: 'delete', tenant }); }}
                              className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
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

      {!loading && visibleCount < filteredTenants.length && (
        <div className="flex justify-center mt-6 z-10 relative">
          <button 
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-xl font-semibold shadow-sm transition-all duration-200 hover:shadow-md"
          >
            View More
          </button>
        </div>
      )}

      <Drawer isOpen={isDetailsDrawerOpen} onClose={() => setIsDetailsDrawerOpen(false)} title="Tenant Details">
        {selectedTenantDetails && (
          <div className="space-y-6">
            <div className="flex flex-col items-center p-6 bg-gradient-to-b from-primary-50/50 to-white rounded-3xl border border-primary-100/50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${selectedTenantDetails.status === 'Active' || !selectedTenantDetails.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedTenantDetails.status || 'Active'}
                </span>
              </div>
              <div className="h-24 w-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-primary-500/30 mb-4 ring-4 ring-white overflow-hidden">
                {(selectedTenantDetails.tenant_image || selectedTenantDetails.image) ? (
                  <img src={selectedTenantDetails.tenant_image || selectedTenantDetails.image} alt={selectedTenantDetails.tnt_name || selectedTenantDetails.name} className="w-full h-full object-cover" />
                ) : (
                  (selectedTenantDetails.tnt_name || selectedTenantDetails.name || 'T').charAt(0)
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedTenantDetails.tnt_name || selectedTenantDetails.name}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Tenant ID: {selectedTenantDetails.tnt_id || selectedTenantDetails.id || 'N/A'}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
                <div className="flex items-center text-slate-600 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                  <Mail className="h-4 w-4 mr-2 text-primary-400" />
                  {selectedTenantDetails.tnt_email || selectedTenantDetails.email}
                </div>
                {selectedTenantDetails.joined_at && (
                  <div className="flex items-center text-slate-600 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                    <Calendar className="h-4 w-4 mr-2 text-primary-400" />
                    Joined {selectedTenantDetails.joined_at}
                  </div>
                )}
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
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedTenantDetails.unit_assign || selectedTenantDetails.unit || 'Unassigned'}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lease Term</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{selectedTenantDetails.lease_start || 'N/A'} - <br/>{selectedTenantDetails.lease_end || 'N/A'}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider">Rent Amount</p>
                  <p className="text-lg font-black text-emerald-700 mt-0.5">${selectedTenantDetails.rent_amount || selectedTenantDetails.rentAmount || '0.00'}</p>
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

      <Modal isOpen={isAddTenantModalOpen} onClose={() => { setIsAddTenantModalOpen(false); setSelectedPropId(''); setPropSearchTerm(''); setSelectedTenantId(''); setTenantSearchTerm(''); }} title="Assign Tenant to Unit">
        <form onSubmit={handleAddTenantSubmit} className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Tenant Details</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" name="tnt_name" required maxLength={50} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input type="email" name="tnt_email" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input type="tel" name="tnt_number" required maxLength={20} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">National ID</label>
            <input type="text" name="tnt_national_id" required maxLength={50} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-700">Tenant Photo</span>
            <label 
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors cursor-pointer relative block ${tenantImageFile ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-500'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  setTenantImageFile(e.dataTransfer.files[0]);
                }
              }}
            >
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="flex text-sm text-gray-600 justify-center">
                  <span className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                    <span>Upload photo</span>
                    <input 
                      type="file" 
                      name="tenant_image"
                      className="sr-only" 
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setTenantImageFile(e.target.files[0]);
                        }
                      }}
                    />
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {tenantImageFile ? tenantImageFile.name : 'PNG, JPG'}
                </p>
              </div>
            </label>
          </div>

          <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mt-6 mb-4">Lease Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Property</label>
              <input type="hidden" name="prop_id" value={selectedPropId} />
              <div 
                className="mt-1 relative"
                onClick={() => setIsPropDropdownOpen(!isPropDropdownOpen)}
              >
                <button 
                  type="button"
                  className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <span className="block truncate text-gray-900">
                    {isLoadingProperties ? <span className="text-gray-400">Loading properties...</span> :
                     selectedPropId 
                      ? (properties.find(p => (p.id || p.prop_id)?.toString() === selectedPropId.toString())?.name || properties.find(p => (p.id || p.prop_id)?.toString() === selectedPropId.toString())?.prop_name || 'Selected Property') 
                      : <span className="text-gray-400">Select a property...</span>}
                  </span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                </button>

                {isPropDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setIsPropDropdownOpen(false); }}></div>
                    <div className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      <div className="sticky top-0 bg-white px-2 py-1.5 border-b border-gray-100">
                        <input
                          type="text"
                          className="block w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Search properties..."
                          value={propSearchTerm}
                          onChange={(e) => setPropSearchTerm(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <ul className="max-h-48 overflow-y-auto">
                        {properties
                          .filter(p => (p.name || p.prop_name || '').toLowerCase().includes(propSearchTerm.toLowerCase()))
                          .map((p) => {
                            const id = p.id || p.prop_id;
                            const name = p.name || p.prop_name;
                            return (
                              <li 
                                key={id}
                                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary-50 ${selectedPropId === id?.toString() ? 'bg-primary-100 text-primary-900 font-medium' : 'text-gray-900'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPropId(id?.toString());
                                  setIsPropDropdownOpen(false);
                                  setPropSearchTerm('');
                                }}
                              >
                                <span className="block truncate">{name}</span>
                              </li>
                            );
                          })}
                        {properties.filter(p => (p.name || p.prop_name || '').toLowerCase().includes(propSearchTerm.toLowerCase())).length === 0 && (
                          <li className="text-gray-500 py-2 px-3 text-sm italic">No properties found.</li>
                        )}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Assignment</label>
              <input type="text" name="unit_assign" required maxLength={50} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rent Amount ($)</label>
            <input type="number" name="rent_amount" min="0" step="0.01" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Lease Start</label>
              <input type="date" name="lease_start" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lease End</label>
              <input type="date" name="lease_end" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-700">Lease Document</span>
            <label 
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors cursor-pointer relative block ${tenantLeaseFile ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-500'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  setTenantLeaseFile(e.dataTransfer.files[0]);
                }
              }}
            >
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex text-sm text-gray-600 justify-center">
                  <span className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                    <span>Upload File</span>
                    <input 
                      type="file" 
                      name="lease_doc"
                      className="sr-only" 
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setTenantLeaseFile(e.target.files[0]);
                        }
                      }}
                    />
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {tenantLeaseFile ? tenantLeaseFile.name : 'PDF Only'}
                </p>
              </div>
            </label>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsAddTenantModalOpen(false)} disabled={isSubmitting} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || isLoadingProperties} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
              {isSubmitting ? 'Please wait...' : 'Save Tenant'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditTenantModalOpen} onClose={() => setIsEditTenantModalOpen(false)} title="Edit Tenant">
        <form onSubmit={handleEditTenantSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" name="tnt_name" defaultValue={tenantToEdit?.tnt_name || tenantToEdit?.name} required maxLength={50} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input type="email" name="tnt_email" defaultValue={tenantToEdit?.tnt_email || tenantToEdit?.email} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input type="tel" name="tnt_number" defaultValue={tenantToEdit?.tnt_number || tenantToEdit?.phone} required maxLength={20} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">National ID</label>
              <input type="text" name="tnt_national_id" defaultValue={tenantToEdit?.tnt_national_id || tenantToEdit?.nationalId} required maxLength={50} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700">Update Photo (Optional)</span>
              <label 
                className={`mt-1 flex justify-center px-4 py-2 border-2 border-dashed rounded-md transition-colors cursor-pointer relative block ${tenantImageFile ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-500'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    setTenantImageFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                <div className="space-y-1 text-center">
                  <div className="flex text-sm text-gray-600 justify-center">
                    <span className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                      <span>Upload photo</span>
                      <input 
                        type="file" 
                        name="tenant_image"
                        className="sr-only" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setTenantImageFile(e.target.files[0]);
                          }
                        }}
                      />
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {tenantImageFile ? tenantImageFile.name : 'PNG, JPG'}
                  </p>
                </div>
              </label>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsEditTenantModalOpen(false)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
              {isSubmitting ? 'Please wait...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Universal Confirmation Modal */}
      <Modal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} title={confirmAction?.action === 'delete' ? 'Confirm Delete Tenant' : 'Confirm Action'}>
        <div className="space-y-4">
          <p className="text-gray-600">
            {confirmAction?.action === 'delete' ? `Are you sure you want to permanently delete ${confirmAction.tenant.tnt_name || confirmAction.tenant.name}? This action cannot be undone.` : 'Are you sure you want to proceed?'}
          </p>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button 
              onClick={() => setConfirmAction(null)} 
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmProceed}
              disabled={isConfirming}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                confirmAction?.action === 'delete' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
              }`}
            >
              {isConfirming ? 'Please wait...' : 'Proceed'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
