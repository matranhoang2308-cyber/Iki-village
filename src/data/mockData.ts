export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  apartments: Apartment[]
}

export interface Apartment {
  id: string
  code: string
  tower: string
  floor: number
  area: number
  type: string
  contractDate: string
}

export interface TimeSlot {
  startTime: string   // "HH:mm"
  endTime: string     // "HH:mm"
  available: number   // 0-3 (slots still open)
  capacity: number    // always 3
}

export interface BookingDay {
  date: string        // "YYYY-MM-DD"
  slots: TimeSlot[]
}

// ─── Customers ───────────────────────────────────────────────────────────────

export const CUSTOMERS: Customer[] = [
  {
    id: "C001",
    name: "Nguyễn Thị Minh Châu",
    phone: "0901234567",
    email: "minhchau.nguyen@gmail.com",
    apartments: [
      { id: "A001", code: "S1-12A-01", tower: "S1", floor: 12, area: 72.5,  type: "2PN", contractDate: "2024-03-15" },
      { id: "A002", code: "S1-12A-02", tower: "S1", floor: 12, area: 88.0,  type: "3PN", contractDate: "2024-03-15" },
    ],
  },
  {
    id: "C002",
    name: "Trần Văn Khoa",
    phone: "0912345678",
    email: "vankhoa.tran@email.com",
    apartments: [
      { id: "A003", code: "S2-08B-05", tower: "S2", floor: 8, area: 65.2, type: "2PN", contractDate: "2024-05-20" },
    ],
  },
  {
    id: "C003",
    name: "Lê Thanh Hương",
    phone: "0987654321",
    email: "thanh.huong@business.vn",
    apartments: [
      { id: "A004", code: "S3-20C-10", tower: "S3", floor: 20, area: 112.0, type: "4PN", contractDate: "2024-01-10" },
      { id: "A005", code: "S3-20C-11", tower: "S3", floor: 20, area: 112.0, type: "4PN", contractDate: "2024-01-10" },
      { id: "A006", code: "S3-21C-10", tower: "S3", floor: 21, area: 112.0, type: "4PN", contractDate: "2024-01-10" },
    ],
  },
  {
    id: "C004",
    name: "Phạm Đức Anh",
    phone: "0933445566",
    email: "ducanh.pham@corp.com",
    apartments: [
      { id: "A007", code: "S1-05A-03", tower: "S1", floor: 5, area: 55.8, type: "1PN", contractDate: "2024-07-01" },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Add `minutes` to "HH:mm" and return "HH:mm" */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

/** All 45-min block start times from 08:00 up to but not exceeding 17:00 end */
function buildSlotTimes(): string[] {
  const times: string[] = []
  let h = 8, m = 0
  while (true) {
    const endTotal = h * 60 + m + 45
    if (endTotal > 17 * 60) break
    times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
    m += 45
    if (m >= 60) { h += Math.floor(m / 60); m = m % 60 }
  }
  return times
}

export const SLOT_TIMES = buildSlotTimes()
// → ["08:00","08:45","09:30","10:15","11:00","11:45","12:30","13:15","14:00","14:45","15:30","16:15"]
// A continuous 45-minute grid: every slot is time-adjacent to the next.

// ─── Mock occupancy ───────────────────────────────────────────────────────────

/**
 * Realistic occupancy for day-index 0 (tomorrow), cycling for subsequent days.
 * 3 = full (no slots left), 0 = empty, 1/2 = partially occupied.
 *
 * Key pattern for demo (N=3 customer):
 *   - 08:00(1), 08:45(1), 09:30(3←full!) → chain 08:00 breaks at 09:30
 *   - 10:15(1), 11:00(1), 11:45(1)       → valid chain starting 10:15
 *   - 13:30(2), 14:15(0), 15:00(2)       → valid chain starting 13:30
 */
const DAY_PATTERNS: Record<string, number>[] = [
  // Day 0 — many slots, one full slot breaks an early chain.
  // For N=3: 08:00 is blocked (09:30 is full), 10:15 is the first valid start.
  { "08:00": 1, "08:45": 1, "09:30": 3, "10:15": 1, "11:00": 1, "11:45": 1, "12:30": 2, "13:15": 0, "14:00": 2, "14:45": 1, "15:30": 2, "16:15": 2 },
  // Day 1 — morning full, only afternoon available
  { "08:00": 3, "08:45": 3, "09:30": 3, "10:15": 2, "11:00": 1, "11:45": 0, "12:30": 1, "13:15": 1, "14:00": 1, "14:45": 2, "15:30": 3, "16:15": 1 },
  // Day 2 — spread availability
  { "08:00": 0, "08:45": 1, "09:30": 1, "10:15": 1, "11:00": 3, "11:45": 2, "12:30": 0, "13:15": 0, "14:00": 1, "14:45": 1, "15:30": 1, "16:15": 3 },
  // Day 3 — almost all open
  { "08:00": 0, "08:45": 0, "09:30": 0, "10:15": 0, "11:00": 1, "11:45": 0, "12:30": 0, "13:15": 0, "14:00": 0, "14:45": 0, "15:30": 0, "16:15": 1 },
  // Day 4 — heavily booked; no valid chain at all for N=3
  { "08:00": 2, "08:45": 3, "09:30": 2, "10:15": 3, "11:00": 2, "11:45": 3, "12:30": 2, "13:15": 3, "14:00": 2, "14:45": 3, "15:30": 2, "16:15": 3 },
]

function buildSlots(pattern: Record<string, number>): TimeSlot[] {
  return SLOT_TIMES.map((start) => {
    const occupied = pattern[start] ?? 0
    return {
      startTime: start,
      endTime: addMinutes(start, 45),
      available: Math.max(0, 3 - occupied),
      capacity: 3,
    }
  })
}

// ─── Calendar generation ──────────────────────────────────────────────────────

export function generateCalendarDays(): BookingDay[] {
  const days: BookingDay[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let patternIdx = 0

  for (let i = 1; i <= 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    if (d.getDay() === 0) continue   // skip Sundays

    days.push({
      date: d.toISOString().split("T")[0],
      slots: buildSlots(DAY_PATTERNS[patternIdx % DAY_PATTERNS.length]),
    })
    patternIdx++
  }

  return days
}

/** Generate all future working days (non-Sunday, > today) for a given month. */
export function generateMonthDays(year: number, month: number): BookingDay[] {
  const days: BookingDay[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let patternIdx = 0

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    if (date <= today) continue
    if (date.getDay() === 0) continue

    days.push({
      date: date.toISOString().split("T")[0],
      slots: buildSlots(DAY_PATTERNS[patternIdx % DAY_PATTERNS.length]),
    })
    patternIdx++
  }

  return days
}

// ─── Booking logic ────────────────────────────────────────────────────────────

export const SLOT_MINUTES = 45

/** "HH:mm" → minutes since midnight */
function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

/**
 * True when slots[i..i+n-1] form one unbroken 45-minute run in TIME:
 * each slot must start exactly where the previous one ended.
 * Index adjacency is not enough — a lunch break or any gap in the grid
 * means those slots cannot be chained together.
 */
export function isContiguousChain(slots: TimeSlot[], startIdx: number, n: number): boolean {
  if (startIdx < 0 || startIdx + n > slots.length) return false
  for (let i = startIdx; i < startIdx + n - 1; i++) {
    if (toMinutes(slots[i + 1].startTime) !== toMinutes(slots[i].startTime) + SLOT_MINUTES) return false
  }
  return true
}

/**
 * Returns every valid start index: a start T is valid only when all N blocks
 * T, T+45, … T+45(N-1) are time-adjacent AND each still has available > 0.
 *
 * A start is INVALID if ANY block in its chain is full (available === 0) —
 * a block's own availability never decides this on its own. The system never
 * skips over a full block to stitch together a non-adjacent chain.
 */
export function findValidStartIndices(slots: TimeSlot[], n: number): number[] {
  if (n <= 0) return []
  const valid: number[] = []
  for (let i = 0; i <= slots.length - n; i++) {
    if (!isContiguousChain(slots, i, n)) continue
    if (slots.slice(i, i + n).every((s) => s.available > 0)) valid.push(i)
  }
  return valid
}

/** Returns the chain of N slots starting at index `startIdx`. */
export function getChain(slots: TimeSlot[], startIdx: number, n: number): TimeSlot[] {
  return slots.slice(startIdx, startIdx + n)
}

/**
 * For a given start index that is NOT valid, return which slot in the chain
 * is blocking it (first slot with available === 0).
 */
export function findBlockingSlot(slots: TimeSlot[], startIdx: number, n: number): number {
  for (let i = startIdx; i < Math.min(startIdx + n, slots.length); i++) {
    if (slots[i].available === 0) return i
  }
  return -1
}

export function calculateEndTime(startTime: string, n: number): string {
  return addMinutes(startTime, n * SLOT_MINUTES)
}

/** @deprecated use findValidStartIndices */
export function findValidStartTimes(slots: TimeSlot[], n: number): string[] {
  return findValidStartIndices(slots, n).map((i) => slots[i].startTime)
}
