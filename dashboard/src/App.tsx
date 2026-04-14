import { useState } from 'react'
import { SensitiveDataProvider } from './context/SensitiveDataContext'
import { AccountProvider, useAccount } from './context/AccountContext'
import { DateRangeProvider } from './context/DateRangeContext'
import { SelectionProvider } from './context/SelectionContext'
import { IncludedProvider } from './context/IncludedContext'
import { Header } from './components/layout/Header'
import { TabNav } from './components/layout/TabNav'
import { MetricsBar } from './components/tabs/MetricsBar'
import { CampaignsTab } from './components/tabs/CampaignsTab'
import { AdSetsTab } from './components/tabs/AdSetsTab'
import { AdsTab } from './components/tabs/AdsTab'
import { DetailPanel } from './components/detail/DetailPanel'
import { Spinner } from './components/common/Spinner'
import type { TabLevel } from './types/meta'

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<TabLevel>('campaigns')
  const { loading, error, selectedAccount } = useAccount()

  if (loading) return <Spinner />
  if (error) return <div className="error-banner" style={{ margin: 24 }}>Error conectando con Meta API: {error}</div>
  if (!selectedAccount) {
    return (
      <div className="empty-state" style={{ margin: 24 }}>
        <div className="empty-state-icon">📭</div>
        <div className="empty-state-text">No se encontraron cuentas publicitarias activas</div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-content">
        <MetricsBar />
        <div className="tab-content-wrapper" key={activeTab}>
          {activeTab === 'campaigns' && <CampaignsTab />}
          {activeTab === 'adsets' && <AdSetsTab />}
          {activeTab === 'ads' && <AdsTab />}
        </div>
      </main>
      <DetailPanel />
    </>
  )
}

export default function App() {
  return (
    <SensitiveDataProvider>
      <AccountProvider>
        <DateRangeProvider>
          <SelectionProvider>
            <IncludedProvider>
              <DashboardContent />
            </IncludedProvider>
          </SelectionProvider>
        </DateRangeProvider>
      </AccountProvider>
    </SensitiveDataProvider>
  )
}
