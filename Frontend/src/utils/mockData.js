export const mockProperties = [
  {
    id: 'p1',
    name: 'Sunset Apartments',
    address: '123 Sunset Blvd, CA 90210',
    units: 24,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'p2',
    name: 'Oceanview Residences',
    address: '456 Ocean Ave, FL 33139',
    units: 12,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
];

export const mockTenants = [
  { tnt_id: 1, tnt_name: 'Alice Smith', tnt_email: 'alice@example.com', tnt_number: '555-0101', tnt_national_id: 'ID12345', tenant_image: null, status: 'Active', joined_at: '2025-01-01', propertyId: 'p1', unit: '101' },
  { tnt_id: 2, tnt_name: 'Bob Johnson', tnt_email: 'bob@example.com', tnt_number: '555-0102', tnt_national_id: 'ID67890', tenant_image: null, status: 'Active', joined_at: '2025-01-15', propertyId: 'p1', unit: '102' },
];

export const mockLeases = [
  { id: 'l1', tenantId: 't1', propertyId: 'p1', unit: '101', startDate: '2025-01-01', endDate: '2025-12-31', rentAmount: 1500, status: 'Active' },
];

export const mockPayments = [
  { id: 'pay1', tenantId: 't1', amount: 1500, date: '2025-07-01', status: 'Paid', reference: 'TXN-001' },
  { id: 'pay2', tenantId: 't2', amount: 1200, date: '2025-07-01', status: 'Due', reference: '-' },
];

export const mockMaintenance = [
  { id: 'm1', propertyId: 'p1', unit: '101', title: 'Leaky Faucet', status: 'Pending', priority: 'Low', date: '2025-07-20' },
  { id: 'm2', propertyId: 'p2', unit: '205', title: 'AC Not Working', status: 'In Progress', priority: 'High', date: '2025-07-22' },
];
