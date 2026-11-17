'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export default function AllLeadsPage() {
  const [search, setSearch] = useState('');
  const [classification, setClassification] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', '15');
  if (search) queryParams.set('search', search);
  if (classification) queryParams.set('classification', classification);
  if (priority) queryParams.set('priority', priority);
  if (status) queryParams.set('status', status);
  if (sortBy) queryParams.set('sortBy', sortBy);

  const { data, isLoading } = useQuery({
    queryKey: ['leads', queryParams.toString()],
    queryFn: () =>
      apiClient<{
        items: Array<any>;
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>(`/leads?${queryParams.toString()}`),
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discovered Opportunities</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Filter, inspect, and qualify software development opportunities discovered from social platforms.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search projects & scope..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Classification Filter */}
            <select
              aria-label="Filter by classification"
              className="h-9 px-3 text-sm rounded-md border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              value={classification}
              onChange={(e) => {
                setClassification(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Classifications</option>
              <option value="QUALIFIED_LEAD">Qualified Lead</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="NOT_A_LEAD">Not A Lead</option>
            </select>

            {/* Priority Filter */}
            <select
              aria-label="Filter by priority"
              className="h-9 px-3 text-sm rounded-md border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Priorities</option>
              <option value="HIGH">High (80-100)</option>
              <option value="MEDIUM">Medium (60-79)</option>
              <option value="LOW">Low (40-59)</option>
            </select>

            {/* Status Filter */}
            <select
              aria-label="Filter by status"
              className="h-9 px-3 text-sm rounded-md border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="INTERESTED">Interested</option>
              <option value="CONTACTED">Contacted</option>
              <option value="CLOSED">Closed</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Sort Order */}
            <select
              aria-label="Sort leads by"
              className="h-9 px-3 text-sm rounded-md border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="highest_score">Sort: Highest Score</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/40 text-muted-foreground text-xs uppercase border-b border-border">
                <tr>
                  <th className="py-3 px-4">Opportunity & Scope</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Technologies</th>
                  <th className="py-3 px-4">Budget / Timeline</th>
                  <th className="py-3 px-4">Score & Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      Loading opportunities...
                    </td>
                  </tr>
                )}

                {!isLoading && data?.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      No leads matching the selected criteria.
                    </td>
                  </tr>
                )}

                {data?.items.map((lead) => (
                  <tr key={lead.id} className="hover:bg-accent/40 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors block line-clamp-1"
                      >
                        {lead.projectTitle || 'Software Development Opportunity'}
                      </Link>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {lead.projectDescription || lead.reason}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground uppercase">
                        {lead.post?.source}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-[180px]">
                      <div className="flex flex-wrap gap-1">
                        {lead.technologies?.slice(0, 3).map((t: string) => (
                          <span
                            key={t}
                            className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20"
                          >
                            {t}
                          </span>
                        ))}
                        {lead.technologies?.length > 3 && (
                          <span className="text-[11px] text-muted-foreground">
                            +{lead.technologies.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs space-y-0.5">
                      {lead.budget ? (
                        <div className="text-emerald-400 font-semibold">{lead.budget}</div>
                      ) : (
                        <div className="text-muted-foreground">Budget: Not stated</div>
                      )}
                      {lead.deadline && (
                        <div className="text-muted-foreground text-[11px]">Due: {lead.deadline}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{lead.leadScore}</span>
                        <Badge
                          variant={
                            lead.priority === 'HIGH'
                              ? 'high'
                              : lead.priority === 'MEDIUM'
                              ? 'medium'
                              : 'low'
                          }
                        >
                          {lead.priority}
                        </Badge>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          lead.status === 'INTERESTED' || lead.status === 'CONTACTED'
                            ? 'success'
                            : lead.status === 'REVIEWED'
                            ? 'default'
                            : lead.status === 'REJECTED'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {lead.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-secondary hover:bg-accent text-secondary-foreground transition-colors"
                      >
                        Details &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <div>
                Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} leads)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
