import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Lightweight native-select wrapper styled to match the SpecForge design system.
 * Mimics the shadcn Select API surface used in this project (no radix-ui required).
 */

const SelectContext = React.createContext({})

function Select({ value, onValueChange, defaultValue, children }) {
  const [internal, setInternal] = React.useState(defaultValue ?? '')
  const controlled = value !== undefined
  const current = controlled ? value : internal

  function handleChange(e) {
    if (!controlled) setInternal(e.target.value)
    onValueChange?.(e.target.value)
  }

  return (
    <SelectContext.Provider value={{ current, handleChange }}>
      {children}
    </SelectContext.Provider>
  )
}

function SelectTrigger({ className, children, ...props }) {
  // Passes through — the actual <select> lives inside SelectContent
  return <div className={cn('relative w-full', className)} {...props}>{children}</div>
}

function SelectValue({ placeholder }) {
  // Visual placeholder shown inside SelectTrigger when nothing selected
  // (the native select handles its own display; this is a stub for API compat)
  return null
}

function SelectContent({ className, children }) {
  const { current, handleChange } = React.useContext(SelectContext)

  // Collect <SelectItem> children to build <option> elements
  const options = React.Children.toArray(children)
    .filter((c) => c?.props?.value !== undefined)
    .map((c) => ({ value: c.props.value, label: c.props.children }))

  return (
    <select
      value={current}
      onChange={handleChange}
      className={cn(
        'h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 py-2 pr-8 text-sm text-foreground',
        'focus:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'bg-[var(--ink2)] cursor-pointer',
        className
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: '#181a21' }}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function SelectItem({ value, children }) {
  // Rendered as <option> by SelectContent — no DOM output of its own
  return null
}

function SelectGroup({ children }) {
  return <>{children}</>
}

function SelectLabel({ children }) {
  return null
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
}
