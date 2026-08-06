import { useState } from "react"
import { ArrowLeft, ArrowRight, TriangleAlert, CheckCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import CountdownTimer from "@/components/CountdownTimer"
import { BookingState } from "@/App"

const VI_DAYS   = ["Chủ nhật","Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy"]
const VI_MONTHS = ["tháng 1","tháng 2","tháng 3","tháng 4","tháng 5","tháng 6","tháng 7","tháng 8","tháng 9","tháng 10","tháng 11","tháng 12"]

const CONFIRM_HOLD = 300

interface Props {
  booking: BookingState
  onConfirm: () => void
  onBack: () => void
}

export default function BookingConfirmation({ booking, onConfirm, onBack }: Props) {
  const [confirmExpired, setConfirmExpired] = useState(false)

  const { customer, selectedDate, selectedStartTime, selectedEndTime, chain, submitStatus, conflictMessage } = booking
  if (!customer || !selectedDate || !selectedStartTime || !selectedEndTime) return null

  const n = customer.apartments.length
  const d = new Date(selectedDate + "T00:00:00")
  const dateLabel = `${VI_DAYS[d.getDay()]}, ngày ${d.getDate()} ${VI_MONTHS[d.getMonth()]} ${d.getFullYear()}`

  const isChecking = submitStatus === "checking"
  const isConflict = submitStatus === "conflict"
  const isDisabled = isChecking || isConflict || confirmExpired

  const handleConfirmExpired = () => {
    setConfirmExpired(true)
  }

  return (
    <div className="max-w-6xl mx-auto py-6 pb-32 lg:pb-6">
      <div className="flex items-start justify-between mb-6 sm:mb-8 gap-4 flex-wrap">
        <div className="space-y-1">
          <p className="font-sans text-xs tracking-[0.18em] uppercase text-[#316817] font-semibold leading-none">Bước 4 — Xác nhận</p>
          <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#2C2820] leading-snug">Xác nhận đặt lịch</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl hidden lg:inline-flex"><ArrowLeft size={14} />Quay lại</Button>
      </div>

      {/* Hold timer: bare digits above the booking details at every width.
          Single instance, so one interval and one onExpire. */}
      {!confirmExpired && (
        <div className="mb-6">
          <p className="font-sans text-xs text-center tracking-[0.18em] uppercase text-[#6B5F51] font-semibold mb-2.5">
            Thời gian giữ chỗ còn lại
          </p>
          <CountdownTimer totalSeconds={CONFIRM_HOLD} onExpire={handleConfirmExpired} bare />
        </div>
      )}

      {/* Hold expired — replaces the timer in the same slot. */}
      {confirmExpired && (
        <Card className="p-4 mb-6 bg-[#FDF5F5] border-[#C4714A] rounded-2xl text-center">
          <p className="font-sans text-xs font-semibold text-[#C4714A] mb-1">Hết thời gian giữ chỗ!</p>
          <p className="font-sans text-[13px] text-[#6B5F51] mb-3">Vui lòng quay lại chọn lại khung giờ khác.</p>
          <Button variant="outline" size="sm" onClick={onBack} className="rounded-xl">Chọn lại giờ</Button>
        </Card>
      )}

      {/* One column at every width: timer above, details, then the CTA last.
          The old lg two-column split existed only to park the timer and the
          confirm button beside the details. */}
      <div className="space-y-4">
        <div>
          <Card className="rounded-2xl border-[#E0D8CC] overflow-hidden shadow-sm">
            <CardContent className="p-4 sm:p-6 space-y-5">
              <div className="p-4 rounded-xl bg-[#F0F7EC] border border-[#AACF97] flex items-start sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="font-sans text-xs text-[#6B5F51] uppercase tracking-wider">Khách hàng</p>
                  <p className="font-serif text-lg sm:text-xl font-normal text-[#2C2820] leading-snug py-0.5 truncate">{customer.name}</p>
                  {/* Mobile: phone and email stack, since the dot-joined line overflows */}
                  <div className="sm:hidden">
                    <p className="font-sans text-xs text-[#7A6E60]">{customer.phone}</p>
                    <p className="font-sans text-xs text-[#7A6E60] truncate">{customer.email}</p>
                  </div>
                  <p className="font-sans text-xs text-[#7A6E60] hidden sm:block">{customer.phone} · {customer.email}</p>
                </div>
                <Badge variant="outline" className="bg-white border-[#316817] text-[#316817] flex-shrink-0 whitespace-nowrap">{n} căn hộ</Badge>
              </div>

              <div className="space-y-1">
                <p className="font-sans text-xs font-semibold text-[#7A6E60] uppercase tracking-wider">Thời gian đặt lịch</p>
                {/* The arrow is an SVG, not "→": Pacific Standard has no
                    U+2192 glyph, so the character fell back to Times New Roman
                    and sat off the baseline of the numerals beside it. */}
                <p className="font-serif text-xl sm:text-2xl font-bold text-[#316817] py-0.5 flex items-center gap-2">
                  <span>{selectedStartTime}</span>
                  <ArrowRight className="w-5 h-5 shrink-0" aria-label="đến" />
                  <span>{selectedEndTime}</span>
                </p>
                <p className="font-sans text-sm text-[#7A6E60]">{dateLabel} ({n * 45} phút)</p>
              </div>

              <Separator />

              <div>
                <p className="font-sans text-xs font-semibold text-[#7A6E60] uppercase tracking-wider mb-2">Danh sách căn hộ</p>
                <div className="flex flex-wrap gap-2">
                  {customer.apartments.map((apt) => (
                    <Badge key={apt.id} variant="default" className="text-xs">{apt.code}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conflict feedback — the state was being set but never shown */}
        {isConflict && conflictMessage && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-[#C4714A] bg-[#FDF5F5]">
            <TriangleAlert size={16} className="text-[#C4714A] mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-sans text-xs font-semibold text-[#C4714A] mb-0.5">Khung giờ vừa bị đặt mất</p>
              <p className="font-sans text-[13px] text-[#6B5F51] leading-relaxed">{conflictMessage}</p>
            </div>
          </div>
        )}

        {/* Desktop actions, last in the flow — on mobile the sticky bar below
            carries the same two controls. */}
        <div className="hidden lg:flex gap-3 pt-2">
          <Button variant="outline" onClick={onBack} className="rounded-xl h-12 px-6 flex items-center justify-center gap-2">
            <ArrowLeft size={16} className="shrink-0" />
            <span>Quay lại chỉnh sửa</span>
          </Button>
          <Button
            variant="default"
            disabled={isDisabled}
            onClick={onConfirm}
            className="flex-1 h-12 rounded-xl bg-[#316817] hover:bg-[#1C3E0C] text-white font-semibold uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
          >
            {isChecking ? (
              <>
                <Loader2 size={16} className="shrink-0 animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : confirmExpired ? (
              <span>Hết thời gian giữ chỗ</span>
            ) : isConflict ? (
              <span>Vui lòng chọn lại giờ</span>
            ) : (
              <>
                <CheckCircle2 size={18} className="shrink-0" />
                <span>Xác nhận đặt lịch</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile: sticky confirm bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#E0D8CC] bg-[#F5F0E8]/95 backdrop-blur-md px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex gap-2.5">
        <Button variant="outline" onClick={onBack} aria-label="Quay lại chỉnh sửa" className="rounded-xl h-12 w-12 flex-shrink-0 p-0">
          <ArrowLeft size={18} />
        </Button>
        <Button
          variant="default"
          disabled={isDisabled}
          onClick={onConfirm}
          className="flex-1 rounded-xl h-12 bg-[#316817] hover:bg-[#1C3E0C] text-white font-semibold uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
        >
          {isChecking ? (
            <>
              <Loader2 size={16} className="shrink-0 animate-spin" />
              <span>Đang xác thực...</span>
            </>
          ) : confirmExpired ? (
            <span>Hết thời gian giữ chỗ</span>
          ) : isConflict ? (
            <span>Vui lòng chọn lại giờ</span>
          ) : (
            <>
              <CheckCircle2 size={18} className="shrink-0" />
              <span>Xác nhận đặt lịch</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
