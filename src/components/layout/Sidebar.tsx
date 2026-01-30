import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Leaf,
  BarChart3,
  Camera,
  Sparkles,
  Users,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Coins,
  CloudSun,
  Menu,
  X,
  Sprout,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string | number;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: MapPin, label: 'My Lands', path: '/my-lands' },
  { icon: Sprout, label: 'Farming Plans', path: '/farming-plans' },
  { icon: Leaf, label: 'Crop Advice', path: '/crop-recommendation' },
  { icon: Camera, label: 'Diagnose', path: '/diagnose' },
  { icon: Sparkles, label: 'AI Assistant', path: '/ai' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
];

const secondaryNavItems: NavItem[] = [
  { icon: Coins, label: 'Market Prices', path: '/market' },
  { icon: CloudSun, label: 'Weather', path: '/weather' },
  { icon: FileText, label: 'Soil Reports', path: '/soil-report' },
  { icon: Users, label: 'Connect', path: '/connect' },
];

const bottomNavItems: NavItem[] = [
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: HelpCircle, label: 'Help', path: '/help' },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const location = useLocation();
  const { logout, user } = useAuth();

  const NavItemComponent = ({ item, collapsed: isCollapsed }: { item: NavItem; collapsed: boolean }) => {
    const isActive = location.pathname === item.path || 
      (item.path !== '/' && location.pathname.startsWith(item.path));

    return (
      <NavLink
        to={item.path}
        onClick={onMobileClose}
        className={`
          flex items-center gap-3 px-4 py-3 mx-3 rounded-xl
          font-medium text-sm
          transition-all duration-200
          ${isActive 
            ? 'bg-white/15 text-white shadow-lg shadow-black/10' 
            : 'text-white/70 hover:bg-white/10 hover:text-white'
          }
          ${isCollapsed ? 'justify-center px-3' : ''}
        `}
        title={isCollapsed ? item.label : undefined}
      >
        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-emerald-300' : ''}`} />
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs font-bold bg-emerald-400 text-emerald-900 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-5 py-6 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Sprout className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold text-white">Farmees</h1>
            <p className="text-xs text-emerald-300/80">Smart Farming</p>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="mb-6">
          {!collapsed && (
            <p className="px-5 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
              Main Menu
            </p>
          )}
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <NavItemComponent key={item.path} item={item} collapsed={collapsed} />
            ))}
          </div>
        </div>

        <div className="mb-6">
          {!collapsed && (
            <p className="px-5 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
              Tools
            </p>
          )}
          <div className="space-y-1">
            {secondaryNavItems.map((item) => (
              <NavItemComponent key={item.path} item={item} collapsed={collapsed} />
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/10 py-4">
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <NavItemComponent key={item.path} item={item} collapsed={collapsed} />
          ))}
        </div>

        {/* User Profile */}
        <div className={`mx-3 mt-4 p-3 bg-white/10 rounded-xl ${collapsed ? 'p-2' : ''}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user?.name?.charAt(0).toUpperCase() || 'F'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Farmer'}</p>
                <p className="text-xs text-white/60 truncate">{user?.phone || 'farmer@example.com'}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full mt-3 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle (Desktop) */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white rounded-full shadow-lg items-center justify-center text-slate-600 hover:text-emerald-600 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:block fixed left-0 top-0 h-screen
          bg-gradient-to-b from-emerald-800 via-emerald-900 to-green-950
          transition-all duration-300 z-40
          ${collapsed ? 'w-[72px]' : 'w-64'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`
          lg:hidden fixed left-0 top-0 h-screen w-72
          bg-gradient-to-b from-emerald-800 via-emerald-900 to-green-950
          transform transition-transform duration-300 z-50
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <button
          onClick={onMobileClose}
          className="absolute right-4 top-6 text-white/70 hover:text-white p-1"
        >
          <X className="w-6 h-6" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}

// Mobile Header with Menu Button
export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900">Farmees</span>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>
    </header>
  );
}
