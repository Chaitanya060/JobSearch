import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../app/ThemeProvider.jsx'
import { cn } from '../../utils/cn.js'

const OPTIONS = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5" role="group" aria-label="Theme">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          title={label}
          className={cn(
            'rounded-md p-1.5 transition-colors',
            theme === value ? 'bg-surface-2 text-primary' : 'text-muted hover:text-text',
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  )
}
