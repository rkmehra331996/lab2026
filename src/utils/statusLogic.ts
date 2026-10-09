import { checkPanicOrCriticalValue } from './criticalAlerts';

export type ParameterStatus = 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL' | 'ABNORMAL' | 'PENDING';

export interface EvaluatedParameterResult {
  status: ParameterStatus;
  isCritical: boolean;
  criticalDetails?: {
    type?: 'CRITICAL_LOW' | 'CRITICAL_HIGH';
    label?: string;
    clinicalImplication?: string;
    recommendedAction?: string;
  };
  style: {
    textColor: [number, number, number];
    fillColor?: [number, number, number];
    fontStyle: 'normal' | 'bold';
    badgeLabel: string;
  };
}

/**
 * Parses numeric value from a string (handles commas, spaces, units)
 */
function parseCleanNumber(val: string | number): number | null {
  if (val === undefined || val === null) return null;
  const str = String(val).replace(/,/g, '').trim();
  const match = str.match(/[-+]?[0-9]*\.?[0-9]+/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return isNaN(num) ? null : num;
}

/**
 * Parses a reference range string into structured bounds
 * Supports formats:
 * - "13.0–17.0" or "13.0 - 17.0" or "13.0 to 17.0"
 * - "<5.7" or "< 5.7%" or "<= 100"
 * - ">50" or "> 50" or ">= 60"
 * - Qualitative strings like "Negative", "Non-Reactive", "Normal"
 */
function parseReferenceInterval(rangeStr: string): {
  type: 'range' | 'less_than' | 'greater_than' | 'qualitative' | 'unknown';
  min?: number;
  max?: number;
  expectedQualitative?: string;
} {
  if (!rangeStr || !rangeStr.trim()) {
    return { type: 'unknown' };
  }

  const clean = rangeStr.replace(/,/g, '').trim();

  // Pattern: "< 5.7" or "<= 5.7"
  const lessThanMatch = clean.match(/^<\s*=?\s*([0-9]*\.?[0-9]+)/);
  if (lessThanMatch) {
    return {
      type: 'less_than',
      max: parseFloat(lessThanMatch[1]),
    };
  }

  // Pattern: "> 50" or ">= 50"
  const greaterThanMatch = clean.match(/^>\s*=?\s*([0-9]*\.?[0-9]+)/);
  if (greaterThanMatch) {
    return {
      type: 'greater_than',
      min: parseFloat(greaterThanMatch[1]),
    };
  }

  // Pattern: "13.0 - 17.0" or "13.0–17.0" or "13.0 to 17.0"
  const rangeMatch = clean.match(/([0-9]*\.?[0-9]+)\s*(?:-|–|—|to)\s*([0-9]*\.?[0-9]+)/i);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (!isNaN(min) && !isNaN(max)) {
      return {
        type: 'range',
        min: Math.min(min, max),
        max: Math.max(min, max),
      };
    }
  }

  // Qualitative: Negative, Non-Reactive, Nil, Absent
  const lower = clean.toLowerCase();
  if (
    lower.includes('neg') ||
    lower.includes('non-reactive') ||
    lower.includes('nil') ||
    lower.includes('absent')
  ) {
    return {
      type: 'qualitative',
      expectedQualitative: 'negative',
    };
  }

  return { type: 'unknown' };
}

/**
 * Automatically evaluates the exact status of a laboratory investigation parameter
 * based on laboratory reference interval configuration.
 *
 * Status Determination Rules:
 * - PENDING: when value is empty, "pending", or awaiting
 * - CRITICAL: when configured panic alert threshold is exceeded (immediate clinical risk)
 * - LOW: when value < minimum reference interval
 * - HIGH: when value > maximum reference interval
 * - ABNORMAL: when qualitative test is positive/abnormal or manually flagged abnormal
 * - NORMAL: when within reference interval
 */
