# Go2-Payroll - Complete Payroll Management System

A comprehensive, standalone payroll management system built with React and Electron.

## Features

- ✅ **Staff Management**: Complete employee records with documents
- ✅ **Attendance Tracking**: Daily attendance, late marks, overtime
- ✅ **Salary Processing**: Automated calculations with PF, ESI, PT, TDS
- ✅ **Leave Management**: Application, approval, balance tracking
- ✅ **Advances & Loans**: Track and auto-recover from salary
- ✅ **Reports**: 20+ comprehensive reports
- ✅ **Multi-company**: Support for multiple companies
- ✅ **Export**: Excel and PDF export for all reports
- ✅ **Backup/Restore**: Automatic and manual backup

## Tech Stack

- **Frontend**: React 18, Tailwind CSS
- **Desktop**: Electron 27
- **State**: Zustand
- **Charts**: Recharts
- **Export**: jsPDF, XLSX
- **Calendar**: React-Big-Calendar

## Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Run Electron
npm run electron:dev

# Build for production
npm run build

# Create executable
npm run dist:win
```

## Production Build

The final executable will be generated in `build-output/` folder:
- `Go2-Payroll-Portable.exe` (~80 MB)

## License

Proprietary - Go2-BillingSoftware Team

## Support

For support, contact: support@go2billing.com
