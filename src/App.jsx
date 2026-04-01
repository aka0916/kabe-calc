import { useState, useMemo } from 'react'
import './App.css'
import InputPanel from './components/InputPanel.jsx'
import ResultPanel from './components/ResultPanel.jsx'
import { calcAll, calcChartData } from './calc/index.js'

const DEFAULT_PARAMS = {
  income: 120,           // 万円
  ageGroup: 'student',   // 'student' | 'general' | 'spouse'
  useKinroGakusei: true,
  companySize: 'large',  // 'large' | 'small'
  parentIncome: 600,     // 万円
}

export default function App() {
  const [params, setParams] = useState(DEFAULT_PARAMS)

  const result = useMemo(() => calcAll(params), [params])
  const chartData = useMemo(() => calcChartData(params), [params])

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="header-brand">
          <div className="header-icon">W</div>
          <div>
            <div className="header-title">
              年収の壁<span>.JP</span>
            </div>
            <div className="header-tagline">2026年最新税制対応 — 103万の壁はもう古い</div>
          </div>
        </div>
        <div className="header-badge">令和7年分（2025年）税制改正対応</div>
      </header>

      <main className="app-main">
        <InputPanel params={params} onChange={setParams} />
        <ResultPanel result={result} chartData={chartData} params={params} />
      </main>

      <footer className="app-footer">
        <span>計算は概算です。正確な金額は税務署・社会保険事務所にご確認ください。</span>
        <span className="footer-sep" />
        <span>令和7年分（2025年）所得税・令和8年度住民税の改正内容を反映</span>
      </footer>
    </div>
  )
}
