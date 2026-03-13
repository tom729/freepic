'use client';
import { NotificationBell } from './NotificationBell';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { User, LogOut, Upload, Bell } from 'lucide-react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();

  // Debug: log auth state changes
  useEffect(() => {
    console.log('[Header] Auth state:', { user: user?.email, isAuthenticated });
  }, [user, isAuthenticated]);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-8 w-8"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
            <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-lg font-semibold tracking-tight text-gray-900">FreePic</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/" active>
            首页
          </NavLink>
          <NavLink href="/upload">
            <span className="flex items-center gap-1">
              <Upload className="h-4 w-4" />
              上传
            </span>
          </NavLink>
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Link
            href="/search"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 md:hidden min-h-[44px] min-w-[44px]"
            aria-label="Search"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <circle cx="11" cy="11" r="8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            href="/search"
            className="hidden md:flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Search"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <circle cx="11" cy="11" r="8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          {/* Notification Bell */}
          <NotificationBell className="hidden md:flex" />

          {/* User Section */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {user?.email?.includes('@')
                    ? user.email.replace(/(.{2}).*(@.*)/, '$1***$2')
                    : user?.email || ''}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 min-h-[44px] min-w-[44px]"
                title="退出登录"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden md:flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <User className="h-4 w-4" />
              登录
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 md:hidden min-h-[44px] min-w-[44px]"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="border-t border-gray-200/80 bg-white md:hidden">
          <nav className="flex flex-col px-4 py-2">
            <MobileNavLink href="/" active onClick={() => setIsMenuOpen(false)}>
              首页
            </MobileNavLink>
            <MobileNavLink href="/upload" onClick={() => setIsMenuOpen(false)}>
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                上传
              </span>
            </MobileNavLink>
            <MobileNavLink href="/search" onClick={() => setIsMenuOpen(false)}>
              搜索
            </MobileNavLink>

            {isAuthenticated && (
              <MobileNavLink href="/profile?tab=notifications" onClick={() => setIsMenuOpen(false)}>
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </span>
              </MobileNavLink>
            )}

            {isAuthenticated ? (
              <>
                <div className="px-4 py-3 text-sm text-gray-600 border-t border-gray-100 mt-2 min-h-[44px] flex items-center">
                  {user?.email?.includes('@')
                    ? user.email.replace(/(.{2}).*(@.*)/, '$1***$2')
                    : user?.email || ''}
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-3 min-h-[44px] text-left text-red-600 text-sm font-medium rounded-lg hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </>
            ) : (
              <MobileNavLink href="/login" onClick={() => setIsMenuOpen(false)}>
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  登录
                </span>
              </MobileNavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}

function NavLink({ href, children, active }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {children}
    </Link>
  );
}

interface MobileNavLinkProps extends NavLinkProps {
  onClick?: () => void;
}

function MobileNavLink({ href, children, active, onClick }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
        active ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {children}
    </Link>
  );
}
