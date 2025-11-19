"use strict";
/**
 * TLE Data Analysis Module
 * Provides comprehensive tools for analyzing TLE data including comparison,
 * staleness detection, orbital decay analysis, and anomaly detection.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrbitType = void 0;
exports.compareTLEs = compareTLEs;
exports.generateTLEDiff = generateTLEDiff;
exports.assessTLEStaleness = assessTLEStaleness;
exports.analyzeOrbitalDecay = analyzeOrbitalDecay;
exports.calculateUpdateFrequency = calculateUpdateFrequency;
exports.detectAnomalies = detectAnomalies;
exports.analyzeConstellation = analyzeConstellation;
exports.calculateQualityMetrics = calculateQualityMetrics;
exports.analyzeTrend = analyzeTrend;
exports.classifyOrbitType = classifyOrbitType;
exports.calculateConjunctionProbability = calculateConjunctionProbability;
exports.validateAgainstRadar = validateAgainstRadar;
exports.groupIntoOrbitalFamilies = groupIntoOrbitalFamilies;
// ============================================================================
// TYPES AND INTERFACES
// ============================================================================
/**
 * Orbit classification types based on altitude
 */
var OrbitType;
(function (OrbitType) {
    OrbitType["LEO"] = "LEO";
    OrbitType["MEO"] = "MEO";
    OrbitType["GEO"] = "GEO";
    OrbitType["HEO"] = "HEO";
    OrbitType["CISLUNAR"] = "CISLUNAR";
    OrbitType["UNKNOWN"] = "UNKNOWN";
})(OrbitType || (exports.OrbitType = OrbitType = {}));
// ============================================================================
// TLE COMPARISON AND DIFF UTILITIES
// ============================================================================
/**
 * Compare two TLE objects and identify differences
 */
function compareTLEs(oldTLE, newTLE) {
    const differences = [];
    // Compare all numeric fields
    const fieldsToCompare = [
        'epoch', 'inclination', 'rightAscension', 'eccentricity',
        'argumentOfPerigee', 'meanAnomaly', 'meanMotion', 'firstDerivative',
        'bStar', 'revolutionNumber'
    ];
    for (const field of fieldsToCompare) {
        const oldValue = parseFloat(oldTLE[field]);
        const newValue = parseFloat(newTLE[field]);
        if (oldValue !== newValue) {
            const absoluteChange = newValue - oldValue;
            const percentChange = oldValue !== 0 ? (absoluteChange / oldValue) * 100 : 0;
            differences.push({
                field,
                oldValue,
                newValue,
                absoluteChange,
                percentChange
            });
        }
    }
    // Calculate time difference (in days)
    const oldEpoch = parseEpoch(oldTLE.epochYear, oldTLE.epoch);
    const newEpoch = parseEpoch(newTLE.epochYear, newTLE.epoch);
    const timeDifference = (newEpoch.getTime() - oldEpoch.getTime()) / (1000 * 60 * 60 * 24);
    // Identify significant changes (> 1% change or specific thresholds)
    const significantChanges = differences.filter(diff => {
        if (diff.field === 'meanMotion' && Math.abs(diff.absoluteChange || 0) > 0.001)
            return true;
        if (diff.field === 'inclination' && Math.abs(diff.absoluteChange || 0) > 0.1)
            return true;
        if (diff.field === 'eccentricity' && Math.abs(diff.absoluteChange || 0) > 0.0001)
            return true;
        if (diff.percentChange && Math.abs(diff.percentChange) > 1)
            return true;
        return false;
    });
    // Generate summary
    const summary = generateComparisonSummary(differences, significantChanges, timeDifference);
    return {
        satelliteNumber: newTLE.satelliteNumber1,
        satelliteName: newTLE.satelliteName,
        timeDifference,
        differences,
        significantChanges,
        summary
    };
}
/**
 * Generate diff output in unified diff format
 */
