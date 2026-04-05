import { createContext, useContext, useState, type ReactNode } from 'react'
import type { InsightRow, TabLevel } from '../types/meta'

export interface SelectedEntity {
  level: TabLevel
  id: string
  name: string
  row: InsightRow
}

interface SelectionContextType {
  selectedEntity: SelectedEntity | null
  selectEntity: (entity: SelectedEntity) => void
  clearSelection: () => void
}

const SelectionContext = createContext<SelectionContextType>({
  selectedEntity: null,
  selectEntity: () => {},
  clearSelection: () => {},
})

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null)

  const selectEntity = (entity: SelectedEntity) => {
    if (selectedEntity?.id === entity.id && selectedEntity?.level === entity.level) {
      setSelectedEntity(null)
    } else {
      setSelectedEntity(entity)
    }
  }

  const clearSelection = () => setSelectedEntity(null)

  return (
    <SelectionContext.Provider value={{ selectedEntity, selectEntity, clearSelection }}>
      {children}
    </SelectionContext.Provider>
  )
}

export function useSelection() {
  return useContext(SelectionContext)
}
