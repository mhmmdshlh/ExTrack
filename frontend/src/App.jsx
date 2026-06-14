import { Outlet } from 'react-router-dom';
import SidebarNav from './components/SidebarNav.jsx';

export default function App() {
  return (
    <div className="min-h-dvh bg-background text-foreground lg:flex">
      <SidebarNav />
      <main className="flex-1 lg:ml-16">
        <Outlet />
      </main>
    </div>
  );
}
