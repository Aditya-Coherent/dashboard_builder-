import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals)
}

export function formatCurrency(value: number, currency: string = 'USD', unit: string = 'Mn'): string {
  return `${currency} ${value.toFixed(2)} ${unit}`
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`
}

export function calculateGrowth(startValue: number, endValue: number): number {
  if (startValue === 0) return 0
  return ((endValue - startValue) / startValue) * 100
}

