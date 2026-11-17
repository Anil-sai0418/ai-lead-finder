'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Settings, ShieldCheck, Key, Database, Activity, Sparkles, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const [testText, setTestText] = useState(
    'Looking for a full-stack Next.js developer to build an MVP. Budget is $5,000. Need it in 4 weeks.'
  );
  const [previewResult, setPreviewResult] = useState<any | null>(null);

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => apiClient<any>('/health'),
    refetchInterval: 15000,
  });

  const previewMutation = useMutation({
    mutationFn: (content: string) =>
      apiClient<any>('/ai/classify-preview', {
        method: 'POST',
        body: JSON.stringify({ content, contentLevel: 'FULL_TEXT' }),
      }),
    onSuccess: (res) => {
      setPreviewResult(res);
    },
  });

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System & AI Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review system health diagnostics, external integration configurations, and test Gemini AI classification logic.
        </p>
      </div>

      {/* System Health Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Platform Connectivity Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-secondary/40 border border-border space-y-1">
              <span className="text-muted-foreground block text-[11px]">System Status</span>
              <div className="flex items-center gap-2 font-bold text-sm">
                <Badge
                  variant={
                    health?.status === 'healthy'
                      ? 'success'
                      : health?.status === 'degraded'
                      ? 'warning'
                      : 'destructive'
                  }
                >
                  {healthLoading ? 'Checking...' : health?.status?.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-secondary/40 border border-border space-y-1">
              <span className="text-muted-foreground block text-[11px]">PostgreSQL Database</span>
              <div className="font-semibold text-foreground text-sm capitalize">
                {health?.services?.database || 'Pending Check'}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-secondary/40 border border-border space-y-1">
              <span className="text-muted-foreground block text-[11px]">Redis & BullMQ Queues</span>
              <div className="font-semibold text-foreground text-sm capitalize">
                {health?.services?.redis || 'Pending Check'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credentials & Architecture Security Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" /> Credentials & Architecture Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <p>
            In strict compliance with production security standards, sensitive secrets (such as Google Gemini API keys,
            X API Bearer Tokens, and database credentials) are stored securely in backend server environment variables
            (<code className="text-primary font-mono">.env</code>) and are <strong>never</strong> exposed or returned to the browser.
          </p>
          <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-1">
            <div className="font-semibold text-foreground">Configured Models & Endpoints:</div>
            <div>&bull; Gemini Model: <code className="text-primary font-mono">gemini-1.5-flash</code> (with JSON schema mode)</div>
            <div>&bull; X API Endpoint: <code className="text-primary font-mono">https://api.x.com/2/tweets/search/recent</code></div>
            <div>&bull; Queue Engine: Redis 7 + BullMQ</div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time AI Sandbox Classification Tester */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Real-time Classification & Scoring Sandbox
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Test any arbitrary post text against the live Gemini classification prompt and deterministic 100-point scoring engine.
          </p>

          <div>
            <textarea
              rows={3}
              className="w-full rounded-md border border-input bg-card p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
            />
          </div>

          <Button
            size="sm"
            onClick={() => previewMutation.mutate(testText)}
            disabled={previewMutation.isPending}
          >
            {previewMutation.isPending ? 'Analyzing...' : 'Run Real-time Analysis'}
          </Button>

          {previewResult && (
            <div className="mt-4 p-4 rounded-xl bg-secondary/40 border border-border text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Analysis Result:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="success">
                    {previewResult.classification.classification}
                  </Badge>
                  <Badge variant="high">
                    {previewResult.scoreResult.score} / 100 PTS
                  </Badge>
                </div>
              </div>

              <div className="text-muted-foreground">
                <strong>Reason:</strong> {previewResult.classification.reason}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-muted-foreground">Technologies:</span>{' '}
                  <span className="text-foreground font-semibold">
                    {previewResult.classification.technologies.join(', ') || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Extracted Budget:</span>{' '}
                  <span className="text-emerald-400 font-semibold">
                    {previewResult.classification.budget || 'None'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
