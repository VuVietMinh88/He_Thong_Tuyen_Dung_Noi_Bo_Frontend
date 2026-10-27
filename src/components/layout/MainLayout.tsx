import type { FC, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export interface MainLayoutProps {
  children?: ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => (
  <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
    <Sidebar />
    <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
      <main className="flex-1 overflow-y-auto bg-slate-50/70 flex flex-col">
        <Header />
        <div className="flex-1">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  </div>
);

export default MainLayout;
