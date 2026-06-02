import React, { useState, useEffect } from 'react';
import { DollarSign, RefreshCw, TrendingUp, Globe, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import payrollDataStore from '../../services/payrollDataStore';

const CurrencySettings = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [settings, setSettings] = useState(null);
  const [exchangeRates, setExchangeRates] = useState(null);
  const [summary, setSummary] = useState(null);
  const [staff, setStaff] = useState([]);

  // Converter state
  const [converter, setConverter] = useState({
    amount: 1000,
    fromCurrency: 'INR',
    toCurrency: 'USD',
    result: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const currSettings = payrollDataStore.getCurrencySettings();
    setSettings(currSettings);

    const rates = payrollDataStore.getExchangeRates();
    setExchangeRates(rates);

    if (currSettings.enableMultiCurrency) {
      const multiSummary = payrollDataStore.getPayrollSummaryMultiCurrency();
      setSummary(multiSummary);
    }

    const allStaff = payrollDataStore.getStaff();
    setStaff(allStaff);
  };

  const handleUpdateSettings = () => {
    payrollDataStore.updateCurrencySettings(settings);
    toast.success('Currency settings updated');
    loadData();
  };

  const handleUpdateExchangeRate = (currency, rate) => {
    const result = payrollDataStore.updateExchangeRate(currency, rate);

    if (result.success) {
      toast.success(`Exchange rate updated for ${currency}`);
      loadData();
    } else {
      toast.error(result.message);
    }
  };

  const handleBulkUpdateRates = () => {
    const ratesObj = {};

    Object.keys(exchangeRates).forEach(curr => {
      if (curr !== 'INR') {
        ratesObj[curr] = exchangeRates[curr].rate;
      }
    });

    const result = payrollDataStore.bulkUpdateExchangeRates(ratesObj);

    if (result.success) {
      toast.success('All exchange rates updated');
      loadData();
    }
  };

  const handleConvert = () => {
    const result = payrollDataStore.convertCurrency(
      parseFloat(converter.amount),
      converter.fromCurrency,
      converter.toCurrency
    );

    if (result) {
      setConverter({ ...converter, result });
      toast.success('Conversion complete');
    } else {
      toast.error('Conversion failed');
    }
  };

  const handleSetStaffCurrency = (staffId, currency) => {
    const result = payrollDataStore.setStaffCurrency(staffId, currency);

    if (result.success) {
      toast.success('Staff currency updated');
      loadData();
    } else {
      toast.error(result.message);
    }
  };

  const currencies = exchangeRates ? Object.keys(exchangeRates) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Multi-Currency Settings</h1>
          <p className="text-gray-600 mt-1">Manage currencies and exchange rates</p>
        </div>
        <button
          onClick={handleBulkUpdateRates}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw size={20} />
          Update All Rates
        </button>
      </div>

      {/* Stats */}
      {settings?.enableMultiCurrency && summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Globe className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Currencies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(summary).filter(s => s.totalStaff > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Base Currency</p>
                <p className="text-2xl font-bold text-gray-900">{settings.baseCurrency}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Update</p>
                <p className="text-sm font-medium text-gray-900">
                  {settings.lastRateUpdate
                    ? new Date(settings.lastRateUpdate).toLocaleDateString('en-IN')
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['settings', 'rates', 'converter', 'staff'].map((tab) => (
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

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Currency Configuration</h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="label">Enable Multi-Currency Support</label>
                <p className="text-sm text-gray-600">Allow staff salaries in different currencies</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableMultiCurrency}
                onChange={(e) => setSettings({ ...settings, enableMultiCurrency: e.target.checked })}
                className="w-5 h-5"
              />
            </div>

            <div>
              <label className="label">Base Currency</label>
              <select
                className="input max-w-xs"
                value={settings.baseCurrency}
                onChange={(e) => setSettings({ ...settings, baseCurrency: e.target.value })}
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr} - {exchangeRates[curr]?.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-600 mt-1">
                Primary currency for payroll calculations
              </p>
            </div>

            <div>
              <label className="label">Supported Currencies</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {currencies.map((curr) => (
                  <label key={curr} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.supportedCurrencies.includes(curr)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({
                            ...settings,
                            supportedCurrencies: [...settings.supportedCurrencies, curr]
                          });
                        } else {
                          setSettings({
                            ...settings,
                            supportedCurrencies: settings.supportedCurrencies.filter(c => c !== curr)
                          });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span>{curr}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="label">Auto-Update Exchange Rates</label>
                <p className="text-sm text-gray-600">Automatically fetch latest rates on save</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoUpdateRates}
                onChange={(e) => setSettings({ ...settings, autoUpdateRates: e.target.checked })}
                className="w-5 h-5"
              />
            </div>

            <button onClick={handleUpdateSettings} className="btn-primary">
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Exchange Rates Tab */}
      {activeTab === 'rates' && exchangeRates && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Exchange Rates (Base: INR = 1)</h3>

          <div className="space-y-3">
            {Object.entries(exchangeRates).map(([currency, data]) => (
              <div key={currency} className="flex items-center gap-4 p-3 border rounded">
                <div className="flex-1">
                  <div className="font-medium">{data.symbol} {data.name}</div>
                  <div className="text-sm text-gray-600">{currency}</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Rate</div>
                    <input
                      type="number"
                      step="0.0001"
                      className="input w-32"
                      value={data.rate}
                      onChange={(e) => {
                        setExchangeRates({
                          ...exchangeRates,
                          [currency]: { ...data, rate: parseFloat(e.target.value) }
                        });
                      }}
                      disabled={currency === 'INR'}
                    />
                  </div>

                  {currency !== 'INR' && (
                    <button
                      onClick={() => handleUpdateExchangeRate(currency, data.rate)}
                      className="btn-secondary"
                    >
                      Update
                    </button>
                  )}
                </div>

                {data.lastUpdated && (
                  <div className="text-xs text-gray-500">
                    Updated: {new Date(data.lastUpdated).toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Currency Converter Tab */}
      {activeTab === 'converter' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calculator size={20} />
            Currency Converter
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Amount</label>
                <input
                  type="number"
                  className="input"
                  value={converter.amount}
                  onChange={(e) => setConverter({ ...converter, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="label">From Currency</label>
                <select
                  className="input"
                  value={converter.fromCurrency}
                  onChange={(e) => setConverter({ ...converter, fromCurrency: e.target.value })}
                >
                  {currencies.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr} - {exchangeRates[curr]?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">To Currency</label>
                <select
                  className="input"
                  value={converter.toCurrency}
                  onChange={(e) => setConverter({ ...converter, toCurrency: e.target.value })}
                >
                  {currencies.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr} - {exchangeRates[curr]?.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={handleConvert} className="btn-primary">
              Convert
            </button>

            {converter.result && (
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {payrollDataStore.formatCurrency(
                      converter.result.convertedAmount,
                      converter.result.convertedCurrency
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Exchange Rate: 1 {converter.fromCurrency} = {converter.result.exchangeRate.toFixed(4)}{' '}
                    {converter.toCurrency}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Converted at: {new Date(converter.result.timestamp).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staff Currency Tab */}
      {activeTab === 'staff' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Staff Currency Assignment</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Staff Name</th>
                  <th className="text-left py-3 px-4">Basic Salary</th>
                  <th className="text-left py-3 px-4">Current Currency</th>
                  <th className="text-left py-3 px-4">Change Currency</th>
                  <th className="text-left py-3 px-4">In Base Currency (INR)</th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No staff members found
                    </td>
                  </tr>
                ) : (
                  staff.map((s) => {
                    const staffCurrency = s.currency || settings?.baseCurrency || 'INR';
                    const inBase = payrollDataStore.getStaffSalaryInCurrency(s.id, 'INR');

                    return (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{s.name}</td>
                        <td className="py-3 px-4">
                          {payrollDataStore.formatCurrency(s.basicSalary || 0, staffCurrency)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                            {staffCurrency}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            className="input py-1"
                            value={staffCurrency}
                            onChange={(e) => handleSetStaffCurrency(s.id, e.target.value)}
                          >
                            {currencies.map((curr) => (
                              <option key={curr} value={curr}>
                                {curr}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          {inBase?.converted ? (
                            <span className="text-sm">
                              ₹{inBase.basicSalary.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                              <span className="text-xs text-gray-500 ml-2">
                                (@ {inBase.exchangeRate.toFixed(4)})
                              </span>
                            </span>
                          ) : (
                            <span>₹{(s.basicSalary || 0).toLocaleString('en-IN')}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySettings;
