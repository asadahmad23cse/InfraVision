# Sustainability & Green Planning Intelligence System

A real-world decision-support system for Delhi's city government planners and policymakers.

## Overview

This system solves actual planning problems faced by Delhi, with:

- **9 modules**: Overview, Water Stress, Energy & Solar, Waste & Circular Economy, Green Space, Carbon Footprint, Policy Simulator, AI Recommendations, Reports
- **Zone-level analysis**: North, South, East, West, Central, North-East, North-West, South-West, South-East
- **Forecasting**: Demand/supply projections to 2030
- **Policy simulation**: What-if engine with instant impact
- **Actionable recommendations**: Zone-specific ranked interventions

## Quick Start

### 1. Run the Next.js App (Frontend + API)

```bash
cd infra-vision
npm install
npm run dev
```

Visit **http://localhost:3000/sustainability-intelligence**

### 2. (Optional) Run Python Backend

For advanced forecasting (Prophet/ARIMA), run the FastAPI backend:

```bash
cd sustainability_api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Set `NEXT_PUBLIC_SUSTAINABILITY_API=http://localhost:8000` in `.env` to use the Python API. By default, the Next.js API routes process data from the CSV.

## Data

**Master dataset**: `data/expanded_sustainability_delhi.csv`

| Column | Description |
|--------|-------------|
| zone | Delhi zone (9 zones) |
| year | 2015–2030 |
| population | Zone population |
| water_supply_mgd / water_demand_mgd | Water supply and demand |
| groundwater_extraction_mgd / groundwater_recharge_mgd | Groundwater balance |
| energy_consumption_mu | Electricity (Million Units) |
| solar_capacity_mw | Solar installed capacity |
| renewable_share_percent | Renewable energy share |
| waste_generated_tpd / waste_processed_tpd | MSW metrics |
| landfill_dependency_percent | % waste to landfill |
| green_space_sqkm / tree_cover_percent | Green metrics |
| built_up_density_percent | Urban density |
| ghg_emissions_mtco2 | Total GHG |
| transport_emissions_mtco2 / waste_emissions_mtco2 | Sector emissions |
| sustainability_score | 0–100 composite score |

Data reflects Delhi-specific patterns (e.g. East: high waste, low processing; North-East: water stress).

## Modules

1. **Overview Dashboard**: KPIs, zone comparison, trend lines, risk flags
2. **Water Stress**: Zone stress map, demand forecast, groundwater health, wastewater gap, AI alerts
3. **Energy & Solar**: Consumption map, solar priority ranking, renewable scenario simulator
4. **Waste & Circular**: Zone waste dashboard, CE index, intervention map, recycling forecaster
5. **Green Space**: Green score, heat island risk, deficit map, park recommender
6. **Carbon Footprint**: Emissions breakdown, net-zero tracker, policy scenarios
7. **Policy Simulator**: Sliders for solar, waste, green, water, EV, transit → instant impact
8. **AI Recommendations**: Zone health report cards, top interventions
9. **Reports**: Export CSV, JSON for planners

## Success Criteria

✓ Open dashboard and see which zones are in crisis  
✓ Run a forecast to see what happens by 2030  
✓ Test a policy and see quantified impact in seconds  
✓ Export a report for a government presentation  
✓ Get zone-specific recommendations with cost estimates  

## File Structure

```
BDA/
├── data/
│   └── expanded_sustainability_delhi.csv
├── sustainability_api/
│   ├── main.py           # FastAPI backend
│   └── requirements.txt
└── infra-vision/
    ├── app/
    │   ├── api/sustainability/   # Next.js API routes
    │   └── sustainability-intelligence/  # Dashboard pages
    ├── lib/
    │   └── sustainabilityApi.ts  # API client
    └── public/data/
        └── expanded_sustainability_delhi.csv
```
