/**
 * income.js
 * 給与所得控除・基礎控除・所得税・住民税の計算
 * 令和7年分（2025年分）税制改正対応
 */

/**
 * 給与所得控除（令和7年分〜）
 * @param {number} income 年収（円）
 * @returns {number} 給与所得控除額（円）
 */
export function calcSalaryDeduction(income) {
  if (income <= 1_900_000) return 650_000
  if (income <= 3_600_000) return Math.floor(income * 0.30) + 80_000
  if (income <= 6_600_000) return Math.floor(income * 0.20) + 440_000
  if (income <= 8_500_000) return Math.floor(income * 0.10) + 1_100_000
  return 1_950_000
}

/**
 * 給与所得（= 年収 - 給与所得控除）
 * @param {number} income 年収（円）
 * @returns {number} 給与所得（円）
 */
export function calcEmploymentIncome(income) {
  return Math.max(0, income - calcSalaryDeduction(income))
}

/**
 * 基礎控除（所得税、令和7年分〜）
 * @param {number} totalIncome 合計所得（円）
 * @returns {number} 基礎控除額（円）
 */
export function calcBasicDeductionIT(totalIncome) {
  if (totalIncome <= 1_320_000) return 950_000  // 低中所得者上乗せ特例
  if (totalIncome <= 6_550_000) return 580_000
  if (totalIncome <= 23_500_000) return 580_000
  if (totalIncome <= 24_000_000) return 480_000
  if (totalIncome <= 24_500_000) return 320_000
  if (totalIncome <= 25_000_000) return 160_000
  return 0
}

/**
 * 基礎控除（住民税、令和8年度分〜）
 * @param {number} totalIncome 合計所得（円）
 * @returns {number} 基礎控除額（円）
 */
export function calcBasicDeductionLT(totalIncome) {
  if (totalIncome <= 1_320_000) return 860_000  // 低中所得者上乗せ特例
  if (totalIncome <= 24_000_000) return 530_000
  if (totalIncome <= 24_500_000) return 350_000
  if (totalIncome <= 25_000_000) return 210_000
  return 0
}

/**
 * 所得税の計算
 * @param {number} income 年収（円）
 * @param {boolean} useKinroGakusei 勤労学生控除を使うか
 * @returns {{ tax: number, taxableIncome: number }} 所得税額と課税所得
 */
export function calcIncomeTax(income, useKinroGakusei = false) {
  const employmentIncome = calcEmploymentIncome(income)
  const basicDeduction = calcBasicDeductionIT(employmentIncome)
  // 勤労学生控除: 合計所得85万以下（年収150万以下）が適用要件
  const kinroDeduction = (useKinroGakusei && employmentIncome <= 850_000) ? 270_000 : 0

  const taxableIncome = Math.max(0, employmentIncome - basicDeduction - kinroDeduction)

  let baseTax = 0
  if (taxableIncome <= 1_950_000) {
    baseTax = taxableIncome * 0.05
  } else if (taxableIncome <= 3_300_000) {
    baseTax = taxableIncome * 0.10 - 97_500
  } else if (taxableIncome <= 6_950_000) {
    baseTax = taxableIncome * 0.20 - 427_500
  } else if (taxableIncome <= 9_000_000) {
    baseTax = taxableIncome * 0.23 - 636_000
  } else if (taxableIncome <= 18_000_000) {
    baseTax = taxableIncome * 0.33 - 1_536_000
  } else if (taxableIncome <= 40_000_000) {
    baseTax = taxableIncome * 0.40 - 2_796_000
  } else {
    baseTax = taxableIncome * 0.45 - 4_796_000
  }
  baseTax = Math.max(0, baseTax)

  // 復興特別所得税（2.1%）
  const tax = Math.floor(baseTax * 1.021)

  return { tax, taxableIncome }
}

/**
 * 住民税の計算（令和8年度分〜）
 * @param {number} income 年収（円）
 * @param {boolean} useKinroGakusei 勤労学生控除を使うか
 * @returns {{ tax: number, incomeLevy: number, uniformLevy: number, taxableIncome: number }}
 */
export function calcResidentTax(income, useKinroGakusei = false) {
  const employmentIncome = calcEmploymentIncome(income)
  const basicDeduction = calcBasicDeductionLT(employmentIncome)
  // 勤労学生控除: 合計所得85万以下（年収150万以下）が適用要件
  const kinroDeduction = (useKinroGakusei && employmentIncome <= 850_000) ? 260_000 : 0

  const taxableIncome = Math.max(0, employmentIncome - basicDeduction - kinroDeduction)

  // 非課税判定: 給与所得が45万以下なら所得割非課税
  const incomeLevy = employmentIncome <= 450_000 ? 0 : Math.floor(taxableIncome * 0.10)

  // 均等割（課税される場合のみ）
  // 所得割が0でも均等割が発生するケースを考慮
  // 合計所得が基礎控除以下の場合は非課税
  const isNonTaxable = employmentIncome <= 450_000
  const uniformLevy = isNonTaxable ? 0 : 5_000

  const tax = incomeLevy + uniformLevy

  return { tax, incomeLevy, uniformLevy, taxableIncome }
}

/**
 * 親の所得税の限界税率を計算
 * @param {number} parentIncome 親の年収（円）
 * @returns {number} 限界税率（0.05〜0.33）
 */
export function calcParentMarginalRate(parentIncome) {
  const empIncome = calcEmploymentIncome(parentIncome)
  const basicDed = calcBasicDeductionIT(empIncome)
  const taxableIncome = Math.max(0, empIncome - basicDed)

  if (taxableIncome <= 1_950_000) return 0.05
  if (taxableIncome <= 3_300_000) return 0.10
  if (taxableIncome <= 6_950_000) return 0.20
  if (taxableIncome <= 9_000_000) return 0.23
  if (taxableIncome <= 18_000_000) return 0.33
  if (taxableIncome <= 40_000_000) return 0.40
  return 0.45
}
