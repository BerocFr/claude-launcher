import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { api } from '../api'

// ── Interactive PTY Terminal ──────────────────────────────────────────────────
export function InteractiveTerminal({ id = 'main' }: { id?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const term = new XTerm({
      theme: {
        background: '#080810',
        foreground: '#D4D4E8',
        cursor: '#F06A35',
        cursorAccent: '#080810',
        selectionBackground: '#F06A3530',
        black: '#080810', brightBlack: '#45455A',
        red: '#EF4444', brightRed: '#F87171',
        green: '#10B981', brightGreen: '#34D399',
        yellow: '#F59E0B', brightYellow: '#FCD34D',
        blue: '#4A9EF5', brightBlue: '#93C5FD',
        magenta: '#9B72F6', brightMagenta: '#C4B5FD',
        cyan: '#06B6D4', brightCyan: '#67E8F9',
        white: '#D4D4E8', brightWhite: '#FFFFFF',
      },
      fontFamily: '"SF Mono", Monaco, Menlo, Consolas, "Courier New", monospace',
      fontSize: 12.5,
      lineHeight: 1.55,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 5000,
      allowProposedApi: true,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)

    const fit = () => {
      try {
        fitAddon.fit()
        api.resizeTerminal(id, term.cols, term.rows)
      } catch {}
    }
    fit()

    api.createTerminal(id)

    const removeData = api.onTerminalData(id, (data) => term.write(data))
    term.onData((data) => api.writeTerminal(id, data))

    const ro = new ResizeObserver(fit)
    ro.observe(containerRef.current)

    return () => {
      removeData()
      ro.disconnect()
      term.dispose()
    }
  }, [id])

  return <div ref={containerRef} className="h-full w-full" />
}

// ── Guided output panel ───────────────────────────────────────────────────────
// Shows streamed output from guided installs (no PTY, read-only display)
export function TerminalPanel({ lines }: { lines: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<XTerm | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initialized.current) return
    initialized.current = true

    const term = new XTerm({
      theme: {
        background: '#080810',
        foreground: '#C8C8DC',
        cursor: '#F06A35',
        cursorAccent: '#080810',
        selectionBackground: '#F06A3530',
        black: '#080810', brightBlack: '#45455A',
        red: '#EF4444', brightRed: '#F87171',
        green: '#10B981', brightGreen: '#34D399',
        yellow: '#F59E0B', brightYellow: '#FCD34D',
        blue: '#4A9EF5', brightBlue: '#93C5FD',
        magenta: '#9B72F6', brightMagenta: '#C4B5FD',
        cyan: '#06B6D4', brightCyan: '#67E8F9',
        white: '#C8C8DC', brightWhite: '#FFFFFF',
      },
      fontFamily: '"SF Mono", Monaco, Menlo, Consolas, "Courier New", monospace',
      fontSize: 12.5,
      lineHeight: 1.55,
      cursorBlink: false,
      disableStdin: true,
      scrollback: 10000,
      allowProposedApi: true,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)

    setTimeout(() => {
      try { fitAddon.fit() } catch {}
    }, 50)

    // Header
    term.writeln('\x1b[38;5;240m╔══════════════════════════════════════════╗\x1b[0m')
    term.writeln('\x1b[38;5;240m║\x1b[0m  \x1b[38;5;208mClaude Launcher\x1b[0m \x1b[38;5;240m— Terminal de sortie   ║\x1b[0m')
    term.writeln('\x1b[38;5;240m╚══════════════════════════════════════════╝\x1b[0m')
    term.writeln('')

    const ro = new ResizeObserver(() => {
      try { fitAddon.fit() } catch {}
    })
    ro.observe(containerRef.current!)
    termRef.current = term

    return () => {
      ro.disconnect()
      term.dispose()
      initialized.current = false
    }
  }, [])

  // Write new lines as they arrive
  const lastLen = useRef(0)
  useEffect(() => {
    const term = termRef.current
    if (!term) return
    for (let i = lastLen.current; i < lines.length; i++) {
      term.write(lines[i])
    }
    lastLen.current = lines.length
  }, [lines])

  return (
    <div className="flex flex-col h-full">
      {/* Terminal header bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-edge flex-shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-3 text-xs font-mono text-tx-3">Terminal</span>
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  )
}
