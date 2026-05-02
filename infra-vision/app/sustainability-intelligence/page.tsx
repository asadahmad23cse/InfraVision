'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { TooltipProps } from 'recharts';
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
import { Droplets, Zap, Flame, Target, Activity, Cpu, HeartPulse } from 'lucide-react';
import { getOverview, getFullData, type OverviewResponse, type SustainabilityRow } from '@/lib/sustainabilityApi';
import WeatherCard from '@/components/WeatherCard';
import PerformanceMetrics from '@/components/PerformanceMetrics';

const BG = '#030508';
const PANEL = '#0a0f18';
const NEON_CYAN = '#22d3ee';
const NEON_VIOLET = '#a78bfa';
const NEON_GREEN = '#4ade80';
const NEON_ROSE = '#fb7185';
const NEON_AMBER = '#fbbf24';

const RISK_ORDER: Record<string, number> = { safe: 0, moderate: 1, high: 2, critical: 3 };

type TrendRow = Record<string, number> & { year: number };

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

function seriesFromTrend(trendData: TrendRow[], key: string): number[] {
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
    return <div className="h-8 w-full rounded-md bg-black/50 ring-1 ring-white/[0.06]" />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.1 || 1;
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
    <svg className="h-8 w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
      />
    </svg>
  );
}

type HealthStatus = 'healthy' | 'degraded' | 'critical';

function healthFromScore(score: number): HealthStatus {
  if (score >= 65) return 'healthy';
  if (score >= 45) return 'degraded';
  return 'critical';
}

function healthFromDeltaGood(delta: number, higherIsGood: boolean): HealthStatus {
  const eff = higherIsGood ? delta : -delta;
  if (eff > 0.5) return 'healthy';
  if (eff < -0.5) return 'critical';
  return 'degraded';
}

const STATUS_STYLES: Record<
  HealthStatus,
  { label: string; bar: string; glow: string; dot: string }
> = {
  healthy: {
    label: 'HEALTHY',
    bar: 'from-emerald-400/80 to-cyan-400/60',
    glow: 'shadow-[0_0_20px_rgba(74,222,128,0.35)]',
    dot: 'bg-emerald-400 shadow-[0_0_12px_#4ade80]',
  },
  degraded: {
    label: 'DEGRADED',
    bar: 'from-amber-400/80 to-orange-500/50',
    glow: 'shadow-[0_0_18px_rgba(251,191,36,0.3)]',
    dot: 'bg-amber-400 shadow-[0_0_12px_#fbbf24]',
  },
  critical: {
    label: 'CRITICAL',
    bar: 'from-rose-500/80 to-fuchsia-600/50',
    glow: 'shadow-[0_0_20px_rgba(251,113,133,0.35)]',
    dot: 'bg-rose-400 shadow-[0_0_12px_#fb7185]',
  },
};

