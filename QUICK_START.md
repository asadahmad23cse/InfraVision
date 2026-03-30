# Quick Start Guide: School Coverage Model

## Overview

This guide will help you quickly get started with the School Coverage Analysis Model for the City Infrastructure Intelligence Platform.

## Prerequisites

- Python 3.8 or higher
- Required data files (see below)

## Installation

1. **Install dependencies**:
```bash
pip install -r requirements.txt
```

## Data Files Required

Ensure you have these files in the same directory as the script:

1. **`delhi_schools_all.csv`** - School point data with coordinates
2. **`delhi_admin.geojson`** - Administrative zone boundaries
3. **`delhi_population_zones.csv`** - Population data per zone (optional - will be created if missing)

## Quick Start

### Step 1: Train the Model

Run the main script to train the model:

```bash
python school_coverage_model.py
```

This will:
- Load and clean your data
- Perform spatial joins
- Create features
- Train the model
- Save the model to `models/` directory
- Generate predictions to `school_coverage_predictions.csv`

### Step 2: Check Results

After training, you'll see:
- Model evaluation metrics (R², MAE, RMSE)
- Feature importance rankings
- Sample predictions
- Summary statistics for UI integration

### Step 3: Use Predictions

The predictions CSV contains:
- `zone_id`: Zone identifier
- `zone_name`: Zone name
- `predicted_coverage_score`: Coverage score (0-100)
- `coverage_label`: Text label ("Excellent Coverage", "Good Coverage", "Needs Improvement")
- `status`: UI status code ("excellent", "good", "needs-improvement")
- `num_schools`: Number of schools in zone
- `total_enrolment`: Total enrolment capacity

## UI Integration

### For the InfrastructureCard Component

The model output maps directly to the UI component:

```typescript
// From model predictions
const schoolData = {
  coverage: 78,              // Average coverage percentage
  totalFacilities: 1247,     // Total number of schools
  status: 'good'             // 'excellent' | 'good' | 'needs-improvement'
};
```

### Getting UI-Ready Data

```python
import pandas as pd

# Load predictions
predictions = pd.read_csv('school_coverage_predictions.csv')

# Calculate city-level statistics
avg_coverage = predictions['predicted_coverage_score'].mean()
total_schools = predictions['num_schools'].sum()
status = 'excellent' if avg_coverage >= 80 else \
         'good' if avg_coverage >= 60 else \
         'needs-improvement'

# For UI
ui_data = {
    'coverage': round(avg_coverage),
    'totalFacilities': int(total_schools),
    'status': status
}
```

## Using Trained Model for New Predictions

Once you have a trained model, use it for new data:

```bash
python predict_example.py
```

Or in your code:

```python
from school_coverage_model import predict_school_coverage
import joblib

# Load model
model = joblib.load('models/school_coverage_model.pkl')
scaler = joblib.load('models/school_coverage_scaler.pkl')

# Load new data
schools_gdf = load_schools_data('new_schools.csv')
admin_gdf = load_admin_zones('new_zones.geojson')
population_df = load_or_create_population_data('new_population.csv', admin_gdf)

# Make predictions
predictions = predict_school_coverage(
    schools_gdf, admin_gdf, population_df, model, scaler, feature_names
)
```

## Troubleshooting

### Issue: CSV format not recognized

**Solution**: The script auto-detects column names. If issues persist:
- Check that your CSV has `Latitude` and `Longitude` columns (or similar)
- Ensure coordinates are numeric

### Issue: No schools assigned to zones

**Solution**: 
- Check that school coordinates are in the same CRS as zone boundaries
- Verify coordinates are within zone boundaries
- Check for coordinate system issues (should be WGS84/EPSG:4326)

### Issue: Population data missing

**Solution**: The script will create synthetic population data if the file is missing. For production, provide real population data in `delhi_population_zones.csv`.

### Issue: Model performance is poor

**Solution**:
- Check data quality (missing values, outliers)
- Adjust feature engineering in `create_features()`
- Modify coverage score formula in `calculate_coverage_score()`
- Try different model parameters or algorithms

## Next Steps

1. **Customize the model**: Adjust the coverage score formula in `calculate_coverage_score()`
2. **Add features**: Include additional features like distance to nearest school
3. **Visualize results**: Create maps showing coverage by zone
4. **Deploy to production**: Set up API endpoint for real-time predictions

## File Structure

```
.
├── school_coverage_model.py      # Main training script
├── predict_example.py             # Example prediction script
├── requirements.txt               # Python dependencies
├── QUICK_START.md                 # This file
├── SCHOOL_COVERAGE_MODEL_README.md # Detailed documentation
├── UI_INTEGRATION_GUIDE.md        # UI integration guide
├── delhi_schools_all.csv          # Input: School data
├── delhi_admin.geojson            # Input: Zone boundaries
├── delhi_population_zones.csv     # Input: Population data
├── models/                        # Output: Saved models
│   ├── school_coverage_model.pkl
│   └── school_coverage_scaler.pkl
└── school_coverage_predictions.csv # Output: Predictions
```

## Support

For detailed documentation, see:
- `SCHOOL_COVERAGE_MODEL_README.md` - Complete model documentation
- `UI_INTEGRATION_GUIDE.md` - UI integration details

## Example Output

After running the model, you'll see output like:

```
================================================================================
MODEL EVALUATION METRICS
================================================================================
Training Set:
  R² Score: 0.9234
  MAE: 3.4567
  RMSE: 4.5678

Test Set:
  R² Score: 0.8901
  MAE: 4.1234
  RMSE: 5.2345
================================================================================

SAMPLE PREDICTIONS
================================================================================
zone_id zone_name  predicted_coverage_score coverage_label  num_schools
01      East Zone  78.5                     Good Coverage  45
02      West Zone  85.2                     Excellent     52
...
```

The predictions CSV will contain all zone-level predictions ready for UI integration.












