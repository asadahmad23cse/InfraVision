"""
Diagnostic script to check data quality and identify issues.
"""

import pandas as pd
import geopandas as gpd
from pathlib import Path

BASE_DIR = Path(__file__).parent

# Check schools CSV
print("="*60)
print("CHECKING SCHOOLS DATA")
print("="*60)
schools_df = pd.read_csv(BASE_DIR / "delhi_schools_all.csv", encoding='utf-8', header=1, nrows=5)
print("\nFirst few rows:")
print(schools_df.head())
print("\nColumn names:")
print(schools_df.columns.tolist())
print("\nData types:")
print(schools_df.dtypes)

# Check for enrolment-related columns
enrolment_cols = [col for col in schools_df.columns if 'enrol' in col.lower() or 'student' in col.lower() or 'capacity' in col.lower()]
print(f"\nEnrolment-related columns found: {enrolment_cols}")

# Check admin zones
print("\n" + "="*60)
print("CHECKING ADMINISTRATIVE ZONES")
print("="*60)
admin_gdf = gpd.read_file(BASE_DIR / "delhi_admin.geojson")
print(f"\nNumber of zones: {len(admin_gdf)}")
print(f"Zone names: {admin_gdf['name'].tolist() if 'name' in admin_gdf.columns else 'N/A'}")
print(f"Columns: {admin_gdf.columns.tolist()}")

# Check population data
print("\n" + "="*60)
print("CHECKING POPULATION DATA")
print("="*60)
if (BASE_DIR / "delhi_population_zones.csv").exists():
    pop_df = pd.read_csv(BASE_DIR / "delhi_population_zones.csv", index_col=False)
    print(f"\nPopulation data loaded: {len(pop_df)} zones")
    print(pop_df.head())
else:
    print("\nPopulation CSV not found (will be created)")

# Check predictions
print("\n" + "="*60)
print("CHECKING PREDICTIONS")
print("="*60)
if (BASE_DIR / "school_coverage_predictions.csv").exists():
    pred_df = pd.read_csv(BASE_DIR / "school_coverage_predictions.csv")
    print(f"\nPredictions loaded: {len(pred_df)} zones")
    print(pred_df.head())
    print(f"\nTotal schools in predictions: {pred_df['num_schools'].sum()}")
    print(f"Total enrolment in predictions: {pred_df.get('total_enrolment', pd.Series([0])).sum()}")
else:
    print("\nPredictions file not found")

print("\n" + "="*60)
print("RECOMMENDATIONS")
print("="*60)
print("""
1. If enrolment data is missing:
   - Check if your CSV has enrolment/student count columns with different names
   - The model will work with 0 enrolment, but coverage scores will be lower
   - Consider adding enrolment data manually or estimating from school capacity

2. If only few schools are assigned to zones:
   - Your GeoJSON only has 2 zones (Dwarka and Paschim Vihar)
   - Most schools (1021 out of 1080) are outside these zones
   - Consider:
     a) Getting a complete Delhi NCR administrative zones GeoJSON
     b) Expanding the zone boundaries
     c) Using a different spatial join method (e.g., nearest zone)

3. To improve coverage scores:
   - Add enrolment data
   - Ensure population data is accurate
   - Check that all features are being calculated correctly
   - Consider adjusting the coverage score formula in calculate_coverage_score()
""")











