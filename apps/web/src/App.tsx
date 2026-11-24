import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AppShell } from './layouts/AppShell';
import { AuthPage } from './pages/AuthPage';
import { OverviewPage } from './pages/OverviewPage';
import { PilotVillagesPage } from './pages/PilotVillagesPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { RecordsPage } from './pages/RecordsPage';
import { SchemesPage } from './pages/SchemesPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AssistantPage } from './pages/AssistantPage';
import { AdminPage } from './pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 15_000 },
  },
});

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Loading Betul District Intelligence Platform...
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const isCitizen = user.role === 'citizen';
  const isAdmin = user.role === 'district_admin' && user.verificationStatus === 'approved';

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/pilot" element={<PilotVillagesPage />} />
        <Route path="/departments" element={!isCitizen ? <DepartmentsPage /> : <Navigate to="/" />} />
        <Route path="/records" element={!isCitizen ? <RecordsPage /> : <Navigate to="/" />} />
        <Route path="/schemes" element={<SchemesPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/admin" element={isAdmin ? <AdminPage /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
