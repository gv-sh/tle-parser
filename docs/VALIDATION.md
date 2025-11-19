# TLE Validation & Normalization

Comprehensive validation and normalization features for Two-Line Element (TLE) satellite data.

## Table of Contents

- [Overview](#overview)
- [Epoch Date Validation](#epoch-date-validation)
- [Orbital Parameter Validation](#orbital-parameter-validation)
- [Checksum Validation](#checksum-validation)
- [Scientific Notation Normalization](#scientific-notation-normalization)
- [Satellite Number Validation](#satellite-number-validation)
- [International Designator Validation](#international-designator-validation)
- [Anomaly Detection](#anomaly-detection)
- [Data Quality Scoring](#data-quality-scoring)
- [Field Sanitization](#field-sanitization)
- [Validation Rule Customization](#validation-rule-customization)
- [Validation Reports](#validation-reports)

## Overview

The TLE parser includes comprehensive validation and normalization features to ensure data quality and detect potential issues in TLE data.

```typescript
import {
  generateValidationReport,
  validateEpochDate,
  detectAnomalies,
  calculateQualityScore
} from 'tle-parser';
```

## Epoch Date Validation

### Convert Epoch to Date

Convert TLE epoch format (2-digit year + day of year) to full date information:

```typescript
import { convertEpochToDate } from 'tle-parser';

const epochInfo = convertEpochToDate(24, 100.5);

console.log(epochInfo);
// {
//   year: 2024,
//   twoDigitYear: 24,
//   dayOfYear: 100.5,
//   isoDate: '2024-04-09T12:00:00.000Z',
//   date: Date object,
//   julianDate: 2460410.0,
//   modifiedJulianDate: 60409.5
// }
```

### Validate Epoch Date

Validate epoch year and day values:

```typescript
import { validateEpochDate } from 'tle-parser';

const result = validateEpochDate(24, 100.5);

if (result.valid) {
  console.log('Epoch is valid');
} else {
  console.error(result.message);
}
```

### Calculate Epoch Age

Calculate how old a TLE is relative to a reference date:

```typescript
import { calculateEpochAge } from 'tle-parser';

const referenceDate = new Date();
const ageInDays = calculateEpochAge(24, 100.0, referenceDate);

console.log(`TLE is ${ageInDays.toFixed(1)} days old`);
```

### Validate Epoch Age

Check if epoch is stale or in the future:

```typescript
import { validateEpochAge } from 'tle-parser';

const result = validateEpochAge(24, 100.0, {
  referenceDate: new Date(),
  allowFuture: false,
  maxAge: 30  // days
});

if (!result.valid) {
  console.error(result.message);
}
```

## Orbital Parameter Validation

### Validate Individual Parameters

Validate single orbital parameters against valid ranges:

```typescript
import { validateOrbitalParameter } from 'tle-parser';

// Validate mean motion (revolutions per day)
const result = validateOrbitalParameter('meanMotion', 15.5);

if (!result.valid) {
  console.error(result.message);
  // "meanMotion value 25.0 outside valid range [0, 20]"
}

// Check if parameter is outside typical range
const result2 = validateOrbitalParameter('meanMotion', 19.0, true);
if (result2.message) {
  console.warn(result2.message);
  // "meanMotion value 19.0 outside typical range [10, 17]"
}
```

### Validate All Parameters

Validate all orbital parameters in a TLE:

```typescript
import { validateAllOrbitalParameters } from 'tle-parser';

const tle = parseTLE(tleString);
const results = validateAllOrbitalParameters(tle, true);

// Find any errors
const errors = results.filter(r => !r.valid);
if (errors.length > 0) {
  errors.forEach(err => console.error(err.message));
}

// Find warnings (outside typical range)
const warnings = results.filter(r => r.valid && r.message);
warnings.forEach(warn => console.warn(warn.message));
```

### Parameter Ranges

Access parameter range constants:

```typescript
import { ORBITAL_PARAMETER_RANGES } from 'tle-parser';

console.log(ORBITAL_PARAMETER_RANGES.eccentricity);
// {
//   min: 0.0,
//   max: 0.999999,
//   typical: { min: 0.0, max: 0.25 }
// }
```

## Checksum Validation

### Calculate Checksum

Calculate the modulo-10 checksum for a TLE line:

```typescript
import { calculateChecksum } from 'tle-parser';

const line = '1 25544U 98067A   24001.50000000  .00002182  00000-0  41420-4 0  999';
const checksum = calculateChecksum(line);

console.log(`Calculated checksum: ${checksum}`);
```

### Validate Checksum

Validate the checksum for a complete TLE line:

```typescript
import { validateChecksum } from 'tle-parser';

const line1 = '1 25544U 98067A   24001.50000000  .00002182  00000-0  41420-4 0  9990';
const result = validateChecksum(line1, 1);

if (!result.valid) {
  console.error(result.message);
  // "Line 1 checksum mismatch: expected 0, calculated 5"
}
```

## Scientific Notation Normalization

### Normalize Assumed Decimal Notation

TLE format uses an assumed decimal point for certain fields:

```typescript
import { normalizeAssumedDecimalNotation } from 'tle-parser';

// B* drag term: " 41420-4" = 0.41420e-4
const bStar = normalizeAssumedDecimalNotation(' 41420-4');
console.log(bStar); // 0.000041420

// Negative value: "-12345-3" = -0.12345e-3
const neg = normalizeAssumedDecimalNotation('-12345-3');
console.log(neg); // -0.00012345
```

### Normalize Scientific Notation

Normalize different numeric formats:

```typescript
import { normalizeScientificNotation } from 'tle-parser';

// Assumed decimal (TLE format)
const bStar = normalizeScientificNotation(' 41420-4', 'assumedDecimal');

// Standard floating point
const inclination = normalizeScientificNotation('51.6400', 'standard');

// Integer
const satNum = normalizeScientificNotation('25544', 'integer');
```

## Satellite Number Validation

Validate NORAD catalog numbers:

```typescript
import { validateSatelliteNumber, SATELLITE_NUMBER_RANGES } from 'tle-parser';

const result = validateSatelliteNumber(25544);

if (result.valid) {
  console.log(`Valid ${result.context.format} satellite number`);
  // "Valid 5-digit satellite number"
}

// Check ranges
console.log(SATELLITE_NUMBER_RANGES);
// {
//   min: 1,
//   max: 999999,
//   historical5Digit: 99999,
//   modern6Digit: 999999
// }
```

## International Designator Validation

Validate international designator format (COSPAR ID):

```typescript
import { validateInternationalDesignator } from 'tle-parser';

const result = validateInternationalDesignator('98067A');

if (result.valid) {
  console.log(result.context);
  // {
  //   designator: '98067A',
  //   year: 98,
  //   fullYear: 1998,
  //   launchNumber: 67,
  //   piece: 'A'
  // }
}
```

## Anomaly Detection

Detect unusual orbital parameters:

```typescript
import { detectAnomalies } from 'tle-parser';

const tle = parseTLE(tleString);
const anomalies = detectAnomalies(tle);

anomalies.forEach(anomaly => {
  console.log(`${anomaly.type}: ${anomaly.description}`);
  console.log(`Severity: ${anomaly.severity}, Score: ${anomaly.score}`);
});

// Example output:
// HIGH_ECCENTRICITY: Unusually high eccentricity: 0.750000 (threshold: 0.5)
// Severity: warning, Score: 0.8
//
// RETROGRADE_ORBIT: Retrograde orbit detected: inclination 120.0° (>90°)
// Severity: info, Score: 0.33
```

### Anomaly Types

- `HIGH_ECCENTRICITY` - Eccentricity > 0.5 (approaching parabolic orbit)
- `LOW_MEAN_MOTION` - Mean motion < 1.0 (high/deep orbit)
- `HIGH_MEAN_MOTION` - Mean motion > 18.0 (very low orbit)
- `RETROGRADE_ORBIT` - Inclination > 90° (retrograde)
- `HIGH_DRAG` - |B*| > 0.01 (high atmospheric drag)
- `RAPID_ORBITAL_CHANGE` - |dn/dt| > 0.01 (rapid decay/boost)
- `NEW_SATELLITE` - Revolution number < 100 (recently launched)
- `CIRCULAR_ORBIT` - Eccentricity = 0 (perfect circle)

## Data Quality Scoring

Calculate a comprehensive quality score for TLE data:

```typescript
import { calculateQualityScore } from 'tle-parser';

const tle = parseTLE(tleString);

const score = calculateQualityScore(tle, {
  checksumValid: true,
  formatValid: true,
  rangeErrors: [],
  rangeResults: [],
  epochAge: 2,  // 2 days old
  anomalies: []
});

console.log(`Quality Score: ${score.overall}/100`);
console.log(`Grade: ${score.grade}`);
console.log(`Assessment: ${score.assessment}`);

// Component scores
console.log(score.components);
// {
//   checksumScore: 20,
//   formatScore: 15,
//   rangeScore: 25,
//   epochScore: 13.5,
//   anomalyScore: 10,
//   consistencyScore: 10
// }
```

### Quality Grades

- **A (90-100)**: Excellent quality - fresh, valid, anomaly-free
- **B (80-89)**: Good quality - valid with minor warnings
- **C (70-79)**: Acceptable quality - some issues but usable
- **D (60-69)**: Poor quality - significant issues, use with caution
- **F (<60)**: Invalid - critical errors, should not be used

## Field Sanitization

Clean and normalize TLE field values:

```typescript
import { sanitizeField, sanitizeAllFields } from 'tle-parser';

// Sanitize individual field
const result = sanitizeField('  ISS@#$  ', 'satelliteName');
console.log(result.value); // "ISS"
console.log(result.modified); // true
console.log(result.modifications);
// ["Removed invalid characters from satellite name", "Trimmed whitespace"]

// Sanitize all fields in a TLE
const tle = parseTLE(tleString);
const sanitized = sanitizeAllFields(tle);

sanitized.forEach((result, fieldName) => {
  console.log(`${fieldName}: ${result.modifications.join(', ')}`);
});
```

## Validation Rule Customization

### Create Custom Rules

Define custom validation rules:

```typescript
import { createValidationRule } from 'tle-parser';

const customRule = createValidationRule(
  'myCustomRule',
  'Check if satellite number is even',
  (tle) => {
    const satNum = parseInt(tle.satelliteNumber1, 10);
    return {
      valid: satNum % 2 === 0,
      message: satNum % 2 === 0 ? undefined : 'Satellite number must be even'
    };
  },
  { severity: 'warning', enabled: true }
);
```

### Validation Rule Manager

Manage validation rules:

```typescript
import { ValidationRuleManager, DEFAULT_VALIDATION_RULES } from 'tle-parser';

// Create manager with default rules
const manager = new ValidationRuleManager(DEFAULT_VALIDATION_RULES);

// Add custom rule
manager.addRule(customRule);

// Enable/disable rules
manager.enableRule('anomalyDetection');
manager.disableRule('epochAge');

// Get enabled rules
const enabledRules = manager.getEnabledRules();

// Get specific rule
const rule = manager.getRule('checksum');
```

## Validation Reports

Generate comprehensive validation reports:

```typescript
import { generateValidationReport } from 'tle-parser';

const tle = parseTLE(tleString);
const report = generateValidationReport(
  tle,
  { line1: line1String, line2: line2String },
  {
    validateChecksums: true,
    validateEpoch: true,
    validateRanges: true,
    detectAnomalies: true,
    calculateQuality: true,
    sanitizeFields: true,
    strict: false,
    referenceDate: new Date(),
    allowFutureEpochs: false,
    maxEpochAge: 30
  }
);

// Report structure
console.log(report);
// {
//   isValid: true,
//   qualityScore: { overall: 92, grade: 'A', ... },
//   errors: [],
//   warnings: [...],
//   anomalies: [...],
//   sanitizedFields: ['satelliteName'],
//   timestamp: Date,
//   rulesApplied: ['checksum', 'epochDate', ...],
//   summary: {
//     totalChecks: 15,
//     passedChecks: 14,
//     failedChecks: 1,
//     warningCount: 2,
//     errorCount: 0
//   }
// }

// Check validity
if (!report.isValid) {
  report.errors.forEach(error => {
    console.error(`Error in ${error.field}: ${error.message}`);
  });
}

// Check warnings
report.warnings.forEach(warning => {
  console.warn(`Warning in ${warning.field}: ${warning.message}`);
});

// Check anomalies
report.anomalies.forEach(anomaly => {
  console.log(`Anomaly detected: ${anomaly.description}`);
});
```

### Validation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validateChecksums` | boolean | true | Validate line checksums |
| `validateEpoch` | boolean | true | Validate epoch date |
| `validateRanges` | boolean | true | Validate parameter ranges |
| `detectAnomalies` | boolean | false | Detect orbital anomalies |
| `calculateQuality` | boolean | true | Calculate quality score |
| `sanitizeFields` | boolean | false | Sanitize field values |
| `strict` | boolean | false | Use strict validation |
| `referenceDate` | Date | now | Reference date for age checks |
| `allowFutureEpochs` | boolean | true | Allow future epoch dates |
| `maxEpochAge` | number | 30 | Maximum epoch age in days |
| `customRules` | ValidationRule[] | [] | Custom validation rules |

## Complete Example

```typescript
import {
  parseTLE,
  generateValidationReport,
  detectAnomalies,
  validateSatelliteNumber
} from 'tle-parser';

const tleString = `ISS (ZARYA)
1 25544U 98067A   24100.50000000  .00002182  00000-0  41420-4 0  9990
2 25544  51.6400 208.9163 0006317  69.9862  25.2906 15.54225995123456`;

// Parse TLE
const tle = parseTLE(tleString);

// Quick validation checks
const satNumResult = validateSatelliteNumber(tle.satelliteNumber1);
console.log(`Satellite number valid: ${satNumResult.valid}`);

// Detect anomalies
const anomalies = detectAnomalies(tle);
if (anomalies.length > 0) {
  console.log(`Found ${anomalies.length} anomalies:`);
  anomalies.forEach(a => console.log(`  - ${a.description}`));
}

// Generate comprehensive report
const lines = tleString.split('\n');
const report = generateValidationReport(
  tle,
  { line1: lines[1], line2: lines[2] },
  {
    validateChecksums: true,
    validateEpoch: true,
    validateRanges: true,
    detectAnomalies: true,
    calculateQuality: true
  }
);

// Display results
console.log(`\nValidation Report:`);
console.log(`  Valid: ${report.isValid}`);
console.log(`  Quality: ${report.qualityScore.overall}/100 (${report.qualityScore.grade})`);
console.log(`  Assessment: ${report.qualityScore.assessment}`);
console.log(`  Checks: ${report.summary.passedChecks}/${report.summary.totalChecks} passed`);

if (report.errors.length > 0) {
  console.log(`\nErrors:`);
  report.errors.forEach(e => console.log(`  - ${e.message}`));
}

if (report.warnings.length > 0) {
  console.log(`\nWarnings:`);
  report.warnings.forEach(w => console.log(`  - ${w.message}`));
}
```

## Best Practices

1. **Always validate checksums** - Checksums catch transmission errors
2. **Check epoch age** - Stale TLEs lead to poor propagation accuracy
3. **Validate parameter ranges** - Detect corrupted or invalid data
4. **Monitor anomalies** - Unusual values may indicate special orbits or errors
5. **Use quality scores** - Prioritize high-quality TLEs for mission-critical applications
6. **Customize validation** - Add domain-specific rules for your use case
7. **Generate reports** - Keep audit trails of data quality

## Error Handling

```typescript
try {
  const report = generateValidationReport(tle, lines, options);

  if (!report.isValid) {
    // Handle validation failures
    const criticalErrors = report.errors.filter(e => e.severity === 'error');
    if (criticalErrors.length > 0) {
      throw new Error('Critical validation errors detected');
    }
  }

  if (report.qualityScore.overall < 70) {
    console.warn('Low quality TLE data - use with caution');
  }

} catch (error) {
  console.error('Validation failed:', error);
}
```

## Performance Considerations

- Validation adds minimal overhead (~1-2ms per TLE)
- Anomaly detection is slightly more expensive (~0.5ms)
- Quality scoring requires full validation suite
- For batch processing, consider parallel validation:

```typescript
const reports = await Promise.all(
  tles.map(async (tle) =>
    generateValidationReport(tle, lines, options)
  )
);
```
