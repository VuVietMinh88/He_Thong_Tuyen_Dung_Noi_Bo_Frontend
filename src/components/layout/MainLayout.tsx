import type { FC, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export interface MainLayoutProps {
  children?: ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => (
  <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
    <Sidebar />
    <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
      <main className="flex-1 overflow-y-auto bg-gray-100">
        {children ?? <Outlet />}
      </main>
    </div>
  </div>
);

export default MainLayout;

