import type {
  CitizenProfile,
  EligibilityOutcome,
  GovernmentScheme,
  SchemeMatchResult,
  SchemeRuleCondition,
} from '@betul/shared-types';

function evaluateCondition(
  profile: Partial<CitizenProfile>,
  rule: SchemeRuleCondition,
): 'matched' | 'failed' | 'missing' {
  const rawValue = profile[rule.field];

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return 'missing';
  }

  const normalizedVal = typeof rawValue === 'string' ? rawValue.trim().toLowerCase() : rawValue;

  switch (rule.operator) {
    case 'exists':
      return 'matched';
    case 'eq': {
      const target = typeof rule.value === 'string' ? rule.value.toLowerCase() : rule.value;
      return normalizedVal === target ? 'matched' : 'failed';
    }
    case 'neq': {
      const target = typeof rule.value === 'string' ? rule.value.toLowerCase() : rule.value;
      return normalizedVal !== target ? 'matched' : 'failed';
    }
    case 'gte':
      return Number(rawValue) >= Number(rule.value) ? 'matched' : 'failed';
    case 'lte':
      return Number(rawValue) <= Number(rule.value) ? 'matched' : 'failed';
    case 'in': {
      if (!Array.isArray(rule.value)) return 'failed';
      const normalizedList = rule.value.map((v) => (typeof v === 'string' ? v.toLowerCase() : v));
      return normalizedList.includes(normalizedVal as string | number) ? 'matched' : 'failed';
    }
    default:
      return 'failed';
  }
}

export function isSchemeCurrentlyActive(scheme: GovernmentScheme, now = new Date()): boolean {
  if (!scheme.isActive) return false;
  if (scheme.effectiveUntil && new Date(scheme.effectiveUntil) < now) return false;
  return true;
}

export function evaluateSchemeEligibility(
  profile: Partial<CitizenProfile>,
  schemes: GovernmentScheme[],
): SchemeMatchResult[] {
  const results: SchemeMatchResult[] = [];

  for (const scheme of schemes) {
    // CRITICAL RULE (Section 14): Never recommend an inactive or expired scheme as available.
    if (!isSchemeCurrentlyActive(scheme)) {
      continue;
    }

    const matchedConditions: string[] = [];
    const failedConditions: string[] = [];
    const missingFields: string[] = [];
    let excluded = false;

    for (const rule of scheme.rules) {
      const status = evaluateCondition(profile, rule);

      if (rule.isExclusion) {
        if (status === 'matched') {
          excluded = true;
          failedConditions.push(rule.labelEn);
        } else if (status === 'missing') {
          missingFields.push(`${rule.field} (needed to verify exclusion: ${rule.labelEn})`);
        } else {
          matchedConditions.push(`Exclusion not triggered: ${rule.labelEn}`);
        }
      } else {
        if (status === 'matched') {
          matchedConditions.push(rule.labelEn);
        } else if (status === 'failed') {
          failedConditions.push(rule.labelEn);
        } else {
          missingFields.push(`${rule.field} (${rule.labelEn})`);
        }
      }
    }

    let outcome: EligibilityOutcome;
    let confidence: number;

    if (excluded || failedConditions.length > 0) {
      outcome = 'likely_ineligible';
      confidence = missingFields.length === 0 ? 0.92 : 0.72;
    } else if (missingFields.length > 0) {
      outcome = 'additional_info_required';
      const total = Math.max(1, scheme.rules.length);
      confidence = Number((matchedConditions.length / total).toFixed(2));
    } else {
      outcome = 'potentially_eligible';
      confidence = 0.95;
    }

    results.push({
      scheme,
      outcome,
      confidence,
      matchedConditions,
      failedConditions,
      missingFields,
      disclaimer:
        'Preliminary rule-based match only. Final eligibility and benefit approval require official departmental verification.',
    });
  }

  const order: Record<EligibilityOutcome, number> = {
    potentially_eligible: 0,
    additional_info_required: 1,
    likely_ineligible: 2,
    application_submitted: 3,
    application_approved: 4,
    benefit_received: 5,
  };

  return results.sort((a, b) => order[a.outcome] - order[b.outcome] || b.confidence - a.confidence);
}
