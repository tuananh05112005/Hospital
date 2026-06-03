import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-8">
          <div className="max-w-7xl mx-auto animation-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
