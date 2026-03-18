'use client'
import { Winner } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  label: string
  winner: Winner
  onClick: (winner: Winner) => void
  disabled: boolean
  selected?: boolean
}

export default function PickButton({ label, winner, onClick, disabled, selected }: Props) {
  return (
    <button
      onClick={() => onClick(winner)}
      disabled={disabled}
      className={clsx(
        'py-2 border rounded-xl text-sm font-medium transition disabled:opacity-50',
        selected
          ? 'bg-sky-500/40 border-sky-500/60 text-sky-200'
          : 'bg-sky-500/20 hover:bg-sky-500/40 border-sky-500/30 text-sky-300'
      )}
    >
      {label}
    </button>
  )
}
