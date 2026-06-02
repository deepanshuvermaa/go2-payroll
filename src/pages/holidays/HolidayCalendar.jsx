import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';
import { formatDate } from '../../utils/dateHelpers';

const HOLIDAY_TYPES = [
  'National Holiday',
  'Regional Holiday',
  'Festival',
  'Company Holiday',
  'Restricted Holiday',
  'Optional Holiday'
];

const HolidayCalendar = () => {
  const [holidays, setHolidays] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: '',
    description: '',
    isOptional: false
  });

  useEffect(() => {
    loadHolidays();
  }, [selectedYear]);

  const loadHolidays = () => {
    const allHolidays = payrollDataStore.getHolidays();
    const filtered = allHolidays.filter(h => {
      const holidayYear = new Date(h.date).getFullYear();
      return holidayYear === selectedYear;
    });
    setHolidays(filtered.sort((a, b) => new Date(a.date) - new Date(b.date)));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      date: '',
      type: '',
      description: '',
      isOptional: false
    });
    setEditingHoliday(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.date || !formData.type) {
      toast.error('Please fill all required fields');
      return;
    }

    const holidayData = {
      name: formData.name,
      date: formData.date,
      type: formData.type,
      description: formData.description,
      isOptional: formData.isOptional,
      year: new Date(formData.date).getFullYear(),
      month: new Date(formData.date).getMonth() + 1,
      day: new Date(formData.date).getDate()
    };

    if (editingHoliday) {
      holidayData.id = editingHoliday.id;
      payrollDataStore.updateHoliday(holidayData);
      toast.success('Holiday updated successfully');
    } else {
      payrollDataStore.addHoliday(holidayData);
      toast.success('Holiday added successfully');
    }

    setShowAddModal(false);
    resetForm();
    loadHolidays();
  };

  const handleEdit = (holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date,
      type: holiday.type,
      description: holiday.description || '',
      isOptional: holiday.isOptional || false
    });
    setShowAddModal(true);
  };

  const handleDelete = (holidayId) => {
    if (confirm('Are you sure you want to delete this holiday?')) {
      payrollDataStore.deleteHoliday(holidayId);
      toast.success('Holiday deleted');
      loadHolidays();
    }
  };

  const preloadIndianHolidays = () => {
    const year = selectedYear;
    const indianHolidays = [
      { name: 'New Year\'s Day', date: `${year}-01-01`, type: 'National Holiday', description: 'New Year celebration' },
      { name: 'Republic Day', date: `${year}-01-26`, type: 'National Holiday', description: 'Republic Day of India' },
      { name: 'Maha Shivaratri', date: `${year}-03-08`, type: 'Festival', description: 'Hindu festival' },
      { name: 'Holi', date: `${year}-03-14`, type: 'Festival', description: 'Festival of Colors' },
      { name: 'Good Friday', date: `${year}-03-29`, type: 'Festival', description: 'Christian observance' },
      { name: 'Id-ul-Fitr (Eid)', date: `${year}-04-11`, type: 'Festival', description: 'End of Ramadan' },
      { name: 'Dr. Ambedkar Jayanti', date: `${year}-04-14`, type: 'National Holiday', description: 'Birth anniversary of Dr. B.R. Ambedkar' },
      { name: 'Ram Navami', date: `${year}-04-17`, type: 'Festival', description: 'Birth of Lord Rama' },
      { name: 'Mahavir Jayanti', date: `${year}-04-21`, type: 'Festival', description: 'Birth of Lord Mahavira' },
      { name: 'May Day / Labour Day', date: `${year}-05-01`, type: 'National Holiday', description: 'International Workers Day' },
      { name: 'Buddha Purnima', date: `${year}-05-12`, type: 'Festival', description: 'Birth of Gautam Buddha' },
      { name: 'Eid-ul-Adha (Bakrid)', date: `${year}-06-17`, type: 'Festival', description: 'Festival of Sacrifice' },
      { name: 'Muharram', date: `${year}-07-17`, type: 'Festival', description: 'Islamic New Year' },
      { name: 'Independence Day', date: `${year}-08-15`, type: 'National Holiday', description: 'Independence Day of India' },
      { name: 'Raksha Bandhan', date: `${year}-08-19`, type: 'Festival', description: 'Brother-sister bond festival' },
      { name: 'Janmashtami', date: `${year}-08-26`, type: 'Festival', description: 'Birth of Lord Krishna' },
      { name: 'Milad-un-Nabi', date: `${year}-09-16`, type: 'Festival', description: 'Prophet Muhammad birthday' },
      { name: 'Mahatma Gandhi Jayanti', date: `${year}-10-02`, type: 'National Holiday', description: 'Birth anniversary of Mahatma Gandhi' },
      { name: 'Dussehra (Vijayadashami)', date: `${year}-10-12`, type: 'Festival', description: 'Victory of good over evil' },
      { name: 'Diwali', date: `${year}-11-01`, type: 'Festival', description: 'Festival of Lights' },
      { name: 'Diwali (Day 2 - Govardhan Puja)', date: `${year}-11-02`, type: 'Festival', description: 'Day after Diwali' },
      { name: 'Bhai Dooj', date: `${year}-11-03`, type: 'Festival', description: 'Brother-sister celebration' },
      { name: 'Guru Nanak Jayanti', date: `${year}-11-15`, type: 'Festival', description: 'Birth of Guru Nanak Dev' },
      { name: 'Christmas', date: `${year}-12-25`, type: 'National Holiday', description: 'Christmas Day' },
    ];
    let added = 0;
    const existing = payrollDataStore.getHolidays().map(h => h.date);
    indianHolidays.forEach(h => {
      if (!existing.includes(h.date)) {
        payrollDataStore.addHoliday({ ...h, isOptional: false });
        added++;
      }
    });
    toast.success(`Loaded ${added} Indian holidays for ${year}`);
    loadHolidays();
  };

  const getHolidayTypeColor = (type) => {
    const colors = {
      'National Holiday': 'text-red-600 bg-red-50',
      'Regional Holiday': 'text-orange-600 bg-orange-50',
      'Festival': 'text-purple-600 bg-purple-50',
      'Company Holiday': 'text-blue-600 bg-blue-50',
      'Restricted Holiday': 'text-yellow-600 bg-yellow-50',
      'Optional Holiday': 'text-gray-600 bg-gray-50'
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  const getMonthName = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'long' });
  };

  const getDayName = (date) => {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  };

  const groupedHolidays = holidays.reduce((acc, holiday) => {
    const month = getMonthName(holiday.date);
    if (!acc[month]) acc[month] = [];
    acc[month].push(holiday);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Holiday Calendar</h1>
          <p className="text-gray-600 mt-1">Manage company and regional holidays</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="form-input"
          >
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - 1 + i;
              return (
                <option key={year} value={year}>{year}</option>
              );
            })}
          </select>
          <button
            onClick={preloadIndianHolidays}
            className="btn btn-secondary flex items-center gap-2"
          >
            Load Indian Holidays
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Holiday
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Holidays</p>
              <p className="text-2xl font-bold text-gray-900">{holidays.length}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <CalendarIcon className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">National Holidays</p>
              <p className="text-2xl font-bold text-red-600">
                {holidays.filter(h => h.type === 'National Holiday').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <CalendarIcon className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Festivals</p>
              <p className="text-2xl font-bold text-purple-600">
                {holidays.filter(h => h.type === 'Festival').length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <CalendarIcon className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Optional Holidays</p>
              <p className="text-2xl font-bold text-warning-600">
                {holidays.filter(h => h.isOptional).length}
              </p>
            </div>
            <div className="p-3 bg-warning-100 rounded-lg">
              <CalendarIcon className="text-warning-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Holidays List - Grouped by Month */}
      <div className="space-y-6">
        {Object.keys(groupedHolidays).length > 0 ? (
          Object.entries(groupedHolidays).map(([month, monthHolidays]) => (
            <div key={month} className="bg-white rounded-lg shadow-card overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">{month} {selectedYear}</h3>
                <p className="text-sm text-gray-600">{monthHolidays.length} holidays</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {monthHolidays.map(holiday => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="text-center min-w-[60px]">
                            <div className="text-2xl font-bold text-gray-900">
                              {new Date(holiday.date).getDate()}
                            </div>
                            <div className="text-xs text-gray-500 uppercase">
                              {getDayName(holiday.date).substring(0, 3)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{holiday.name}</h4>
                            <p className="text-sm text-gray-600">{holiday.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getHolidayTypeColor(holiday.type)}`}>
                                {holiday.type}
                              </span>
                              {holiday.isOptional && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                                  Optional
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(holiday)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(holiday.id)}
                          className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-card p-12 text-center">
            <CalendarIcon size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No holidays configured for {selectedYear}</p>
            <p className="text-sm text-gray-500 mt-2">Click "Add Holiday" to create a new holiday</p>
          </div>
        )}
      </div>

      {/* Add/Edit Holiday Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="form-label">Holiday Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., Independence Day"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select type...</option>
                    {HOLIDAY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-input"
                    rows="3"
                    placeholder="Enter holiday description..."
                  ></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isOptional"
                      checked={formData.isOptional}
                      onChange={handleInputChange}
                      className="form-checkbox"
                    />
                    <span className="text-sm text-gray-700">
                      This is an optional holiday (employees can choose to work)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingHoliday ? 'Update Holiday' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayCalendar;