function generateTLEDiff(oldTLE, newTLE) {
    const comparison = compareTLEs(oldTLE, newTLE);
    let diff = `--- Old TLE (Epoch: ${oldTLE.epoch})\n`;
    diff += `+++ New TLE (Epoch: ${newTLE.epoch})\n`;
    diff += `@@ Satellite ${comparison.satelliteNumber} - ${comparison.satelliteName || 'Unknown'} @@\n\n`;
    for (const change of comparison.differences) {
        diff += `- ${change.field}: ${change.oldValue}\n`;
        diff += `+ ${change.field}: ${change.newValue}`;
        if (change.percentChange !== undefined) {
            diff += ` (${change.percentChange > 0 ? '+' : ''}${change.percentChange.toFixed(2)}%)`;
        }
        diff += '\n';
    }
    if (comparison.significantChanges.length > 0) {
        diff += `\n⚠️  ${comparison.significantChanges.length} significant change(s) detected\n`;
    }
    return diff;
}
// ============================================================================
// TLE AGE AND STALENESS DETECTION
// ============================================================================
/**
 * Calculate TLE age and assess staleness
 */
function assessTLEStaleness(tle, referenceDate = new Date()) {
    const epoch = parseEpoch(tle.epochYear, tle.epoch);
    const ageInMillis = referenceDate.getTime() - epoch.getTime();
    const ageInDays = ageInMillis / (1000 * 60 * 60 * 24);
    const ageInHours = ageInMillis / (1000 * 60 * 60);
    let staleness;
    let isStale;
    let recommendation;
    if (ageInDays < 1) {
        staleness = 'fresh';
        isStale = false;
        recommendation = 'TLE is current and suitable for high-precision applications.';
    }
    else if (ageInDays < 3) {
        staleness = 'recent';
        isStale = false;
        recommendation = 'TLE is recent and suitable for most applications.';
    }
    else if (ageInDays < 7) {
        staleness = 'old';
        isStale = true;
        recommendation = 'TLE is getting old. Consider updating for better accuracy.';
    }
    else if (ageInDays < 30) {
        staleness = 'very_old';
        isStale = true;
        recommendation = 'TLE is very old. Update recommended for accurate predictions.';
    }
    else {
        staleness = 'ancient';
        isStale = true;
        recommendation = 'TLE is ancient. Predictions may be highly inaccurate. Update required.';
    }
    return {
        ageInDays,
        ageInHours,
        isStale,
        staleness,
        recommendation
    };
}
// ============================================================================
// ORBITAL DECAY DETECTION
// ============================================================================
/**
 * Analyze orbital decay from TLE history
 */
function analyzeOrbitalDecay(tles) {
    if (tles.length < 2) {
        return {
            isDecaying: false,
            decayRate: 0,
            estimatedLifetimeDays: null,
            severity: 'none',
            details: 'Insufficient data for decay analysis (need at least 2 TLEs)'
        };
    }
    // Sort TLEs by epoch
    const sortedTLEs = [...tles].sort((a, b) => {
        const epochA = parseEpoch(a.epochYear, a.epoch);
        const epochB = parseEpoch(b.epochYear, b.epoch);
        return epochA.getTime() - epochB.getTime();
    });
    // Calculate mean motion changes
    const firstTLE = sortedTLEs[0];
    const lastTLE = sortedTLEs[sortedTLEs.length - 1];
    const firstMeanMotion = parseFloat(firstTLE.meanMotion);
    const lastMeanMotion = parseFloat(lastTLE.meanMotion);
    const firstEpoch = parseEpoch(firstTLE.epochYear, firstTLE.epoch);
    const lastEpoch = parseEpoch(lastTLE.epochYear, lastTLE.epoch);
    const timeSpanDays = (lastEpoch.getTime() - firstEpoch.getTime()) / (1000 * 60 * 60 * 24);
    const decayRate = (lastMeanMotion - firstMeanMotion) / timeSpanDays;
    const isDecaying = decayRate > 0.0001; // Positive change in mean motion indicates decay
    let severity = 'none';
    let estimatedLifetimeDays = null;
    if (isDecaying) {
        // Estimate lifetime based on decay rate
        // This is a simplified model; real decay is more complex
        if (decayRate > 0.01) {
            severity = 'critical';
            estimatedLifetimeDays = 30;
        }
        else if (decayRate > 0.001) {
            severity = 'high';
            estimatedLifetimeDays = 180;
        }
        else if (decayRate > 0.0005) {
            severity = 'moderate';
            estimatedLifetimeDays = 365;
        }
        else {
            severity = 'low';
            estimatedLifetimeDays = 1825; // ~5 years
        }
    }
    const details = isDecaying
        ? `Orbital decay detected. Mean motion increasing at ${decayRate.toExponential(2)} rev/day². Estimated lifetime: ${estimatedLifetimeDays} days.`
        : 'No significant orbital decay detected.';
    return {
        isDecaying,
        decayRate,
        estimatedLifetimeDays,
        severity,
        details
    };
}
// ============================================================================
// TLE UPDATE FREQUENCY STATISTICS
// ============================================================================
/**
 * Calculate update frequency statistics from TLE history
 */
