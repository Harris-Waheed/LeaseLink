import { useState, useEffect } from 'react';
import { Home, Calendar, CreditCard, Wrench, AlertCircle, User, FileText, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { propertyService } from '../../services/propertyService';
import { tenantService } from '../../services/tenantService';
import { useAuth } from '../../context/AuthContext';

export default function TenantDashboardPage() {
  const { user } = useAuth();
  const [portalData, setPortalData] = useState([]);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Pass the user email directly to the updated portal API
        const res = await tenantService.getPortalData(user?.email);
        const data = res.data?.data || [];
        setPortalData(data);

        // Fetch properties to map the property details using the unit_assign/tenant info
        const tenantsRes = await tenantService.getAll();
        const allTenants = tenantsRes.data?.data || [];
        const currentTenant = allTenants.find(t => t.tnt_email === user?.email);

        if (currentTenant?.prop_name) {
          const propsRes = await propertyService.getAll();
          const properties = propsRes.data || propsRes.data?.data || [];
          const matchedProp = properties.find(p => p.prop_name === currentTenant.prop_name);
          if (matchedProp) {
            setProperty(matchedProp);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load portal data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      loadData();
    }
  }, [user?.email]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading your portal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 flex items-center gap-3">
        <AlertCircle className="h-6 w-6" />
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  // The portal API returns multiple rows if there are multiple maintenance requests.
  // The tenant and lease data is duplicated across these rows.
  const tenantInfo = portalData.length > 0 ? portalData[0] : null;
  const maintenanceRequests = portalData.filter(d => d.request_id);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      {/* Page Background Accent */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-indigo-600/10 via-purple-500/5 to-transparent rounded-3xl -z-10 blur-3xl"></div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/80 backdrop-blur-md border border-slate-100 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-5">
          {tenantInfo?.tenant_image ? (
            <img 
              src={tenantInfo.tenant_image} 
              alt="Profile" 
              className="w-20 h-20 rounded-full object-cover shadow-md ring-4 ring-white" 
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center shadow-inner ring-4 ring-white">
              <User className="h-8 w-8 text-indigo-500" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {tenantInfo?.full_name?.split(' ')[0] || user?.email.split('@')[0]}!
              </h1>
              {tenantInfo?.tenant_status && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  tenantInfo.tenant_status.toLowerCase() === 'inactive' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {tenantInfo.tenant_status.toLowerCase() === 'inactive' ? 'Inactive' : 'Active'}
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center text-sm font-medium text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5" />
              Tenant Portal Overview
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to="/tenant/payments" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5">
            Make Payment
          </Link>
          <Link to="/tenant/maintenance" className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-0.5">
            Report Issue
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Property & Lease Details */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Property Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-shadow">
            {property?.prop_image ? (
              <div className="h-64 w-full relative overflow-hidden">
                <img 
                  src={property.prop_image} 
                  alt="Property" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
                      Unit {tenantInfo?.unit_assign || 'N/A'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${tenantInfo?.lease_status === 'Active' ? 'bg-emerald-500/80 text-white' : 'bg-rose-500/80 text-white'}`}>
                      {tenantInfo?.lease_status || 'Unknown'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Home className="h-6 w-6" />
                    {property?.prop_name || 'Your Property'}
                  </h3>
                  <p className="text-slate-200 mt-1 font-medium">{property?.prop_loc || 'Address not available'}</p>
                </div>
              </div>
            ) : (
              <div className="h-32 bg-indigo-50 flex items-center justify-center">
                <Home className="h-10 w-10 text-indigo-200" />
              </div>
            )}
            
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lease Start</p>
                  <p className="font-bold text-slate-800 mt-1">{tenantInfo?.lease_start || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lease End</p>
                  <p className="font-bold text-slate-800 mt-1">{tenantInfo?.lease_end || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rent Amount</p>
                  <p className="font-bold text-slate-800 mt-1">${tenantInfo?.rent_amount || '0'}/mo</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined Date</p>
                  <p className="font-bold text-slate-800 mt-1">{tenantInfo?.joined_at || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Actions & Maintenance */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Document & Payment Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <CreditCard className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-indigo-200 mb-6 flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Current Balance
              </h3>
              <div>
                <p className="text-4xl font-extrabold">${tenantInfo?.rent_amount || '0'}</p>
                <p className="text-sm text-indigo-200 mt-1">Due by the 1st of next month</p>
              </div>
              
              <div className="mt-8 space-y-3">
                {tenantInfo?.lease_doc_url && (
                  <a 
                    href={`https://docs.google.com/viewer?url=${encodeURIComponent(tenantInfo.lease_doc_url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl transition-colors font-medium text-sm"
                  >
                    <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> View Lease Agreement</span>
                    <span>&rarr;</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Maintenance Requests */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-indigo-500" /> Recent Requests
              </h3>
              <Link to="/tenant/maintenance" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                View All
              </Link>
            </div>

            {maintenanceRequests.length > 0 ? (
              <div className="space-y-4">
                {maintenanceRequests.slice(0, 3).map((req, idx) => (
                  <div key={idx} className="group p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-slate-800 group-hover:text-indigo-900 transition-colors">
                        {req.issue_title}
                      </p>
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                        req.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                        req.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {req.request_date}</span>
                      <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Priority: {req.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">No active maintenance requests.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
