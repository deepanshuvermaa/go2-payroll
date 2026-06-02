import React, { useState, useEffect } from 'react';
import { Plus, Copy, Trash2, Edit, Users, Calculator, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';

const PayrollTemplates = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [calculation, setCalculation] = useState(null);

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    basicSalary: 0,
    hra: 0,
    conveyanceAllowance: 0,
    medicalAllowance: 0,
    specialAllowance: 0,
    otherAllowances: 0,
    pfEnabled: true,
    esiEnabled: true,
    ptEnabled: true,
    tdsEnabled: false
  });

  const [applyForm, setApplyForm] = useState({
    templateId: '',
    staffIds: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allTemplates = payrollDataStore.getSalaryTemplates();
    setTemplates(allTemplates);

    const allStaff = payrollDataStore.getStaff();
    setStaff(allStaff);
  };

  const resetForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      basicSalary: 0,
      hra: 0,
      conveyanceAllowance: 0,
      medicalAllowance: 0,
      specialAllowance: 0,
      otherAllowances: 0,
      pfEnabled: true,
      esiEnabled: true,
      ptEnabled: true,
      tdsEnabled: false
    });
    setEditingTemplate(null);
  };

  const handleAddTemplate = () => {
    if (!templateForm.name) {
      toast.error('Template name is required');
      return;
    }

    if (editingTemplate) {
      const result = payrollDataStore.updateSalaryTemplate({
        ...templateForm,
        id: editingTemplate.id
      });

      if (result.success) {
        toast.success('Template updated');
        resetForm();
        setShowForm(false);
        loadData();
      } else {
        toast.error(result.message);
      }
    } else {
      const result = payrollDataStore.addSalaryTemplate(templateForm);

      if (result.success) {
        toast.success('Template created');
        resetForm();
        setShowForm(false);
        loadData();
      } else {
        toast.error(result.message);
      }
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      basicSalary: template.basicSalary || 0,
      hra: template.hra || 0,
      conveyanceAllowance: template.conveyanceAllowance || 0,
      medicalAllowance: template.medicalAllowance || 0,
      specialAllowance: template.specialAllowance || 0,
      otherAllowances: template.otherAllowances || 0,
      pfEnabled: template.pfEnabled !== false,
      esiEnabled: template.esiEnabled !== false,
      ptEnabled: template.ptEnabled !== false,
      tdsEnabled: template.tdsEnabled === true
    });
    setShowForm(true);
  };

  const handleDeleteTemplate = (id) => {
    if (window.confirm('Delete this template?')) {
      const result = payrollDataStore.deleteSalaryTemplate(id);

      if (result.success) {
        toast.success('Template deleted');
        loadData();
      } else {
        toast.error(result.message);
      }
    }
  };

  const handleCloneTemplate = (id) => {
    const name = window.prompt('Enter name for cloned template:');
    if (!name) return;

    const result = payrollDataStore.cloneSalaryTemplate(id, name);

    if (result.success) {
      toast.success('Template cloned');
      loadData();
    } else {
      toast.error(result.message);
    }
  };

  const handleApplyTemplate = () => {
    if (!applyForm.templateId || applyForm.staffIds.length === 0) {
      toast.error('Select template and at least one staff member');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    applyForm.staffIds.forEach((staffId) => {
      const result = payrollDataStore.applyTemplateToStaff(applyForm.templateId, staffId);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    });

    if (successCount > 0) {
      toast.success(`Template applied to ${successCount} staff members`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to apply to ${errorCount} staff members`);
    }

    setApplyForm({ templateId: '', staffIds: [] });
    loadData();
  };

  const handleCalculatePreview = (templateId) => {
    const calc = payrollDataStore.calculateSalaryFromTemplate(templateId);
    setCalculation(calc);
    setSelectedTemplate(templateId);
  };

  const calculateGross = () => {
    return (
      (parseFloat(templateForm.basicSalary) || 0) +
      (parseFloat(templateForm.hra) || 0) +
      (parseFloat(templateForm.conveyanceAllowance) || 0) +
      (parseFloat(templateForm.medicalAllowance) || 0) +
      (parseFloat(templateForm.specialAllowance) || 0) +
      (parseFloat(templateForm.otherAllowances) || 0)
    );
  };

  const getStaffUsingTemplate = (templateId) => {
    return staff.filter(s => s.salaryTemplate === templateId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage salary structure templates</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          New Template
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Staff Using Templates</p>
              <p className="text-2xl font-bold text-gray-900">
                {staff.filter(s => s.salaryTemplate).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calculator className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Templates</p>
              <p className="text-2xl font-bold text-gray-900">
                {templates.filter(t => t.appliedToStaff && t.appliedToStaff.length > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['templates', 'apply'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {editingTemplate ? 'Edit' : 'Create'} Template
          </h3>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Template Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Junior Developer"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Description</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Optional description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                />
              </div>
            </div>

            {/* Salary Components */}
            <div>
              <h4 className="font-medium mb-3">Salary Components</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Basic Salary</label>
                  <input
                    type="number"
                    className="input"
                    value={templateForm.basicSalary}
                    onChange={(e) => setTemplateForm({ ...templateForm, basicSalary: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="label">HRA</label>
                  <input
                    type="number"
                    className="input"
                    value={templateForm.hra}
                    onChange={(e) => setTemplateForm({ ...templateForm, hra: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="label">Conveyance</label>
                  <input
                    type="number"
                    className="input"
                    value={templateForm.conveyanceAllowance}
                    onChange={(e) => setTemplateForm({ ...templateForm, conveyanceAllowance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="label">Medical</label>
                  <input
                    type="number"
                    className="input"
                    value={templateForm.medicalAllowance}
                    onChange={(e) => setTemplateForm({ ...templateForm, medicalAllowance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="label">Special Allowance</label>
                  <input
                    type="number"
                    className="input"
                    value={templateForm.specialAllowance}
                    onChange={(e) => setTemplateForm({ ...templateForm, specialAllowance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="label">Other Allowances</label>
                  <input
                    type="number"
                    className="input"
                    value={templateForm.otherAllowances}
                    onChange={(e) => setTemplateForm({ ...templateForm, otherAllowances: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="mt-3 p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium">
                  Gross Salary: <span className="text-primary-600">₹{calculateGross().toLocaleString('en-IN')}</span>
                </p>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h4 className="font-medium mb-3">Statutory Deductions</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={templateForm.pfEnabled}
                    onChange={(e) => setTemplateForm({ ...templateForm, pfEnabled: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span>PF (12%)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={templateForm.esiEnabled}
                    onChange={(e) => setTemplateForm({ ...templateForm, esiEnabled: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span>ESI (0.75%)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={templateForm.ptEnabled}
                    onChange={(e) => setTemplateForm({ ...templateForm, ptEnabled: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span>PT</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={templateForm.tdsEnabled}
                    onChange={(e) => setTemplateForm({ ...templateForm, tdsEnabled: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span>TDS</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleAddTemplate} className="btn-primary">
                {editingTemplate ? 'Update' : 'Create'} Template
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No templates created yet</p>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="btn-primary mt-4"
              >
                Create First Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => {
                const staffUsing = getStaffUsingTemplate(template.id);
                const calc = payrollDataStore.calculateSalaryFromTemplate(template.id);

                return (
                  <div key={template.id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-gray-600">{template.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleCloneTemplate(template.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Clone"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Basic Salary:</span>
                        <span className="font-medium">₹{(template.basicSalary || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Gross Salary:</span>
                        <span className="font-medium text-primary-600">
                          ₹{calc ? calc.grossSalary.toLocaleString('en-IN') : '0'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Net Salary:</span>
                        <span className="font-bold text-green-600">
                          ₹{calc ? calc.netSalary.toLocaleString('en-IN') : '0'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Users size={16} />
                        <span>{staffUsing.length} staff using this template</span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        {template.pfEnabled && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">PF</span>}
                        {template.esiEnabled && <span className="px-2 py-1 bg-green-100 text-green-700 rounded">ESI</span>}
                        {template.ptEnabled && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">PT</span>}
                        {template.tdsEnabled && <span className="px-2 py-1 bg-red-100 text-red-700 rounded">TDS</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Apply Template Tab */}
      {activeTab === 'apply' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Apply Template to Staff</h3>

          <div className="space-y-4">
            <div>
              <label className="label">Select Template</label>
              <select
                className="input"
                value={applyForm.templateId}
                onChange={(e) => setApplyForm({ ...applyForm, templateId: e.target.value })}
              >
                <option value="">Choose a template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {applyForm.templateId && (
              <div>
                <label className="label">Select Staff Members</label>
                <div className="max-h-64 overflow-y-auto border rounded p-3 space-y-2">
                  {staff.map((s) => (
                    <label key={s.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={applyForm.staffIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setApplyForm({ ...applyForm, staffIds: [...applyForm.staffIds, s.id] });
                          } else {
                            setApplyForm({
                              ...applyForm,
                              staffIds: applyForm.staffIds.filter((id) => id !== s.id)
                            });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span>{s.name}</span>
                      {s.salaryTemplate && (
                        <span className="text-xs text-gray-500">
                          (Currently using: {templates.find(t => t.id === s.salaryTemplate)?.name})
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleApplyTemplate}
              className="btn-primary"
              disabled={!applyForm.templateId || applyForm.staffIds.length === 0}
            >
              Apply Template to {applyForm.staffIds.length} Staff
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollTemplates;
