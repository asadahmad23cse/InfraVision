# How to Check Your Model Results

## Step-by-Step Guide to Verify Results

### Step 1: View Prediction Results

The predictions are saved in `school_coverage_predictions.csv`. Open it to see:

```bash
# View the predictions file
python -c "import pandas as pd; df = pd.read_csv('school_coverage_predictions.csv'); print(df.to_string())"
```

Or open it in Excel/any spreadsheet software.

**What to check:**
- ✅ `predicted_coverage_score`: Should be between 0-100
- ✅ `coverage_label`: Should be "Excellent Coverage", "Good Coverage", or "Needs Improvement"
- ✅ `num_schools`: Number of schools per zone
- ✅ `total_enrolment`: Total enrolment capacity (currently 0 if data is missing)

### Step 2: Run Diagnostic Script

Check your data quality:

```bash
python diagnose_data.py
```

**What it shows:**
- Available columns in your CSV
- Whether enrolment data exists
- Number of zones in GeoJSON
- Current data quality issues

### Step 3: Verify Model Performance

The model evaluation metrics were shown during training. Check:

**Metrics to verify:**
- **R² Score**: Should be > 0.7 (higher is better)
  - Training R²: Model fit on training data
  - Test R²: Model performance on unseen data
- **MAE (Mean Absolute Error)**: Lower is better
  - Should be < 10 for good predictions
- **RMSE (Root Mean Squared Error)**: Lower is better
  - Should be < 15 for good predictions

**If metrics are low:**
- Check if features are being calculated correctly
- Verify data quality
- Check if target variable (coverage_score) is reasonable

### Step 4: Check Feature Importance

The model shows feature importance during training. Important features should include:
- `schools_per_1000_children` (most important)
- `seat_capacity_per_100_children`
- `avg_student_teacher_ratio`
- `literacy_rate`

**To see feature importance:**
- Check the console output during training
- Or load the model and check:

```python
import joblib
import pandas as pd

model = joblib.load('models/school_coverage_model.pkl')
feature_names = ['num_schools', 'total_enrolment', 'avg_enrolment', 
                 'avg_student_teacher_ratio', 'num_primary_schools', 
                 'num_secondary_schools', 'num_senior_secondary_schools',
                 'num_govt_schools', 'num_private_schools', 'population_total',
                 'population_6_17', 'literacy_rate', 'schools_per_1000_children',
                 'seat_capacity_per_100_children', 'school_level_diversity',
                 'govt_school_ratio', 'enrolment_per_school']

importance_df = pd.DataFrame({
    'feature': feature_names,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print(importance_df)
```

### Step 5: Verify Zone Coverage

Check how many schools were assigned to zones:

```python
import pandas as pd

# Load predictions
predictions = pd.read_csv('school_coverage_predictions.csv')

# Check zone coverage
print(f"Total zones: {len(predictions)}")
print(f"Total schools: {predictions['num_schools'].sum()}")
print(f"Average schools per zone: {predictions['num_schools'].mean():.1f}")

# Check coverage distribution
print("\nCoverage Distribution:")
print(predictions['coverage_label'].value_counts())
```

**Expected:**
- If you have 2 zones and 59 schools assigned, that's only 5.5% of 1080 schools
- Most schools are outside your zone boundaries

### Step 6: Check UI Integration Data

Verify the data format for UI:

```python
import pandas as pd

# Load predictions
predictions = pd.read_csv('school_coverage_predictions.csv')

# Calculate UI data
avg_coverage = predictions['predicted_coverage_score'].mean()
total_schools = predictions['num_schools'].sum()
status = 'excellent' if avg_coverage >= 80 else \
         'good' if avg_coverage >= 60 else \
         'needs-improvement'

print("UI Integration Data:")
print(f"  coverage: {round(avg_coverage)}")
print(f"  totalFacilities: {total_schools}")
print(f"  status: '{status}'")
print(f"  label: '{predictions['coverage_label'].iloc[0]}'")
```

**This should match:**
- Coverage percentage shown in UI (e.g., 78%)
- Total facilities count (e.g., 1247)
- Status code for styling (e.g., 'good')

### Step 7: Visualize Results (Optional)

Create a simple visualization:

