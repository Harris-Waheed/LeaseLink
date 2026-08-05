import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export default function TenantCombobox({ tenants, name, defaultValue, onChange, required, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(defaultValue || '');
  const containerRef = useRef(null);

  useEffect(() => {
    setSelectedId(defaultValue || '');
  }, [defaultValue]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTenants = tenants.filter(t => {
    const term = search.toLowerCase();
    const nameMatch = (t.name || t.tnt_name || '').toLowerCase().includes(term);
    const idMatch = (t.national_id || t.tnt_national_id || '').toLowerCase().includes(term);
    return nameMatch || idMatch;
  });

  const selectedTenant = tenants.find(t => (t.id || t.tnt_id) == selectedId);

  return (
    <div className="relative" ref={containerRef}>
      <input type="hidden" name={name} value={selectedId} required={required} />
      
      <div 
        className={`mt-1 flex items-center justify-between w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500 sm:text-sm rounded-md cursor-pointer ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedTenant ? "text-gray-900" : "text-gray-500"}>
          {selectedTenant ? (selectedTenant.name || selectedTenant.tnt_name) : "Select tenant..."}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 absolute right-3" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <div className="px-2 pb-2 sticky top-0 bg-white z-10 pt-1">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Search name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          
          {filteredTenants.length === 0 ? (
            <div className="px-4 py-2 text-gray-500 text-sm">No tenants found.</div>
          ) : (
            filteredTenants.map((t) => (
              <div
                key={t.id || t.tnt_id}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary-50 ${selectedId == (t.id || t.tnt_id) ? 'bg-primary-50 text-primary-900' : 'text-gray-900'}`}
                onClick={() => {
                  const newId = t.id || t.tnt_id;
                  setSelectedId(newId);
                  setIsOpen(false);
                  setSearch('');
                  if (onChange) {
                    onChange({ target: { name, value: newId } });
                  }
                }}
              >
                <div className="font-medium">{t.name || t.tnt_name}</div>
                <div className="text-xs text-gray-500 font-mono tracking-tight mt-0.5">{t.national_id || t.tnt_national_id || 'No ID provided'}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
