import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import { AuthProvider } from '../hooks/useAuth';
import { HomePage } from '../pages/HomePage';
import { AuthPage } from '../pages/AuthPage';

describe('Betul District Frontend — Public Portal & Dedicated Role Logins', () => {
  it('renders public Betul Portal Home explaining the platform and all 4 role portals', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Select Your Dedicated Login Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/Citizen & Household Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/Field Worker & Survey Portal/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Department Officer Portal/i })).toBeInTheDocument();
    expect(screen.getByText(/District Administration Command/i)).toBeInTheDocument();
    expect(screen.getByText(/Install Betul District App on Android/i)).toBeInTheDocument();
  });

  it('shows official verification notice on the dedicated Officer Login portal when creating an account', () => {
    render(
      <MemoryRouter initialEntries={['/login/officer']}>
        <AuthProvider>
          <Routes>
            <Route path="/login/:portal" element={<AuthPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Department Officer Portal/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(
      screen.getByText(/Official accounts require District Administration verification/i),
    ).toBeInTheDocument();
  });
});
