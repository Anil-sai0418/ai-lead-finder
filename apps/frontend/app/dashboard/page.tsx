'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  CheckCircle2,
  Flame,
  HelpCircle,
  Calendar,
  XCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function DashboardOverviewPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () =>
      apiClient<{
        totalPosts: number;
        totalQualified: number;
        totalNeedsReview: number;
        totalRejected: number;
        totalHighPriority: number;
        todayDiscovered: number;
      }>('/dashboard/stats'),
  });

  const { data: sources } = useQuery({
    queryKey: ['source-distribution'],
    queryFn: () => apiClient<Array<{ source: string; count: number }>>('/dashboard/source-distribution'),
  });

  const { data: recentLeads } = useQuery({
    queryKey: ['recent-leads'],
    queryFn: () => apiClient<Array<any>>('/dashboard/recent-leads'),
  });

  const statCards = [
    {
      title: 'Discovered Posts',
      value: stats?.totalPosts ?? 0,
      icon: FileText,
      color: 'text-primary',
      bg: 'bg-primary/10',
      description: 'Total public posts ingested',
    },
    {
      title: 'Qualified Leads',
      value: stats?.totalQualified ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      description: 'Confirmed project hiring buyers',
    },
    {
      title: 'High Priority (80+)',
      value: stats?.totalHighPriority ?? 0,
      icon: Flame,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      description: 'Actionable opportunities with budget',
    },
    {
      title: 'Needs Review',
      value: stats?.totalNeedsReview ?? 0,
      icon: HelpCircle,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      description: 'Vague or snippet-only posts',
    },
    {
      title: 'Discovered Today',
      value: stats?.todayDiscovered ?? 0,
      icon: Calendar,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      description: 'Ingested within the last 24h',
    },
    {
      title: 'Rejected / Non-Leads',
      value: stats?.totalRejected ?? 0,
      icon: XCircle,
      color: 'text-zinc-400',
      bg: 'bg-zinc-500/10',
      description: 'Job seekers & promotions filtered',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opportunity Discovery Command</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time feed of software development opportunities classified with Google Gemini and deterministic scoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/high-priority"
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
          >
            <Flame className="w-3.5 h-3.5" /> View High-Priority Leads
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight">
                  {statsLoading ? '...' : stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Two Column Section: Source Breakdown & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Source Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Source Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(!sources || sources.length === 0) && (
              <p className="text-xs text-muted-foreground py-4">No sources ingested yet.</p>
            )}
            {sources?.map((item) => {
              const total = stats?.totalPosts || 1;
              const percent = Math.round((item.count / total) * 100);
              return (
                <div key={item.source} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="capitalize">{item.source.replace('_', ' ')}</span>
                    <span className="text-muted-foreground">
                      {item.count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Qualified Leads */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Recent Opportunities
            </CardTitle>
            <Link
              href="/dashboard/leads"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {(!recentLeads || recentLeads.length === 0) ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <p>No leads recorded yet.</p>
                <Link
                  href="/dashboard/import"
                  className="mt-3 inline-block text-xs text-primary underline"
                >
                  Submit or import a post now &rarr;
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          className="font-semibold text-sm hover:text-primary transition-colors truncate"
                        >
                          {lead.projectTitle || 'Software Development Project'}
                        </Link>
                        <Badge
                          variant={
                            lead.priority === 'HIGH'
                              ? 'high'
                              : lead.priority === 'MEDIUM'
                              ? 'medium'
                              : 'low'
                          }
                        >
                          {lead.leadScore} pts &bull; {lead.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {lead.projectDescription || lead.reason}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                        <span className="capitalize text-primary font-medium">
                          {lead.source || lead.post?.source || 'Public Feed'}
                        </span>
                        {(lead.originalUrl || lead.post?.originalUrl) && (
                          <a
                            href={lead.originalUrl || lead.post?.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline font-medium"
                          >
                            <span>Live Post</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {lead.budget && <span className="text-emerald-400 font-medium">Budget: {lead.budget}</span>}
                        {lead.deadline && <span>Deadline: {lead.deadline}</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(lead.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(lead.originalUrl || lead.post?.originalUrl) && (
                        <a
                          href={lead.originalUrl || lead.post?.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/30 transition-colors font-semibold"
                          title="Open original post on platform"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="hidden sm:inline">Post</span>
                        </a>
                      )}
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="shrink-0 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
