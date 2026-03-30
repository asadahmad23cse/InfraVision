"""
Example script showing how to use the trained model for predictions on new data.

This demonstrates how to load a saved model and use it for predictions,
which is useful when you have new data for the same city or data for a different city.
"""

import pandas as pd
import geopandas as gpd
import joblib
from pathlib import Path
from school_coverage_model import (
    load_schools_data,
    load_admin_zones,
    load_or_create_population_data,
    predict_school_coverage
)

# ============================================================================
# CONFIGURATION
# ============================================================================

BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "school_coverage_model.pkl"
SCALER_PATH = MODEL_DIR / "school_coverage_scaler.pkl"

# For new predictions, specify your data files
NEW_SCHOOLS_CSV = BASE_DIR / "delhi_schools_all.csv"  # Or path to new city's schools
NEW_ADMIN_GEOJSON = BASE_DIR / "delhi_admin.geojson"  # Or path to new city's zones
NEW_POPULATION_CSV = BASE_DIR / "delhi_population_zones.csv"  # Or path to new city's population

# ============================================================================
# LOAD MODEL AND MAKE PREDICTIONS
# ============================================================================

def load_trained_model():
    """Load the trained model and scaler."""
    print("Loading trained model...")
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    print("Model loaded successfully!")
    return model, scaler


def get_feature_names():
    """
    Get the feature names used during training.
    In a production system, you might save this separately.
    For now, we'll reconstruct it from the model training process.
    """
    # These are the features used in the model (should match training)
    # In production, save this list with the model
    feature_names = [
        'num_schools',
        'total_enrolment',
        'avg_enrolment',
        'avg_student_teacher_ratio',
        'num_primary_schools',
        'num_secondary_schools',
        'num_senior_secondary_schools',
        'num_govt_schools',
        'num_private_schools',
        'population_total',
        'population_6_17',
        'literacy_rate',
        'schools_per_1000_children',
        'seat_capacity_per_100_children',
        'school_level_diversity',
        'govt_school_ratio',
        'enrolment_per_school'
    ]
    return feature_names


def predict_new_data(schools_file, admin_file, population_file):
    """
    Make predictions on new data.
    
    Args:
        schools_file: Path to schools CSV file
        admin_file: Path to administrative zones GeoJSON
        population_file: Path to population CSV file
        
    Returns:
        DataFrame with predictions
    """
    # Load model
    model, scaler = load_trained_model()
    feature_names = get_feature_names()
    
    # Load new data
    print("\nLoading new data...")
    schools_gdf = load_schools_data(schools_file)
    admin_gdf = load_admin_zones(admin_file)
    population_df = load_or_create_population_data(population_file, admin_gdf)
    
    # Make predictions
    print("\nGenerating predictions...")
    predictions = predict_school_coverage(
        schools_gdf,
        admin_gdf,
        population_df,
        model,
        scaler,
        feature_names
    )
    
    return predictions


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("="*60)
    print("School Coverage Prediction - Example Usage")
    print("="*60)
    print()
    
    # Make predictions
    predictions = predict_new_data(
        NEW_SCHOOLS_CSV,
        NEW_ADMIN_GEOJSON,
        NEW_POPULATION_CSV
    )
    
    # Display results
    print("\n" + "="*60)
    print("PREDICTION RESULTS")
    print("="*60)
    print(predictions[['zone_id', 'zone_name', 'predicted_coverage_score', 
                      'coverage_label', 'num_schools']].to_string(index=False))
    
    # Save results
    output_file = BASE_DIR / "new_predictions.csv"
    predictions.to_csv(output_file, index=False)
    print(f"\nPredictions saved to {output_file}")
    
    # Example: Get data for UI
    print("\n" + "="*60)
    print("UI INTEGRATION DATA")
    print("="*60)
    avg_coverage = predictions['predicted_coverage_score'].mean()
    total_schools = predictions['num_schools'].sum()
    status = 'excellent' if avg_coverage >= 80 else ('good' if avg_coverage >= 60 else 'needs-improvement')
    
    print(f"Coverage: {avg_coverage:.0f}%")
    print(f"Total Facilities: {total_schools}")
    print(f"Status: '{status}'")
    print(f"Label: '{predictions.iloc[0]['coverage_label']}'")
    print()
    
    # Example JSON format for API
    print("Example JSON for API/UI:")
    import json
    ui_data = {
        "coverage": round(avg_coverage),
        "totalFacilities": int(total_schools),
        "status": status,
        "label": predictions.iloc[0]['coverage_label'],
        "zones": predictions[['zone_id', 'zone_name', 'predicted_coverage_score', 
                            'coverage_label', 'num_schools']].to_dict('records')
    }
    print(json.dumps(ui_data, indent=2))












