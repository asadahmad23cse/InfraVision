# UI Integration Guide: School Coverage Model

## Overview

This document explains how the machine learning model outputs connect to the City Infrastructure Intelligence Platform UI, specifically the `InfrastructureCard` component that displays school coverage information.

## UI Component Structure

The UI displays school coverage in the `InfrastructureCard` component with the following structure:

```typescript
interface InfrastructureCardProps {
  coverage: number;           // Percentage (0-100)
  totalFacilities: number;     // Total number of schools
  status: 'excellent' | 'good' | 'needs-improvement';
}
```

## Model Output → UI Mapping

### 1. Coverage Percentage

**UI Display**: Large percentage number (e.g., "78%")

**Model Output**: `predicted_coverage_score` (0-100)

**Mapping**:
```python
# From model predictions
avg_coverage = predictions['predicted_coverage_score'].mean()

# For UI
coverage = round(avg_coverage)  # e.g., 78
```

**Display Location**: Top-right of card, large bold text

### 2. Coverage Label

**UI Display**: Pill-shaped badge (e.g., "Good Coverage")

**Model Output**: `coverage_label` ("Excellent Coverage", "Good Coverage", "Needs Improvement")

**Mapping**:
```python
# From model predictions
label = predictions['coverage_label'].iloc[0]  # e.g., "Good Coverage"

# For UI status code
status = 'excellent' if avg_coverage >= 80 else \
         'good' if avg_coverage >= 60 else \
         'needs-improvement'
```

**Display Location**: Below coverage percentage, colored badge

**Color Mapping**:
- `excellent` → Green gradient (`from-green-500 to-emerald-500`)
- `good` → Teal gradient (`from-[#00A8E8] to-[#34D399]`)
- `needs-improvement` → Orange gradient (`from-amber-500 to-orange-500`)

### 3. Total Facilities

**UI Display**: "1247 facilities" text

**Model Output**: `num_schools` (sum across all zones)

**Mapping**:
```python
# From model predictions
total_schools = predictions['num_schools'].sum()

# For UI
totalFacilities = int(total_schools)  # e.g., 1247
```

**Display Location**: Right side of "Area Coverage" bar

### 4. Area Coverage Bar

**UI Display**: Horizontal progress bar showing coverage percentage

**Model Output**: `predicted_coverage_score` (0-100)

**Mapping**:
```python
# Bar width is percentage of coverage
bar_width = f"{coverage}%"  # e.g., "78%"
```

**Display Location**: Below description, with facility count on the right

## Complete Data Flow

### Step 1: Model Training
```python
python school_coverage_model.py
```

**Output**: 
- Trained model saved to `models/school_coverage_model.pkl`
- Predictions saved to `school_coverage_predictions.csv`

### Step 2: Load Predictions
```python
import pandas as pd

predictions = pd.read_csv('school_coverage_predictions.csv')
```

### Step 3: Aggregate for UI
```python
# Calculate city-level statistics
avg_coverage = predictions['predicted_coverage_score'].mean()
total_schools = predictions['num_schools'].sum()
status = 'excellent' if avg_coverage >= 80 else \
         'good' if avg_coverage >= 60 else \
         'needs-improvement'
```

### Step 4: Format for UI Component
```typescript
const schoolData = {
  title: "Analyze School Distribution in the City",
  description: "Comprehensive analysis of educational infrastructure...",
  Icon: GraduationCap,
  coverage: 78,              // From avg_coverage
  totalFacilities: 1247,     // From total_schools
  status: 'good'             // From status
};
```

## Example API Response Format

For a REST API integration, the model output can be formatted as:

```json
{
  "school_coverage": {
    "coverage": 78,
    "totalFacilities": 1247,
    "status": "good",
    "label": "Good Coverage",
    "zones": [
      {
        "zone_id": "01",
        "zone_name": "East Zone",
        "coverage_score": 78.5,
        "coverage_label": "Good Coverage",
        "num_schools": 45,
        "total_enrolment": 12500
      },
      ...
    ]
  }
}
```

## Real-Time Integration

### Option 1: Pre-computed Predictions

1. Run model training periodically (e.g., daily/weekly)
2. Save predictions to database or JSON file
3. UI fetches pre-computed results

**Pros**: Fast response time, no computation on request
**Cons**: Data may be slightly stale

### Option 2: On-Demand Predictions

1. UI sends request with current data
2. Backend loads model and generates predictions
3. Return results to UI

**Pros**: Always up-to-date
**Cons**: Slower response time

### Option 3: Hybrid Approach

1. Pre-compute predictions for common queries
2. Use on-demand for new data or specific zones
3. Cache results for performance

## Code Example: Backend API Endpoint

```python
from flask import Flask, jsonify
import pandas as pd
import joblib
from school_coverage_model import predict_school_coverage, get_feature_names

app = Flask(__name__)

# Load model once at startup
model = joblib.load('models/school_coverage_model.pkl')
scaler = joblib.load('models/school_coverage_scaler.pkl')
feature_names = get_feature_names()

@app.route('/api/school-coverage', methods=['GET'])
def get_school_coverage():
    # Load current data
    schools_gdf = load_schools_data('delhi_schools_all.csv')
    admin_gdf = load_admin_zones('delhi_admin.geojson')
    population_df = load_or_create_population_data('delhi_population_zones.csv', admin_gdf)
    
    # Generate predictions
    predictions = predict_school_coverage(
        schools_gdf, admin_gdf, population_df, model, scaler, feature_names
    )
    
    # Aggregate for UI
    avg_coverage = predictions['predicted_coverage_score'].mean()
    total_schools = predictions['num_schools'].sum()
    status = 'excellent' if avg_coverage >= 80 else \
             'good' if avg_coverage >= 60 else \
             'needs-improvement'
    
    return jsonify({
        'coverage': round(avg_coverage),
        'totalFacilities': int(total_schools),
        'status': status,
        'label': predictions['coverage_label'].iloc[0],
        'zones': predictions.to_dict('records')
    })
```

## Zone-Level Visualization

The UI can also display zone-level coverage using the grid visualization:

```typescript
// Map coverage scores to grid colors
const zoneCoverage = predictions.map(zone => ({
  zone_id: zone.zone_id,
  coverage_score: zone.predicted_coverage_score,
  color: getCoverageColor(zone.predicted_coverage_score)
}));

function getCoverageColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'teal';
  return 'orange';
}
```

## Summary

The model provides three key outputs for the UI:

1. **Coverage Score (0-100)**: Displayed as percentage
2. **Coverage Label**: Text label for the badge
3. **Total Facilities**: Count of schools for the "Area Coverage" text

These outputs directly map to the `InfrastructureCard` component props:
- `coverage` → Coverage percentage
- `totalFacilities` → Total schools count
- `status` → Coverage status code

The model is designed to be easily integrated into any frontend framework (React, Vue, Angular) through a simple API or data file.