export function determineParameterStatus(
  parameterName: string,
  observedValue: string | number,
  referenceInterval: string,
  unit?: string,
  isManualAbnormal?: boolean
): EvaluatedParameterResult {
  const obsStr = String(observedValue || '').trim();

  // 1. Check for Pending State
  if (!obsStr || obsStr.toLowerCase() === 'pending' || obsStr.toLowerCase() === 'awaiting') {
    return {
      status: 'PENDING',
      isCritical: false,
      style: {
        textColor: [100, 116, 139], // Slate-500
        fontStyle: 'normal',
        badgeLabel: 'PENDING',
      },
    };
  }

  // 2. Check for Critical / Panic Value Alert
  const critical = checkPanicOrCriticalValue(parameterName, observedValue, unit);
  if (critical.isCritical) {
    return {
      status: 'CRITICAL',
      isCritical: true,
      criticalDetails: critical,
      style: {
        textColor: [190, 18, 60], // Rose-700
        fillColor: [254, 226, 226], // Rose-100
        fontStyle: 'bold',
        badgeLabel: 'CRITICAL',
      },
    };
  }

  // 3. Structured Interval Parsing
  const parsedRange = parseReferenceInterval(referenceInterval);
  const obsNum = parseCleanNumber(observedValue);

  if (obsNum !== null) {
    if (parsedRange.type === 'range' && parsedRange.min !== undefined && parsedRange.max !== undefined) {
      if (obsNum < parsedRange.min) {
        return {
          status: 'LOW',
          isCritical: false,
          style: {
            textColor: [29, 78, 216], // Blue-700
            fontStyle: 'bold',
            badgeLabel: 'LOW',
          },
        };
      }
      if (obsNum > parsedRange.max) {
        return {
          status: 'HIGH',
          isCritical: false,
          style: {
            textColor: [180, 83, 9], // Amber-700
            fontStyle: 'bold',
            badgeLabel: 'HIGH',
          },
        };
      }
      return {
        status: 'NORMAL',
        isCritical: false,
        style: {
          textColor: [30, 41, 59], // Slate-800
          fontStyle: 'normal',
          badgeLabel: 'NORMAL',
        },
      };
    }

    if (parsedRange.type === 'less_than' && parsedRange.max !== undefined) {
      if (obsNum > parsedRange.max) {
        return {
          status: 'HIGH',
          isCritical: false,
          style: {
            textColor: [180, 83, 9], // Amber-700
            fontStyle: 'bold',
            badgeLabel: 'HIGH',
          },
        };
      }
      return {
        status: 'NORMAL',
        isCritical: false,
        style: {
          textColor: [30, 41, 59],
          fontStyle: 'normal',
          badgeLabel: 'NORMAL',
        },
      };
    }

    if (parsedRange.type === 'greater_than' && parsedRange.min !== undefined) {
      if (obsNum < parsedRange.min) {
        return {
          status: 'LOW',
          isCritical: false,
          style: {
            textColor: [29, 78, 216], // Blue-700
            fontStyle: 'bold',
            badgeLabel: 'LOW',
          },
        };
      }
      return {
        status: 'NORMAL',
        isCritical: false,
        style: {
          textColor: [30, 41, 59],
          fontStyle: 'normal',
          badgeLabel: 'NORMAL',
        },
      };
    }
  }

  // 4. Qualitative Checking
  if (parsedRange.type === 'qualitative') {
    const obsLower = obsStr.toLowerCase();
    if (
      obsLower.includes('pos') ||
      obsLower.includes('reactive') ||
      obsLower.includes('present') ||
      obsLower.includes('detected')
    ) {
      return {
        status: 'ABNORMAL',
        isCritical: false,
        style: {
          textColor: [190, 18, 60],
          fontStyle: 'bold',
          badgeLabel: 'ABNORMAL',
        },
      };
    }
    return {
      status: 'NORMAL',
      isCritical: false,
      style: {
        textColor: [30, 41, 59],
        fontStyle: 'normal',
        badgeLabel: 'NORMAL',
      },
    };
  }

  // 5. Fallback based on pre-configured isAbnormal flag
  if (isManualAbnormal) {
    return {
      status: 'ABNORMAL',
      isCritical: false,
      style: {
        textColor: [180, 83, 9],
        fontStyle: 'bold',
        badgeLabel: 'ABNORMAL',
      },
    };
  }

  return {
    status: 'NORMAL',
    isCritical: false,
    style: {
      textColor: [30, 41, 59],
      fontStyle: 'normal',
      badgeLabel: 'NORMAL',
    },
  };
}
