from fastapi import APIRouter, HTTPException
import os
from typing import Any, Dict, Optional

import google.generativeai as genai
import httpx
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

router = APIRouter(prefix="/api/sustainability", tags=["AI Intelligence"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-2.0-flash"))
else:
    model = None


class InsightRequest(BaseModel):
    data_context: Dict[str, Any]
    forecast_data: Optional[Dict[str, Any]] = None


class SimulationRequest(BaseModel):
    user_inputs: Dict[str, float]
    system_result: Dict[str, Any]


class NLQRequest(BaseModel):
    query: str


async def _get_weather_context() -> dict:
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return {"temperature_c": 32, "condition": "Clear", "source": "fallback"}

    try:
        async with httpx.AsyncClient() as client:
            url = f"https://api.openweathermap.org/data/2.5/weather?q=Delhi&appid={api_key}&units=metric"
            resp = await client.get(url, timeout=8)
            resp.raise_for_status()
            data = resp.json()
            return {
                "temperature_c": data["main"]["temp"],
                "condition": data["weather"][0]["main"],
                "source": "openweather",
            }
    except Exception:
        return {"temperature_c": 32, "condition": "Cloudy", "source": "fallback"}


@router.post("/executive-insights")
async def get_executive_insights(req: InsightRequest):
    if not model:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    weather = await _get_weather_context()
    heat_rule = (
        "Temperature is above 40C, so prioritize water stress and heat-driven energy load."
        if float(weather.get("temperature_c", 0)) > 40
        else "Use weather only if it materially changes risk priority."
    )

    prompt = f"""
    You are an Urban Sustainability Expert for the Delhi Government.
    Strict Rule: Do not use words like 'Sure', 'Here is', or 'I think'. Start directly with the insight. Max 2 lines only.
    Current Weather Context: {weather}
    Weather Rule: {heat_rule}

    Data Context: {req.data_context}
    Forecast (2030): {req.forecast_data}

    Task:
    Identify the Red Alert zone, explain why by linking water stress with population or emissions, and provide one cross-sector advice.
    """

    try:
        response = model.generate_content(prompt)
        return {"insight": response.text, "weather": weather}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulation-explainer")
async def get_simulation_explainer(req: SimulationRequest):
    if not model:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    prompt = f"""
    Act as a Policy Strategist.
    Strict Rule: Do not use words like 'Sure', 'Here is', or 'I think'. Start directly with the insight. Max 2 lines only.
    User Inputs: {req.user_inputs}
    System Result: {req.system_result}

    Task: Justify the consequence. If cost is high but score gain is low, mention Diminishing Returns. Mention one social consequence.
    """

    try:
        response = model.generate_content(prompt)
        return {"explanation": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/nlq-to-params")
async def get_nlq_params(req: NLQRequest):
    if not model:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    prompt = f"""
    Convert this User Query into parameters for our Optimization Engine.
    User Query: {req.query}

    Output JSON only:
    {{
      "target_metric": "ghg_emissions",
      "constraint_budget": 500000000,
      "priority_zone": "South",
      "secondary_constraint": "water_demand_supply_gap",
      "focus_areas": ["EV", "Solar"]
    }}
    """

    try:
        response = model.generate_content(prompt)
        return {"params": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