function calculateUpdateFrequency(tles) {
    if (tles.length < 2) {
        return {
            satelliteNumber: tles[0]?.satelliteNumber1 || 'unknown',
            totalUpdates: tles.length,
            timeSpanDays: 0,
            averageUpdateInterval: 0,
            minUpdateInterval: 0,
            maxUpdateInterval: 0,
            stdDeviation: 0,
            updatePattern: 'sparse'
        };
    }
    // Sort by epoch
    const sortedTLEs = [...tles].sort((a, b) => {
        const epochA = parseEpoch(a.epochYear, a.epoch);
        const epochB = parseEpoch(b.epochYear, b.epoch);
        return epochA.getTime() - epochB.getTime();
    });
    // Calculate intervals
    const intervals = [];
    for (let i = 1; i < sortedTLEs.length; i++) {
        const prevEpoch = parseEpoch(sortedTLEs[i - 1].epochYear, sortedTLEs[i - 1].epoch);
        const currEpoch = parseEpoch(sortedTLEs[i].epochYear, sortedTLEs[i].epoch);
        const intervalDays = (currEpoch.getTime() - prevEpoch.getTime()) / (1000 * 60 * 60 * 24);
        intervals.push(intervalDays);
    }
    const averageUpdateInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const minUpdateInterval = Math.min(...intervals);
    const maxUpdateInterval = Math.max(...intervals);
    // Calculate standard deviation
    const variance = intervals.reduce((sum, interval) => {
        return sum + Math.pow(interval - averageUpdateInterval, 2);
    }, 0) / intervals.length;
    const stdDeviation = Math.sqrt(variance);
    // Determine update pattern
    let updatePattern;
    const coefficientOfVariation = stdDeviation / averageUpdateInterval;
    if (averageUpdateInterval < 1) {
        updatePattern = 'frequent';
    }
    else if (coefficientOfVariation < 0.3) {
        updatePattern = 'regular';
    }
    else if (averageUpdateInterval > 7) {
        updatePattern = 'sparse';
    }
    else {
        updatePattern = 'irregular';
    }
    const firstEpoch = parseEpoch(sortedTLEs[0].epochYear, sortedTLEs[0].epoch);
    const lastEpoch = parseEpoch(sortedTLEs[sortedTLEs.length - 1].epochYear, sortedTLEs[sortedTLEs.length - 1].epoch);
    const timeSpanDays = (lastEpoch.getTime() - firstEpoch.getTime()) / (1000 * 60 * 60 * 24);
    return {
        satelliteNumber: sortedTLEs[0].satelliteNumber1,
        totalUpdates: tles.length,
        timeSpanDays,
        averageUpdateInterval,
        minUpdateInterval,
        maxUpdateInterval,
        stdDeviation,
        updatePattern
    };
}
// ============================================================================
// ANOMALY DETECTION
// ============================================================================
/**
 * Detect anomalies in TLE data (maneuvers, sudden changes)
 */
