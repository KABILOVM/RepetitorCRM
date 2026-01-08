import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Teachers } from './pages/Teachers';
import { Groups } from './pages/Groups';
import { Schedule } from './pages/Schedule';
import { Attendance } from './pages/Attendance';
import { Calls } from './pages/Calls';
import { Violations } from './pages/Violations';
import { Finance } from './pages/Finance';
import { CRM } from './pages/CRM';
import { Analytics } from './pages/Analytics';
import { ImportData } from './pages/ImportData';
import { Exams } from './pages/Exams';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/violations" element={<Violations />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/import" element={<ImportData />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;