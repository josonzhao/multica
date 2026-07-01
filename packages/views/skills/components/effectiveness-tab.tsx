"use client";

import { BarChart3, Clock, Percent, Zap } from "lucide-react";
import type { SkillEffectiveness } from "@multica/core/types";
import { useQuery } from "@tanstack/react-query";
import { skillEffectivenessOptions } from "@multica/core/workspace/queries";
import { useWorkspaceId } from "@multica/core/hooks";
import { useTimeAgo, useT } from "../../i18n";
import { KpiCard } from "../../runtimes/components/shared";
import { AlertCircle } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@multica/ui/components/ui/empty";
import { Skeleton } from "@multica/ui/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatDuration(ms: number): string {
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}m`;
  if (ms >= 1_000) return `${(ms / 1_000).toFixed(1)}s`;
  return `${ms}ms`;
}

function successRate(data: SkillEffectiveness): number {
  if (data.usage_count === 0) return 0;
  return Math.round((data.success_count / data.usage_count) * 100);
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function EffectivenessSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border">
        <div className="border-b px-4 py-2">
          <Skeleton className="h-4 w-32" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function EffectivenessError({ message }: { message: string }) {
  const { t } = useT("skills");
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm font-medium">{t(($) => $.detail.effectiveness.error_title)}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EffectivenessEmpty() {
  const { t } = useT("skills");
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BarChart3 className="h-4 w-4" />
        </EmptyMedia>
        <EmptyTitle>{t(($) => $.detail.effectiveness.empty_title)}</EmptyTitle>
        <EmptyDescription>
          {t(($) => $.detail.effectiveness.empty_description)}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

// ---------------------------------------------------------------------------
// Per-agent breakdown table
// ---------------------------------------------------------------------------

function AgentBreakdown({ data }: { data: SkillEffectiveness }) {
  const { t } = useT("skills");
  if (data.per_agent.length === 0) return null;

  const sorted = [...data.per_agent].sort(
    (a, b) => b.usage_count - a.usage_count,
  );

  return (
    <div className="rounded-lg border">
      <div className="border-b px-4 py-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t(($) => $.detail.effectiveness.agent_breakdown_title)}
        </h3>
      </div>
      <div className="divide-y">
        <div className="grid grid-cols-3 gap-2 px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <span>{t(($) => $.detail.effectiveness.col_agent)}</span>
          <span className="text-right">{t(($) => $.detail.effectiveness.col_runs)}</span>
          <span className="text-right">{t(($) => $.detail.effectiveness.col_success)}</span>
        </div>
        {sorted.map((row) => {
          const rate =
            row.usage_count > 0
              ? Math.round((row.success_count / row.usage_count) * 100)
              : 0;
          return (
            <div
              key={row.agent_id}
              className="grid grid-cols-3 gap-2 px-4 py-2 text-sm tabular-nums"
            >
              <span className="truncate">{row.agent_name}</span>
              <span className="text-right">{row.usage_count}</span>
              <span className="text-right">{rate}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function EffectivenessTab({ skillId }: { skillId: string }) {
  const { t } = useT("skills");
  const timeAgo = useTimeAgo();
  const wsId = useWorkspaceId();

  const { data, isLoading, error } = useQuery(
    skillEffectivenessOptions(wsId, skillId),
  );

  if (isLoading) return <EffectivenessSkeleton />;

  if (error) {
    return (
      <EffectivenessError
        message={error instanceof Error ? error.message : t(($) => $.detail.effectiveness.error_description)}
      />
    );
  }

  if (!data || data.usage_count === 0) return <EffectivenessEmpty />;

  const rate = successRate(data);

  return (
    <div className="space-y-4 p-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-card">
          <KpiCard
            label={t(($) => $.detail.effectiveness.kpi_usage)}
            value={String(data.usage_count)}
            hint={
              <span className="inline-flex items-center gap-1">
                <Percent className="h-3 w-3" />
                {t(($) => $.detail.effectiveness.kpi_success_rate, { rate })}
              </span>
            }
          />
        </div>
        <div className="rounded-lg border bg-card">
          <KpiCard
            label={t(($) => $.detail.effectiveness.kpi_tokens)}
            value={formatTokens(data.total_tokens)}
          />
        </div>
        <div className="rounded-lg border bg-card">
          <KpiCard
            label={t(($) => $.detail.effectiveness.kpi_avg_duration)}
            value={formatDuration(data.avg_duration_ms)}
            hint={
              <span className="inline-flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {t(($) => $.detail.effectiveness.kpi_failures, {
                  count: data.failure_count,
                })}
              </span>
            }
          />
        </div>
        <div className="rounded-lg border bg-card">
          <KpiCard
            label={t(($) => $.detail.effectiveness.kpi_last_used)}
            value={data.last_used_at ? timeAgo(data.last_used_at) : "—"}
            hint={
              data.last_used_at ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(data.last_used_at).toLocaleString()}
                </span>
              ) : undefined
            }
          />
        </div>
      </div>

      {/* Per-agent breakdown */}
      <AgentBreakdown data={data} />
    </div>
  );
}