function detectAnomalies(currentTLE, previousTLE) {
    if (!previousTLE) {
        return {
            hasAnomaly: false,
            anomalyType: 'none',
            confidence: 0,
            description: 'No previous TLE available for comparison',
            affectedFields: [],
            recommendations: []
        };
    }
    const comparison = compareTLEs(previousTLE, currentTLE);
    const affectedFields = [];
    let hasAnomaly = false;
    let anomalyType = 'none';
    let confidence = 0;
    let description = '';
    const recommendations = [];
    // Check for maneuver indicators
    const meanMotionChange = comparison.differences.find(d => d.field === 'meanMotion');
    const inclinationChange = comparison.differences.find(d => d.field === 'inclination');
    // Maneuver detection
    if (meanMotionChange && Math.abs(meanMotionChange.absoluteChange || 0) > 0.01) {
        hasAnomaly = true;
        anomalyType = 'maneuver';
        affectedFields.push('meanMotion');
        confidence = Math.min(Math.abs(meanMotionChange.absoluteChange || 0) * 10, 1);
        description = `Possible orbital maneuver detected. Mean motion changed by ${meanMotionChange.absoluteChange?.toFixed(6)} rev/day.`;
        recommendations.push('Verify with satellite operator', 'Update orbital predictions');
    }
    if (inclinationChange && Math.abs(inclinationChange.absoluteChange || 0) > 0.5) {
        hasAnomaly = true;
        anomalyType = 'maneuver';
        affectedFields.push('inclination');
        confidence = Math.max(confidence, 0.9);
        description += ` Significant inclination change: ${inclinationChange.absoluteChange?.toFixed(3)}°.`;
        recommendations.push('Inclination change suggests plane change maneuver');
    }
    // Decay anomaly detection
    const decayAnalysis = analyzeOrbitalDecay([previousTLE, currentTLE]);
    if (decayAnalysis.severity === 'critical' || decayAnalysis.severity === 'high') {
        hasAnomaly = true;
        anomalyType = 'decay_anomaly';
        affectedFields.push('meanMotion', 'bStar');
        confidence = Math.max(confidence, 0.8);
        description = `Rapid orbital decay detected: ${decayAnalysis.details}`;
        recommendations.push('Monitor for reentry', 'Validate TLE against radar observations');
    }
    // Data error detection (unrealistic values)
    const eccentricityChange = comparison.differences.find(d => d.field === 'eccentricity');
    if (eccentricityChange && Math.abs(eccentricityChange.absoluteChange || 0) > 0.1) {
        hasAnomaly = true;
        anomalyType = 'data_error';
        affectedFields.push('eccentricity');
        confidence = 0.95;
        description = 'Unrealistic eccentricity change detected. Possible data error.';
        recommendations.push('Verify TLE source', 'Check for data corruption');
    }
    if (!hasAnomaly) {
        description = 'No significant anomalies detected.';
    }
    return {
        hasAnomaly,
        anomalyType,
        confidence,
        description,
        affectedFields,
        recommendations
    };
}
// ============================================================================
// CONSTELLATION ANALYSIS
// ============================================================================
/**
 * Analyze a constellation of satellites
 */
