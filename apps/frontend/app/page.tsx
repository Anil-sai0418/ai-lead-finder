import Link from 'next/link';
import { Search, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 h-16 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>AI Lead Finder</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Launch Dashboard
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          Production Lead Discovery & Classification Engine
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
          Find High-Intent Software Projects <br className="hidden sm:inline" />
          <span className="text-primary">Before Anyone Else</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl">
          Automated multi-source discovery, Google Gemini project requirement extraction, and
          100-point deterministic scoring to identify genuine clients looking to hire developers.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            Explore Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="http://localhost:5001/api/v1/health"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground font-semibold transition-colors"
          >
            System Health API
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Multi-Source Discovery</h3>
            <p className="text-sm text-muted-foreground">
              Official X Recent Search, Google Search Result snippet import, and manual submission pipelines.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Gemini Fact Extraction</h3>
            <p className="text-sm text-muted-foreground">
              Structured JSON classification distinguishing true buyers from job seekers, extracting budgets, tech stacks, and scopes.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Deterministic Scoring</h3>
            <p className="text-sm text-muted-foreground">
              Calculates 0–100 scores using strict backend business rules, prioritizing actionable opportunities without hallucination.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        AI Lead Finder &bull; Built with Next.js 15, Express, Prisma, BullMQ, and Google Gemini
      </footer>
    </div>
  );
}
