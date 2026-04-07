'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Droplets, Zap, Recycle, Flame, Target, Activity, Crosshair } from 'lucide-react';
import { getOverview, getFullData, type OverviewResponse, type SustainabilityRow } from '@/lib/sustainabilityApi';

/** Palantir Foundry–style command palette: neon amber + military green */
const AMBER = '#ffb30f';
const AMBER_DIM = 'rgba(255, 179, 15, 0.45)';
const MILITARY = '#6b8f3a';
const MILITARY_DIM = 'rgba(107, 143, 58, 0.5)';
const HUD_BG = '#050608';
const PANEL = '#080b0d';

const RISK_TOKENS: Record<string, { stroke: string; label: string }> = {
  critical: { stroke: AMBER, label: 'CRIT' },
  high: { stroke: '#d4a017', label: 'HIGH' },
  moderate: { stroke: '#9aa86c', label: 'MOD' },
  safe: { stroke: MILITARY, label: 'OK' },
};

function getWaterRisk(gapPct: number) {
  if (gapPct >= 30) return 'critical';
  if (gapPct >= 15) return 'high';
  if (gapPct >= 5) return 'moderate';
  return 'safe';
}

function getWasteRisk(landfillPct: number) {
  if (landfillPct > 50) return 'critical';
  if (landfillPct > 30) return 'high';
  if (landfillPct > 15) return 'moderate';
  return 'safe';
}

function seriesFromTrend(trendData: Array<Record<string, number>>, key: string): number[] {
  return trendData.map((d) => Number(d[key] ?? 0));
}

function microDelta(series: number[]): { delta: number; pct: number | null } {
  if (series.length < 2) return { delta: 0, pct: null };
  const a = series[series.length - 2];
  const b = series[series.length - 1];
  const delta = b - a;
  const pct = a !== 0 ? (delta / Math.abs(a)) * 100 : null;
  return { delta, pct };
}

