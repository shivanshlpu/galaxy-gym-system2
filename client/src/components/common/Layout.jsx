import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import useAuthStore from '../../store/authStore';

const Layout = () => {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <div className="min-h-screen bg-bg-background text-text-primary">
      <Sidebar />
      <div className="lg:ml-[220px] min-h-screen flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
