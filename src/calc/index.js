/**
 * calc/index.js
 * 全計算結果をまとめて返すメイン関数
 */

import { calcEmploymentIncome, calcIncomeTax, calcResidentTax } from './income.js'
import { calcSocialInsurance } from './social.js'
import { calcParentTaxIncrease } from './dependent.js'

/**
 * メイン計算関数
 * @param {{
 *   income: number,          // 年収（万円）
 *   ageGroup: 'student'|'general'|'spouse',
 *   useKinroGakusei: boolean,
 *   companySize: 'large'|'small',
 *   parentIncome: number,    // 親の年収（万円）
 * }} params
 * @returns {object} 計算結果
 */
export function calcAll(params) {
  const {
    income: incomeMan,
    ageGroup,
    useKinroGakusei,
    companySize,
    parentIncome: parentIncomeMan,
  } = params

  const income = incomeMan * 10_000
  const parentIncome = parentIncomeMan * 10_000

  // 勤労学生控除は学生かつ設定がある場合のみ
  const kinro = ageGroup === 'student' && useKinroGakusei

  const employmentIncome = calcEmploymentIncome(income)
  const { tax: incomeTax, taxableIncome: itTaxableIncome } = calcIncomeTax(income, kinro)
  const { tax: residentTax, incomeLevy, uniformLevy, taxableIncome: ltTaxableIncome } = calcResidentTax(income, kinro)
  const socialIns = calcSocialInsurance(income, ageGroup, companySize)
  const parentTax = calcParentTaxIncrease(income, ageGroup, parentIncome)

  const takeHome = income - incomeTax - residentTax - socialIns.total

  // 基準は年収123万（壁を超えない最大値）での手取り
  const baseResult = calcBaseline(123, ageGroup, companySize, parentIncomeMan)
  const takeHomeGain = takeHome - baseResult.takeHome
  const householdBalance = takeHomeGain - parentTax.total

  return {
    income: incomeMan,
    incomeYen: income,
    employmentIncome,
    incomeTax,
    residentTax,
    incomeLevy,
    uniformLevy,
    socialIns,
    takeHome,
    parentTax,
    itTaxableIncome,
    ltTaxableIncome,
    // 世帯損益
    takeHomeGain,
    householdBalance,
  }
}

/**
 * 123万（基準点）での計算結果
 */
function calcBaseline(incomeMan, ageGroup, companySize, parentIncomeMan) {
  const income = incomeMan * 10_000
  const parentIncome = parentIncomeMan * 10_000
  const incomeTax = calcIncomeTax(income, false).tax
  const { tax: residentTax } = calcResidentTax(income, false)
  const socialIns = calcSocialInsurance(income, ageGroup, companySize)
  const takeHome = income - incomeTax - residentTax - socialIns.total
  return { takeHome }
}

/**
 * グラフ用に年収50〜300万を1万刻みで計算
 * @param {{
 *   ageGroup: 'student'|'general'|'spouse',
 *   useKinroGakusei: boolean,
 *   companySize: 'large'|'small',
 *   parentIncome: number
 * }} params
 * @returns {Array<{income: number, takeHome: number, incomeTax: number, residentTax: number, socialIns: number}>}
 */
export function calcChartData(params) {
  const { ageGroup, useKinroGakusei, companySize, parentIncome } = params
  const data = []

  for (let incomeMan = 50; incomeMan <= 300; incomeMan++) {
    const income = incomeMan * 10_000
    const kinro = ageGroup === 'student' && useKinroGakusei
    const { tax: incomeTax } = calcIncomeTax(income, kinro)
    const { tax: residentTax } = calcResidentTax(income, kinro)
    const socialIns = calcSocialInsurance(income, ageGroup, companySize)
    const parentTax = calcParentTaxIncrease(income, ageGroup, parentIncome * 10_000)
    const takeHome = income - incomeTax - residentTax - socialIns.total

    data.push({
      income: incomeMan,
      takeHome: Math.round(takeHome / 10_000 * 10) / 10,
      incomeTax: Math.round(incomeTax / 10_000 * 10) / 10,
      residentTax: Math.round(residentTax / 10_000 * 10) / 10,
      socialIns: Math.round(socialIns.total / 10_000 * 10) / 10,
      parentTaxBurden: Math.round(parentTax.total / 10_000 * 10) / 10,
    })
  }

  return data
}
