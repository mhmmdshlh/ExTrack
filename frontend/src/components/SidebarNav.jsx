import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, BarChart3, Settings } from 'lucide-react';

export default function SidebarNav() {
  const { t } = useTranslation();
  const tabs = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/statistics', label: t('nav.statistics'), icon: BarChart3 },
    { to: '/history', label: t('nav.history'), icon: History },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];
  return (
    <>
      {/* Mobile: bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card lg:hidden">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop: collapsed sidebar */}
      <nav className="fixed left-0 top-0 z-50 hidden h-dvh w-16 flex-col items-center gap-2 border-r bg-card py-4 lg:flex">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group relative flex w-full flex-col items-center gap-1 px-3 py-3 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Icon size={20} />
            <span className="sr-only">{label}</span>
            <div className="absolute left-full ml-3 hidden whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-sm group-hover:lg:block">
              {label}
            </div>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
