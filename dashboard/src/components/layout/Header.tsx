import { useAccount } from '../../context/AccountContext'
import { useSensitiveData } from '../../context/SensitiveDataContext'
import { useDateRange, type CompareMode } from '../../context/DateRangeContext'
import { DateRangePicker } from '../common/DateRangePicker'

export function Header() {
  const { accounts, selectedAccount, setSelectedAccount, loading } = useAccount()
  const { isHidden, toggle } = useSensitiveData()
  const { compareMode, setCompareMode } = useDateRange()

  return (
    <header className="header">
      <div className="header-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18" />
          <path d="M7 16l4-8 4 4 4-6" />
        </svg>
        Meta Ads Dashboard
      </div>

      <div className="header-controls">
        <div className="select-wrapper">
          <select
            className="select"
            value={selectedAccount?.id || ''}
            onChange={(e) => {
              const account = accounts.find((a) => a.id === e.target.value)
              if (account) setSelectedAccount(account)
            }}
            disabled={loading}
          >
            {loading && <option>Cargando cuentas...</option>}
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.currency})
              </option>
            ))}
          </select>
        </div>

        <DateRangePicker />

        <div className="select-wrapper">
          <select
            className="select"
            style={{ minWidth: 150 }}
            value={compareMode}
            onChange={(e) => setCompareMode(e.target.value as CompareMode)}
          >
            <option value="previous">vs Periodo anterior</option>
            <option value="year">vs Ano anterior</option>
            <option value="none">Sin comparativa</option>
          </select>
        </div>

        <button
          className={`toggle-btn ${isHidden ? 'active' : ''}`}
          onClick={toggle}
          title={isHidden ? 'Mostrar datos sensibles' : 'Ocultar datos sensibles'}
        >
          {isHidden ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
          {isHidden ? 'Ocultos' : 'Ocultar'}
        </button>
      </div>
    </header>
  )
}
