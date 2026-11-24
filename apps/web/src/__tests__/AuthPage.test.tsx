import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AuthProvider } from '../hooks/useAuth';
import { AuthPage } from '../pages/AuthPage';

describe('Betul District Frontend — Auth & Role Pathways', () => {
  it('renders Sign In, Create Account, and Quick Demo Role Sign-In options', () => {
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>,
    );

    expect(screen.getByText(/Betul District Intelligence Platform/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick Demo Role Sign-In/i)).toBeInTheDocument();
    expect(screen.getByText('District Admin')).toBeInTheDocument();
    expect(screen.getByText('Citizen (Farmer)')).toBeInTheDocument();
  });

  it('shows official verification notice when Government Officer track is selected in Register', () => {
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    fireEvent.click(screen.getByRole('button', { name: 'Govt Officer' }));

    expect(
      screen.getByText(/Official accounts require District Administration verification/i),
    ).toBeInTheDocument();
  });
});
