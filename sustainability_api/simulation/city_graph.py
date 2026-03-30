"""
Digital Twin: City Graph Model using NetworkX.
Zones = nodes with resource attributes.
Edges = infrastructure flows (water pipelines, energy grid, waste transport).
"""
import networkx as nx
import numpy as np
from typing import Optional
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import ALL_ZONES, POPULATION_GROWTH_RATE

# Zone adjacency (Delhi zones sharing infrastructure)
ZONE_EDGES = [
    ("North", "North-West", {"type": "water_pipeline", "capacity": 380}),
    ("North", "North-East", {"type": "water_pipeline", "capacity": 350}),
    ("North", "Central",    {"type": "energy_grid",    "capacity": 2200}),
    ("Central", "South",    {"type": "energy_grid",    "capacity": 2500}),
    ("Central", "East",     {"type": "waste_transport","capacity": 800}),
    ("Central", "West",     {"type": "waste_transport","capacity": 750}),
    ("South", "South-East", {"type": "water_pipeline", "capacity": 300}),
    ("South", "South-West", {"type": "water_pipeline", "capacity": 310}),
    ("West",  "North-West", {"type": "energy_grid",    "capacity": 1900}),
    ("East",  "North-East", {"type": "energy_grid",    "capacity": 1700}),
    ("North-West", "South-West", {"type": "waste_transport","capacity": 600}),
    ("North-East", "South-East", {"type": "water_pipeline","capacity": 290}),
]


def build_city_graph(zone_data: list[dict]) -> nx.DiGraph:
    """
    Build a directed graph of Delhi's infrastructure.
    zone_data: list of dicts with zone attributes (latest year).
    """
    G = nx.DiGraph()

    # Add zone nodes
    for zd in zone_data:
        zone = zd.get("zone")
        G.add_node(zone, **{
            "population": zd.get("population", 3e6),
            "water_supply_mgd": zd.get("water_supply_mgd", 300),
            "water_demand_mgd": zd.get("water_demand_mgd", 350),
            "energy_consumption_mu": zd.get("energy_consumption_mu", 3800),
            "solar_capacity_mw": zd.get("solar_capacity_mw", 200),
            "waste_generated_tpd": zd.get("waste_generated_tpd", 1200),
            "waste_processed_tpd": zd.get("waste_processed_tpd", 700),
            "ghg_emissions_mtco2": zd.get("ghg_emissions_mtco2", 5.5),
            "sustainability_score": zd.get("sustainability_score", 55),
            "status": "normal",
        })

    # Add infrastructure edges
    for src, dst, attrs in ZONE_EDGES:
        if src in G and dst in G:
            G.add_edge(src, dst, **attrs)
            G.add_edge(dst, src, **{**attrs, "capacity": attrs["capacity"] * 0.7})  # reverse flow

    return G


def get_graph_export(G: nx.DiGraph) -> dict:
    """Export graph for frontend visualization (nodes + links format)."""
    nodes = []
    for node, attrs in G.nodes(data=True):
        score = attrs.get("sustainability_score", 55)
        nodes.append({
            "id": node,
            "label": node,
            "score": round(float(score), 1),
            "status": attrs.get("status", "normal"),
            "population": int(attrs.get("population", 0)),
            "water_stress": round(max(0, float(attrs.get("water_demand_mgd", 1)) - float(attrs.get("water_supply_mgd", 0))), 1),
            "energy_mu": round(float(attrs.get("energy_consumption_mu", 0)), 1),
            "ghg": round(float(attrs.get("ghg_emissions_mtco2", 0)), 2),
        })

    links = []
    for src, dst, attrs in G.edges(data=True):
        links.append({
            "source": src,
            "target": dst,
            "type": attrs.get("type", "infrastructure"),
            "capacity": attrs.get("capacity", 100),
        })

    metrics = {
        "total_nodes": G.number_of_nodes(),
        "total_edges": G.number_of_edges(),
        "avg_degree": round(sum(dict(G.degree()).values()) / max(1, G.number_of_nodes()), 2),
        "is_connected": nx.is_weakly_connected(G),
    }
    return {"nodes": nodes, "links": links, "metrics": metrics}


def simulate_zone_failure(G: nx.DiGraph, failed_zone: str) -> dict:
    """
    Simulate what happens when a zone fails (water outage, power failure).
    Returns cascading impact on connected zones.
    """
    G2 = G.copy()
    G2.nodes[failed_zone]["status"] = "failed"

    impacted = {}
    for neighbor in list(G2.neighbors(failed_zone)):
        edge = G2.edges[failed_zone, neighbor]
        edge_type = edge.get("type", "")
        n_attrs = G2.nodes[neighbor]

        impact_pct = 0
        if edge_type == "water_pipeline":
            impact_pct = 25  # 25% reduction in water supply
            G2.nodes[neighbor]["water_supply_mgd"] = n_attrs["water_supply_mgd"] * 0.75
        elif edge_type == "energy_grid":
            impact_pct = 20
            G2.nodes[neighbor]["energy_consumption_mu"] = n_attrs["energy_consumption_mu"] * 0.80
        elif edge_type == "waste_transport":
            impact_pct = 30
            G2.nodes[neighbor]["waste_processed_tpd"] = n_attrs["waste_processed_tpd"] * 0.70

        G2.nodes[neighbor]["status"] = "impacted"
        impacted[neighbor] = {
            "impact_type": edge_type,
            "reduction_percent": impact_pct,
        }

    return {
        "failed_zone": failed_zone,
        "directly_impacted": impacted,
        "network_resilience_pct": round((1 - len(impacted) / max(1, G.number_of_nodes() - 1)) * 100, 1),
        "graph": get_graph_export(G2),
    }
