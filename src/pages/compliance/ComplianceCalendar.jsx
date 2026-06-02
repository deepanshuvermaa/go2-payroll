import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Bell, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';

const ComplianceCalendar = () => {
  const [events, setEvents] = useState([]);
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allEvents = payrollDataStore.getComplianceCalendar();
    setEvents(allEvents);
    const upcomingEvents = payrollDataStore.getUpcomingCompliance(30);
    setUpcoming(upcomingEvents);
  };

  const predefinedEvents = [
    { name: 'PF Payment', dueDate: '15th', recurring: 'monthly', description: 'Pay PF by 15th of every month' },
    { name: 'ESI Payment', dueDate: '21st', recurring: 'monthly', description: 'Pay ESI by 21st of every month' },
    { name: 'PT Payment', dueDate: '30th', recurring: 'monthly', description: 'Professional Tax payment' },
    { name: 'TDS Payment', dueDate: '7th', recurring: 'monthly', description: 'Pay TDS by 7th of next month' },
    { name: 'Form 24Q', dueDate: 'Quarterly', recurring: 'quarterly', description: 'TDS return filing' },
    { name: 'Bonus Payment', dueDate: '8 months', recurring: 'yearly', description: 'Annual bonus payout' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Compliance Calendar</h1><p className="text-gray-600 mt-1">Track statutory deadlines & compliance events</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Bell className="text-yellow-600" size={20} /> Upcoming (Next 30 Days)</h3>
          {upcoming.length === 0 ? <p className="text-gray-500 text-center py-8">No upcoming compliance events</p> : (
            <div className="space-y-3">
              {upcoming.map(e => (
                <div key={e.id} className="p-3 border rounded hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div><p className="font-medium">{e.name}</p><p className="text-sm text-gray-600">{e.description}</p></div>
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">{new Date(e.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Calendar size={20} /> Recurring Compliance</h3>
          <div className="space-y-2">
            {predefinedEvents.map((e, i) => (
              <div key={i} className="p-3 border rounded">
                <div className="flex justify-between items-start">
                  <div><p className="font-medium">{e.name}</p><p className="text-sm text-gray-600">{e.description}</p></div>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{e.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">All Compliance Events</h3>
        <table className="min-w-full text-sm">
          <thead><tr className="border-b"><th className="text-left py-2 px-2">Event</th><th className="text-left py-2 px-2">Due Date</th><th className="text-left py-2 px-2">Status</th><th className="text-left py-2 px-2">Description</th></tr></thead>
          <tbody>
            {events.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-gray-500">No events</td></tr> : events.map(e => (
              <tr key={e.id} className="border-b hover:bg-gray-50"><td className="py-2 px-2 font-medium">{e.name}</td><td className="py-2 px-2">{new Date(e.dueDate).toLocaleDateString()}</td><td className="py-2 px-2"><span className={`px-2 py-1 rounded text-xs ${e.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{e.status}</span></td><td className="py-2 px-2 text-gray-600">{e.description}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComplianceCalendar;