function MicroSparkline({ values, stroke }: { values: number[]; stroke: string }) {
  const n = values.length;
  if (n < 2) {
    return <div className="h-9 w-full border border-white/[0.06] bg-black/40" />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.15 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const span = hi - lo || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (n - 1)) * 100;
      const y = 100 - ((v - lo) / span) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  return (
    <svg className="h-9 w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function DataNodeCard(props: {
  nodeId: string;
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: 'amber' | 'olive';
  trendKey: string;
  trendData: Array<Record<string, number>>;
  delay: number;
}) {
  const { nodeId, label, value, icon: Icon, accent, trendKey, trendData, delay } = props;
  const stroke = accent === 'amber' ? AMBER : MILITARY;
  const border = accent === 'amber' ? AMBER_DIM : MILITARY_DIM;
  const glow =
    accent === 'amber'
      ? '0 0 28px rgba(255, 179, 15, 0.12), inset 0 0 0 1px rgba(255, 179, 15, 0.22)'
      : '0 0 28px rgba(107, 143, 58, 0.12), inset 0 0 0 1px rgba(107, 143, 58, 0.25)';
  const series = seriesFromTrend(trendData, trendKey);
  const { delta, pct } = microDelta(series);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="relative min-h-[140px] border bg-[#080b0d] p-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/45"
      style={{
        borderColor: border,
        boxShadow: glow,
      }}
    >
      <span className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l-2 border-t-2 border-[#ffb30f]/70" />
      <span className="pointer-events-none absolute right-0 top-0 h-2 w-2 border-r-2 border-t-2 border-[#ffb30f]/70" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-2 w-2 border-b-2 border-l-2 border-[#6b8f3a]/60" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-[#6b8f3a]/60" />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] text-white/35">{nodeId}</p>
          <p className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-white/55">{label}</p>
        </div>
        <Icon className="h-4 w-4 shrink-0" style={{ color: stroke, filter: `drop-shadow(0 0 6px ${stroke})` }} />
      </div>

      <p
        className="relative z-10 mt-3 text-2xl font-semibold tabular-nums tracking-tight text-white"
        style={{ textShadow: `0 0 24px ${accent === 'amber' ? 'rgba(255,179,15,0.25)' : 'rgba(107,143,58,0.3)'}` }}
      >
        {value}
      </p>

      <div className="relative z-10 mt-2 border border-white/[0.08] bg-black/50 px-1 py-0.5">
        <MicroSparkline
          values={series.length >= 2 ? series : series.length === 1 ? [series[0], series[0]] : [0, 0]}
          stroke={stroke}
        />
      </div>

      <div className="relative z-10 mt-2 flex items-baseline justify-between gap-2 border-t border-white/[0.06] pt-2 text-[9px] normal-case tracking-normal text-white/40">
        <span>MICRO-TREND</span>
        <span className="tabular-nums" style={{ color: stroke }}>
          {delta === 0 && pct === null
            ? '—'
            : `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}${pct !== null ? ` (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)` : ''}`}
        </span>
      </div>
    </motion.div>
  );
}

export default function SustainabilityOverviewPage() {
  const [year, setYear] = useState(2022);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [trendData, setTrendData] = useState<Array<Record<string, number>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ov, full] = await Promise.all([
          getOverview(year),
          getFullData(undefined, undefined),
        ]);
        setOverview(ov);
        const byYear = (full.data || []).reduce((acc: Record<number, Record<string, number>>, r: SustainabilityRow) => {
          const y = r.year;
          if (!acc[y]) {
            acc[y] = {
              year: y,
              water_gap: 0,
              renewable_sum: 0,
              waste_gen: 0,
              waste_proc: 0,
              ghg: 0,
              score: 0,
              count: 0,
              energy: 0,
            };
          }
          const bucket = acc[y];
          bucket.water_gap += (r.water_demand_mgd || 0) - (r.water_supply_mgd || 0);
          bucket.renewable_sum += (r.renewable_share_percent || 0) * (r.energy_consumption_mu || 0);
          bucket.energy += r.energy_consumption_mu || 0;
          bucket.waste_gen += r.waste_generated_tpd || 0;
          bucket.waste_proc += r.waste_processed_tpd || 0;
          bucket.ghg += r.ghg_emissions_mtco2 || 0;
          bucket.score += r.sustainability_score || 0;
          bucket.count += 1;
          return acc;
        }, {});

        setTrendData(
          Object.entries(byYear)
            .map(([yk, v]) => {
              const vTyped = v as {
                year: number;
                water_gap: number;
                renewable_sum: number;
                energy: number;
                waste_gen: number;
                waste_proc: number;
                ghg: number;
                score: number;
                count: number;
              };
              return {
                year: Number(yk),
                water_gap: Math.max(0, vTyped.water_gap),
                renewable: vTyped.energy > 0 ? vTyped.renewable_sum / vTyped.energy : 0,
                waste_rate: vTyped.waste_gen > 0 ? (vTyped.waste_proc / vTyped.waste_gen) * 100 : 0,
                ghg: vTyped.ghg,
                score: vTyped.count ? vTyped.score / vTyped.count : 0,
              };
            })
            .sort((a, b) => a.year - b.year),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year]);

  const zoneChartData = useMemo(() => {
    if (!overview) return [];
    return (overview.zone_data || []).map((z: SustainabilityRow) => {
      const gapPct =
        z.water_demand_mgd > 0 ? ((z.water_demand_mgd - z.water_supply_mgd) / z.water_demand_mgd) * 100 : 0;
      return {
        zone: z.zone,
        score: z.sustainability_score,
        water_risk: getWaterRisk(gapPct),
        waste_risk: getWasteRisk(z.landfill_dependency_percent || 0),
      };
    });
  }, [overview]);

  const systemStatus = useMemo(() => {
    if (!overview) return { label: 'OPTIMAL' as const, tone: 'green' as const };
    if (overview.city_sustainability_score < 40) return { label: 'CRITICAL' as const, tone: 'amber' as const };
    if (overview.city_sustainability_score < 60) return { label: 'DEGRADED' as const, tone: 'amber' as const };
    return { label: 'OPTIMAL' as const, tone: 'green' as const };
  }, [overview]);

  if (loading || !overview) {
    return (
      <div
        className="flex min-h-[80vh] items-center justify-center font-mono"
        style={{ backgroundColor: HUD_BG }}
      >
        <div className="flex flex-col items-center gap-4 border border-[#ffb30f]/30 bg-black/60 px-10 py-8 shadow-[0_0_40px_rgba(255,179,15,0.08)]">
          <Crosshair className="h-8 w-8 animate-pulse text-[#ffb30f]" style={{ filter: 'drop-shadow(0 0 12px #ffb30f)' }} />
          <p className="text-[10px] font-bold tracking-[0.35em] text-[#ffb30f]/80">ESTABLISHING UPLINK</p>
          <p className="text-[9px] tracking-[0.25em] text-white/35">COMMAND / GEOSPATIAL GRID</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden font-mono"
      style={{
        backgroundColor: HUD_BG,
        backgroundImage: `
          linear-gradient(rgba(255, 179, 15, 0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(107, 143, 58, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      }}
    >
      <div className="foundry-grid-pulse pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_31px,rgba(255,255,255,0.03)_32px)]" />

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        {/* Header — brutalist command strip */}
        <header className="mb-6 grid grid-cols-1 gap-4 border border-white/[0.08] bg-black/40 lg:mb-8 lg:grid-cols-12 lg:gap-px lg:bg-white/[0.08] lg:p-px">
          <div
            className="flex flex-col justify-center border border-white/[0.06] bg-[#080b0d] px-5 py-4 lg:col-span-8"
            style={{ boxShadow: `inset 0 0 0 1px ${systemStatus.tone === 'amber' ? AMBER_DIM : MILITARY_DIM}` }}
          >
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold tracking-[0.28em] text-white/40">
              <span className="inline-flex items-center gap-2 text-white/55">
                <span
                  className="h-2 w-2 shrink-0 rounded-none"
                  style={{
                    backgroundColor: systemStatus.tone === 'amber' ? AMBER : MILITARY,
                    boxShadow: `0 0 14px ${systemStatus.tone === 'amber' ? AMBER : MILITARY}`,
                  }}
                />
                SYS.STATUS
              </span>
              <span className="text-white/20">│</span>
              <span style={{ color: systemStatus.tone === 'amber' ? AMBER : MILITARY }}>{systemStatus.label}</span>
              <span className="text-white/20">│</span>
              <span>UNIT: DELHI MUNICIPAL</span>
            </div>
            <h1 className="mt-3 text-xl font-bold uppercase tracking-[0.12em] text-white sm:text-2xl md:text-3xl">
              Operations <span style={{ color: AMBER }}>Overview</span>
            </h1>
            <p className="mt-2 max-w-3xl text-[11px] font-normal normal-case leading-relaxed tracking-normal text-white/45">
              Geospatial resource mesh · macro KPI nodes · longitudinal trajectory (aggregated zones)
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3 border border-white/[0.06] bg-[#080b0d] px-5 py-4 lg:col-span-4">
            <label className="text-[9px] font-bold tracking-[0.3em] text-white/35">TIMELINE.SLICE</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full cursor-pointer border border-[#ffb30f]/35 bg-black px-3 py-2.5 text-sm font-semibold tabular-nums tracking-wider text-[#ffb30f] outline-none focus:border-[#ffb30f] focus:shadow-[0_0_20px_rgba(255,179,15,0.2)]"
            >
              {Array.from({ length: 16 }, (_, i) => 2015 + i).map((y) => (
                <option key={y} value={y} className="bg-[#0a0c0f] text-white">
                  {y}
                </option>
              ))}
            </select>
            <p className="text-[9px] tracking-[0.2em] text-white/30">SOURCE: FUSION LAYER / CSV + API</p>
          </div>
        </header>

        {/* Tactical insight block */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="mb-6 border-l-4 border-[#ffb30f] bg-black/55 pl-5 pr-4 py-4 shadow-[inset_0_0_60px_rgba(255,179,15,0.04)] sm:mb-8"
          style={{ borderRight: `1px solid ${AMBER_DIM}`, borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold tracking-[0.25em] text-[#ffb30f]/90">
            <Activity className="h-3.5 w-3.5" />
            SYNTHESIZED BRIEF
            <span className="border border-[#6b8f3a]/50 bg-[#6b8f3a]/10 px-2 py-0.5 text-[8px] text-[#9ccc65]">AUTO</span>
          </div>
          <p className="mt-3 max-w-5xl text-[12px] font-normal normal-case leading-relaxed tracking-normal text-white/65">
            {overview.city_sustainability_score < 50
              ? 'Critical intervention vector: aggregate composite score is low. Structural deficits in water distribution (supply–demand delta) and landfill pressure dominate. Recommend capital allocation to high-stress southwestern nodes.'
              : 'System within tolerance: renewable mix is stabilizing GHG. Eastern water-stress clusters require proactive mitigation to avoid cascade risk toward end of decade.'}
          </p>
        </motion.section>

        {/* KPI data nodes — strict 4-column grid */}
        <div className="mb-6 grid grid-cols-2 gap-px bg-white/[0.08] sm:mb-8 lg:grid-cols-4">
          <DataNodeCard
            nodeId="NODE-α / SCORE"
            label="Composite Index"
            value={overview.city_sustainability_score.toFixed(1)}
            icon={Target}
            accent="olive"
            trendKey="score"
            trendData={trendData}
            delay={0.05}
          />
          <DataNodeCard
            nodeId="NODE-β / GHG"
            label="GHG Footprint"
            value={`${overview.ghg_emissions_mtco2} Mt`}
            icon={Flame}
            accent="amber"
            trendKey="ghg"
            trendData={trendData}
            delay={0.1}
          />
          <DataNodeCard
            nodeId="NODE-γ / H₂O"
            label="Water Deficit"
            value={`${Math.round(overview.water_gap_mgd)} MGD`}
            icon={Droplets}
            accent="amber"
            trendKey="water_gap"
            trendData={trendData}
            delay={0.15}
          />
          <DataNodeCard
            nodeId="NODE-δ / REN"
            label="Clean Energy"
            value={`${overview.renewable_share_percent}%`}
            icon={Zap}
            accent="olive"
            trendKey="renewable"
            trendData={trendData}
            delay={0.2}
          />
        </div>

        <div className="grid grid-cols-1 gap-px bg-white/[0.08] lg:grid-cols-12 lg:p-px">
          {/* Main trajectory — radar scan + high-contrast grid */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="relative border border-white/[0.06] bg-[#080b0d] p-4 sm:p-6 lg:col-span-8"
            style={{ boxShadow: `inset 0 0 0 1px ${AMBER_DIM}` }}
          >
            <div className="mb-5 flex flex-col gap-2 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[11px] font-bold tracking-[0.28em] text-white/50">LONGITUDINAL.TRAJECTORY</h2>
                <p className="mt-1 text-[10px] font-normal normal-case tracking-normal text-white/40">
                  Composite score · all zones · normalized timeline
                </p>
              </div>
              <div className="flex items-center gap-2 border border-[#6b8f3a]/40 bg-[#6b8f3a]/10 px-2 py-1 text-[9px] font-bold tracking-[0.2em] text-[#9ccc65]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-none bg-[#6b8f3a]" />
                AGG. STREAM
              </div>
            </div>

            <div className="relative h-80 w-full overflow-hidden border border-white/[0.1] bg-black/60">
              <div
                className="pointer-events-none absolute inset-0 z-20 mix-blend-screen"
                style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(255,255,255,0.04) 24px)' }}
              />
              <div
                className="foundry-radar-beam pointer-events-none absolute inset-y-0 z-30 w-[38%] opacity-90"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255, 179, 15, 0.06) 35%, rgba(255, 213, 80, 0.22) 50%, rgba(255, 179, 15, 0.06) 65%, transparent 100%)',
                  boxShadow: '0 0 40px rgba(255, 179, 15, 0.12)',
                }}
              />
              {trendData.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin border-2 border-[#ffb30f] border-t-transparent" />
                </div>
              ) : (
                <div className="relative z-10 h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id="foundryScoreFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={AMBER} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="rgba(255,255,255,0.22)"
                        strokeWidth={1}
                        vertical
                        horizontal
                      />
                      <XAxis
                        dataKey="year"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'ui-monospace' }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.25)' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.25)' }}
                      />
                      <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10, fontFamily: 'ui-monospace' }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.25)' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.25)' }}
                        domain={['dataMin - 8', 'dataMax + 8']}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(5, 6, 8, 0.94)',
                          border: `1px solid ${AMBER_DIM}`,
                          borderRadius: 0,
                          fontFamily: 'ui-monospace',
                          fontSize: 11,
                          boxShadow: '0 0 24px rgba(255,179,15,0.15)',
                        }}
                        labelStyle={{ color: AMBER }}
                        itemStyle={{ color: '#e2e8f0' }}
                      />
                      <ReferenceLine
                        x={year}
                        stroke={MILITARY}
                        strokeDasharray="4 4"
                        strokeOpacity={0.85}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke={AMBER}
                        strokeWidth={2}
                        fill="url(#foundryScoreFill)"
                        activeDot={{
                          r: 5,
                          fill: MILITARY,
                          stroke: AMBER,
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.section>

          {/* Zone risk matrix — defense-style list */}
          <motion.aside
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col border border-white/[0.06] bg-[#080b0d] p-4 sm:p-6 lg:col-span-4"
            style={{ boxShadow: `inset 0 0 0 1px ${MILITARY_DIM}` }}
          >
            <h2 className="text-[11px] font-bold tracking-[0.28em] text-white/50">ZONE.RISK.MATRIX</h2>
            <p className="mt-1 text-[10px] font-normal normal-case tracking-normal text-white/40">
              Cross-sectional hazard tags
            </p>

            <div className="custom-scrollbar mt-5 max-h-[340px] flex-1 space-y-px overflow-y-auto bg-white/[0.06] pr-1 lg:max-h-none">
              {zoneChartData
                .slice()
                .sort((a, b) => a.score - b.score)
                .map((z) => (
                  <div
                    key={z.zone}
                    className="flex items-center justify-between gap-2 border border-white/[0.05] bg-black/50 px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.15em] text-white/85">{z.zone}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold tracking-[0.15em] text-white/35">
                          <Droplets className="h-3 w-3" style={{ color: RISK_TOKENS[z.water_risk].stroke }} />
                          H₂O.{RISK_TOKENS[z.water_risk].label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold tracking-[0.15em] text-white/35">
                          <Recycle className="h-3 w-3" style={{ color: RISK_TOKENS[z.waste_risk].stroke }} />
                          WST.{RISK_TOKENS[z.waste_risk].label}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-semibold tabular-nums text-white" style={{ textShadow: `0 0 12px ${MILITARY}` }}>
                        {z.score.toFixed(0)}
                      </p>
                      <p className="text-[8px] tracking-[0.2em] text-white/30">IDX</p>
                    </div>
                  </div>
                ))}
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
