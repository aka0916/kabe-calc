/**
 * dependent.js
 * 扶養控除・配偶者控除の計算（親の税負担増）
 */

import { calcParentMarginalRate, calcEmploymentIncome } from './income.js'

/**
 * 扶養から外れるかどうかの判定
 * 123万の壁（令和7年分〜、旧103万）
 * @param {number} income 年収（円）
 * @returns {boolean}
 */
export function isOutOfDependency(income) {
  return income > 1_230_000
}

/**
 * 扶養控除の消失による親の税負担増を計算
 * @param {number} income 子/配偶者の年収（円）
 * @param {'student' | 'general' | 'spouse'} ageGroup 年齢区分
 * @param {number} parentIncome 親の年収（円）
 * @returns {{
 *   incomeTaxIncrease: number,
 *   residentTaxIncrease: number,
 *   total: number,
 *   marginalRate: number,
 *   dependentType: string,
 *   isDependent: boolean
 * }}
 */
export function calcParentTaxIncrease(income, ageGroup, parentIncome) {
  const isDependent = !isOutOfDependency(income)

  if (isDependent) {
    return {
      incomeTaxIncrease: 0,
      residentTaxIncrease: 0,
      total: 0,
      marginalRate: 0,
      dependentType: ageGroup === 'student' ? '特定扶養' : '一般扶養',
      isDependent: true,
    }
  }

  const marginalRate = calcParentMarginalRate(parentIncome)

  if (ageGroup === 'student') {
    // 特定扶養控除（19-22歳）: 63万円消失
    const incomeTaxIncrease = Math.floor(630_000 * marginalRate * 1.021) // 復興税込み
    // 住民税: 45万円 × 10%
    const residentTaxIncrease = 45_000
    return {
      incomeTaxIncrease,
      residentTaxIncrease,
      total: incomeTaxIncrease + residentTaxIncrease,
      marginalRate,
      dependentType: '特定扶養',
      isDependent: false,
    }
  }

  if (ageGroup === 'general') {
    // 一般扶養控除: 38万円消失
    const incomeTaxIncrease = Math.floor(380_000 * marginalRate * 1.021)
    // 住民税: 33万円 × 10%
    const residentTaxIncrease = 33_000
    return {
      incomeTaxIncrease,
      residentTaxIncrease,
      total: incomeTaxIncrease + residentTaxIncrease,
      marginalRate,
      dependentType: '一般扶養',
      isDependent: false,
    }
  }

  if (ageGroup === 'spouse') {
    // 配偶者: 配偶者控除（38万）→ 配偶者特別控除（段階的減少）
    // 控除額は配偶者の「合計所得金額」（給与のみなら給与所得）で判定
    // 所得48万超~95万(年収~160万): 38万
    // 所得95万超~100万(年収~165万): 36万
    // 所得100万超~105万(年収~170万): 31万
    // 所得105万超~110万(年収~175万): 26万
    // 所得110万超~115万(年収~180万): 21万
    // 所得115万超~120万(年収~185万): 16万
    // 所得120万超~125万(年収~190万): 11万
    // 所得125万超~130万(年収~197万): 6万
    // 所得130万超~133万(年収~201.4万): 3万
    // 所得133万超(年収~201.4万超): 0
    const spouseSpecialDeduction = calcSpouseSpecialDeduction(income)
    // 配偶者控除（38万）と特別控除の差分が実質的な控除額の変化
    // 123万以下なら配偶者控除38万が適用されているので、その消失分
    const spouseDeductionLoss = 380_000 - spouseSpecialDeduction
    if (spouseDeductionLoss <= 0) {
      return {
        incomeTaxIncrease: 0,
        residentTaxIncrease: 0,
        total: 0,
        marginalRate,
        dependentType: '配偶者',
        isDependent: false,
      }
    }
    const incomeTaxIncrease = Math.floor(spouseDeductionLoss * marginalRate * 1.021)
    // 住民税の配偶者控除消失（33万）
    const ltSpouseSpecial = calcSpouseSpecialDeductionLT(income)
    const ltLoss = 330_000 - ltSpouseSpecial
    const residentTaxIncrease = Math.max(0, Math.floor(ltLoss * 0.10))
    return {
      incomeTaxIncrease,
      residentTaxIncrease,
      total: incomeTaxIncrease + residentTaxIncrease,
      marginalRate,
      dependentType: '配偶者',
      isDependent: false,
    }
  }

  return { incomeTaxIncrease: 0, residentTaxIncrease: 0, total: 0, marginalRate, dependentType: '', isDependent: false }
}

/**
 * 配偶者特別控除額（所得税）を計算
 * 判定は配偶者の「合計所得金額」（給与のみなら給与所得）で行う（国税庁規定）
 * @param {number} income 配偶者の年収（円）
 * @returns {number} 控除額（円）
 */
function calcSpouseSpecialDeduction(income) {
  const empIncome = calcEmploymentIncome(income)
  if (empIncome <= 950_000) return 380_000    // 48万超~95万
  if (empIncome <= 1_000_000) return 360_000  // 95万超~100万
  if (empIncome <= 1_050_000) return 310_000  // 100万超~105万
  if (empIncome <= 1_100_000) return 260_000  // 105万超~110万
  if (empIncome <= 1_150_000) return 210_000  // 110万超~115万
  if (empIncome <= 1_200_000) return 160_000  // 115万超~120万
  if (empIncome <= 1_250_000) return 110_000  // 120万超~125万
  if (empIncome <= 1_300_000) return 60_000   // 125万超~130万
  if (empIncome <= 1_330_000) return 30_000   // 130万超~133万
  return 0
}

/**
 * 配偶者特別控除額（住民税）を計算
 * 判定は配偶者の「合計所得金額」（給与のみなら給与所得）で行う
 * @param {number} income 配偶者の年収（円）
 * @returns {number} 控除額（円）
 */
function calcSpouseSpecialDeductionLT(income) {
  const empIncome = calcEmploymentIncome(income)
  if (empIncome <= 950_000) return 330_000    // 48万超~95万
  if (empIncome <= 1_000_000) return 310_000  // 95万超~100万
  if (empIncome <= 1_050_000) return 260_000  // 100万超~105万
  if (empIncome <= 1_100_000) return 210_000  // 105万超~110万
  if (empIncome <= 1_150_000) return 160_000  // 110万超~115万
  if (empIncome <= 1_200_000) return 110_000  // 115万超~120万
  if (empIncome <= 1_250_000) return 60_000   // 120万超~125万
  if (empIncome <= 1_300_000) return 30_000   // 125万超~130万
  if (empIncome <= 1_330_000) return 10_000   // 130万超~133万
  return 0
}
