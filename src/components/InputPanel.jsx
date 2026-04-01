import { useState, useCallback } from 'react'

const WALLS = [
  { income: 100, label: '100万' },
  { income: 106, label: '106万' },
  { income: 123, label: '123万' },
  { income: 130, label: '130万' },
  { income: 150, label: '150万（学生特例）' },
  { income: 160, label: '160万' },
  { income: 198, label: '198万' },
]

export default function InputPanel({ params, onChange }) {
  const { income, ageGroup, useKinroGakusei, companySize, parentIncome } = params

  const set = useCallback((key, val) => onChange({ ...params, [key]: val }), [params, onChange])

  const sliderPct = ((income - 50) / (300 - 50)) * 100
  const parentSliderPct = ((parentIncome - 200) / (2000 - 200)) * 100

  return (
    <div className="input-panel">
      <div className="panel-title">条件設定</div>

      {/* 年収スライダー */}
      <div className="input-group">
        <div className="input-label">
          <span className="input-label-text">年収</span>
          <span className="input-label-value">{income}万円</span>
        </div>
        <div className="range-wrap">
          <div className="range-track">
            <div className="range-fill" style={{ width: `${sliderPct}%` }} />
            {WALLS.filter(w => w.income <= 300).map(w => (
              <div
                key={w.income}
                className="range-wall-tick"
                style={{ left: `${((w.income - 50) / 250) * 100}%` }}
                title={w.label}
              />
            ))}
          </div>
          <input
            type="range"
            min={50}
            max={300}
            step={1}
            value={income}
            onChange={e => set('income', Number(e.target.value))}
          />
        </div>
        <div className="range-labels">
          <span>50万</span>
          <span>175万</span>
          <span>300万</span>
        </div>
      </div>

      <div className="input-divider" />

      {/* 年齢区分 */}
      <div className="input-group">
        <div className="input-label">
          <span className="input-label-text">区分</span>
        </div>
        <div className="toggle-group">
          {[
            { key: 'student', label: '学生(19-22歳)' },
            { key: 'general', label: '一般(扶養)' },
            { key: 'spouse', label: '配偶者' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`toggle-btn ${ageGroup === key ? 'active' : ''}`}
              onClick={() => set('ageGroup', key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 勤労学生控除（学生のみ表示） */}
      {ageGroup === 'student' && (
        <div className="input-group">
          <div className="input-label">
            <span className="input-label-text">勤労学生控除</span>
          </div>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${useKinroGakusei ? 'active' : ''}`}
              onClick={() => set('useKinroGakusei', true)}
            >
              あり（適用する）
            </button>
            <button
              className={`toggle-btn ${!useKinroGakusei ? 'active' : ''}`}
              onClick={() => set('useKinroGakusei', false)}
            >
              なし
            </button>
          </div>
          <div className="input-note">27万円の追加控除。合計所得75万以下が条件</div>
        </div>
      )}

      <div className="input-divider" />

      {/* 企業規模 */}
      <div className="input-group">
        <div className="input-label">
          <span className="input-label-text">勤務先の従業員数</span>
        </div>
        <div className="toggle-group">
          <button
            className={`toggle-btn ${companySize === 'large' ? 'active' : ''}`}
            onClick={() => set('companySize', 'large')}
          >
            51人以上
          </button>
          <button
            className={`toggle-btn ${companySize === 'small' ? 'active' : ''}`}
            onClick={() => set('companySize', 'small')}
          >
            50人以下
          </button>
        </div>
        <div className="input-note">106万の壁（社保加入）の判定に使用</div>
      </div>

      {/* 親の年収（学生・一般扶養・配偶者の場合） */}
      {(ageGroup === 'student' || ageGroup === 'general' || ageGroup === 'spouse') && (
        <>
          <div className="input-divider" />
          <div className="input-group">
            <div className="input-label">
              <span className="input-label-text">
                {ageGroup === 'spouse' ? '配偶者（扶養者）の年収' : '親の年収'}
              </span>
              <span className="input-label-value">{parentIncome}万円</span>
            </div>
            <div className="range-wrap">
              <div className="range-track">
                <div className="range-fill range-fill-gold" style={{ width: `${parentSliderPct}%` }} />
              </div>
              <input
                type="range"
                min={200}
                max={2000}
                step={10}
                value={parentIncome}
                onChange={e => set('parentIncome', Number(e.target.value))}
              />
            </div>
            <div className="range-labels">
              <span>200万</span>
              <span>1100万</span>
              <span>2000万</span>
            </div>
            <div className="input-note">
              扶養控除が消失したときの{ageGroup === 'spouse' ? '配偶者' : '親'}の税負担増を計算
            </div>
          </div>
        </>
      )}
    </div>
  )
}
