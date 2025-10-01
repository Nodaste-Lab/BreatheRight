import type { LocationData } from '../../types/location';

export type ConditionSeverity = 'good' | 'moderate' | 'poor' | 'severe';

export interface ConditionAssessment {
  severity: ConditionSeverity;
  lungIcon: any;
  aqiIcon: any;
  pollenIcon: any;
  lightningIcon: any;
  factors: {
    aqi: number | null;
    pollen: number | null;
    lightning: number | null;
  };
}

export function assessOverallConditions(data: LocationData): ConditionAssessment {
  const aqiValue = data.aqi?.aqi ?? -1;
  const pollenValue = data.pollen?.overall ?? -1;
  const lightningValue = data.lightning?.probability ?? -1;
  
  // Convert values to severity scores (0-3 scale, where 3 is worst)
  const aqiScore = getAQISeverityScore(aqiValue);
  const pollenScore = getPollenSeverityScore(pollenValue);
  const lightningScore = getLightningSeverityScore(lightningValue);
  
  // Calculate weighted overall score
  // AQI has highest weight, then pollen, then lightning
  const weightedScore = (aqiScore * 0.5) + (pollenScore * 0.3) + (lightningScore * 0.2);
  
  // Also check for any individual severe conditions
  const hasAnySevere = aqiScore >= 3 || pollenScore >= 3 || lightningScore >= 3;
  const hasAnyPoor = aqiScore >= 2 || pollenScore >= 2 || lightningScore >= 2;
  
  let severity: ConditionSeverity;
  let lungIcon;
  
  if (hasAnySevere || weightedScore >= 2.5) {
    severity = 'severe';
    lungIcon = require('../../assets/kawaii/lungs-dangerous.png');
  } else if (hasAnyPoor || weightedScore >= 1.5) {
    severity = 'poor';
    lungIcon = require('../../assets/kawaii/lungs-impacted.png');
  } else if (weightedScore >= 0.5) {
    severity = 'moderate';
    lungIcon = require('../../assets/kawaii/lungs-sensitive.png');
  } else {
    severity = 'good';
    lungIcon = require('../../assets/kawaii/lungs-good.png');
  }
  
  // Get individual condition icons
  const aqiIcon = getAQIIcon(aqiValue);
  const pollenIcon = getPollenIcon(pollenValue);
  const lightningIcon = getLightningIcon(lightningValue);
  
  return {
    severity,
    lungIcon,
    aqiIcon,
    pollenIcon,
    lightningIcon,
    factors: {
      aqi: aqiValue >= 0 ? aqiValue : null,
      pollen: pollenValue >= 0 ? pollenValue * 10 : null, // Convert to 0-100 scale for display
      lightning: lightningValue >= 0 ? lightningValue : null
    }
  };
}

function getAQISeverityScore(aqi: number): number {
  if (aqi < 0) return 0; // N/A or unknown
  if (aqi <= 50) return 0; // Good
  if (aqi <= 100) return 1; // Moderate
  if (aqi <= 150) return 2; // Unhealthy for sensitive groups
  return 3; // Unhealthy/Very Unhealthy/Hazardous
}

function getPollenSeverityScore(pollen: number): number {
  if (pollen < 0) return 0; // N/A or unknown
  if (pollen <= 3) return 0; // Low (0-30 on 0-100 scale)
  if (pollen <= 6) return 1; // Medium (31-60)
  if (pollen <= 8) return 2; // High (61-80)
  return 3; // Very High (81-100)
}

function getLightningSeverityScore(lightning: number): number {
  if (lightning < 0) return 0; // N/A or unknown
  if (lightning <= 20) return 0; // None/Very Low
  if (lightning <= 50) return 1; // Low
  if (lightning <= 70) return 2; // Medium
  return 3; // High
}

/**
 * Get appropriate AQI kawaii icon based on AQI value
 */
function getAQIIcon(aqi: number): any {
  if (aqi < 0) return require('../../assets/kawaii/aqi-good.png'); // N/A
  if (aqi <= 50) return require('../../assets/kawaii/aqi-good.png'); // Good
  if (aqi <= 100) return require('../../assets/kawaii/aqi-moderate.png'); // Moderate
  if (aqi <= 150) return require('../../assets/kawaii/aqi-moderate.png'); // Unhealthy for Sensitive
  return require('../../assets/kawaii/aqi-unhealthy.png'); // Unhealthy+
}

/**
 * Get appropriate pollen kawaii icon based on pollen level
 */
function getPollenIcon(pollen: number): any {
  if (pollen < 0) return require('../../assets/kawaii/pollen-good.png'); // N/A
  if (pollen <= 3) return require('../../assets/kawaii/pollen-good.png'); // Low
  if (pollen <= 6) return require('../../assets/kawaii/pollen-moderate.png'); // Medium
  return require('../../assets/kawaii/pollen-unhealthy.png'); // High
}

/**
 * Get appropriate lightning kawaii icon based on probability
 */
function getLightningIcon(lightning: number): any {
  if (lightning < 0) return require('../../assets/kawaii/storm-good.png'); // N/A
  if (lightning <= 20) return require('../../assets/kawaii/storm-good.png'); // None/Very Low
  if (lightning <= 50) return require('../../assets/kawaii/storm-moderate.png'); // Low
  return require('../../assets/kawaii/storm-unhealthy.png'); // Medium/High
}