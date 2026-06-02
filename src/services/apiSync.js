/**
 * API Sync Layer - Bridges payrollDataStore (localStorage) with backend API
 * When online: syncs operations to backend, caches locally
 * When offline: uses localStorage, queues for sync when back online
 */
import { employeeAPI, attendanceAPI, leaveAPI, payrollAPI, salaryAPI, taxAPI, orgAPI } from './api';
import toast from 'react-hot-toast';

class ApiSync {
  constructor() {
    this.online = navigator.onLine;
    this.syncQueue = JSON.parse(localStorage.getItem('_syncQueue') || '[]');
    window.addEventListener('online', () => { this.online = true; this.processQueue(); });
    window.addEventListener('offline', () => { this.online = false; });
  }

  async syncEmployees() {
    if (!this.online) return;
    try {
      const res = await employeeAPI.list({ limit: 500 });
      const employees = res.data || [];
      // Map backend format to frontend format
      const mapped = employees.map(e => ({
        id: e.id, employeeId: e.employeeCode, name: `${e.firstName} ${e.lastName}`,
        firstName: e.firstName, lastName: e.lastName, email: e.email, phone: e.phone,
        department: e.department?.name || '', designation: e.designation?.name || '',
        branch: e.branch?.name || '', dateOfJoining: e.dateOfJoining, status: e.status?.toLowerCase(),
        employmentType: e.employmentType, panNumber: e.panNumber, aadharNumber: e.aadharNumber,
        uanNumber: e.uanNumber, bankName: e.bankName, bankAccountNo: e.bankAccountNo,
        bankIfsc: e.bankIfsc, reportingManager: e.reportingManagerId,
      }));
      localStorage.setItem('payroll_staff', JSON.stringify(mapped));
      return mapped;
    } catch (e) { console.warn('Sync employees failed:', e.message); return null; }
  }

  async syncAttendance(date) {
    if (!this.online) return;
    try {
      const res = await attendanceAPI.getByDate(date);
      return res.data || [];
    } catch (e) { return null; }
  }

  async createEmployee(data) {
    if (!this.online) { this.queueAction('createEmployee', data); return; }
    try {
      const res = await employeeAPI.create({
        employeeCode: data.employeeId || `EMP${Date.now()}`,
        firstName: data.name?.split(' ')[0] || data.firstName,
        lastName: data.name?.split(' ').slice(1).join(' ') || data.lastName || '',
        email: data.email, phone: data.phone, dateOfJoining: data.dateOfJoining || new Date().toISOString(),
        gender: data.gender?.toUpperCase(), employmentType: data.employmentType?.toUpperCase().replace('-', '_'),
      });
      toast.success('Employee synced to server');
      return res.data;
    } catch (e) { this.queueAction('createEmployee', data); }
  }

  async markAttendance(employeeId, date, status) {
    if (!this.online) { this.queueAction('markAttendance', { employeeId, date, status }); return; }
    try {
      await attendanceAPI.mark({ employeeId, date, status: status.toUpperCase().replace('-', '_') });
    } catch (e) { this.queueAction('markAttendance', { employeeId, date, status }); }
  }

  async applyLeave(data) {
    if (!this.online) { this.queueAction('applyLeave', data); return; }
    try { return await leaveAPI.apply(data); } catch (e) { this.queueAction('applyLeave', data); }
  }

  queueAction(action, data) {
    this.syncQueue.push({ action, data, timestamp: Date.now() });
    localStorage.setItem('_syncQueue', JSON.stringify(this.syncQueue));
    toast('Saved offline — will sync when connected', { icon: '📡' });
  }

  async processQueue() {
    if (this.syncQueue.length === 0) return;
    toast.loading(`Syncing ${this.syncQueue.length} offline actions...`);
    const queue = [...this.syncQueue];
    this.syncQueue = [];
    localStorage.setItem('_syncQueue', '[]');
    for (const item of queue) {
      try {
        switch (item.action) {
          case 'createEmployee': await this.createEmployee(item.data); break;
          case 'markAttendance': await this.markAttendance(item.data.employeeId, item.data.date, item.data.status); break;
          case 'applyLeave': await this.applyLeave(item.data); break;
        }
      } catch (e) { this.syncQueue.push(item); }
    }
    localStorage.setItem('_syncQueue', JSON.stringify(this.syncQueue));
    toast.dismiss();
    toast.success('Sync complete');
  }

  // Initial full sync on login
  async fullSync() {
    if (!this.online) return;
    await this.syncEmployees();
    this.processQueue();
  }
}

export const apiSync = new ApiSync();
export default apiSync;
