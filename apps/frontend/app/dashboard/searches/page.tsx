'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Play,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';

export default function SearchManagementPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Frontend Development');
  const [source, setSource] = useState<'TWITTER' | 'GOOGLE_IMPORT' | 'MANUAL'>('TWITTER');
  const [frequency, setFrequency] = useState('DAILY');
  const [maxResults, setMaxResults] = useState(20);

  const { data: queries, isLoading } = useQuery({
    queryKey: ['searches'],
    queryFn: () => apiClient<Array<any>>('/searches'),
  });

  const { data: executions } = useQuery({
    queryKey: ['search-executions'],
    queryFn: () =>
      apiClient<{ items: Array<any>; pagination: { total: number } }>('/executions?limit=10'),
  });

  const createMutation = useMutation({
    mutationFn: (newQuery: any) =>
      apiClient('/searches', {
        method: 'POST',
        body: JSON.stringify(newQuery),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searches'] });
      setShowAddModal(false);
      setName('');
      setQuery('');
    },
  });

  const runMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/searches/${id}/run`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searches'] });
      queryClient.invalidateQueries({ queryKey: ['search-executions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/searches/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searches'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      query,
      category,
      source,
      frequency,
      maxResults: Number(maxResults),
      isActive: true,
    });
  };

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Search Query Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure automated discovery queries across social platforms, set frequencies, and monitor search executions.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Search Query
        </Button>
      </div>

      {/* Query Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading && (
          <div className="col-span-full py-12 text-center text-muted-foreground text-sm">
            Loading configured searches...
          </div>
        )}

        {!isLoading && queries?.length === 0 && (
          <div className="col-span-full p-8 text-center border border-dashed rounded-xl border-border text-muted-foreground text-sm">
            No search queries created yet. Click &quot;Add Search Query&quot; to configure your first discovery job.
          </div>
        )}

        {queries?.map((q) => (
          <Card key={q.id} className="border-border flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="outline" className="text-[11px] font-semibold mb-1">
                    {q.category}
                  </Badge>
                  <CardTitle className="text-base">{q.name}</CardTitle>
                </div>
                <Badge variant={q.isActive ? 'success' : 'secondary'}>
                  {q.isActive ? 'Active' : 'Paused'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="p-2.5 rounded bg-secondary/60 text-xs font-mono text-muted-foreground break-all">
                &ldquo;{q.query}&rdquo;
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="block text-[11px]">Source</span>
                  <span className="font-medium text-foreground uppercase">{q.source}</span>
                </div>
                <div>
                  <span className="block text-[11px]">Frequency</span>
                  <span className="font-medium text-foreground">{q.frequency}</span>
                </div>
                <div>
                  <span className="block text-[11px]">Max Results</span>
                  <span className="font-medium text-foreground">{q.maxResults} posts</span>
                </div>
                <div>
                  <span className="block text-[11px]">Last Run</span>
                  <span className="font-medium text-foreground">
                    {q.lastExecutedAt ? formatDate(q.lastExecutedAt) : 'Never'}
                  </span>
                </div>
              </div>

              {q.lastExecution && (
                <div className="text-[11px] p-2 rounded bg-card border border-border flex items-center justify-between">
                  <span className="text-muted-foreground">Last Yield:</span>
                  <span className="font-semibold text-emerald-400">
                    +{q.lastExecution.qualifiedLeads} Qualified Leads
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runMutation.mutate(q.id)}
                  disabled={runMutation.isPending}
                >
                  <Play className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  {runMutation.isPending ? 'Running...' : 'Run Now'}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300"
                  onClick={() => deleteMutation.mutate(q.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Execution History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Execution Audit History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">Search Query</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Discovered</th>
                  <th className="py-2.5 px-4">New Posts</th>
                  <th className="py-2.5 px-4">Duplicates</th>
                  <th className="py-2.5 px-4">Qualified</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {executions?.items.map((exec) => (
                  <tr key={exec.id}>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {exec.searchQuery?.name || 'Manual Query'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge
                          variant={
                            exec.status === 'COMPLETED'
                              ? 'success'
                              : exec.status === 'RUNNING'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {exec.status}
                        </Badge>
                        {exec.errorMessage && (
                          <span
                            className="text-[11px] text-red-400 font-normal max-w-[220px] truncate block cursor-help"
                            title={exec.errorMessage}
                          >
                            {exec.errorMessage.includes('402') || exec.errorMessage.includes('credits depleted')
                              ? 'X API: Credits depleted (402)'
                              : exec.errorMessage}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">{exec.resultsFound}</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">{exec.newPosts}</td>
                    <td className="py-3 px-4 text-muted-foreground">{exec.duplicates}</td>
                    <td className="py-3 px-4 text-primary font-bold">+{exec.qualifiedLeads}</td>
                    <td className="py-3 px-4 text-muted-foreground">{formatDate(exec.startedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Create Social Search Query</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold mb-1">Query Label</label>
                  <Input
                    placeholder="e.g. Next.js SaaS Developers"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Search Phrase / Operators</label>
                  <Input
                    placeholder='e.g. "looking for a React developer"'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Uses official platform operators. Example: &quot;need a developer&quot; OR &quot;looking to hire&quot;
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Category</label>
                    <select
                      className="w-full h-9 px-3 rounded-md border border-input bg-card text-foreground text-xs"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Frontend Development">Frontend Development</option>
                      <option value="Backend Development">Backend Development</option>
                      <option value="Software Agencies">Software Agencies</option>
                      <option value="SaaS Projects">SaaS Projects</option>
                      <option value="AI Projects">AI Projects</option>
                      <option value="Mobile Apps">Mobile Apps</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Platform Source</label>
                    <select
                      className="w-full h-9 px-3 rounded-md border border-input bg-card text-foreground text-xs"
                      value={source}
                      onChange={(e) => setSource(e.target.value as any)}
                    >
                      <option value="TWITTER">X (Twitter)</option>
                      <option value="GOOGLE_IMPORT">Google CSE Import</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Execution Schedule</label>
                    <select
                      className="w-full h-9 px-3 rounded-md border border-input bg-card text-foreground text-xs"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                    >
                      <option value="HOURLY">Hourly</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MANUAL">Manual Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Max Results Per Run</label>
                    <Input
                      type="number"
                      min={5}
                      max={100}
                      value={maxResults}
                      onChange={(e) => setMaxResults(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Saving...' : 'Create Query'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
