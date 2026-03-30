"""
Quick script to check and verify model results.
Run this after training to verify everything is working correctly.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import joblib

BASE_DIR = Path(__file__).parent

print("="*60)
print("CHECKING MODEL RESULTS")
print("="*60)

# Step 1: Check if predictions file exists
predictions_file = BASE_DIR / "school_coverage_predictions.csv"
if not predictions_file.exists():
    print("\n❌ ERROR: Predictions file not found!")
    print("   Run 'python school_coverage_model.py' first to generate predictions.")
    exit(1)

print("\n✅ Predictions file found")

# Step 2: Load and check predictions
predictions = pd.read_csv(predictions_file)
print(f"\n✅ Loaded {len(predictions)} zone predictions")

# Step 3: Verify data structure
print("\n" + "="*60)
print("DATA STRUCTURE CHECK")
print("="*60)
required_cols = ['zone_id', 'zone_name', 'predicted_coverage_score', 
                 'coverage_label', 'num_schools']
missing_cols = [col for col in required_cols if col not in predictions.columns]
if missing_cols:
    print(f"❌ Missing columns: {missing_cols}")
else:
    print("✅ All required columns present")

# Step 4: Check coverage scores
print("\n" + "="*60)
print("COVERAGE SCORES CHECK")
print("="*60)
scores = predictions['predicted_coverage_score']
print(f"  Score range: {scores.min():.1f} - {scores.max():.1f}")
print(f"  Average score: {scores.mean():.1f}%")
print(f"  Scores in valid range (0-100): {(scores.between(0, 100)).all()}")

if (scores.between(0, 100)).all():
    print("✅ All scores are in valid range")
else:
    print("❌ Some scores are outside valid range (0-100)")

# Step 5: Check coverage labels
print("\n" + "="*60)
print("COVERAGE LABELS CHECK")
print("="*60)
valid_labels = ['Excellent Coverage', 'Good Coverage', 'Needs Improvement']
labels = predictions['coverage_label'].unique()
print(f"  Unique labels: {labels}")
print(f"  Label distribution:")
print(predictions['coverage_label'].value_counts())

if all(label in valid_labels for label in labels):
    print("✅ All labels are valid")
else:
    print("❌ Some labels are invalid")

# Step 6: Check school counts
print("\n" + "="*60)
print("SCHOOL COUNTS CHECK")
print("="*60)
total_schools = predictions['num_schools'].sum()
avg_schools = predictions['num_schools'].mean()
print(f"  Total schools: {total_schools}")
print(f"  Average schools per zone: {avg_schools:.1f}")
print(f"  Zones with schools: {(predictions['num_schools'] > 0).sum()}")
print(f"  Zones with 0 schools: {(predictions['num_schools'] == 0).sum()}")

if total_schools > 0:
    print("✅ Schools are assigned to zones")
else:
    print("❌ No schools assigned to zones")

# Step 7: Check enrolment data
print("\n" + "="*60)
print("ENROLMENT DATA CHECK")
print("="*60)
if 'total_enrolment' in predictions.columns:
    total_enrolment = predictions['total_enrolment'].sum()
    print(f"  Total enrolment: {total_enrolment:,.0f}")
    if total_enrolment > 0:
        print("✅ Enrolment data present")
    else:
        print("⚠️  WARNING: Enrolment data is missing (all zeros)")
        print("   This will affect coverage scores. Check your CSV for enrolment columns.")
else:
    print("⚠️  WARNING: Enrolment column not found")

# Step 8: Check model files
print("\n" + "="*60)
print("MODEL FILES CHECK")
print("="*60)
model_file = BASE_DIR / "models" / "school_coverage_model.pkl"
scaler_file = BASE_DIR / "models" / "school_coverage_scaler.pkl"

if model_file.exists():
    print("✅ Model file found")
    try:
        model = joblib.load(model_file)
        print(f"   Model type: {type(model).__name__}")
        print(f"   Number of features: {model.n_features_in_}")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
else:
    print("❌ Model file not found")

if scaler_file.exists():
    print("✅ Scaler file found")
else:
    print("❌ Scaler file not found")

# Step 9: Calculate UI integration data
print("\n" + "="*60)
print("UI INTEGRATION DATA")
print("="*60)
avg_coverage = predictions['predicted_coverage_score'].mean()
total_schools = predictions['num_schools'].sum()
status = 'excellent' if avg_coverage >= 80 else \
         'good' if avg_coverage >= 60 else \
         'needs-improvement'

print(f"  coverage: {round(avg_coverage)}")
print(f"  totalFacilities: {total_schools}")
print(f"  status: '{status}'")
print(f"  label: '{predictions['coverage_label'].iloc[0]}'")

# Step 10: Display sample predictions
print("\n" + "="*60)
print("SAMPLE PREDICTIONS")
print("="*60)
display_cols = ['zone_id', 'zone_name', 'predicted_coverage_score', 
               'coverage_label', 'num_schools']
if 'total_enrolment' in predictions.columns:
    display_cols.append('total_enrolment')

print(predictions[display_cols].head(10).to_string(index=False))

# Step 11: Summary
print("\n" + "="*60)
print("SUMMARY")
print("="*60)

issues = []
warnings = []

if not (scores.between(0, 100)).all():
    issues.append("Some coverage scores are outside valid range")

if total_schools == 0:
    issues.append("No schools assigned to zones")

if 'total_enrolment' in predictions.columns:
    if predictions['total_enrolment'].sum() == 0:
        warnings.append("Enrolment data is missing (affects coverage scores)")

if not model_file.exists():
    issues.append("Model file not found")

if issues:
    print("\n❌ ISSUES FOUND:")
    for issue in issues:
        print(f"   - {issue}")

if warnings:
    print("\n⚠️  WARNINGS:")
    for warning in warnings:
        print(f"   - {warning}")

if not issues and not warnings:
    print("\n✅ All checks passed! Model results look good.")
elif not issues:
    print("\n✅ No critical issues. Model is working, but check warnings above.")
else:
    print("\n❌ Some issues found. Please review and fix before using in production.")

print("\n" + "="*60)
print("NEXT STEPS")
print("="*60)
print("""
1. Review the predictions in school_coverage_predictions.csv
2. If enrolment data is missing, check your CSV for enrolment columns
3. If only few schools are assigned, consider:
   - Getting complete zone boundaries GeoJSON
   - Using use_nearest=True to assign schools to nearest zones
4. Verify UI integration data matches your requirements
5. Test the model on new data using predict_example.py
""")











