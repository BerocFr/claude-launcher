import { Step } from '../store'

const STEPS: { id: Step; label: string; num: number }[] = [
  { id: 'prerequisites', label: 'Node.js', num: 1 },
  { id: 'claude', label: 'Claude', num: 2 },
  { id: 'claudecode', label: 'Claude Code', num: 3 },
  { id: 'mcp', label: 'MCP', num: 4 },
  { id: 'complete', label: 'Terminé', num: 5 },
]

const stepOrder: Step[] = ['welcome', 'prerequisites', 'claude', 'claudecode', 'mcp', 'complete']

interface Props {
  currentStep: Step
}

export function StepNav({ currentStep }: Props) {
  const currentIdx = stepOrder.indexOf(currentStep)

  return (
    <div className="drag-region flex items-center justify-between px-6 py-3 border-b border-edge bg-surface flex-shrink-0">
      {/* Logo area (traffic light space) */}
      <div className="flex items-center gap-2 no-drag" style={{ marginLeft: 72 }}>
        <span className="text-sm font-semibold text-tx-1 tracking-tight">Claude Launcher</span>
      </div>

      {/* Steps */}
      <div className="no-drag flex items-center gap-1">
        {STEPS.map((s, i) => {
          const stepIdx = stepOrder.indexOf(s.id)
          const isDone = stepIdx < currentIdx
          const isActive = s.id === currentStep
          const isFuture = stepIdx > currentIdx

          return (
            <div key={s.id} className="flex items-center gap-1">
              {/* Connector line */}
              {i > 0 && (
                <div
                  className={`w-8 h-px mx-1 ${
                    isDone ? 'bg-brand-orange' : 'bg-edge-strong'
                  }`}
                />
              )}

              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-brand-orange-dim border border-brand-orange-border'
                  : isDone
                  ? 'opacity-70'
                  : 'opacity-30'
              }`}>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    isActive
                      ? 'bg-brand-orange text-white'
                      : isDone
                      ? 'bg-ok text-white'
                      : 'bg-edge-strong text-tx-3'
                  }`}
                >
                  {isDone ? '✓' : s.num}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? 'text-brand-orange' : isDone ? 'text-tx-2' : 'text-tx-3'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="w-32" />
    </div>
  )
}
