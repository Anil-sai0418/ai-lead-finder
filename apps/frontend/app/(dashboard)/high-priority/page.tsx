'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Flame, ExternalLink, ArrowRight, DollarSign, Calendar, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function HighPriorityLeadsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['high-priority-leads'],
    queryFn: () =>
      apiClient<{
        items: Array<any>;
        pagination: { total: number };
      }>('/leads?priority=HIGH&minScore=80&sortBy=highest_score&limit=50'),
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">High Priority Opportunities</h1>
            <Badge variant="high" className="text-xs px-2.5 py-0.5">
              Score 80-100
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Top actionable software development requirements with explicit hiring intent, defined budget, and scope.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="py-20 text-center text-muted-foreground text-sm">
          Loading high priority opportunities...
        </div>
      )}

      {!isLoading && data?.items.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          <Flame className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground">No high-priority leads yet</h3>
          <p className="text-sm mt-1 max-w-md mx-auto">
            Run automated X searches or import Google search snippets to discover high-budget client opportunities.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/dashboard/searches"
              className="text-xs font-semibold px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Run Search Query
            </Link>
            <Link
              href="/dashboard/import"
              className="text-xs font-semibold px-4 py-2 rounded-md border border-border bg-card hover:bg-accent"
            >
              Import Snippets
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {data?.items.map((lead) => (
          <Card key={lead.id} className="border-border hover:border-emerald-500/40 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="high">{lead.leadScore} / 100 PTS</Badge>
                    <span className="text-xs text-muted-foreground uppercase">{lead.post?.source}</span>
                  </div>
                  <Link
                    href={`/dashboard/leads/${lead.id}`}
                    className="font-bold text-base hover:text-primary transition-colors block line-clamp-1 pt-1"
                  >
                    {lead.projectTitle || 'Software Development Opportunity'}
                  </Link>
                </div>
                <Badge
                  variant={
                    lead.status === 'INTERESTED' || lead.status === 'CONTACTED'
                      ? 'success'
                      : lead.status === 'REVIEWED'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {lead.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {lead.projectDescription || lead.reason}
              </p>

              {/* Technologies */}
              <div className="flex flex-wrap gap-1.5">
                {lead.technologies?.map((tech: string) => (
                  <span
                    key={tech}
                    className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Key Commercial Metrics */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-secondary/30 border border-border/50 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Budget</span>
                  <span className="font-semibold text-emerald-400">
                    {lead.budget || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Timeline</span>
                  <span className="font-semibold text-foreground">
                    {lead.deadline || 'Flexible / Unspecified'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs border-t border-border/50">
                <span className="text-muted-foreground">Discovered {formatDate(lead.createdAt)}</span>
                <Link
                  href={`/dashboard/leads/${lead.id}`}
                  className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  Inspect Full Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
