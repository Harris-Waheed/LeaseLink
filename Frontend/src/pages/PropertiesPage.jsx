import { useState } from 'react';
import { Plus, Search, MapPin, Building, MoreVertical } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '../components/Modal';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function PropertiesPage() {
  const queryClient = useQueryClient();
  const { data: properties = [], isLoading: loading } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/prop/get_prop');
      if (!response.ok) {
        throw new Error('Failed to load properties');
      }
      const data = await response.json();
      const propsData = Array.isArray(data) ? data : (data.properties || data.data || []);
      
      const propsWithStats = await Promise.all(propsData.map(async (property) => {
        try {
          const propertyId = property.prop_id || property.id;
          const statsRes = await fetch(`http://localhost:8000/prop/prop_stats/${propertyId}`);
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            return { 
              ...property, 
              occupancyRate: statsData.data?.occupancy_rate,
              monthlyRevenue: statsData.data?.monthly_revenue
            };
          }
        } catch (e) {
          console.error(`Failed to fetch stats for property ${property.prop_id || property.id}`, e);
        }
        return property;
      }));
      return propsWithStats;
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Dropdown and Modals State
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [formAction, setFormAction] = useState(null); // Used for Edit Property, Add Tenant, Edit Lease
  const [imageFile, setImageFile] = useState(null);

  const openDetails = async (property) => {
    setSelectedProperty(property);
    setIsDetailsModalOpen(true);
    
    try {
      const propertyId = property.prop_id || property.id;
      const statsRes = await fetch(`http://localhost:8000/prop/prop_stats/${propertyId}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setSelectedProperty(prev => ({
          ...prev,
          occupancyRate: statsData.data?.occupancy_rate,
          monthlyRevenue: statsData.data?.monthly_revenue
        }));
      }
    } catch (error) {
      console.error("Failed to load property stats", error);
    }
  };

  // Data is fetched via React Query

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const formElement = e.target;
    const formData = new FormData(formElement);
    
    if (imageFile && !formData.get('prop_image')?.size) {
      formData.append('prop_image', imageFile);
    }
    
    try {
      const response = await fetch('http://localhost:8000/prop/add_property', {
        method: 'POST',
        body: formData
      });

      let result;
      try {
        result = await response.json();
      } catch (err) {
        toast.error(`Server returned invalid JSON (HTTP ${response.status})`);
        return;
      }

      if (response.ok) {
        toast.success(result.message || 'Property added successfully!');
        setIsAddModalOpen(false);
        setImageFile(null);
        formElement.reset();
        queryClient.invalidateQueries({ queryKey: ['properties'] });
      } else {
        toast.error(result.message || result.detail || 'Failed to add property');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      console.error('Failed to add property', error);
    }
  };

  const getDropdownActions = (property) => [
    { label: 'Edit Property', action: 'edit' },
    { 
      label: property.prop_status === 'Active' ? 'Deactivate Property' : 'Activate Property', 
      action: property.prop_status === 'Active' ? 'deactivate' : 'activate' 
    }
  ];

  // --- Explicit Async Handlers for Integration ---

  const handleOpenEdit = async (property) => {
    // TODO: Add backend API call here to fetch full property details if needed before editing
    setFormAction({ action: 'edit', label: 'Edit Property', property });
  };

  const handleToggleStatus = async (propertyId, newStatus) => {
    try {
      // Assuming PATCH, sending the desired status in the body just in case the backend requires it.
      const response = await fetch(`http://localhost:8000/prop/status/${propertyId}?status=${newStatus}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prop_status: newStatus })
      });
      
      let result;
      try {
        result = await response.json();
      } catch (err) {
        toast.error(`Server returned invalid JSON (HTTP ${response.status})`);
        return;
      }

      if (response.ok) {
        // The prompt states: "show data returned by the api on property card"
        // We ensure prop_status is explicitly updated regardless of whether the backend nested it,
        // named it 'status', or just returned a success message.
        // Invalidate queries to refetch the new status from backend
        queryClient.invalidateQueries({ queryKey: ['properties'] });
        
        toast.success(result.message || `Property status updated successfully!`);
        setConfirmAction(null);
      } else {
        toast.error(result.detail || result.message || 'Failed to update status');
      }
    } catch (e) {
      toast.error('Network error. Please try again.');
      console.error('Failed to toggle status', e);
    }
  };

  const handleDelete = async (propertyId) => {
    try {
      const response = await fetch(`http://localhost:8000/prop/delete_prop/${propertyId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['properties'] });
        toast.success('Property deleted successfully');
        setConfirmAction(null);
      } else {
        toast.error('Failed to delete property');
      }
    } catch (e) {
      toast.error('Network error. Please try again.');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formElement = e.target;
    const formData = new FormData(formElement);

    if (formAction?.action === 'edit') {
      // Pass the property ID explicitly to the backend
      formData.append('prop_id', formAction.property.prop_id);

      // If no new image was selected, the browser sends an empty file. 
      // Remove it so the FastAPI backend receives `None` (via the default=None fallback)
      const imageFile = formData.get('prop_image');
      if (imageFile && imageFile.size === 0) {
        formData.delete('prop_image');
      }

      try {
        const response = await fetch(`http://localhost:8000/prop/edit_prop/${formAction.property.prop_id}`, {
          method: 'PUT',
          body: formData
        });

        let result;
        try {
          result = await response.json();
        } catch(e) {
          toast.error(`Server returned invalid JSON (HTTP ${response.status})`);
          return;
        }

        if (response.ok) {
          toast.success(result.message || 'Property updated successfully!');
          setFormAction(null);
          queryClient.invalidateQueries({ queryKey: ['properties'] });
        } else {
          toast.error(result.message || result.detail || 'Failed to update property');
        }
      } catch (err) {
        toast.error('Network error. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setFormAction(null);
      setIsSubmitting(false);
      toast.success(`${formAction?.label} saved successfully!`);
    }
  };

  const handleActionClick = (actionItem, property) => {
    setOpenDropdownId(null);
    
    // Form Actions (Directly open dedicated forms without confirmation)
    if (actionItem.action === 'edit') {
      handleOpenEdit(property);
      return;
    }
    
    if (['edit_lease'].includes(actionItem.action)) {
      setFormAction({ ...actionItem, property });
      return;
    }
    
    // State/Destructive Actions (Require confirmation)
    let title = '';
    let message = '';
    
    switch(actionItem.action) {
      case 'deactivate': 
        title = 'Confirm Deactivate Property'; 
        message = `Are you sure you want to deactivate ${property.prop_name}?`; 
        break;
      case 'activate': 
        title = 'Confirm Activate Property'; 
        message = `Are you sure you want to activate ${property.prop_name}?`; 
        break;
      case 'delete': 
        title = 'Confirm Delete Property'; 
        message = `Are you sure you want to permanently delete ${property.prop_name}? This action cannot be undone.`; 
        break;
      default:
        title = 'Confirm Action';
        message = 'Are you sure you want to proceed?';
    }
    
    setConfirmAction({
      ...actionItem,
      property,
      title,
      message
    });
  };

  const handleConfirmProceed = async () => {
    const { action, property } = confirmAction;
    setIsConfirming(true);
    
    try {
      if (action === 'delete') {
      await handleDelete(property.prop_id);
    } else if (action === 'deactivate') {
      await handleToggleStatus(property.prop_id, 'Inactive');
    } else if (action === 'activate') {
      await handleToggleStatus(property.prop_id, 'Active');
    }
    } finally {
      setIsConfirming(false);
    }
  };

  const filteredProperties = properties.filter(p => 
    p.prop_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.prop_loc?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleProperties = filteredProperties.slice(0, visibleCount);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Invisible overlay to close dropdown when clicking outside */}
      {openDropdownId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)}></div>
      )}

      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Properties</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your real estate portfolio</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-4">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add Property
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredProperties.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50/50 rounded-xl border border-gray-200">
              <div className="flex flex-col items-center justify-center">
                <Building className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-900">No properties found</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search or add a new property.</p>
              </div>
            </div>
          ) : visibleProperties.map((property) => (
            <motion.div variants={itemVariants} key={property.prop_id} className="bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-xl border border-white/60 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative group z-10 hover:z-20 flex flex-col">
              <div className="h-56 w-full relative overflow-hidden rounded-t-[2rem] shadow-inner flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent z-10 opacity-70 group-hover:opacity-90 transition-opacity duration-500"></div>
                <img src={property.prop_image} alt={property.prop_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-4 right-4 z-20">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md transition-colors ${
                    property.prop_status === 'Active' ? 'bg-emerald-400/90 text-white ring-1 ring-inset ring-white/20' : 'bg-rose-400/90 text-white ring-1 ring-inset ring-white/20'
                  }`}>
                    {property.prop_status}
                  </span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{property.prop_name}</h3>
                    <p className="text-xs font-semibold text-gray-400 mt-1 mb-2 tracking-wider">ID: {property.prop_id}</p>
                    <div className="mt-1 flex items-center text-sm text-gray-500 font-medium">
                      <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-primary-400" />
                      {property.prop_loc}
                    </div>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setOpenDropdownId(openDropdownId === property.prop_id ? null : property.prop_id)}
                      className="text-gray-400 hover:text-gray-900 relative z-20 p-2 rounded-full hover:bg-gray-100/80 transition-all"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    
                    {openDropdownId === property.prop_id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 z-50 p-1.5 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                        {getDropdownActions(property).map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(item, property)}
                            className={`block w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                              item.destructive 
                                ? 'text-red-600 hover:bg-red-50 hover:text-red-700' 
                                : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-auto pt-6 flex items-center justify-between">
                  <div className="flex items-center text-sm font-semibold text-gray-600 bg-gray-100/50 px-3 py-1.5 rounded-lg">
                    <Building className="flex-shrink-0 mr-2 h-4 w-4 text-primary-500" />
                    {property.prop_unit} Units
                  </div>
                  <button 
                    onClick={() => openDetails(property)}
                    className="text-sm font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!loading && visibleCount < filteredProperties.length && (
        <div className="flex justify-center mt-6 z-10 relative">
          <button 
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-xl font-semibold shadow-sm transition-all duration-200 hover:shadow-md"
          >
            View More
          </button>
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Property">
        <form onSubmit={handleAddSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Property Name</label>
            <input type="text" name="prop_name" maxLength={100} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address (Location)</label>
            <input type="text" name="prop_loc" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Number of Units</label>
              <input type="number" name="prop_unit" min="1" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Year Built</label>
              <input type="number" name="prop_built" min="1800" max={new Date().getFullYear()} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Property Status</label>
            <select name="prop_status" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Property Image</label>
            <label 
              className={`mt-1 flex justify-center px-6 pt-4 pb-4 border-2 border-dashed rounded-md transition-colors cursor-pointer relative block ${imageFile ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-500'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const file = e.dataTransfer.files[0];
                  if (file.type.startsWith('image/')) setImageFile(file);
                }
              }}
            >
              <div className="space-y-1 text-center pointer-events-none">
                <svg className="mx-auto h-10 w-10 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600 justify-center">
                  <span className="relative rounded-md font-medium text-primary-600">
                    Upload a file
                  </span>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  {imageFile ? imageFile.name : 'PNG, JPG, GIF up to 10MB'}
                </p>
              </div>
              <input 
                type="file" 
                name="prop_image"
                className="sr-only" 
                accept=".png,.jpg,.jpeg,.gif,image/*"
                required
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setImageFile(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Cancel
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Save Property
            </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Property Details" scrollable={false}>
        {selectedProperty && (
          <div className="space-y-6">
            <div className="relative h-56 rounded-3xl overflow-hidden shadow-inner group">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent z-10"></div>
              <img src={selectedProperty.prop_image} alt={selectedProperty.prop_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute bottom-5 left-5 z-20">
                <h3 className="text-3xl font-black text-white tracking-tight drop-shadow-md">{selectedProperty.prop_name}</h3>
                <p className="text-sm font-medium text-slate-200 mt-2 flex items-center drop-shadow-md"><MapPin className="h-4 w-4 mr-1.5 text-primary-300"/> {selectedProperty.prop_loc}</p>
              </div>
              <div className="absolute top-4 right-4 z-20">
                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md ${selectedProperty.prop_status === 'Active' ? 'bg-emerald-400/90 text-white ring-1 ring-inset ring-white/20' : 'bg-rose-400/90 text-white ring-1 ring-inset ring-white/20'}`}>
                  {selectedProperty.prop_status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center transition-all duration-300 hover:bg-white hover:shadow-md hover:-translate-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Units</p>
                <p className="text-3xl font-black text-slate-800">{selectedProperty.prop_unit}</p>
              </div>
              <div className="bg-slate-50/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center transition-all duration-300 hover:bg-white hover:shadow-md hover:-translate-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Occupancy Rate</p>
                <p className="text-3xl font-black text-primary-600">{selectedProperty.occupancyRate != null ? selectedProperty.occupancyRate : 0}%</p>
              </div>
              <div className="bg-slate-50/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center transition-all duration-300 hover:bg-white hover:shadow-md hover:-translate-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Year Built</p>
                <p className="text-3xl font-black text-slate-800">{selectedProperty.prop_built ?? 2018}</p>
              </div>
              <div className="bg-slate-50/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center transition-all duration-300 hover:bg-white hover:shadow-md hover:-translate-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Monthly Rev.</p>
                <p className="text-3xl font-black text-emerald-500 tracking-tight">${selectedProperty.monthlyRevenue != null ? selectedProperty.monthlyRevenue.toLocaleString() : 0}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Dedicated Form Modals (Edit, Add Tenant, Edit Lease) */}
      <Modal isOpen={!!formAction} onClose={() => setFormAction(null)} title={formAction?.label}>
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <p className="text-gray-500 text-sm">
            Please fill out the details to {formAction?.label.toLowerCase()} for <span className="font-semibold text-gray-900">{formAction?.property?.prop_name}</span>.
          </p>

          {formAction?.action === 'edit' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Property Name</label>
                <input type="text" name="prop_name" maxLength={100} defaultValue={formAction?.property?.prop_name} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address (Location)</label>
                <input type="text" name="prop_loc" defaultValue={formAction?.property?.prop_loc} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Number of Units</label>
                  <input type="number" name="prop_unit" min="1" defaultValue={formAction?.property?.prop_unit} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year Built</label>
                  <input type="number" name="prop_built" min="1800" max={new Date().getFullYear()} defaultValue={formAction?.property?.prop_built} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Property Status</label>
                <select name="prop_status" defaultValue={formAction?.property?.prop_status || "Active"} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Update Image (Optional)</label>
                <input 
                  type="file" 
                  name="prop_image"
                  accept=".png,.jpg,.jpeg,.gif,image/*"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
            </>
          )}

          {formAction?.action === 'edit_lease' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Tenant / Unit</label>
                <select name="tenantId" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                  <option value="">Select a tenant...</option>
                  <option value="1">John Doe - Unit 101</option>
                  <option value="2">Jane Smith - Unit 204</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monthly Rent ($)</label>
                  <input type="number" name="rent" min="0" step="0.01" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Security Deposit ($)</label>
                  <input type="number" name="deposit" min="0" step="0.01" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lease Start</label>
                  <input type="date" name="leaseStart" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lease End</label>
                  <input type="date" name="leaseEnd" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Lease Status</label>
                <select name="status" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                  <option value="Active">Active</option>
                  <option value="Month-to-Month">Month-to-Month</option>
                  <option value="Pending Renewal">Pending Renewal</option>
                </select>
              </div>
            </>
          )}

          <div className="pt-3 flex justify-end gap-3">
            <button type="button" onClick={() => setFormAction(null)} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-md text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:hover:translate-y-0">
              {isSubmitting ? 'Please wait...' : (formAction?.action === 'edit' ? 'Update Property' : 'Save Property')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Universal Confirmation Modal (For State/Destructive Actions) */}
      <Modal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} title={confirmAction?.title}>
        <div className="space-y-4">
          <p className="text-gray-600">{confirmAction?.message}</p>
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
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none disabled:opacity-50 ${
                confirmAction?.destructive 
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500' 
                  : 'bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              }`}
            >
              {isConfirming ? 'Please wait...' : (confirmAction?.destructive ? 'Proceed' : 'Confirm')}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
