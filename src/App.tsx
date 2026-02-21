import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import SilentAuctionAdmin from './components/SilentAuctionAdmin';
import './App.css';

function AppContent() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="App">
      <header className="bg-gray-800 text-white py-2 px-4 flex justify-end items-center">
        <span className="text-sm text-gray-300 mr-3">{user.email}</span>
        <button
          type="button"
          onClick={() => signOut()}
          className="text-sm text-gray-300 hover:text-white underline"
        >
          Sign out
        </button>
      </header>
      <SilentAuctionAdmin />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;




