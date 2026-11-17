'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Flame,
  HelpCircle,
  Search,
  UploadCloud,
  Settings,
  Sparkles,
  ExternalLink,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'All Leads', href: '/dashboard/leads', icon: Users },
  { label: 'High Priority (80+)', href: '/dashboard/high-priority', icon: Flame },
  { label: 'Needs Review', href: '/dashboard/needs-review', icon: HelpCircle },
  { label: 'Search Queries', href: '/dashboard/searches', icon: Search },
  { label: 'Import & Submit', href: '/dashboard/import', icon: UploadCloud },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Providers>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-sm flex flex-col fixed inset-y-0 z-40">
          <div className="h-16 flex items-center gap-2.5 px-6 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/25">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight block">AI Lead Finder</span>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Discovery Engine</span>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="rounded-lg p-3 bg-card border border-border text-xs space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Backend API
                </span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Port 5001 &bull; BullMQ Queues &bull; Gemini
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 pl-64 flex flex-col min-h-screen">
          <header className="h-16 border-b border-border bg-card/40 backdrop-blur-sm px-8 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Platform</span>
              <span>/</span>
              <span className="text-foreground font-medium capitalize">
                {pathname === '/dashboard' ? 'Overview' : pathname.split('/').pop()?.replace('-', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/import"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Submit Post
              </Link>
              <a
                href="http://localhost:5001/api/v1/health"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5 transition-colors"
              >
                Health Check <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-y-auto">{children}</main>
        </div>
      </div>
    </Providers>
  );
}