function SystemHealthWidget(props: {
  serviceId: string;
  title: string;
  subtitle: string;
  valueLabel: string;
  health: HealthStatus;
  utilization: number;
  sparkColor: string;
  trendKey: string;
  trendData: TrendRow[];
  higherIsGood: boolean;
  delay: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const {
    serviceId,
    title,
    subtitle,
    valueLabel,
    health,
    utilization,
    sparkColor,
    trendKey,
    trendData,
    higherIsGood,
    delay,
    icon: Icon,
  } = props;
  const series = seriesFromTrend(trendData, trendKey);
  const { delta, pct } = microDelta(series);
  const trendHealth = healthFromDeltaGood(delta, higherIsGood);
  const displayHealth = health === 'critical' || trendHealth === 'critical' ? 'critical' : trendHealth === 'healthy' && health === 'healthy' ? 'healthy' : 'degraded';
  const st = STATUS_STYLES[displayHealth];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      className={`relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-4 ${st.glow}`}
      style={{ backgroundColor: PANEL }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-40 blur-2xl"
        style={{ background: `radial-gradient(circle, ${sparkColor}55, transparent 70%)` }}
      />
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/50 ring-1 ring-cyan-400/20">
            <Icon className="h-4 w-4 text-cyan-300/90" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200/70">{serviceId}</p>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-[10px] text-white/40">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2 py-1">
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
          <span className="text-[9px] font-bold tracking-wider text-white/90">{st.label}</span>
        </div>
      </div>

      <p className="relative mt-3 font-mono text-2xl font-bold tabular-nums tracking-tight text-white" style={{ textShadow: `0 0 24px ${sparkColor}44` }}>
        {valueLabel}
      </p>

      <div className="relative mt-3">
        <div className="mb-1 flex justify-between text-[9px] uppercase tracking-wider text-white/35">
          <span>Load / saturation</span>
          <span className="tabular-nums text-white/50">{Math.round(utilization)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black/60 ring-1 ring-white/[0.06]">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${st.bar}`}
            style={{ width: `${Math.min(100, Math.max(4, utilization))}%` }}
          />
        </div>
      </div>

      <div className="relative mt-3 rounded-lg bg-black/40 p-1.5 ring-1 ring-white/[0.05]">
        <MicroSparkline
          values={series.length >= 2 ? series : series.length === 1 ? [series[0], series[0]] : [0, 0]}
          stroke={sparkColor}
        />
      </div>

      <div className="relative mt-2 flex items-center justify-between border-t border-white/[0.06] pt-2 text-[10px] font-mono tabular-nums text-white/45">
        <span>Δ window</span>
        <span style={{ color: sparkColor }}>
          {delta === 0 && pct === null ? '—' : `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`}
          {pct !== null ? ` (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)` : ''}
        </span>
      </div>
    </motion.div>
  );
}

function RiskGlyph({ level }: { level: string }) {
  const n = RISK_ORDER[level] ?? 0;
  const c =
    n >= 3 ? NEON_ROSE : n === 2 ? NEON_AMBER : n === 1 ? '#fde68a' : NEON_GREEN;
  return (
    <span className="inline-block w-3 text-center text-xs font-bold" style={{ color: c }}>
      {n >= 3 ? '●' : n === 2 ? '◐' : n === 1 ? '○' : '◌'}
    </span>
  );
}

type TrajectoryTooltipProps = TooltipProps<number, string> & { selectedYear: number };

function TrajectoryTooltip({ active, payload, label, selectedYear }: TrajectoryTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as TrendRow | undefined;
  const score = row?.score ?? Number(payload[0]?.value);
  const y = Number(label);
  if (!Number.isFinite(y)) return null;
  const vs40 = score - 40;
  const vs60 = score - 60;
  const vs80 = score - 80;
  const isRef = y === selectedYear;

  return (
    <div
      className="max-w-[240px] rounded-xl border border-cyan-400/35 bg-[#070b12]/95 px-3 py-2.5 shadow-[0_0_32px_rgba(34,211,238,0.18),0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md"
      style={{ pointerEvents: 'none' }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">Fiscal year</p>
          <p className="font-mono text-lg font-bold tabular-nums text-white">{y}</p>
        </div>
        {isRef && (
          <span className="rounded-md border border-violet-400/40 bg-violet-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-200">
            Selected
          </span>
        )}
      </div>
      <div className="mt-2 space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between gap-4">
          <span className="text-white/50">Composite score</span>
          <span className="font-bold tabular-nums text-cyan-300" style={{ textShadow: '0 0 12px rgba(34,211,238,0.5)' }}>
            {typeof score === 'number' ? score.toFixed(2) : '—'}
          </span>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <p className="text-[9px] font-semibold uppercase tracking-wider text-white/35">Threshold delta</p>
        <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-[10px]">
          <span className="text-rose-300/80">vs CRIT (40)</span>
          <span className={`tabular-nums ${vs40 < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {vs40 >= 0 ? '+' : ''}
            {vs40.toFixed(1)}
          </span>
          <span className="text-amber-200/80">vs WARN (60)</span>
          <span className={`tabular-nums ${vs60 < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {vs60 >= 0 ? '+' : ''}
            {vs60.toFixed(1)}
          </span>
          <span className="text-emerald-300/80">vs TARGET (80)</span>
          <span className={`tabular-nums ${vs80 < 0 ? 'text-white/50' : 'text-emerald-400'}`}>
            {vs80 >= 0 ? '+' : ''}
            {vs80.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SustainabilityOverviewPage() {
  const [year, setYear] = useState(2022);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [trendData, setTrendData] = useState<TrendRow[]>([]);
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

        const sortedTrends = Object.entries(byYear)
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
            .sort((a, b) => a.year - b.year);
            
        // Filter to show only the 15-year window ending at the selected year, removing any historical noise
        setTrendData(sortedTrends.filter(t => t.year <= year && t.year > year - 15));
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

  const avgZoneScore = useMemo(() => {
    if (!zoneChartData.length) return 0;
    return zoneChartData.reduce((s, z) => s + z.score, 0) / zoneChartData.length;
  }, [zoneChartData]);

  const orderBookRows = useMemo(() => {
    return zoneChartData
      .map((z) => {
        const stress = (RISK_ORDER[z.water_risk] + RISK_ORDER[z.waste_risk]) / 6;
        const bidPct = Math.min(100, Math.max(8, z.score * 0.85 + 12));
        const askPct = Math.min(100, stress * 100);
        const netVsMkt = z.score - avgZoneScore;
        return { ...z, bidPct, askPct, netVsMkt };
      })
      .sort((a, b) => a.score - b.score);
  }, [zoneChartData, avgZoneScore]);

  const scoreSeries = useMemo(() => seriesFromTrend(trendData, 'score'), [trendData]);
  const ghgSeries = useMemo(() => seriesFromTrend(trendData, 'ghg'), [trendData]);
  const waterSeries = useMemo(() => seriesFromTrend(trendData, 'water_gap'), [trendData]);
  const renSeries = useMemo(() => seriesFromTrend(trendData, 'renewable'), [trendData]);

  const maxGhg = useMemo(() => (ghgSeries.length ? Math.max(...ghgSeries, 1) : 1), [ghgSeries]);
  const maxWater = useMemo(() => (waterSeries.length ? Math.max(...waterSeries, 1) : 1), [waterSeries]);

  const xTicks = useMemo(() => {
    if (trendData.length === 0) return [];
    const years = trendData.map((d) => d.year);
    const lo = years[0];
    const hi = years[years.length - 1];
    const span = hi - lo;
    if (span <= 0) return years;
    const step = Math.max(1, Math.ceil(span / 6));
    const out: number[] = [];
    for (let y = lo; y <= hi; y += step) out.push(y);
    if (out[out.length - 1] !== hi) out.push(hi);
    return out;
  }, [trendData]);

  const renderTooltip = useCallback(
    (props: TooltipProps<number, string>) => <TrajectoryTooltip {...props} selectedYear={year} />,
    [year],
  );

  if (loading || !overview) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center" style={{ backgroundColor: BG }}>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-cyan-500/25 bg-[#0a0f18] px-14 py-12 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
          <Cpu className="h-8 w-8 animate-pulse text-cyan-400" />
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">Hydrating telemetry</p>
        </div>
      </div>
    );
  }

  const compositeHealth = healthFromScore(overview.city_sustainability_score);
  const ghgHealth =
    ghgSeries.length >= 2 && ghgSeries[ghgSeries.length - 1] < ghgSeries[ghgSeries.length - 2]
      ? 'healthy'
      : ghgSeries.length >= 2 && ghgSeries[ghgSeries.length - 1] > ghgSeries[ghgSeries.length - 2]
        ? 'critical'
        : 'degraded';
  const waterUtil = Math.min(100, (overview.water_gap_mgd / Math.max(maxWater, 1)) * 100);
  const waterHealth: HealthStatus =
    overview.water_gap_mgd > maxWater * 0.85 ? 'critical' : overview.water_gap_mgd > maxWater * 0.5 ? 'degraded' : 'healthy';
  const renUtil = Math.min(100, overview.renewable_share_percent * 1.2);
  const renHealth: HealthStatus =
    overview.renewable_share_percent >= 12 ? 'healthy' : overview.renewable_share_percent >= 6 ? 'degraded' : 'critical';

  return (
    <div className="min-h-screen text-gray-100 bg-[#020617]">
      {/* ── Background Orbs ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[120px] mix-blend-screen opacity-60 animate-[spin_20s_linear_infinite]" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[130px] mix-blend-screen opacity-50" />
        <div className="absolute bottom-[-20%] left-[20%] w-[800px] h-[800px] rounded-full bg-emerald-500/15 blur-[150px] mix-blend-screen opacity-40 animate-[spin_30s_linear_infinite_reverse]" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-6 py-10 z-10">

        {/* ── Header Glass Panel ── */}
        <header className="mb-10 flex flex-col gap-6 rounded-[32px] border border-white/[0.15] bg-white/[0.02] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-[64px] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-6 items-center">
            <div className="h-16 w-16 rounded-[20px] bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/20 shadow-inner">
              <Target className="h-8 w-8 text-white/90" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50 mb-1">Vision Intelligence</p>
              <h1 className="text-4xl font-extrabold tracking-tight text-white/90 bg-clip-text">
                Sustainability Overview
              </h1>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Temporal View</label>
            <div className="relative">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full min-w-[160px] cursor-pointer appearance-none rounded-2xl border border-white/20 bg-black/20 px-5 py-3.5 text-sm font-semibold text-white/90 outline-none backdrop-blur-xl hover:bg-white/10 transition-colors focus:ring-2 ring-white/30 sm:w-auto"
              >
                {Array.from({ length: 16 }, (_, i) => 2015 + i).map((y) => (
                  <option key={y} value={y} className="bg-[#111]">{y} Fiscal</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/50">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
          </div>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-[24px] border border-blue-300/20 bg-gradient-to-r from-blue-500/10 to-indigo-500/5 p-6 backdrop-blur-[40px] shadow-lg flex gap-4 items-start"
        >
          <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-400/30">
            <Activity className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-200 mb-1">Synthesized System Insight</h3>
            <p className="text-[13px] leading-relaxed text-blue-100/70 font-medium tracking-wide">
              {overview.city_sustainability_score < 50
                ? 'The composite index is running below optimal thresholds. Anomalies detected in water pipelines and localized GHG spikes.'
                : 'System operating within safe margins. Renewable energy adoption is mitigating overall carbon intensity effectively.'}
            </p>
          </div>
          <div className="ml-auto">
            <WeatherCard />
          </div>
        </motion.section>

        {/* ── KPI Glass Widgets ── */}
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <SystemHealthWidget
            serviceId="svc/composite"
            title="Composite Index"
            subtitle="City-wide sustainability index"
            valueLabel={overview.city_sustainability_score.toFixed(1)}
            health={compositeHealth}
            utilization={Math.min(100, overview.city_sustainability_score * 1.05)}
            sparkColor="#60a5fa"
            trendKey="score"
            trendData={trendData}
            higherIsGood
            delay={0.03}
            icon={Target}
          />
          <SystemHealthWidget
            serviceId="svc/emissions"
            title="GHG Footprint"
            subtitle="Aggregate MtCO₂e (inverse SLO)"
            valueLabel={`${overview.ghg_emissions_mtco2} Mt`}
            health={ghgHealth}
            utilization={Math.min(100, (overview.ghg_emissions_mtco2 / Math.max(maxGhg, 1)) * 100)}
            sparkColor="#fb7185"
            trendKey="ghg"
            trendData={trendData}
            higherIsGood={false}
            delay={0.06}
            icon={Flame}
          />
          <SystemHealthWidget
            serviceId="svc/hydrology"
            title="Water Deficit"
            subtitle="Supply–demand delta (MGD)"
            valueLabel={`${Math.round(overview.water_gap_mgd)} MGD`}
            health={waterHealth}
            utilization={waterUtil}
            sparkColor="#818cf8"
            trendKey="water_gap"
            trendData={trendData}
            higherIsGood={false}
            delay={0.09}
            icon={Droplets}
          />
          <SystemHealthWidget
            serviceId="svc/renewables"
            title="Clean Energy"
            subtitle="Renewable share %"
            valueLabel={`${overview.renewable_share_percent}%`}
            health={renHealth}
            utilization={renUtil}
            sparkColor="#34d399"
            trendKey="renewable"
            trendData={trendData}
            higherIsGood
            delay={0.12}
            icon={Zap}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

          {/* ── Chart Panel ── */}
          <motion.section
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-8 rounded-[32px] border border-white/[0.12] bg-white/[0.03] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.25)] backdrop-blur-[64px]"
          >
            <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white/90">Ecosystem Trajectory</h2>
                <p className="text-xs text-white/50 tracking-wide mt-1">15-year composite score evolution normalized</p>
              </div>
              <div className="flex gap-4">
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white/60 tracking-widest uppercase shadow-inner">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-2 shadow-[0_0_8px_#60a5fa]" /> Score Model
                </div>
              </div>
            </div>

            <div className="h-[400px] w-full">
              {trendData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-white/35">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="visionGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="year"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      ticks={xTicks}
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={15}
                      allowDecimals={false}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      domain={['dataMin - 5', 'dataMax + 5']}
                      width={60}
                      tickFormatter={(val) => Math.round(val).toString()}
                    />
                    <Tooltip content={renderTooltip} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }} />

                    <ReferenceLine y={40} stroke="rgba(2fb7185,0.3)" strokeDasharray="4 4" />
                    <ReferenceLine y={80} stroke="rgba(52,211,153,0.3)" strokeDasharray="4 4" />

                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#60a5fa"
                      strokeWidth={4}
                      fill="url(#visionGlow)"
                      activeDot={{
                        r: 7,
                        fill: '#fff',
                        stroke: '#3b82f6',
                        strokeWidth: 3,
                        style: { filter: 'drop-shadow(0 0 10px rgba(96,165,250,0.8))' },
                      }}
                      style={{ filter: 'drop-shadow(0 8px 16px rgba(96,165,250,0.3))' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.section>

          {/* ── Zone Matrix Panel ── */}
          <motion.aside
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-4 rounded-[32px] border border-white/[0.12] bg-white/[0.03] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.25)] backdrop-blur-[64px]"
          >
            <h2 className="text-sm font-bold text-white/80 mb-1">Zone Disparity</h2>
            <p className="text-[11px] text-white/40 uppercase tracking-widest mb-5 font-semibold">Live Sort vs Market Avg</p>

            <div className="flex justify-between items-center px-4 py-2 mb-2">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Sectors</span>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Differential</span>
            </div>

            <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto custom-scrollbar pr-2 pb-2 mb-6">
              {orderBookRows.map((row) => (
                <div
                  key={row.zone}
                  className="flex justify-between items-center p-4 rounded-[20px] bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] transition-colors group"
                >
                  <div>
                    <p className="font-bold text-white/90 text-sm tracking-wide">{row.zone}</p>
                    <div className="flex gap-2 items-center mt-1">
                      <RiskGlyph level={row.water_risk} />
                      <RiskGlyph level={row.waste_risk} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-base font-bold ${row.netVsMkt >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                      {row.netVsMkt >= 0 ? '+' : ''}{row.netVsMkt.toFixed(1)}
                    </span>
                    <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest mt-0.5 group-hover:text-white/50 transition-colors pt-1">pts relative</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto">
               <PerformanceMetrics />
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
