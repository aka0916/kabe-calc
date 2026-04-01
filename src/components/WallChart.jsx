import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts'
import { useMemo } from 'react'

const WALL_LINES = [
  { income: 100, label: '100万\n住民税', color: '#f59e0b' },
  { income: 106, label: '106万\n社保', color: '#8b5cf6' },
  { income: 123, label: '123万\n扶養', color: '#e94560' },
  { income: 130, label: '130万\n社保扶養', color: '#f97316' },
  { income: 160, label: '160万\n配偶者特控', color: '#14b8a6' },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const takeHome = payload.find(p => p.dataKey === 'takeHome')
  const it = payload.find(p => p.dataKey === 'incomeTax')
  const lt = payload.find(p => p.dataKey === 'residentTax')
  const si = payload.find(p => p.dataKey === 'socialIns')
  return (
    <div className="chart-tooltip">
      <div className="ct-title">年収 {label}万円</div>
      {takeHome && (
        <div className="ct-row ct-main">
          <span>手取り</span>
          <span className="ct-val green">{takeHome.value.toFixed(1)}万円</span>
        </div>
      )}
      {it && it.value > 0 && (
        <div className="ct-row">
          <span>所得税</span>
          <span className="ct-val red">{it.value.toFixed(1)}万円</span>
        </div>
      )}
      {lt && lt.value > 0 && (
        <div className="ct-row">
          <span>住民税</span>
          <span className="ct-val orange">{lt.value.toFixed(1)}万円</span>
        </div>
      )}
      {si && si.value > 0 && (
        <div className="ct-row">
          <span>社会保険</span>
          <span className="ct-val purple">{si.value.toFixed(1)}万円</span>
        </div>
      )}
    </div>
  )
}

function WallLabel({ viewBox, label, color }) {
  const { x, y } = viewBox
  const lines = label.split('\n')
  return (
    <g>
      <text
        x={x + 4}
        y={y + 14}
        fill={color}
        fontSize={9}
        fontFamily="var(--font-mono)"
        fontWeight="600"
      >
        {lines[0]}
      </text>
      {lines[1] && (
        <text
          x={x + 4}
          y={y + 24}
          fill={color}
          fontSize={9}
          fontFamily="var(--font-mono)"
          opacity={0.8}
        >
          {lines[1]}
        </text>
      )}
    </g>
  )
}

export default function WallChart({ chartData, currentIncome }) {
  // 手取りが下がる区間（逆転現象）を検出
  const reverseAreas = useMemo(() => {
    const areas = []
    let inReverse = false
    let start = null

    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1]
      const cur = chartData[i]
      const isDown = cur.takeHome < prev.takeHome - 0.05  // 0.05万円以上の落ち込み

      if (isDown && !inReverse) {
        inReverse = true
        start = prev.income
      } else if (!isDown && inReverse) {
        inReverse = false
        areas.push({ x1: start, x2: cur.income })
      }
    }
    if (inReverse) areas.push({ x1: start, x2: 300 })
    return areas
  }, [chartData])

  return (
    <div className="chart-section">
      <div className="section-header">
        <span className="section-title">手取り額グラフ（年収 50〜300万）</span>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#10b981' }} />
            <span>手取り</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#e94560' }} />
            <span>税金・社保</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'rgba(233,69,96,0.25)', border: '1px solid #e94560' }} />
            <span>手取り逆転</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart
          data={chartData}
          margin={{ top: 30, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="takeHomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="taxGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e94560" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#e94560" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="income"
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            tickFormatter={v => `${v}万`}
            interval={24}
            axisLine={{ stroke: 'rgba(255,255,255,0.07)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            tickFormatter={v => `${v}万`}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* 手取り逆転区間 */}
          {reverseAreas.map((area, i) => (
            <ReferenceArea
              key={i}
              x1={area.x1}
              x2={area.x2}
              fill="rgba(233,69,96,0.12)"
              stroke="rgba(233,69,96,0.3)"
              strokeWidth={1}
            />
          ))}

          {/* 壁ライン */}
          {WALL_LINES.map(w => (
            <ReferenceLine
              key={w.income}
              x={w.income}
              stroke={w.color}
              strokeWidth={1}
              strokeDasharray="4 3"
              opacity={0.7}
              label={<WallLabel label={w.label} color={w.color} />}
            />
          ))}

          {/* 現在位置 */}
          <ReferenceLine
            x={currentIncome}
            stroke="#3b82f6"
            strokeWidth={2}
            opacity={0.9}
          />

          {/* エリア */}
          <Area
            type="monotone"
            dataKey="takeHome"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#takeHomeGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#10b981' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="chart-note">
        青い縦線が現在の年収。赤い区間は年収を増やすと手取りが下がる「逆転ゾーン」
      </div>
    </div>
  )
}
