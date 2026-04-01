const WALLS = [
  {
    income: 100,
    label: '100万の壁',
    color: '#f59e0b',
    what: '住民税（所得割）が発生',
    detail: '給与所得が45万円超で住民税の所得割（10%）が課される。均等割（5,000円/年）も加算。',
    applies: () => true,
  },
  {
    income: 106,
    label: '106万の壁',
    color: '#8b5cf6',
    what: '厚生年金・健康保険に強制加入',
    detail: '従業員51人以上の企業に勤める場合、年収106万以上で社会保険に加入。保険料は年収の約15%。ただし将来の年金が増えるメリットも。',
    applies: (ageGroup, companySize) => ageGroup !== 'student' && companySize === 'large',
  },
  {
    income: 123,
    label: '123万の壁（旧103万）',
    color: '#e94560',
    what: '所得税が発生・親/配偶者の扶養控除が消失',
    detail: '2026年から103万→123万に改正。この壁を超えると所得税が発生し、親の扶養控除（学生:63万、一般:38万）または配偶者控除（38万）が消失する。',
    applies: () => true,
  },
  {
    income: 130,
    label: '130万の壁',
    color: '#f97316',
    what: '親・配偶者の社会保険の扶養から外れる',
    detail: '年収130万以上（月収108,334円超）で健康保険の被扶養者から外れ、自分で国民健康保険+国民年金（年約33万円）を支払う必要が生じる。',
    applies: (ageGroup) => ageGroup !== 'student',
  },
  {
    income: 150,
    label: '150万の壁（学生特例）',
    color: '#06b6d4',
    what: '学生(19-22歳): 社保扶養から外れる',
    detail: '2025年10月から、19〜22歳の大学生等は150万円未満まで親の社会保険の扶養に残れる特例が適用された。150万を超えると通常通り扶養から外れる。',
    applies: (ageGroup) => ageGroup === 'student',
  },
  {
    income: 160,
    label: '160万の壁',
    color: '#14b8a6',
    what: '配偶者特別控除が段階的に減少開始',
    detail: '配偶者の年収が150万を超えると配偶者特別控除が段階的に減少し始める。160万超からより急速に減少。200万超でゼロになる。',
    applies: (ageGroup) => ageGroup === 'spouse',
  },
  {
    income: 198,
    label: '198万の壁',
    color: '#475569',
    what: '配偶者特別控除がゼロに',
    detail: '配偶者の年収が約201.6万円を超えると配偶者特別控除が完全にゼロになる。扶養者（夫など）は控除なしの状態になる。',
    applies: (ageGroup) => ageGroup === 'spouse',
  },
]

export default function WallTable({ ageGroup, companySize, income }) {
  const walls = WALLS.filter(w => w.applies(ageGroup, companySize))

  return (
    <div className="table-section">
      <div className="section-header" style={{ padding: '20px 20px 0' }}>
        <span className="section-title">年収の壁 一覧</span>
      </div>
      <div className="table-scroll" style={{ padding: '12px 0' }}>
        <table className="wall-table">
          <thead>
            <tr>
              <th>壁</th>
              <th>何が起きる？</th>
              <th>詳細</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            {walls.map(w => {
              const passed = income > w.income
              return (
                <tr key={w.income} className={passed ? 'row-passed' : 'row-not-passed'}>
                  <td>
                    <span
                      className="wall-badge"
                      style={{ borderColor: w.color, color: w.color }}
                    >
                      {w.label}
                    </span>
                  </td>
                  <td className="wall-what">{w.what}</td>
                  <td className="wall-detail">{w.detail}</td>
                  <td>
                    <span className={`status-chip ${passed ? 'passed' : 'safe'}`}>
                      {passed ? '超えている' : 'セーフ'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