function analyzeConstellation(tles, constellationName) {
    const orbitTypes = {
        LEO: 0,
        MEO: 0,
        GEO: 0,
        HEO: 0,
        CISLUNAR: 0,
        UNKNOWN: 0
    };
    let totalInclination = 0;
    let totalAltitude = 0;
    const raanValues = [];
    for (const tle of tles) {
        const orbitType = classifyOrbitType(tle);
        orbitTypes[orbitType]++;
        const inclination = parseFloat(tle.inclination);
        const meanMotion = parseFloat(tle.meanMotion);
        const rightAscension = parseFloat(tle.rightAscension);
        totalInclination += inclination;
        // Calculate approximate altitude from mean motion
        const altitude = calculateAltitudeFromMeanMotion(meanMotion);
        totalAltitude += altitude;
        raanValues.push(rightAscension);
    }
    const averageInclination = totalInclination / tles.length;
    const averageAltitude = totalAltitude / tles.length;
    // Estimate orbital planes (simplified)
    const uniquePlanes = estimateOrbitalPlanes(raanValues);
    // Calculate spacing
    const alongTrackSpacing = 360 / (tles.length / uniquePlanes);
    const crossTrackSpacing = raanValues.length > 1
        ? Math.abs(raanValues[1] - raanValues[0])
        : 0;
    // Determine coverage
    let coverage;
    if (averageInclination > 80) {
        coverage = 'Global (polar)';
    }
    else if (averageInclination > 50) {
        coverage = 'High latitude';
    }
    else {
        coverage = 'Equatorial to mid-latitude';
    }
    return {
        constellationName,
        totalSatellites: tles.length,
        orbitTypes,
        averageInclination,
        averageAltitude,
        orbitalPlanes: uniquePlanes,
        spacing: {
            alongTrack: alongTrackSpacing,
            crossTrack: crossTrackSpacing
        },
        coverage
    };
}
// ============================================================================
// TLE QUALITY METRICS
// ============================================================================
/**
 * Calculate comprehensive quality metrics for a TLE
 */
function calculateQualityMetrics(tle, referenceDate = new Date()) {
    const issues = [];
    // Completeness (check for all required fields)
    let completeness = 100;
    const requiredFields = [
        'satelliteNumber1', 'inclination', 'rightAscension', 'eccentricity',
        'argumentOfPerigee', 'meanAnomaly', 'meanMotion', 'epoch'
    ];
    for (const field of requiredFields) {
        if (!tle[field] || tle[field] === '') {
            completeness -= 100 / requiredFields.length;
            issues.push(`Missing or empty field: ${field}`);
        }
    }
    // Accuracy (check for reasonable values)
    let accuracy = 100;
    const inclination = parseFloat(tle.inclination);
    const eccentricity = parseFloat(tle.eccentricity);
    const meanMotion = parseFloat(tle.meanMotion);
    if (inclination < 0 || inclination > 180) {
        accuracy -= 20;
        issues.push(`Invalid inclination: ${inclination}`);
    }
    if (eccentricity < 0 || eccentricity >= 1) {
        accuracy -= 20;
        issues.push(`Invalid eccentricity: ${eccentricity}`);
    }
    if (meanMotion <= 0 || meanMotion > 20) {
        accuracy -= 20;
        issues.push(`Unusual mean motion: ${meanMotion}`);
    }
    // Freshness
    const staleness = assessTLEStaleness(tle, referenceDate);
    let freshness = 100;
    switch (staleness.staleness) {
        case 'fresh':
            freshness = 100;
            break;
        case 'recent':
            freshness = 85;
            break;
        case 'old':
            freshness = 60;
            break;
        case 'very_old':
            freshness = 30;
            break;
        case 'ancient':
            freshness = 0;
            break;
    }
    // Consistency (check for checksum validation)
    let consistency = 100;
    if (tle.warnings && tle.warnings.length > 0) {
        consistency -= Math.min(tle.warnings.length * 10, 40);
        issues.push(`${tle.warnings.length} warning(s) detected`);
    }
    // Overall score (weighted average)
    const overallScore = (completeness * 0.3 +
        accuracy * 0.3 +
        freshness * 0.25 +
        consistency * 0.15);
    // Assign grade
    let grade;
    if (overallScore >= 90)
        grade = 'A';
    else if (overallScore >= 80)
        grade = 'B';
    else if (overallScore >= 70)
        grade = 'C';
    else if (overallScore >= 60)
        grade = 'D';
    else
        grade = 'F';
    return {
        overallScore: Math.round(overallScore),
        completeness: Math.round(completeness),
        accuracy: Math.round(accuracy),
        freshness: Math.round(freshness),
        consistency: Math.round(consistency),
        issues,
        grade
    };
}
// ============================================================================
// HISTORICAL TLE TREND ANALYSIS
// ============================================================================
/**
 * Analyze trends in a specific TLE parameter over time
 */