```python
import pandas as pd
import matplotlib.pyplot as plt

# Load predictions
predictions = pd.read_csv('school_coverage_predictions.csv')

# Create visualization
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Coverage scores by zone
axes[0].bar(predictions['zone_name'], predictions['predicted_coverage_score'])
axes[0].set_title('Coverage Scores by Zone')
axes[0].set_ylabel('Coverage Score (%)')
axes[0].set_ylim(0, 100)
axes[0].tick_params(axis='x', rotation=45)

# Number of schools by zone
axes[1].bar(predictions['zone_name'], predictions['num_schools'])
axes[1].set_title('Number of Schools by Zone')
axes[1].set_ylabel('Number of Schools')
axes[1].tick_params(axis='x', rotation=45)

plt.tight_layout()
plt.savefig('coverage_results.png', dpi=150)
print("Visualization saved to coverage_results.png")
```

### Step 8: Compare Predictions vs True Scores

If you have true coverage scores, compare:

```python
import pandas as pd
import numpy as np

# Load predictions
predictions = pd.read_csv('school_coverage_predictions.csv')

if 'true_coverage_score' in predictions.columns:
    # Calculate differences
    predictions['difference'] = predictions['predicted_coverage_score'] - predictions['true_coverage_score']
    
    print("Prediction Accuracy:")
    print(f"  Mean Absolute Error: {predictions['difference'].abs().mean():.2f}")
    print(f"  Max Difference: {predictions['difference'].abs().max():.2f}")
    
    # Show comparison
    print("\nZone-by-Zone Comparison:")
    print(predictions[['zone_name', 'true_coverage_score', 
                       'predicted_coverage_score', 'difference']].to_string(index=False))
```

### Step 9: Check Data Quality Issues

Verify common issues:

```python
import pandas as pd

# Load predictions
predictions = pd.read_csv('school_coverage_predictions.csv')

# Check for issues
print("Data Quality Checks:")
print(f"  Missing enrolment data: {predictions['total_enrolment'].sum() == 0}")
print(f"  Zones with 0 schools: {(predictions['num_schools'] == 0).sum()}")
print(f"  Coverage scores in valid range: {(predictions['predicted_coverage_score'].between(0, 100)).all()}")

# Check coverage distribution
print(f"\nCoverage Distribution:")
print(predictions['coverage_label'].value_counts())
```

### Step 10: Test Model on New Data

Test the model on new data:

```bash
python predict_example.py
```

**What to check:**
- Model loads correctly
- Predictions are generated
- Output format matches UI requirements

## Quick Verification Checklist

- [ ] Predictions file exists (`school_coverage_predictions.csv`)
- [ ] Model files exist (`models/school_coverage_model.pkl`, `models/school_coverage_scaler.pkl`)
- [ ] Coverage scores are between 0-100
- [ ] Coverage labels are correct ("Excellent", "Good", or "Needs Improvement")
- [ ] Number of schools per zone is reasonable
- [ ] Model evaluation metrics (R², MAE, RMSE) are acceptable
- [ ] UI integration data format is correct
- [ ] Feature importance makes sense

## Common Issues and Solutions

### Issue: Coverage scores are all the same
**Solution**: Check if features are being calculated correctly. Verify data quality.

### Issue: Total enrolment is 0
**Solution**: Check if enrolment data exists in CSV. Run `diagnose_data.py` to see available columns.

### Issue: Only few schools assigned to zones
**Solution**: 
- Get complete zone boundaries GeoJSON
- Or use `use_nearest=True` to assign schools to nearest zones

### Issue: Low R² score (< 0.5)
**Solution**: 
- Check data quality
- Verify features are meaningful
- Check if target variable (coverage_score) formula is reasonable

### Issue: Predictions don't match UI requirements
**Solution**: 
- Verify aggregation (average coverage, total schools)
- Check status code mapping (excellent/good/needs-improvement)
- Ensure data format matches InfrastructureCard component

## Next Steps After Verification

1. **If results look good**: Integrate with UI
2. **If data quality issues**: Fix data and retrain
3. **If coverage is incomplete**: Get complete zone boundaries
4. **If scores are low**: Add missing data (enrolment, population)

## Integration with UI

Once verified, use the predictions in your UI:

```typescript
// Load predictions data
const predictions = await fetch('/api/school-coverage');

// Use in InfrastructureCard
<InfrastructureCard
  coverage={predictions.coverage}              // e.g., 78
  totalFacilities={predictions.totalFacilities} // e.g., 1247
  status={predictions.status}                   // e.g., 'good'
/>
```











