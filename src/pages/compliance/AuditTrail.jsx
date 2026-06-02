import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter } from 'lucide-react';
import payrollDataStore from '../../services/payrollDataStore';

const AuditTrail = () => {
  const [trail, setTrail] = useState([]);
  const [filters, setFilters] = useState({ entity: '', user: '' });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = () => {
    const auditData = payrollDataStore.getAuditTrail(filters);
    setTrail(auditData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1><p className="text-gray-600 mt-1">Complete history of all payroll changes</p></div>
      </div>

      <div className="card">
        <div className="flex gap-4 mb-4">
          <input type="text" placeholder="Filter by entity..." className="input" value={filters.entity} onChange={(e) => setFilters({ ...filters, entity: e.target.value })} />
          <input type="text" placeholder="Filter by user..." className="input" value={filters.user} onChange={(e) => setFilters({ ...filters, user: e.target.value })} />
        </div>

        <table className="min-w-full text-sm">
          <thead><tr className="border-b"><th className="text-left py-2 px-2">Timestamp</th><th className="text-left py-2 px-2">Action</th><th className="text-left py-2 px-2">Entity</th><th className="text-left py-2 px-2">Entity ID</th><th className="text-left py-2 px-2">User</th><th className="text-left py-2 px-2">Changes</th></tr></thead>
          <tbody>
            {trail.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-500">No audit records</td></tr> : trail.slice(0, 100).map(t => (
              <tr key={t.id} className="border-b hover:bg-gray-50"><td className="py-2 px-2">{new Date(t.timestamp).toLocaleString()}</td><td className="py-2 px-2"><span className={`px-2 py-1 rounded text-xs ${t.action === 'create' ? 'bg-green-100 text-green-700' : t.action === 'update' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{t.action}</span></td><td className="py-2 px-2">{t.entity}</td><td className="py-2 px-2 font-mono text-xs">{t.entityId}</td><td className="py-2 px-2">{t.user}</td><td className="py-2 px-2 text-xs text-gray-600">{JSON.stringify(t.changes).substring(0, 50)}...</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTrail;
