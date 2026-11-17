'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ImportSubmitPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'manual' | 'google'>('manual');

  // Manual submission state
  const [manualUrl, setManualUrl] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualSource, setManualSource] = useState<'TWITTER' | 'GOOGLE_IMPORT' | 'MANUAL'>('MANUAL');
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);

  // Google import state
  const [googleTitle, setGoogleTitle] = useState('');
  const [googleSnippet, setGoogleSnippet] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [googleAuthor, setGoogleAuthor] = useState('');
  const [importSummary, setImportSummary] = useState<any | null>(null);

  const manualMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient<any>('/posts/manual', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setManualSuccessMsg(res.message || 'Post ingested successfully!');
      if (res.data?.lead?.id) {
        setTimeout(() => {
          router.push(`/dashboard/leads/${res.data.lead.id}`);
        }, 1200);
      }
    },
  });

  const googleMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient<any>('/posts/import-results', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setImportSummary(res.data);
      setGoogleTitle('');
      setGoogleSnippet('');
      setGoogleUrl('');
      setGoogleAuthor('');
    },
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualSuccessMsg(null);
    manualMutation.mutate({
      sourcePlatform: manualSource,
      originalUrl: manualUrl,
      content: manualContent,
      title: manualTitle || undefined,
      authorName: manualAuthor || undefined,
    });
  };

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    googleMutation.mutate({
      items: [
        {
          title: googleTitle,
          snippet: googleSnippet,
          originalUrl: googleUrl,
          authorName: googleAuthor || undefined,
          source: 'GOOGLE_IMPORT',
        },
      ],
    });
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lead Ingestion & Discovery Import</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit individual public posts or import Google Programmable Search Engine indexed snippets.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'manual'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Manual Post Submission
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('google')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'google'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Google Programmable Search Import
        </button>
      </div>

      {/* Tab 1: Manual Post Submission */}
      {activeTab === 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Direct Post Ingestion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {manualSuccessMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{manualSuccessMsg} Redirecting to lead detail...</span>
              </div>
            )}

            {manualMutation.isError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{manualMutation.error.message}</span>
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Source Platform</label>
                  <select
                    className="w-full h-9 px-3 rounded-md border border-input bg-card text-foreground text-xs"
                    value={manualSource}
                    onChange={(e) => setManualSource(e.target.value as any)}
                  >
                    <option value="MANUAL">Manual Entry</option>
                    <option value="TWITTER">X (Twitter)</option>
                    <option value="GOOGLE_IMPORT">LinkedIn / Web (Google Import)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Original Post URL</label>
                  <Input
                    type="url"
                    placeholder="https://twitter.com/author/status/..."
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Author Name (Optional)</label>
                  <Input
                    placeholder="e.g. Sarah Jenkins"
                    value={manualAuthor}
                    onChange={(e) => setManualAuthor(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Project Title / Headline (Optional)</label>
                  <Input
                    placeholder="e.g. Next.js SaaS MVP"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Post Content (Required)</label>
                <textarea
                  rows={5}
                  className="w-full rounded-md border border-input bg-card p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  placeholder="Paste the full post text here (e.g. Looking for a full-stack developer to build an MVP...)"
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={manualMutation.isPending}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {manualMutation.isPending ? 'Ingesting & Classifying...' : 'Ingest & Classify Post'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Google Search Result Import */}
      {activeTab === 'google' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
              <Info className="w-4 h-4 text-primary" /> Permitted Google Search Import Pipeline
            </div>
            <p>
              In strict adherence to platform guidelines and privacy standards, this application does not perform
              unauthorized HTML scraping of Google or LinkedIn search pages.
            </p>
            <p>
              Instead, you can paste publicly available indexed results or snippets from your configured Google
              Programmable Search Engine into this validator. The system normalizes the data, detects duplicates,
              and feeds candidate snippets into Gemini with the <code className="text-primary font-mono">SNIPPET_ONLY</code> content flag.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary" /> Import Search Snippet
              </CardTitle>
            </CardHeader>
            <CardContent>
              {importSummary && (
                <div className="mb-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                  <div className="font-semibold text-emerald-400">
                    Import Succeeded: {importSummary.processedCount} item(s) processed
                  </div>
                  <div className="text-muted-foreground">
                    Duplicates dropped: {importSummary.duplicateCount} &bull; Qualified leads:{' '}
                    {importSummary.qualifiedCount}
                  </div>
                </div>
              )}

              <form onSubmit={handleGoogleSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold mb-1">Post Title / Header</label>
                  <Input
                    placeholder="e.g. Looking for a Python Developer - Public Post"
                    value={googleTitle}
                    onChange={(e) => setGoogleTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Search Snippet</label>
                  <textarea
                    rows={4}
                    className="w-full rounded-md border border-input bg-card p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="e.g. ...we are seeking an agency or freelance team to build our healthcare patient portal..."
                    value={googleSnippet}
                    onChange={(e) => setGoogleSnippet(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Target URL</label>
                    <Input
                      type="url"
                      placeholder="https://linkedin.com/posts/..."
                      value={googleUrl}
                      onChange={(e) => setGoogleUrl(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Author Name (Optional)</label>
                    <Input
                      placeholder="e.g. Enterprise Client"
                      value={googleAuthor}
                      onChange={(e) => setGoogleAuthor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={googleMutation.isPending}>
                    {googleMutation.isPending ? 'Importing Snippet...' : 'Import to Discovery Pipeline'}
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