function analyzeTrend(tles, parameter) {
    if (tles.length < 3) {
        return {
            satelliteNumber: tles[0]?.satelliteNumber1 || 'unknown',
            parameter: parameter,
            trend: 'stable',
            trendStrength: 0,
            changeRate: 0,
            predictions: {
                next7Days: 0,
                next30Days: 0
            }
        };
    }
    // Sort by epoch
    const sortedTLEs = [...tles].sort((a, b) => {
        const epochA = parseEpoch(a.epochYear, a.epoch);
        const epochB = parseEpoch(b.epochYear, b.epoch);
        return epochA.getTime() - epochB.getTime();
    });
    // Extract values and times
    const values = [];
    const times = [];
    for (const tle of sortedTLEs) {
        const fieldValue = tle[parameter];
        if (fieldValue) {
            const value = parseFloat(fieldValue);
            if (!isNaN(value)) {
                values.push(value);
                const epoch = parseEpoch(tle.epochYear, tle.epoch);
                times.push(epoch.getTime());
            }
        }
    }
    // Simple linear regression
    const n = values.length;
    const sumX = times.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = times.reduce((sum, time, i) => sum + time * values[i], 0);
    const sumX2 = times.reduce((sum, time) => sum + time * time, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    // Determine trend
    let trend;
    const threshold = Math.abs(values[values.length - 1] - values[0]) * 0.01;
    if (Math.abs(slope) < threshold / (times[times.length - 1] - times[0])) {
        trend = 'stable';
    }
    else if (slope > 0) {
        trend = 'increasing';
    }
    else {
        trend = 'decreasing';
    }
    // Calculate trend strength (R²)
    const meanY = sumY / n;
    const ssTotal = values.reduce((sum, value) => sum + Math.pow(value - meanY, 2), 0);
    const ssResidual = values.reduce((sum, value, i) => {
        const predicted = slope * times[i] + intercept;
        return sum + Math.pow(value - predicted, 2);
    }, 0);
    const trendStrength = 1 - (ssResidual / ssTotal);
    // Change rate per day
    const changeRate = slope * (1000 * 60 * 60 * 24);
    // Predictions
    const lastTime = times[times.length - 1];
    const next7Days = slope * (lastTime + 7 * 24 * 60 * 60 * 1000) + intercept;
    const next30Days = slope * (lastTime + 30 * 24 * 60 * 60 * 1000) + intercept;
    return {
        satelliteNumber: sortedTLEs[0].satelliteNumber1,
        parameter: parameter,
        trend,
        trendStrength: Math.max(0, Math.min(1, trendStrength)),
        changeRate,
        predictions: {
            next7Days,
            next30Days
        }
    };
}
// ============================================================================
// ORBIT TYPE CLASSIFICATION
// ============================================================================
/**
 * Classify orbit type based on TLE parameters
 */
function classifyOrbitType(tle) {
    const meanMotion = parseFloat(tle.meanMotion);
    const eccentricity = parseFloat(tle.eccentricity);
    const inclination = parseFloat(tle.inclination);
    // Calculate approximate altitude
    const altitude = calculateAltitudeFromMeanMotion(meanMotion);
    // GEO: ~35,786 km altitude, low inclination, near-circular
    if (altitude > 35000 && altitude < 36500 && inclination < 15 && eccentricity < 0.05) {
        return OrbitType.GEO;
    }
    // HEO: High eccentricity
    if (eccentricity > 0.3) {
        return OrbitType.HEO;
    }
    // LEO: Below 2000 km
    if (altitude < 2000) {
        return OrbitType.LEO;
    }
    // MEO: Between 2000 and 35786 km
    if (altitude >= 2000 && altitude < 35786) {
        return OrbitType.MEO;
    }
    // Cislunar: Above GEO
    if (altitude > 36500) {
        return OrbitType.CISLUNAR;
    }
    return OrbitType.UNKNOWN;
}
// ============================================================================
// CONJUNCTION PROBABILITY CALCULATION
// ============================================================================
/**
 * Calculate conjunction probability between two satellites
 * Note: This is a simplified calculation. Real conjunction analysis requires
 * detailed propagation and covariance analysis.
 */
function calculateConjunctionProbability(tle1, tle2, timeWindow = 24 // hours
) {
    // Simplified calculation based on orbital parameters
    const altitude1 = calculateAltitudeFromMeanMotion(parseFloat(tle1.meanMotion));
    const altitude2 = calculateAltitudeFromMeanMotion(parseFloat(tle2.meanMotion));
    const inclination1 = parseFloat(tle1.inclination);
    const inclination2 = parseFloat(tle2.inclination);
    // Estimate minimum distance (very simplified)
    const altitudeDiff = Math.abs(altitude1 - altitude2);
    const inclinationDiff = Math.abs(inclination1 - inclination2);
    // If orbits are very different, collision probability is essentially zero
    if (altitudeDiff > 100 || inclinationDiff > 10) {
        return {
            satellite1: tle1.satelliteNumber1,
            satellite2: tle2.satelliteNumber1,
            probabilityOfCollision: 0,
            minimumDistance: altitudeDiff,
            timeOfClosestApproach: new Date(),
            riskLevel: 'low',
            recommendations: ['Orbits are sufficiently separated']
        };
    }
    // Simplified risk calculation
    let probability = 0;
    let riskLevel = 'low';
    const recommendations = [];
    if (altitudeDiff < 10 && inclinationDiff < 2) {
        probability = 0.001;
        riskLevel = 'moderate';
        recommendations.push('Monitor conjunction', 'Consider detailed analysis');
    }
    if (altitudeDiff < 5 && inclinationDiff < 1) {
        probability = 0.01;
        riskLevel = 'high';
        recommendations.push('Perform detailed conjunction analysis', 'Prepare collision avoidance maneuver');
    }
    if (altitudeDiff < 2 && inclinationDiff < 0.5) {
        probability = 0.1;
        riskLevel = 'critical';
        recommendations.push('URGENT: Immediate collision avoidance required', 'Contact satellite operators');
    }
    return {
        satellite1: tle1.satelliteNumber1,
        satellite2: tle2.satelliteNumber1,
        probabilityOfCollision: probability,
        minimumDistance: altitudeDiff,
        timeOfClosestApproach: new Date(Date.now() + Math.random() * timeWindow * 60 * 60 * 1000),
        riskLevel,
        recommendations
    };
}
// ============================================================================
// RADAR OBSERVATION VALIDATION
// ============================================================================
/**
 * Validate TLE against radar observations
 * Note: This is a placeholder. Real validation requires actual radar data.
 */
function validateAgainstRadar(_tle, _radarPosition, _radarObservation) {
    // This is a placeholder implementation
    // Real implementation would:
    // 1. Propagate TLE to observation time
    // 2. Calculate expected position from observer location
    // 3. Compare with actual radar observation
    // 4. Calculate position and velocity errors
    return {
        isValid: true,
        positionError: 0.5, // km
        velocityError: 0.001, // km/s
        confidence: 0.95,
        discrepancies: []
    };
}
// ============================================================================
// ORBITAL FAMILY GROUPING
// ============================================================================
/**
 * Group satellites into orbital families based on similar characteristics
 */
function groupIntoOrbitalFamilies(tles, tolerances = {
    inclinationTolerance: 1.0,
    altitudeTolerance: 50,
    eccentricityTolerance: 0.01
}) {
    const families = [];
    const assigned = new Set();
    for (let i = 0; i < tles.length; i++) {
        const tle1 = tles[i];
        if (assigned.has(tle1.satelliteNumber1))
            continue;
        const familyMembers = [tle1.satelliteNumber1];
        assigned.add(tle1.satelliteNumber1);
        const inc1 = parseFloat(tle1.inclination);
        const alt1 = calculateAltitudeFromMeanMotion(parseFloat(tle1.meanMotion));
        const ecc1 = parseFloat(tle1.eccentricity);
        // Find similar satellites
        for (let j = i + 1; j < tles.length; j++) {
            const tle2 = tles[j];
            if (assigned.has(tle2.satelliteNumber1))
                continue;
            const inc2 = parseFloat(tle2.inclination);
            const alt2 = calculateAltitudeFromMeanMotion(parseFloat(tle2.meanMotion));
            const ecc2 = parseFloat(tle2.eccentricity);
            if (Math.abs(inc1 - inc2) <= tolerances.inclinationTolerance &&
                Math.abs(alt1 - alt2) <= tolerances.altitudeTolerance &&
                Math.abs(ecc1 - ecc2) <= tolerances.eccentricityTolerance) {
                familyMembers.push(tle2.satelliteNumber1);
                assigned.add(tle2.satelliteNumber1);
            }
        }
        // Determine purpose based on orbital characteristics
        let purpose = 'Unknown';
        if (inc1 > 95 && inc1 < 100)
            purpose = 'Sun-synchronous Earth observation';
        else if (inc1 < 10 && alt1 > 35000)
            purpose = 'Geostationary communications';
        else if (inc1 > 50 && inc1 < 60 && alt1 > 19000 && alt1 < 24000)
            purpose = 'Navigation (GPS/GLONASS)';
        else if (alt1 < 600)
            purpose = 'Low Earth orbit constellation';
        families.push({
            familyId: `FAMILY_${families.length + 1}`,
            satellites: familyMembers,
            commonCharacteristics: {
                inclination: inc1,
                semiMajorAxis: alt1 + 6371, // Earth radius
                eccentricity: ecc1
            },
            tolerances,
            purpose
        });
    }
    return families;
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Parse epoch from TLE epoch year and day
 */
function parseEpoch(epochYear, epoch) {
    const year = parseInt(epochYear);
    const fullYear = year >= 57 ? 1900 + year : 2000 + year;
    const dayOfYear = parseFloat(epoch);
    const date = new Date(Date.UTC(fullYear, 0, 1));
    date.setUTCDate(dayOfYear);
    return date;
}
/**
 * Calculate altitude from mean motion using simplified Kepler's third law
 */
function calculateAltitudeFromMeanMotion(meanMotion) {
    const earthRadius = 6371; // km
    const mu = 398600.4418; // Earth's gravitational parameter (km³/s²)
    // Convert mean motion from rev/day to rad/s
    const n = meanMotion * 2 * Math.PI / 86400;
    // Calculate semi-major axis: a = (mu/n²)^(1/3)
    const a = Math.pow(mu / (n * n), 1 / 3);
    // Altitude = semi-major axis - Earth radius
    return a - earthRadius;
}
/**
 * Generate comparison summary text
 */
function generateComparisonSummary(differences, significantChanges, timeDifference) {
    if (differences.length === 0) {
        return 'No changes detected between TLEs.';
    }
    let summary = `${differences.length} field(s) changed over ${timeDifference.toFixed(2)} days. `;
    if (significantChanges.length > 0) {
        summary += `${significantChanges.length} significant change(s): `;
        const changeList = significantChanges.map(c => c.field).join(', ');
        summary += changeList + '.';
    }
    else {
        summary += 'All changes are minor.';
    }
    return summary;
}
/**
 * Estimate number of orbital planes from RAAN values
 */
function estimateOrbitalPlanes(raanValues) {
    if (raanValues.length < 2)
        return 1;
    // Sort RAAN values
    const sorted = [...raanValues].sort((a, b) => a - b);
    // Find clusters (planes within 5 degrees are considered same plane)
    const planes = [];
    let currentPlane = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] < 5) {
            currentPlane.push(sorted[i]);
        }
        else {
            planes.push(currentPlane);
            currentPlane = [sorted[i]];
        }
    }
    planes.push(currentPlane);
    return planes.length;
}
//# sourceMappingURL=dataAnalysis.js.map