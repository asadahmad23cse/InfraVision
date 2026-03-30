"""
Quick script to check and verify park coverage model results.
Run this after running park_coverage_model.py to verify everything is working correctly.
"""

import pandas as pd
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).parent

# Color codes for terminal output
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
RESET = '\033[0m'

def print_success(msg):
    print(f"{GREEN}[SUCCESS]{RESET} {msg}")

def print_warning(msg):
    print(f"{YELLOW}[WARNING]{RESET} {msg}")

def print_error(msg):
    print(f"{RED}[ERROR]{RESET} {msg}")

print("="*60)
print("CHECKING PARK COVERAGE MODEL RESULTS")
print("="*60)

# Step 1: Check if predictions file exists
predictions_file = BASE_DIR / "park_coverage_predictions.csv"
if not predictions_file.exists():
    print_error("Predictions file not found!")
    print("   Run 'python park_coverage_model.py' first to generate predictions.")
    exit(1)

print_success("Predictions file found")

# Step 2: Load and check predictions
predictions = pd.read_csv(predictions_file)
print(f"\n{GREEN}[SUCCESS]{RESET} Loaded {len(predictions)} zone predictions")

# Step 3: Verify data structure
print("\n" + "="*60)
print("DATA STRUCTURE CHECK")
print("="*60)
required_cols = ['zone_id', 'zone_name', 'predicted_coverage_score', 
                 'coverage_label', 'num_parks', 'total_area', 'status']
missing_cols = [col for col in required_cols if col not in predictions.columns]
if missing_cols:
    print_error(f"Missing columns: {missing_cols}")
else:
    print_success("All required columns present")

# Step 4: Check coverage scores
print("\n" + "="*60)
print("COVERAGE SCORES CHECK")
print("="*60)
scores = predictions['predicted_coverage_score']
print(f"  Score range: {scores.min():.1f} - {scores.max():.1f}")
print(f"  Average score: {scores.mean():.1f}%")
print(f"  Scores in valid range (0-100): {(scores.between(0, 100)).all()}")

if (scores.between(0, 100)).all():
    print_success("All scores are in valid range")
else:
    print_error("Some scores are outside valid range (0-100)")

# Step 5: Check coverage labels
print("\n" + "="*60)
print("COVERAGE LABELS CHECK")
print("="*60)
valid_labels = ['Excellent Coverage', 'Good Coverage', 'Needs Improvement']
labels = predictions['coverage_label'].unique()
print(f"  Unique labels: {list(labels)}")
print(f"  Label distribution:")
for label, count in predictions['coverage_label'].value_counts().items():
    print(f"    {label}: {count} zones")

if all(label in valid_labels for label in labels):
    print_success("All labels are valid")
else:
    print_error("Some labels are invalid")

# Step 6: Check park counts
print("\n" + "="*60)
print("PARK COUNTS CHECK")
print("="*60)
total_parks = predictions['num_parks'].sum()
avg_parks = predictions['num_parks'].mean()
print(f"  Total parks: {total_parks:,}")
print(f"  Average parks per zone: {avg_parks:.1f}")
print(f"  Zones with parks: {(predictions['num_parks'] > 0).sum()}")
print(f"  Zones with 0 parks: {(predictions['num_parks'] == 0).sum()}")

if total_parks > 0:
    print_success("Parks are assigned to zones")
else:
    print_error("No parks assigned to zones")

# Step 7: Check area data
print("\n" + "="*60)
print("AREA DATA CHECK")
print("="*60)
total_area = predictions['total_area'].sum()
avg_area = predictions['total_area'].mean()
print(f"  Total area: {total_area:,.2f}")
print(f"  Average area per zone: {avg_area:.2f}")
print(f"  Zones with area data: {(predictions['total_area'] > 0).sum()}")

if total_area > 0:
    print_success("Area data present")
else:
    print_warning("Area data is missing (all zeros)")

# Step 8: Check for empty zones
print("\n" + "="*60)
print("EMPTY ZONES CHECK")
print("="*60)
empty_zones = predictions[(predictions['num_parks'] == 0) & (predictions['total_area'] == 0)]
if len(empty_zones) > 0:
    print_warning(f"Found {len(empty_zones)} zones with no parks")
    print(f"  Sample empty zones: {list(empty_zones['zone_name'].head(5))}")
else:
    print_success("All zones have at least some park data")

# Step 9: Calculate UI integration data
print("\n" + "="*60)
print("UI INTEGRATION DATA")
print("="*60)
avg_coverage = predictions['predicted_coverage_score'].mean()
total_parks = predictions['num_parks'].sum()
status = 'excellent' if avg_coverage >= 80 else \
         'good' if avg_coverage >= 60 else \
         'needs-improvement'

print(f"  coverage: {round(avg_coverage)}")
print(f"  totalFacilities: {total_parks}")
print(f"  status: '{status}'")
print(f"  label: '{predictions['coverage_label'].iloc[0]}'")

# Step 10: Display sample predictions
print("\n" + "="*60)
print("SAMPLE PREDICTIONS")
print("="*60)
display_cols = ['zone_id', 'zone_name', 'predicted_coverage_score', 
               'coverage_label', 'num_parks', 'total_area']
print(predictions[display_cols].head(10).to_string(index=False))

# Step 11: Summary
print("\n" + "="*60)
print("SUMMARY")
print("="*60)

issues = []
warnings = []

if not (scores.between(0, 100)).all():
    issues.append("Some coverage scores are outside valid range")

if total_parks == 0:
    issues.append("No parks assigned to zones")

if total_area == 0:
    warnings.append("Area data is missing (affects coverage scores)")

if len(empty_zones) > len(predictions) * 0.5:
    warnings.append(f"More than 50% of zones have no parks ({len(empty_zones)}/{len(predictions)})")

if issues:
    print(f"\n{RED}[ISSUES FOUND]{RESET}")
    for issue in issues:
        print(f"   - {issue}")

if warnings:
    print(f"\n{YELLOW}[WARNINGS]{RESET}")
    for warning in warnings:
        print(f"   - {warning}")

if not issues and not warnings:
    print(f"\n{GREEN}[SUCCESS]{RESET} All checks passed! Model results look good.")
elif not issues:
    print(f"\n{GREEN}[SUCCESS]{RESET} No critical issues. Model is working, but check warnings above.")
else:
    print(f"\n{RED}[ERROR]{RESET} Some issues found. Please review and fix before using in production.")

print("\n" + "="*60)
print("NEXT STEPS")
print("="*60)
print("""
1. Review the predictions in park_coverage_predictions.csv
2. If area data is missing, check your parks CSV for area columns
3. If only few parks are assigned, consider:
   - Getting complete zone boundaries GeoJSON
   - Using use_nearest=True to assign parks to nearest zones
4. Verify UI integration data matches your requirements
5. Ensure park_coverage_predictions.csv is copied to infra-vision/data/
""")








