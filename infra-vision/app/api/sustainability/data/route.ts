import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function loadData() {
  const p = path.join(process.cwd(), 'public', 'data', 'expanded_sustainability_delhi.csv');
  if (!fs.existsSync(p)) return [];
  const csv = fs.readFileSync(p, 'utf-8');
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const v = line.split(',');
    const row: Record<string, number | string> = {};
    headers.forEach((h, i) => { row[h] = isNaN(Number(v[i])) ? v[i] : Number(v[i]); });
    return row;
  });
}

export async function GET(req: NextRequest) {
  const zone = req.nextUrl.searchParams.get('zone') || '';
  const year = req.nextUrl.searchParams.get('year') || '';
  let data = loadData();
  if (zone) data = data.filter((r: any) => r.zone === zone);
  if (year) data = data.filter((r: any) => String(r.year) === year);
  return NextResponse.json({ data });
}
