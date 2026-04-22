import { truncateAddress } from '@/lib/format'

export function displayNameFor(addr: `0x${string}`): string {
  return truncateAddress(addr)
}

export function avatarToneFor(addr: `0x${string}`): string {
  const last = parseInt(addr.slice(-2), 16) || 0
  const hue = (last * 137) % 360
  return `linear-gradient(135deg, hsl(${hue} 45% 55%), hsl(${(hue + 35) % 360} 40% 40%))`
}
