import WallChart from './WallChart.jsx'
import WallTable from './WallTable.jsx'

function fmt(yen) {
  const man = yen / 10_000
  if (Math.abs(man) < 0.05) return '0万円'
  return `${man >= 0 ? '' : '-'}${Math.abs(man).toFixed(1)}万円`
}

function fmtSign(yen) {
  const man = yen / 10_000
  if (Math.abs(man) < 0.05) return '±0万円'
  return `${man >= 0 ? '+' : ''}${man.toFixed(1)}万円`
}

function KpiCard({ label, value, valueClass = '', unit = '', note = '' }) {
  return (
    <div className={`kpi-card ${valueClass === 'red' ? 'warning' : ''}`}>
      <div className="kpi-label">
        <div className={`kpi-dot kpi-dot-${valueClass || 'muted'}`} />
        {label}
      </div>
      <div className={`kpi-value ${valueClass}`}>{value}</div>
      {unit && <div className="kpi-unit">{unit}</div>}
      {note && <div className="kpi-note">{note}</div>}
    </div>
  )
}

export default function ResultPanel({ result, chartData, params }) {
  const { income, ageGroup } = params
  const r = result

  const socialLabel = r.socialIns.type === 'kosei'
    ? '社会保険料（厚生年金+健保）'
    : r.socialIns.type === 'kokuho'
      ? '社会保険料（国保+国民年金）'
      : '社会保険料'
  const socialNote = r.socialIns.type === 'none'
    ? '親or配偶者の扶養内'
    : r.socialIns.type === 'kosei'
      ? '健保4.96%+厚年9.15%+雇保0.95%'
      : '国保+国民年金'

  const showParentTax = ageGroup === 'student' || ageGroup === 'general' || ageGroup === 'spouse'
  const isDependent = r.parentTax.isDependent

  const householdOk = r.householdBalance >= 0

  return (
    <div className="result-panel">
      {/* 手取りメインカード */}
      <div className="hero-card">
        <div className="hero-label">手取り額（年間）</div>
        <div className="hero-value">{fmt(r.takeHome)}</div>
        <div className="hero-sub">年収 {income}万円 | 実質負担率 {income > 0 ? ((1 - r.takeHome / r.incomeYen) * 100).toFixed(1) : 0}%</div>
      </div>

      {/* KPIグリッド */}
      <div className="kpi-grid">
        <KpiCard
          label="所得税"
          value={fmt(r.incomeTax)}
          valueClass={r.incomeTax > 0 ? 'red' : 'muted'}
          note={r.incomeTax === 0 ? '非課税' : `課税所得${Math.round(r.itTaxableIncome / 10_000)}万円`}
        />
        <KpiCard
          label="住民税"
          value={fmt(r.residentTax)}
          valueClass={r.residentTax > 0 ? 'orange' : 'muted'}
          note={r.residentTax === 0 ? '非課税' : `所得割+均等割${Math.round(r.uniformLevy / 10_000)}千円`}
        />
        <KpiCard
          label={socialLabel}
          value={fmt(r.socialIns.total)}
          valueClass={r.socialIns.total > 0 ? 'purple' : 'muted'}
          note={socialNote}
        />
        {showParentTax && (
          <>
            <KpiCard
              label={ageGroup === 'spouse' ? '配偶者控除消失による増税' : '親の税負担増'}
              value={isDependent ? '影響なし' : fmt(r.parentTax.total)}
              valueClass={isDependent ? 'muted' : 'red'}
              note={
                isDependent
                  ? `${r.parentTax.dependentType}控除が適用中`
                  : `所得税${fmt(r.parentTax.incomeTaxIncrease)}+住民税${fmt(r.parentTax.residentTaxIncrease)}`
              }
            />
            <KpiCard
              label="自分の手取り増（vs 123万）"
              value={fmtSign(r.takeHomeGain)}
              valueClass={r.takeHomeGain >= 0 ? 'green' : 'red'}
              note="年収123万比"
            />
            <KpiCard
              label="世帯トータル損益"
              value={fmtSign(r.householdBalance)}
              valueClass={householdOk ? 'green' : 'red'}
              note={householdOk ? '世帯として得' : '壁を超えない方が得'}
            />
          </>
        )}
      </div>

      {/* 世帯損益バナー */}
      {showParentTax && !isDependent && (
        <div className={`balance-banner ${householdOk ? 'ok' : 'ng'}`}>
          <div className="balance-banner-icon">{householdOk ? 'OK' : 'NG'}</div>
          <div>
            <div className="balance-banner-title">
              {householdOk
                ? `世帯全体で ${fmtSign(r.householdBalance)} のプラス`
                : `世帯全体で ${fmtSign(r.householdBalance)} のマイナス`}
            </div>
            <div className="balance-banner-body">
              {householdOk
                ? `自分の手取り増（${fmtSign(r.takeHomeGain)}）が親の税負担増（${fmt(r.parentTax.total)}）を上回っています`
                : `自分の手取りは増えても、親の税負担増（${fmt(r.parentTax.total)}）を差し引くと世帯としては損です`}
            </div>
          </div>
        </div>
      )}

      {/* 社保の詳細（加入している場合） */}
      {r.socialIns.type === 'kosei' && (
        <div className="detail-box">
          <div className="detail-title">社会保険料の内訳（厚生年金加入）</div>
          <div className="detail-rows">
            <div className="detail-row">
              <span>健康保険（本人分）</span>
              <span>{fmt(r.socialIns.detail.healthIns)}</span>
            </div>
            <div className="detail-row">
              <span>厚生年金（本人分）</span>
              <span>{fmt(r.socialIns.detail.pension)}</span>
            </div>
            <div className="detail-row">
              <span>雇用保険</span>
              <span>{fmt(r.socialIns.detail.employment)}</span>
            </div>
          </div>
        </div>
      )}
      {r.socialIns.type === 'kokuho' && (
        <div className="detail-box">
          <div className="detail-title">社会保険料の内訳（社保扶養から外れた場合）</div>
          <div className="detail-rows">
            <div className="detail-row">
              <span>国民健康保険（概算）</span>
              <span>{fmt(r.socialIns.detail.kokuho)}</span>
            </div>
            <div className="detail-row">
              <span>国民年金</span>
              <span>{fmt(r.socialIns.detail.kokumin)}</span>
            </div>
          </div>
        </div>
      )}

      {/* グラフ */}
      <WallChart chartData={chartData} currentIncome={income} />

      {/* 壁一覧 */}
      <WallTable ageGroup={ageGroup} companySize={params.companySize} income={income} />
    </div>
  )
}
