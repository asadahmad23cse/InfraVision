import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "housing_road_analysis.csv");
    
    if (!fs.existsSync(filePath)) {
      console.error("Housing Road Analysis CSV not found at:", filePath);
      return NextResponse.json({ error: "Data file not found" }, { status: 404 });
    }

    const csv = fs.readFileSync(filePath, "utf-8");
    const [headerLine, ...lines] = csv.trim().split("\n");
    const headers = headerLine.split(",").map(h => h.trim());

    const rows = lines.map(line => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });

    const data = rows.map(cols =>
      Object.fromEntries(headers.map((h, i) => {
        const value = cols[i] || "";
        // Try to parse as number if possible
        const numValue = parseFloat(value);
        return [h.trim(), isNaN(numValue) ? value : numValue];
      }))
    );

    // Calculate summary statistics
    const avgDensity = data.reduce((sum, d) => sum + Number((d as any).Avg_Density || 0), 0) / data.length;
    const avgInfraScore = data.reduce((sum, d) => sum + Number((d as any).Infrastructure_Score || 0), 0) / data.length;
    const avgCongestion = data.reduce((sum, d) => sum + Number((d as any).Congestion_Level || 0), 0) / data.length;
    const totalHousing = data.reduce((sum, d) => sum + Number((d as any).Total_Housing_Units || 0), 0);
    const totalRoadLength = data.reduce((sum, d) => sum + Number((d as any).Total_Road_Length_KM || 0), 0);

    // Get model metrics from first row (they should be the same)
    const modelMetrics = {
      r2Score: data[0]?.Model_R2_Score || 0,
      mse: data[0]?.Model_MSE || 0,
      mae: data[0]?.Model_MAE || 0
    };

    const summary = {
      totalDistricts: data.length,
      avgDensity: Math.round(avgDensity),
      avgInfrastructureScore: Math.round(avgInfraScore * 10) / 10,
      avgCongestionLevel: Math.round(avgCongestion * 10) / 10,
      totalHousingUnits: totalHousing,
      totalRoadLength: Math.round(totalRoadLength * 10) / 10,
      modelMetrics
    };

    return NextResponse.json({ data, summary }, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=300"
      }
    });
  } catch (err) {
    console.error("Failed to load housing road analysis data:", err);
    return NextResponse.json({ error: "Data load failed" }, { status: 500 });
  }
}

