/**
 * social.js
 * 社会保険料（厚生年金・健康保険・雇用保険）および国保・国民年金の計算
 */

import { calcEmploymentIncome } from './income.js'

/**
 * 社保加入判定（106万の壁）
 * @param {number} income 年収（円）
 * @param {'student' | 'general' | 'spouse'} ageGroup 年齢区分
 * @param {'large' | 'small'} companySize 企業規模（51人以上=large）
 * @returns {boolean} 社保（厚生年金+健保）に加入するか
 */
export function isKosei(income, ageGroup, companySize) {
  // 学生は社保加入対象外（勤労学生控除の対象は学生）
  if (ageGroup === 'student') return false
  if (companySize !== 'large') return false
  return income >= 1_060_000
}

/**
 * 社保扶養から外れるか（130万の壁）
 * 学生(19-22歳)は2025年10月〜150万まで扶養OK
 * @param {number} income 年収（円）
 * @param {'student' | 'general' | 'spouse'} ageGroup 年齢区分
 * @returns {boolean} 社保扶養から外れるか
 */
export function isOutOfSocialInsuranceDependency(income, ageGroup) {
  if (ageGroup === 'student') {
    // 19-22歳特例: 150万未満まで扶養OK
    return income >= 1_500_000
  }
  return income >= 1_300_000
}

/**
 * 厚生年金・健康保険・雇用保険料（51人以上企業で加入の場合）
 * @param {number} income 年収（円）
 * @returns {{ healthIns: number, pension: number, employment: number, total: number }}
 */
export function calcKoseiShaho(income) {
  // 健康保険: 4.955%（東京、本人負担分）
  const healthIns = Math.floor(income * 0.04955)
  // 厚生年金: 9.15%
  const pension = Math.floor(income * 0.0915)
  // 雇用保険: 0.95%（2025年度）
  const employment = Math.floor(income * 0.0095)
  const total = healthIns + pension + employment
  return { healthIns, pension, employment, total }
}

/**
 * 国保+国民年金（130万超で扶養から外れ、かつ厚生年金未加入の場合）
 * @param {number} income 年収（円）
 * @returns {{ kokuho: number, kokumin: number, total: number }}
 */
export function calcKokuho(income) {
  const empIncome = calcEmploymentIncome(income)
  // 国民年金: 月17,920円 × 12
  const kokumin = 17_920 * 12
  // 国保: 所得割8% × (給与所得 - 43万) + 均等割35,000円
  const shotokuWari = Math.max(0, Math.floor((empIncome - 430_000) * 0.08))
  const kinkouWari = 35_000
  const kokuho = shotokuWari + kinkouWari
  return { kokuho, kokumin, total: kokuho + kokumin }
}

/**
 * 社会保険料の合計を計算する（状況に応じて適切な保険料を返す）
 * @param {number} income 年収（円）
 * @param {'student' | 'general' | 'spouse'} ageGroup 年齢区分
 * @param {'large' | 'small'} companySize 企業規模
 * @returns {{
 *   type: 'none' | 'kosei' | 'kokuho',
 *   total: number,
 *   detail: object
 * }}
 */
export function calcSocialInsurance(income, ageGroup, companySize) {
  // 厚生年金・健保加入（106万の壁、大企業のみ）
  if (isKosei(income, ageGroup, companySize)) {
    const detail = calcKoseiShaho(income)
    return { type: 'kosei', total: detail.total, detail }
  }

  // 社保扶養から外れて国保・国民年金加入
  if (isOutOfSocialInsuranceDependency(income, ageGroup)) {
    const detail = calcKokuho(income)
    return { type: 'kokuho', total: detail.total, detail }
  }

  // 社保扶養内 or 対象外
  return { type: 'none', total: 0, detail: {} }
}
