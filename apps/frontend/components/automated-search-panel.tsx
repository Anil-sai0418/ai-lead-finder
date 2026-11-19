'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Sparkles,
  ExternalLink,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TargetPlatform, AutomatedSearchExecutionSummary } from '@ai-lead-finder/shared';

const SUGGESTED_QUERIES = [
  {
    label: 'Looking for a Developer',
    query: 'site:linkedin.com/posts "looking for a developer"',
    platform: 'linkedin' as TargetPlatform,
  },
  {
    label: 'Freelance Developer Needed',
    query: 'site:linkedin.com/posts "need a freelance developer"',
    platform: 'linkedin' as TargetPlatform,
  },
  {
    label: 'Software Agency Subcontracting',
    query: 'site:linkedin.com/posts "looking for a software development agency"',
    platform: 'linkedin' as TargetPlatform,
  },
  {
    label: 'Build an Application / MVP',
    query: 'site:linkedin.com/posts "need someone to build an application"',
    platform: 'linkedin' as TargetPlatform,
  },
  {
    label: 'Web Developer Hiring',
    query: 'site:linkedin.com/posts "looking for a web developer"',
    platform: 'linkedin' as TargetPlatform,
  },
];

export function AutomatedSearchPanel() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('site:linkedin.com/posts "looking for a developer"');
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>('linkedin');
  const [maxResults, setMaxResults] = useState(10);
  const [searchDepth, setSearchDepth] = useState<'basic' | 'advanced'>('basic');
  const [summary, setSummary] = useState<AutomatedSearchExecutionSummary | null>(null);

  const searchMutation = useMutation({
    mutationFn: (payload: {
      query: string;
      targetPlatform: TargetPlatform;
      maxResults: number;
      searchDepth: 'basic' | 'advanced';
    }) =>
      apiClient<{ data: AutomatedSearchExecutionSummary }>('/searches/automated', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (res) => {
      setSummary(res.data);
      // Invalidate dashboard queries so newly discovered leads update instantly
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['search-executions'] });
      queryClient.invalidateQueries({ queryKey: ['recent-leads'] });
    },
  });

  const handleExecuteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    searchMutation.mutate({
      query: query.trim(),
      targetPlatform,
      maxResults: Number(maxResults),
      searchDepth,
    });
  };

  const handleApplyPreset = (presetQuery: string, platform: TargetPlatform) => {
    setQuery(presetQuery);
    setTargetPlatform(platform);
  };

  return (
    <div className="space-y-6">
      {/* Search Configuration Form */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Tavily Automated Lead Discovery
            </CardTitle>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Compliant Public Index Search
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Automatically discover public posts across social platforms and developer communities using Tavily Search API. Discovered opportunities are deduplicated and classified in real-time with Google Gemini.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Preset Suggested Queries */}
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Suggested High-Intent Queries:
            </span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(item.query, item.platform)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all text-left ${
                    query === item.query
                      ? 'bg-primary/15 text-primary border-primary/30 font-semibold'
                      : 'bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleExecuteSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">
                Search Query <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. site:linkedin.com/posts 'looking for a developer'"
                  className="pl-9 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Target Platform</label>
                <select
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(e.target.value as TargetPlatform)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-card text-foreground text-xs"
                >
                  <option value="linkedin">LinkedIn (site:linkedin.com/posts)</option>
                  <option value="general_web">General Web (All Public Sources)</option>
                  <option value="twitter">X / Twitter</option>
                  <option value="github">GitHub Issues & Discussions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Max Results</label>
                <select
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-md border border-input bg-card text-foreground text-xs"
                >
                  <option value={5}>5 Posts</option>
                  <option value={10}>10 Posts (Recommended)</option>
                  <option value={20}>20 Posts</option>
                  <option value={25}>25 Posts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Search Depth</label>
                <select
                  value={searchDepth}
                  onChange={(e) => setSearchDepth(e.target.value as 'basic' | 'advanced')}
                  className="w-full h-9 px-3 rounded-md border border-input bg-card text-foreground text-xs"
                >
                  <option value="basic">Basic (Fastest)</option>
                  <option value="advanced">Advanced (Deep Web Extraction)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border">
              <span className="text-[11px] text-muted-foreground">
                * Tavily queries public search indexes. It does not access private profiles or bypass authentication.
              </span>

              <Button type="submit" disabled={searchMutation.isPending} className="shrink-0">
                {searchMutation.isPending ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Discovering & Classifying...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-1.5" /> Run Automated Discovery
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Error Banner */}
          {searchMutation.isError && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-sm">Automated Search Failed</div>
                <div className="mt-1 leading-relaxed">{searchMutation.error.message}</div>
                {searchMutation.error.message.includes('TAVILY_API_KEY') && (
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    Tip: Add <code className="text-foreground bg-muted px-1 py-0.5 rounded">TAVILY_API_KEY=tvly-...</code> to your backend <code className="text-foreground bg-muted px-1 py-0.5 rounded">.env</code> file.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Summary KPI Card */}
      {summary && (
        <Card className="border-emerald-500/30 bg-emerald-950/10">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Search Execution Summary
              </CardTitle>
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" /> {(summary.durationMs / 1000).toFixed(1)}s elapsed
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
              <div className="p-2.5 rounded-lg bg-secondary/50 border border-border">
                <span className="text-[11px] text-muted-foreground block">Retrieved</span>
                <span className="text-lg font-bold text-foreground">{summary.totalRetrieved}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/50 border border-border">
                <span className="text-[11px] text-muted-foreground block">New Posts</span>
                <span className="text-lg font-bold text-foreground">{summary.newDiscovered}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/50 border border-border">
                <span className="text-[11px] text-muted-foreground block">Duplicates Skipped</span>
                <span className="text-lg font-bold text-muted-foreground">{summary.duplicatesSkipped}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/50 border border-border">
                <span className="text-[11px] text-muted-foreground block">Sent to AI</span>
                <span className="text-lg font-bold text-sky-400">{summary.sentForClassification}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[11px] text-emerald-400 font-semibold block">Qualified Leads</span>
                <span className="text-lg font-bold text-emerald-400">+{summary.qualifiedLeads}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="text-[11px] text-amber-400 font-semibold block">Needs Review</span>
                <span className="text-lg font-bold text-amber-400">{summary.needsReview}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/50 border border-border">
                <span className="text-[11px] text-zinc-400 block">Not a Lead</span>
                <span className="text-lg font-bold text-zinc-400">{summary.notALead}</span>
              </div>
            </div>

            {/* Results Stream */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Discovered Opportunities ({summary.items.length})
              </h4>

              {summary.items.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg border-border">
                  No new opportunities extracted from this search query. Try broadening your keywords.
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.items.map((item, index) => (
                    <div
                      key={item.postId || index}
                      className="p-4 rounded-lg bg-card border border-border hover:border-border/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.classification && (
                            <Badge
                              variant={
                                item.classification === 'QUALIFIED_LEAD'
                                  ? 'success'
                                  : item.classification === 'NEEDS_REVIEW'
                                  ? 'warning'
                                  : 'destructive'
                              }
                            >
                              {item.classification.replace('_', ' ')}
                            </Badge>
                          )}

                          {item.leadScore !== undefined && (
                            <Badge
                              variant={
                                item.priority === 'HIGH'
                                  ? 'high'
                                  : item.priority === 'MEDIUM'
                                  ? 'medium'
                                  : 'low'
                              }
                            >
                              <Flame className="w-3 h-3 mr-1" />
                              {item.leadScore} pts &bull; {item.priority}
                            </Badge>
                          )}

                          {item.isDuplicate && (
                            <Badge variant="outline" className="text-muted-foreground text-[10px]">
                              Existing Duplicate
                            </Badge>
                          )}

                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {item.contentLevel}
                          </Badge>
                        </div>

                        <h5 className="font-semibold text-sm text-foreground truncate">
                          {item.title || 'Client Project Requirement'}
                        </h5>

                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.projectDescription || item.reason || 'No detailed scope extracted from snippet.'}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                          {item.budget && (
                            <span className="text-emerald-400 font-semibold">Budget: {item.budget}</span>
                          )}
                          {item.deadline && (
                            <span className="text-foreground">Deadline: {item.deadline}</span>
                          )}
                          {item.technologies && item.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.technologies.slice(0, 3).map((t) => (
                                <span
                                  key={t}
                                  className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium"
                                >
                                  {t}
                                </span>
                              ))}
                              {item.technologies.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{item.technologies.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                        <a
                          href={item.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/30 transition-colors font-semibold"
                        >
                          <span>Live Post</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        {item.leadId ? (
                          <Link
                            href={`/dashboard/leads/${item.leadId}`}
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors font-medium"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
