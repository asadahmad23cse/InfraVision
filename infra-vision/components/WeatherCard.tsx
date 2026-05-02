'use client';

import { useEffect, useState } from 'react';
import { CloudRain, Sun, Thermometer } from 'lucide-react';

interface Weather {
  temperature_c: number;
  condition: string;
  humidity?: number;
  impact?: string;
}

export default function WeatherCard() {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    fetch('/api/sustainability/weather/delhi', { cache: 'no-store' })
      .then((res) => res.json())
      .then(setWeather)
      .catch(() => setWeather({
        temperature_c: 32,
        condition: 'Clear',
        impact: 'High heat increasing energy load by 12%',
      }));
  }, []);

  if (!weather) return null;

  const condition = weather.condition.toLowerCase();
  const temp = Math.round(weather.temperature_c);

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-5 transition-all duration-500 hover:border-emerald-500/30">
      <div className="rounded-xl bg-emerald-500/10 p-3">
        {condition.includes('clear') || condition.includes('sun') ? (
          <Sun className="h-8 w-8 text-yellow-400" />
        ) : condition.includes('rain') ? (
          <CloudRain className="h-8 w-8 text-blue-400" />
        ) : (
          <Thermometer className="h-8 w-8 text-emerald-400" />
        )}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Live Delhi Weather</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl font-bold text-white">{temp}C</h4>
          <span className="text-sm font-medium text-zinc-400">{weather.condition}</span>
        </div>
        <p className="mt-1 text-[11px] text-emerald-400/80">
          Impact: {weather.impact ?? 'High heat increasing energy load by 12%'}
        </p>
      </div>
    </div>
  );
}
