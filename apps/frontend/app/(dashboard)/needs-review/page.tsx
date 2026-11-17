'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HelpCircle, Check, X, Edit3, ExternalLink, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';

export default function NeedsReviewPage() {
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [reviewClassification, setReviewClassification] = useState<'QUALIFIED_LEAD' | 'NOT_A_LEAD'>('QUALIFIED_LEAD');
  const [reviewNote, setReviewNote] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customBudget, setCustomBudget] = useState('');
  const [customDeadline, setCustomDeadline] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['needs-review-leads'],
    queryFn: () =>
      apiClient<{
        items: Array<any>;
        pagination: { total: number };
      }>('/leads?classification=NEEDS_REVIEW&limit=50'),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return apiClient(`/leads/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['needs-review-leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSelectedLead(null);
      setReviewNote('');
    },
  });

  const handleOpenReview = (lead: any) => {
    setSelectedLead(lead);
    setReviewClassification('QUALIFIED_LEAD');
    setCustomTitle(lead.projectTitle || '');
    setCustomBudget(lead.budget || '');
    setCustomDeadline(lead.deadline || '');
    setReviewNote('Verified project hiring requirements during human review.');
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    reviewMutation.mutate({
      id: selectedLead.id,
      payload: {
        classification: reviewClassification,
        isHiring: reviewClassification === 'QUALIFIED_LEAD',
        projectTitle: customTitle || selectedLead.projectTitle,
        projectDescription: selectedLead.projectDescription,
        technologies: selectedLead.technologies,
        budget: customBudget || null,
        deadline: customDeadline || null,
        reviewNote,
      },
    });
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review Triage Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Posts flagged as ambiguous, vague startup exploration, or search snippets requiring human verification.
        </p>
      </div>

      {isLoading && (
        <div className="py-20 text-center text-muted-foreground text-sm">
          Loading items requiring review...
        </div>
      )}

      {!isLoading && data?.items.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          <HelpCircle className="w-12 h-12 text-emerald-400/40 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground">Queue is clear!</h3>
          <p className="text-sm mt-1 max-w-md mx-auto">
            All discovered opportunities have been classified with high confidence.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data?.items.map((lead) => (
          <Card key={lead.id} className="border-border flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">Needs Review</Badge>
                    <span className="text-xs text-muted-foreground uppercase">{lead.post?.source}</span>
                    <span className="text-xs text-muted-foreground">({lead.post?.contentLevel})</span>
                  </div>
                  <h3 className="font-semibold text-base pt-1">
                    {lead.projectTitle || 'Uncertain Project Opportunity'}
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatDate(lead.createdAt)}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                {lead.post?.content}
              </div>

              <div className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">AI Reason:</span>
                  <span>{lead.reason}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-border">
                <a
                  href={lead.post?.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  Source URL <ExternalLink className="w-3 h-3" />
                </a>

                <Button size="sm" onClick={() => handleOpenReview(lead)}>
                  <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Correct Classification
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review Modal Form */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Human Review & Decision</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReview} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                    Original Post
                  </label>
                  <p className="text-xs p-2.5 rounded bg-secondary text-muted-foreground line-clamp-3">
                    {selectedLead.post?.content}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Final Classification Decision
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewClassification('QUALIFIED_LEAD')}
                      className={`px-3 py-2 text-xs font-semibold rounded-md border text-center transition-colors ${
                        reviewClassification === 'QUALIFIED_LEAD'
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                          : 'border-border bg-card text-muted-foreground'
                      }`}
                    >
                      &check; Qualified Lead
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewClassification('NOT_A_LEAD')}
                      className={`px-3 py-2 text-xs font-semibold rounded-md border text-center transition-colors ${
                        reviewClassification === 'NOT_A_LEAD'
                          ? 'border-red-500 bg-red-500/15 text-red-400'
                          : 'border-border bg-card text-muted-foreground'
                      }`}
                    >
                      &cross; Reject (Not a Lead)
                    </button>
                  </div>
                </div>

                {reviewClassification === 'QUALIFIED_LEAD' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Project Title</label>
                      <Input
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="e.g., E-Commerce Next.js Development"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Budget</label>
                        <Input
                          value={customBudget}
                          onChange={(e) => setCustomBudget(e.target.value)}
                          placeholder="e.g., $5,000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Deadline</label>
                        <Input
                          value={customDeadline}
                          onChange={(e) => setCustomDeadline(e.target.value)}
                          placeholder="e.g., 4 weeks"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Decision Note (Auditing Reason)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-input bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLead(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={reviewMutation.isPending}>
                    {reviewMutation.isPending ? 'Saving...' : 'Confirm Decision'}
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
