import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AdAccount } from '../types/meta'

interface AccountContextType {
  accounts: AdAccount[]
  selectedAccount: AdAccount | null
  setSelectedAccount: (account: AdAccount) => void
  loading: boolean
  error: string | null
}

const AccountContext = createContext<AccountContextType>({
  accounts: [],
  selectedAccount: null,
  setSelectedAccount: () => {},
  loading: true,
  error: null,
})

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<AdAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        const activeAccounts = data.accounts.filter(
          (a: AdAccount) => a.account_status === 1
        )
        setAccounts(activeAccounts)
        if (activeAccounts.length > 0) {
          setSelectedAccount(activeAccounts[0])
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AccountContext.Provider
      value={{ accounts, selectedAccount, setSelectedAccount, loading, error }}
    >
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  return useContext(AccountContext)
}
