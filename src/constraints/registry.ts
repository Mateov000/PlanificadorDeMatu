import { HardConstraintRule, SoftConstraintRule, ConstraintRegistryContract } from './contracts';

// Importación de Hard Constraints desacopladas
import { hc01_noOverlapRule } from './hard/HC01_NoOverlap';
import { hc02_lockedPillarsRule } from './hard/HC02_LockedPillars';
import { hc03_sleepAnchorRule } from './hard/HC03_SleepAnchor';
import { hc04_cognitiveBanRule } from './hard/HC04_CognitiveBan';
import { hc05_travelViabilityRule } from './hard/HC05_TravelViability';
import { hc06_splitLagRecoveryRule } from './hard/HC06_SplitLagRecovery';
import { ghc01_cannabisBufferRule } from './hard/GHC01_CannabisBuffer';

// Importación de Soft Constraints desacopladas
import { sc01_studyFocalBlocksRule } from './soft/SC01_StudyFocalBlocks';
import { sc02_circadianFatigueRule } from './soft/SC02_CircadianFatigue';
import { sc03_weatherArbitrageRule } from './soft/SC03_WeatherArbitrage';
import { sc04_punctualityPenaltyRule } from './soft/SC04_PunctualityPenalty';
import { sc05_socialPoolBalanceRule } from './soft/SC05_SocialPoolBalance';
import { sc06_budgetOptimizationRule } from './soft/SC06_BudgetOptimization';
import { sc07_spatialClusteringRule } from './soft/SC07_SpatialClustering';

/**
 * Registro Central de Restricciones (Patrón Registry)
 * El motor CSP no conoce las reglas directamente; itera sobre este registro.
 */
class ConstraintRegistry implements ConstraintRegistryContract {
  hardRules: HardConstraintRule[] = [
    hc01_noOverlapRule,
    hc02_lockedPillarsRule,
    hc03_sleepAnchorRule,
    hc04_cognitiveBanRule,
    hc05_travelViabilityRule,
    hc06_splitLagRecoveryRule,
    ghc01_cannabisBufferRule,
  ];

  softRules: SoftConstraintRule[] = [
    sc01_studyFocalBlocksRule,
    sc02_circadianFatigueRule,
    sc03_weatherArbitrageRule,
    sc04_punctualityPenaltyRule,
    sc05_socialPoolBalanceRule,
    sc06_budgetOptimizationRule,
    sc07_spatialClusteringRule,
  ];

  registerHardRule(rule: HardConstraintRule): void {
    const existingIndex = this.hardRules.findIndex((r) => r.id === rule.id);
    if (existingIndex >= 0) {
      this.hardRules[existingIndex] = rule;
    } else {
      this.hardRules.push(rule);
    }
  }

  registerSoftRule(rule: SoftConstraintRule): void {
    const existingIndex = this.softRules.findIndex((r) => r.id === rule.id);
    if (existingIndex >= 0) {
      this.softRules[existingIndex] = rule;
    } else {
      this.softRules.push(rule);
    }
  }

  setRuleEnabled(id: string, enabled: boolean): void {
    const hard = this.hardRules.find((r) => r.id === id);
    if (hard) {
      hard.enabled = enabled;
      return;
    }
    const soft = this.softRules.find((r) => r.id === id);
    if (soft) {
      soft.enabled = enabled;
    }
  }

  getHardRules(): HardConstraintRule[] {
    return this.hardRules.filter((r) => r.enabled);
  }

  getSoftRules(): SoftConstraintRule[] {
    return this.softRules.filter((r) => r.enabled);
  }
}

export const constraintRegistry = new ConstraintRegistry();
