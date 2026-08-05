import { Users, Home, DollarSign, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { propertyService } from '../services/propertyService';
import { tenantService } from '../services/tenantService';
import { paymentService } from '../services/paymentService';
import { maintenanceService } from '../services/maintenanceService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeTenants: 0,
    pendingRent: 0,
    openTickets: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const statsRes = await fetch('http://localhost:8000/dashboard/dashboard_stats');
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.status === 'success' && statsData.data) {
            setStats({
              totalProperties: statsData.data.total_properties || 0,
              activeTenants: statsData.data.active_tenants || 0,
              pendingRent: statsData.data.pending_rent || 0,
              openTickets: statsData.data.open_tickets || 0
            });
          }
        }

        // Fetch recent activities
        const activitiesRes = await fetch('http://localhost:8000/dashboard/dashboard_activities');
        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json();
          if (activitiesData.status === 'success' && Array.isArray(activitiesData.data)) {
            setRecentActivities(activitiesData.data.map((item, idx) => ({
              id: idx,
              type: item.activity_type ? item.activity_type.toLowerCase() : 'tenant',
              message: item.description,
              time: new Date(item.date).toLocaleDateString()
            })));
          }
        }

        // Fetch chart data
        const revenueRes = await fetch('http://localhost:8000/dashboard/dashboard_revenue');
        if (revenueRes.ok) {
          const revenueData = await revenueRes.json();
          if (revenueData.status === 'success' && Array.isArray(revenueData.data)) {
            setChartData(revenueData.data.map(item => ({
              name: item.month,
              amount: item.revenue
            })));
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      }
    }

    loadDashboardData();
  }, []);

  const cards = [
    { name: 'Total Properties', stat: stats.totalProperties, icon: Home, bgClass: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30' },
    { name: 'Active Tenants', stat: stats.activeTenants, icon: Users, bgClass: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30' },
    { name: 'Pending Rent', stat: `$${stats.pendingRent}`, icon: DollarSign, bgClass: 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/30' },
    { name: 'Open Tickets', stat: stats.openTickets, icon: Wrench, bgClass: 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/30' },
  ];

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your property portfolio</p>
      </div>

      {/* Summary Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {cards.map((card) => (
          <motion.div variants={itemVariants} key={card.name} className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3.5 rounded-xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110 ${card.bgClass}`}>
                    <card.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{card.name}</dt>
                    <dd>
                      <div className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">{card.stat}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 lg:col-span-2 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px'}} 
                />
                <Bar dataKey="amount" fill="url(#colorAmount)" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h2>
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivities.map((activity, activityIdx) => (
                <li key={activity.id} className="group cursor-pointer">
                  <div className="relative pb-8">
                    {activityIdx !== recentActivities.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-100 group-hover:bg-primary-100 transition-colors duration-300" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-4">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white transition-transform duration-300 group-hover:scale-110 ${
                          activity.type === 'payment' ? 'bg-emerald-500' :
                          activity.type === 'maintenance' ? 'bg-rose-500' : 'bg-primary-500'
                        }`}>
                          {activity.type === 'payment' ? <DollarSign className="h-4 w-4 text-white" /> :
                           activity.type === 'maintenance' ? <Wrench className="h-4 w-4 text-white" /> :
                           <Users className="h-4 w-4 text-white" />}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4 bg-white p-3 -mt-3 rounded-xl transition-colors duration-200 group-hover:bg-slate-50 border border-transparent group-hover:border-slate-100">
                        <div>
                          <p className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{activity.message}</p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-400 group-hover:text-primary-500 transition-colors">
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
