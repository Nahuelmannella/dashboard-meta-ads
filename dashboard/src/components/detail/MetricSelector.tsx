import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { METRIC_OPTIONS, METRIC_GROUPS } from '@/config/metrics'

interface MetricSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function MetricSelector({ value, onChange }: MetricSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecciona una metrica" />
      </SelectTrigger>
      <SelectContent>
        {METRIC_GROUPS.map((group) => (
          <SelectGroup key={group}>
            <SelectLabel>{group}</SelectLabel>
            {METRIC_OPTIONS.filter((m) => m.group === group).map((metric) => (
              <SelectItem key={metric.key} value={metric.key}>
                {metric.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
