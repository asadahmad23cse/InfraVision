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
import { Droplets, Zap, Flame, Target, Activity } from 'lucide-react';
import { getOverview, getFullData, type OverviewResponse, type SustainabilityRow } from '@/lib/sustainabilityApi';

/** FinTech / Bloomberg terminal palette */
const BG = '#000000';
const TICKER_UP = '#00e676';
const TICKER_DOWN = '#ff1744';
const TICKER_FLAT = '#9e9e9e';
const ACCENT = '#ff9800';

const RISK_ORDER: Record<string, number> = { safe: 0, moderate: 1, high: 2, critical: 3 };

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

/** Higher metric = good for investor-style "up" */
function tickerColorForDelta(
  delta: number,
  pct: number | null,
  higherIsGood: boolean,
): string {
  if (delta === 0 && (pct === null || pct === 0)) return TICKER_FLAT;
  const effective = higherIsGood ? delta : -delta;
  if (effective > 0) return TICKER_UP;
  if (effective < 0) return TICKER_DOWN;
  return TICKER_FLAT;
}

function MicroSparkline({ values, stroke }: { values: number[]; stroke: string }) {
  const n = values.length;
  if (n < 2) {
    return <div className="h-10 w-full border border-[#2a2a2a] bg-black" />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.12 || 1;
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
    <svg className="h-10 w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function TickerKpiCard(props: {
  symbol: string;
  label: string;
  displayValue: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  trendKey: string;
  trendData: Array<Record<string, number>>;
  higherIsGood: boolean;
  delay: number;
}) {
  const { symbol, label, displayValue, icon: Icon, trendKey, trendData, higherIsGood, delay } = props;
  const series = seriesFromTrend(trendData, trendKey);
  const { delta, pct } = microDelta(series);
  const color = tickerColorForDelta(delta, pct, higherIsGood);
  const sparkStroke =
    series.length >= 2
      ? tickerColorForDelta(series[series.length - 1] - series[0], null, higherIsGood)
      : TICKER_FLAT;

  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '■';
  const deltaStr =
    delta === 0 && pct === null
      ? 'UNCH'
      : `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}${pct !== null ? `  ${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%` : ''}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.15 }}
      className="flex min-h-[158px] flex-col border border-[#2a2a2a] bg-[#0d0d0d] p-3 font-mono"
    >
      <div className="flex items-start justify-between gap-2 border-b border-[#1f1f1f] pb-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-wider text-[#757575]">{symbol}</p>
          <p className="truncate text-[9px] uppercase tracking-[0.14em] text-[#9e9e9e]">{label}</p>
        </div>
        <Icon className="h-3.5 w-3.5 shrink-0 text-[#616161]" />
      </div>

      <p className="mt-2 text-[26px] font-bold leading-none tabular-nums tracking-tight" style={{ color }}>
        {displayValue}
      </p>

      <div className="mt-2 flex flex-1 flex-col justify-end border border-[#252525] bg-black">
        <MicroSparkline
          values={series.length >= 2 ? series : series.length === 1 ? [series[0], series[0]] : [0, 0]}
          stroke={sparkStroke}
        />
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-[#1f1f1f] pt-2 text-[10px] tabular-nums">
        <span className="text-[#616161]">LAST</span>
        <span className="font-bold" style={{ color }}>
          <span className="mr-1">{arrow}</span>
          {deltaStr}
        </span>
      </div>
    </motion.div>
  );
}

function RiskGlyph({ level }: { level: string }) {
  const n = RISK_ORDER[level] ?? 0;
  const c =
    n >= 3 ? TICKER_DOWN : n === 2 ? '#ff9100' : n === 1 ? '#ffee58' : TICKER_UP;
  return (
    <span className="inline-block w-3 text-center font-black" style={{ color: c }}>
      {n >= 3 ? '█' : n === 2 ? '▓' : n === 1 ? '▒' : '░'}
    </span>
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

  const avgZoneScore = useMemo(() => {
    if (!zoneChartData.length) return 0;
    return zoneChartData.reduce((s, z) => s + z.score, 0) / zoneChartData.length;
  }, [zoneChartData]);

  const orderBookRows = useMemo(() => {
    return zoneChartData
      .map((z) => {
        const stress =
          (RISK_ORDER[z.water_risk] + RISK_ORDER[z.waste_risk]) / 6;
        const bidPct = Math.min(100, Math.max(8, z.score * 0.85 + 12));
        const askPct = Math.min(100, stress * 100);
        const netVsMkt = z.score - avgZoneScore;
        return { ...z, bidPct, askPct, netVsMkt };
      })
      .sort((a, b) => a.score - b.score);
  }, [zoneChartData, avgZoneScore]);

  const scoreSeries = useMemo(() => seriesFromTrend(trendData, 'score'), [trendData]);
  const { delta: benchDelta } = microDelta(scoreSeries);
  const benchColor = tickerColorForDelta(benchDelta, null, true);

  if (loading || !overview) {
    return (
      <div
        className="flex min-h-[80vh] items-center justify-center font-mono"
        style={{ backgroundColor: BG }}
      >
        <div className="border border-[#333] bg-[#0d0d0d] px-12 py-10">
          <p className="text-[11px] font-bold tracking-[0.4em] text-[#9e9e9e]">LOADING FEED</p>
          <p className="mt-3 text-[10px] tracking-[0.25em] text-[#616161]">INSTITUTIONAL · OVERVIEW</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-mono" style={{ backgroundColor: BG, color: '#e0e0e0' }}>
      <div className="mx-auto max-w-[1600px] border-x border-[#1a1a1a] px-3 py-4 sm:px-5 sm:py-5">
        {/* Top strip — ticker + controls */}
        <header className="mb-1 border border-[#2a2a2a] bg-[#0d0d0d]">
          <div className="flex flex-wrap items-stretch justify-between gap-px bg-[#2a2a2a]">
            <div className="min-w-[200px] flex-1 bg-[#0d0d0d] px-4 py-3">
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#757575]">
                <span className="h-2 w-2 bg-[#00e676]" />
                LIVE
                <span className="text-[#424242]">|</span>
                <span className="text-[#9e9e9e]">DELHI MUNI COMPOSITE</span>
              </div>
              <h1 className="mt-2 text-lg font-bold uppercase tracking-[0.08em] text-white sm:text-xl">
                Institutional <span style={{ color: ACCENT }}>Overview</span>
              </h1>
              <p className="mt-1 text-[10px] font-normal normal-case leading-snug tracking-normal text-[#757575]">
                Data-dense resource dashboard · aggregated zones · no delay guarantee
              </p>
            </div>
            <div className="flex w-full flex-col justify-center border-t border-[#2a2a2a] bg-black px-4 py-3 sm:w-auto sm:border-l sm:border-t-0 sm:min-w-[200px]">
              <label className="text-[9px] font-bold tracking-[0.25em] text-[#616161]">AS-OF YEAR</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="mt-1 w-full cursor-pointer border border-[#424242] bg-black py-2 pl-2 pr-8 text-sm font-bold tabular-nums text-white outline-none focus:border-[#757575]"
                style={{ borderRadius: 0 }}
              >
                {Array.from({ length: 16 }, (_, i) => 2015 + i).map((y) => (
                  <option key={y} value={y} className="bg-black text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 border-t border-[#2a2a2a] bg-black px-4 py-2 text-[11px] tabular-nums">
            <span className="text-[#616161]">BENCH</span>
            <span className="font-bold" style={{ color: benchColor }}>
              {scoreSeries.length >= 2
                ? `${benchDelta >= 0 ? '▲' : '▼'} ${benchDelta >= 0 ? '+' : ''}${benchDelta.toFixed(2)} Y/Y`
                : '—'}
            </span>
            <span className="text-[#424242]">|</span>
            <span className="text-[#616161]">IDX</span>
            <span className="font-bold text-white">{overview.city_sustainability_score.toFixed(2)}</span>
            <span className="text-[#424242]">|</span>
            <span className="text-[#616161]">SRC</span>
            <span className="text-[#9e9e9e]">CSV/API</span>
          </div>
        </header>

        {/* Analyst blurb — dense */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3"
        >
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-[#757575]">
            <Activity className="h-3 w-3" style={{ color: ACCENT }} />
            RESEARCH NOTE
            <span className="border border-[#424242] bg-black px-1.5 py-0 text-[9px] text-[#9e9e9e]">AUTO</span>
          </div>
          <p className="mt-2 text-[11px] font-normal normal-case leading-relaxed tracking-normal text-[#bdbdbd]">
            {overview.city_sustainability_score < 50
              ? 'Downside case: composite below investment-grade threshold. Water supply–demand gap and landfill dependency drive tail risk; prioritize capital to worst quartile nodes.'
              : 'Base case: renewable trajectory supportive of stabilization. Monitor eastern water stress for convexity into late decade.'}
          </p>
        </motion.section>

        {/* KPI grid — 4 ticker cards */}
        <div className="mt-3 grid grid-cols-2 gap-px bg-[#2a2a2a] lg:grid-cols-4">
          <TickerKpiCard
            symbol="DMC.SCORE"
            label="Composite Index"
            displayValue={overview.city_sustainability_score.toFixed(2)}
            icon={Target}
            trendKey="score"
            trendData={trendData}
            higherIsGood
            delay={0.02}
          />
          <TickerKpiCard
            symbol="DMC.GHG"
            label="GHG MtCO2e"
            displayValue={`${overview.ghg_emissions_mtco2} Mt`}
            icon={Flame}
            trendKey="ghg"
            trendData={trendData}
            higherIsGood={false}
            delay={0.04}
          />
          <TickerKpiCard
            symbol="DMC.H2O"
            label="Water gap MGD"
            displayValue={`${Math.round(overview.water_gap_mgd)}`}
            icon={Droplets}
            trendKey="water_gap"
            trendData={trendData}
            higherIsGood={false}
            delay={0.06}
          />
          <TickerKpiCard
            symbol="DMC.REN"
            label="Renewable %"
            displayValue={`${overview.renewable_share_percent}%`}
            icon={Zap}
            trendKey="renewable"
            trendData={trendData}
            higherIsGood
            delay={0.08}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-px bg-[#2a2a2a] lg:grid-cols-12">
          {/* Chart */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.06 }}
            className="border border-[#2a2a2a] bg-[#0d0d0d] p-3 sm:p-4 lg:col-span-8"
          >
            <div className="mb-3 flex flex-col gap-1 border-b border-[#252525] pb-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[10px] font-bold tracking-[0.22em] text-[#757575]">COMPOSITE · TIME SERIES</h2>
                <p className="text-[9px] text-[#616161]">All zones · mean score · fiscal years</p>
              </div>
              <div className="text-[10px] tabular-nums text-[#9e9e9e]">
                REF <span className="text-white">{year}</span>
              </div>
            </div>
            <div className="h-80 w-full border border-[#252525] bg-black">
              {trendData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-[10px] text-[#616161]">NO SERIES</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bbgScoreFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ACCENT} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#2a2a2a" strokeWidth={1} vertical horizontal />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: '#757575', fontSize: 10, fontFamily: 'ui-monospace' }}
                      axisLine={{ stroke: '#333' }}
                      tickLine={{ stroke: '#333' }}
                    />
                    <YAxis
                      tick={{ fill: '#757575', fontSize: 10, fontFamily: 'ui-monospace' }}
                      axisLine={{ stroke: '#333' }}
                      tickLine={{ stroke: '#333' }}
                      domain={['dataMin - 8', 'dataMax + 8']}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0d0d0d',
                        border: '1px solid #424242',
                        borderRadius: 0,
                        fontFamily: 'ui-monospace',
                        fontSize: 11,
                        color: '#e0e0e0',
                      }}
                    />
                    <ReferenceLine x={year} stroke="#616161" strokeDasharray="3 3" />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke={ACCENT}
                      strokeWidth={1.5}
                      fill="url(#bbgScoreFill)"
                      activeDot={{ r: 4, fill: TICKER_UP, stroke: '#fff', strokeWidth: 1 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.section>

          {/* Zone order book */}
          <motion.aside
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col border border-[#2a2a2a] bg-[#0d0d0d] lg:col-span-4"
          >
            <div className="border-b border-[#2a2a2a] bg-black px-3 py-2">
              <h2 className="text-[10px] font-bold tracking-[0.22em] text-[#757575]">ZONE RISK · ORDER BOOK</h2>
              <p className="text-[9px] text-[#616161]">Sorted worst IDX · synthetic depth from hazard stack</p>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_52px_52px_48px_56px] gap-px bg-[#2a2a2a] text-[9px] font-bold tracking-wider text-[#616161]">
              <div className="bg-[#121212] px-2 py-1.5">INSTRUMENT</div>
              <div className="bg-[#121212] py-1.5 text-center text-[#00e676]">BID</div>
              <div className="bg-[#121212] py-1.5 text-center text-[#ff1744]">ASK</div>
              <div className="bg-[#121212] py-1.5 text-center">H₂O</div>
              <div className="bg-[#121212] py-1.5 text-center">WST</div>
            </div>

            <div className="custom-scrollbar max-h-[360px] min-w-0 flex-1 overflow-x-auto overflow-y-auto lg:max-h-none">
              {orderBookRows.map((row, i) => (
                <div
                  key={row.zone}
                  className="grid grid-cols-[minmax(0,1fr)_52px_52px_48px_56px] gap-px border-b border-[#1a1a1a] bg-black text-[10px] tabular-nums"
                  style={{ backgroundColor: i % 2 === 0 ? '#000000' : '#0a0a0a' }}
                >
                  <div className="flex min-w-0 flex-col justify-center px-2 py-2">
                    <span className="truncate font-bold uppercase tracking-wide text-white">{row.zone}</span>
                    <span className="mt-0.5 text-[9px]">
                      <span style={{ color: row.netVsMkt >= 0 ? TICKER_UP : TICKER_DOWN }}>
                        {row.netVsMkt >= 0 ? '▲' : '▼'}
                        {row.netVsMkt >= 0 ? '+' : ''}
                        {row.netVsMkt.toFixed(1)}
                      </span>
                      <span className="text-[#424242]"> vs mkt</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-center border-l border-[#1a1a1a] bg-[#050505] px-1">
                    <div className="h-8 w-full border border-[#252525] bg-black">
                      <div
                        className="h-full bg-[#00e676]/25"
                        style={{ width: `${row.bidPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center border-l border-[#1a1a1a] bg-[#050505] px-1">
                    <div className="h-8 w-full border border-[#252525] bg-black">
                      <div
                        className="h-full bg-[#ff1744]/30"
                        style={{ width: `${row.askPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center border-l border-[#1a1a1a] bg-black">
                    <RiskGlyph level={row.water_risk} />
                  </div>
                  <div className="flex items-center justify-center border-l border-[#1a1a1a] bg-black">
                    <RiskGlyph level={row.waste_risk} />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#2a2a2a] bg-black px-3 py-2 text-[9px] text-[#616161]">
              <span className="text-[#00e676]">BID</span> depth ∝ composite ·{' '}
              <span className="text-[#ff1744]">ASK</span> depth ∝ water+waste stress
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
