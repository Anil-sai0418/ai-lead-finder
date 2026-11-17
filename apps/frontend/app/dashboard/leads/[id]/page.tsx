'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ExternalLink,
  Flame,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Mail,
  ShieldCheck,
  Brain,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params?.id as string;

  const [notes, setNotes] = useState('');
  const [hasLoadedNotes, setHasLoadedNotes] = useState(false);

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => apiClient<any>(`/leads/${id}`),
    enabled: !!id,
  });

  if (lead && !hasLoadedNotes) {
    setNotes(lead.notes || '');
    setHasLoadedNotes(true);
  }

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, newNotes }: { status: string; newNotes?: string }) =>
      apiClient(`/leads/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes: newNotes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground text-sm">Loading lead analysis...</div>;
  }

  if (!lead) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-lg font-bold">Opportunity Not Found</h2>
        <Link href="/dashboard/leads" className="text-primary hover:underline text-sm mt-2 inline-block">
          &larr; Back to all leads
        </Link>
      </div>
    );
  }

  const breakdown = lead.scoreBreakdown || {};

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/leads"
          className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Leads
        </Link>

        {lead.post?.originalUrl && (
          <a
            href={lead.post.originalUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-md border border-border hover:bg-accent inline-flex items-center gap-1.5 transition-colors"
          >
            Open Original Social Post <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Main Opportunity Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant={
                    lead.classification === 'QUALIFIED_LEAD'
                      ? 'success'
                      : lead.classification === 'NEEDS_REVIEW'
                      ? 'warning'
                      : 'destructive'
                  }
                >
                  {lead.classification.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground uppercase font-semibold">
                  Source: {lead.post?.source}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({lead.post?.contentLevel})
                </span>
              </div>
              <CardTitle className="text-xl">
                {lead.projectTitle || 'Software Development Project'}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Project Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Project Description
                </h4>
                <p className="text-sm text-foreground/90 leading-relaxed bg-secondary/30 p-4 rounded-lg border border-border/50">
                  {lead.projectDescription || 'No detailed scope extracted from original post.'}
                </p>
              </div>

              {/* Technologies */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Required Technologies & Stack
                </h4>
                <div className="flex flex-wrap gap-2">
                  {lead.technologies?.length > 0 ? (
                    lead.technologies.map((t: string) => (
                      <span
                        key={t}
                        className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 font-medium"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None explicitly specified in post</span>
                  )}
                </div>
              </div>

              {/* Commercial Extraction Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-secondary/40 border border-border">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Budget</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {lead.budget || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Deadline</span>
                  <span className="text-xs font-bold text-foreground">
                    {lead.deadline || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Start Date</span>
                  <span className="text-xs font-semibold text-foreground">
                    {lead.startDate || 'Immediate / Flexible'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Contact Method</span>
                  <span className="text-xs font-semibold text-foreground">
                    {lead.contactMethod || 'Public Reply / DM'}
                  </span>
                </div>
              </div>

              {/* Available Original Post Content */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Raw Original Post Content
                </h4>
                <div className="p-3.5 rounded-lg bg-card border border-border text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  {lead.post?.content}
                </div>
                {lead.post?.authorName && (
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Author: <span className="text-foreground font-medium">{lead.post.authorName}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Auditing & Fact Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" /> Gemini AI Classification Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                <span className="font-semibold block text-foreground mb-1">Reasoning:</span>
                <p className="text-muted-foreground leading-relaxed">{lead.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Hiring Intent</span>
                  <span className="font-semibold text-foreground">{lead.hiringIntent}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Model Confidence</span>
                  <span className="font-semibold text-foreground">{Math.round((lead.confidence || 0) * 100)}%</span>
                </div>
              </div>

              {lead.missingInformation?.length > 0 && (
                <div>
                  <span className="text-muted-foreground block mb-1">Missing Parameters (Not Hallucinated):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.missingInformation.map((m: string) => (
                      <span key={m} className="px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-400 text-[11px]">
                        Missing: {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Score Breakdown & Status Workflow */}
        <div className="space-y-6">
          {/* Deterministic Lead Score Gauge Card */}
          <Card>
            <CardHeader className="text-center pb-2">
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                Deterministic Lead Score
              </span>
              <div className="py-4">
                <div className="text-5xl font-black tracking-tight text-primary">
                  {lead.leadScore}
                  <span className="text-lg text-muted-foreground font-normal"> / 100</span>
                </div>
                <div className="mt-2">
                  <Badge
                    variant={
                      lead.priority === 'HIGH'
                        ? 'high'
                        : lead.priority === 'MEDIUM'
                        ? 'medium'
                        : 'low'
                    }
                  >
                    {lead.priority} PRIORITY
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-0 text-xs">
              <div className="border-t border-border pt-3 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Explicit Hiring (+30)</span>
                  <span className="font-bold">{breakdown.explicitHiring?.awardedPoints ?? 0} pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Budget Specified (+20)</span>
                  <span className="font-bold">{breakdown.budgetMentioned?.awardedPoints ?? 0} pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tech Stack (+15)</span>
                  <span className="font-bold">{breakdown.techRequirements?.awardedPoints ?? 0} pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Timeline / Deadline (+15)</span>
                  <span className="font-bold">{breakdown.timelineMentioned?.awardedPoints ?? 0} pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Clear Project Scope (+20)</span>
                  <span className="font-bold">{breakdown.clearScope?.awardedPoints ?? 0} pts</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Workflow Action */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Manage Opportunity Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                {['INTERESTED', 'CONTACTED', 'REVIEWED', 'CLOSED', 'REJECTED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateStatusMutation.mutate({ status: st, newNotes: notes })}
                    className={`px-3 py-2 rounded-md font-semibold text-center border transition-colors ${
                      lead.status === st
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card border-border hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Private Follow-up Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-input bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Record discovery call notes, proposal sent, outreach timestamps..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Button
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => updateStatusMutation.mutate({ status: lead.status, newNotes: notes })}
                  disabled={updateStatusMutation.isPending}
                >
                  Save Notes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
