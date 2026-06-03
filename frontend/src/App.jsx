import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Loader from './components/Loader';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Patients = lazy(() => import('./pages/Patients'));
const Doctors = lazy(() => import('./pages/Doctors'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Billing = lazy(() => import('./pages/Billing'));
const Rooms = lazy(() => import('./pages/Rooms'));
const Inventory = lazy(() => import('./pages/Inventory'));
const EMR = lazy(() => import('./pages/EMR'));
const Lab = lazy(() => import('./pages/Lab'));
const PatientPortal = lazy(() => import('./pages/PatientPortal'));
const Schedules = lazy(() => import('./pages/Schedules'));
const Queue = lazy(() => import('./pages/Queue'));
const Pharmacy = lazy(() => import('./pages/Pharmacy'));

function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes Wrapper */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={
            <ProtectedRoute roles={['admin', 'doctor', 'receptionist']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/patients" element={
            <ProtectedRoute roles={['admin', 'doctor', 'receptionist']}>
              <Patients />
            </ProtectedRoute>
          } />
          <Route path="/doctors" element={
            <ProtectedRoute roles={['admin', 'receptionist']}>
              <Doctors />
            </ProtectedRoute>
          } />
          <Route path="/appointments" element={
            <ProtectedRoute roles={['admin', 'doctor', 'receptionist']}>
              <Appointments />
            </ProtectedRoute>
          } />
          <Route path="/billing" element={
            <ProtectedRoute roles={['admin', 'receptionist']}>
              <Billing />
            </ProtectedRoute>
          } />
          <Route path="/rooms" element={
            <ProtectedRoute roles={['admin', 'doctor', 'receptionist']}>
              <Rooms />
            </ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute roles={['admin', 'receptionist']}>
              <Inventory />
            </ProtectedRoute>
          } />
          <Route path="/emr" element={
            <ProtectedRoute roles={['admin', 'doctor']}>
              <EMR />
            </ProtectedRoute>
          } />
          <Route path="/lab" element={
            <ProtectedRoute roles={['admin', 'doctor', 'receptionist']}>
              <Lab />
            </ProtectedRoute>
          } />
          <Route path="/schedules" element={
            <ProtectedRoute roles={['admin', 'doctor']}>
              <Schedules />
            </ProtectedRoute>
          } />
          <Route path="/queue" element={
            <ProtectedRoute roles={['admin', 'doctor', 'receptionist']}>
              <Queue />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy" element={
            <ProtectedRoute roles={['admin', 'pharmacist']}>
              <Pharmacy />
            </ProtectedRoute>
          } />
          <Route path="/patient-portal" element={
            <ProtectedRoute roles={['patient']}>
              <PatientPortal />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
