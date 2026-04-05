import type { TabLevel } from '../../types/meta'

interface TabNavProps {
  activeTab: TabLevel
  onTabChange: (tab: TabLevel) => void
}

const tabs: { key: TabLevel; label: string }[] = [
  { key: 'campaigns', label: 'Campanas' },
  { key: 'adsets', label: 'Conjuntos de anuncios' },
  { key: 'ads', label: 'Anuncios' },
]

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <nav className="tab-nav">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
