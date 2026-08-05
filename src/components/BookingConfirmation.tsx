import { useState } from "react"
import { ArrowLeft, TriangleAlert, CheckCircle, XCircle, Loader2 } from "lucide-react"
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
        <div className="space-y-2 sm:space-y-3">
          <p className="font-sans text-xs tracking-[0.18em] uppercase text-[#316817] font-semibold">Bước 4 — Xác nhận</p>
          <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#2C2820] leading-snug py-1">Xác nhận đặt lịch</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl hidden lg:inline-flex"><ArrowLeft size={14} />Quay lại</Button>
      </div>

      {/* Mobile order: details first, then the hold timer — you should see WHAT
          you are confirming before the confirm control. Desktop keeps its
          original left/right split via lg:order-*. */}
      <div className="grid lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Left column: Countdown + Action */}
        <div className="lg:col-span-5 space-y-4 order-2 lg:order-1">
          {!confirmExpired ? (
            <Card className="p-4 bg-[#FAF7F2] border-[#E0D8CC] rounded-2xl">
              <p className="font-sans text-xs text-[#7A6E60] mb-2 font-medium">Thời gian giữ slot còn lại:</p>
              <CountdownTimer totalSeconds={CONFIRM_HOLD} onExpire={handleConfirmExpired} />
            </Card>
          ) : (
            <Card className="p-4 bg-[#FDF5F5] border-[#C4714A] rounded-2xl text-center">
              <p className="font-sans text-xs font-semibold text-[#C4714A] mb-1">Hết thời gian giữ chỗ!</p>
              <p className="font-sans text-[11px] text-[#7A6E60] mb-3">Vui lòng quay lại chọn lại khung giờ khác.</p>
              <Button variant="outline" size="sm" onClick={onBack} className="w-full rounded-xl">Chọn lại giờ</Button>
            </Card>
          )}

          {/* Conflict feedback — the state was being set but never shown */}
          {isConflict && conflictMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-[#C4714A] bg-[#FDF5F5]">
              <TriangleAlert size={16} className="text-[#C4714A] mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-sans text-xs font-semibold text-[#C4714A] mb-0.5">Khung giờ vừa bị đặt mất</p>
                <p className="font-sans text-[11px] text-[#7A6E60] leading-relaxed">{conflictMessage}</p>
              </div>
            </div>
          )}

          {/* Desktop actions — on mobile these live in the sticky bar below */}
          <div className="hidden lg:block space-y-4">
            <Button
              variant="default"
              disabled={isDisabled}
              onClick={onConfirm}
              className="w-full h-12 rounded-xl bg-[#316817] hover:bg-[#275413] text-white font-semibold uppercase tracking-wider shadow-md"
            >
              {isChecking ? "Đang xác thực..." : "Xác nhận đặt lịch"}
            </Button>

            <Button variant="outline" onClick={onBack} className="w-full rounded-xl">Quay lại chỉnh sửa</Button>
          </div>
        </div>


        {/* Right column: Booking Details */}
        <div className="lg:col-span-7 order-1 lg:order-2">
          <Card className="rounded-2xl border-[#E0D8CC] overflow-hidden shadow-sm">
            <CardContent className="p-4 sm:p-6 space-y-5">
              <div className="p-4 rounded-xl bg-[#F0F7EC] border border-[#AACF97] flex items-start sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="font-sans text-[10px] text-[#9A8E80] uppercase tracking-wider">Khách hàng</p>
                  <p className="font-serif text-lg sm:text-xl font-normal text-[#2C2820] leading-snug py-0.5 truncate">{customer.name}</p>
                  <p className="font-sans text-xs text-[#7A6E60] sm:hidden">{customer.phone}</p>
                  <p className="font-sans text-xs text-[#7A6E60] hidden sm:block">{customer.phone} · {customer.email}</p>
                </div>
                <Badge variant="outline" className="bg-white border-[#316817] text-[#316817] flex-shrink-0 whitespace-nowrap">{n} căn hộ</Badge>
              </div>

              <div className="space-y-1">
                <p className="font-sans text-xs font-semibold text-[#7A6E60] uppercase tracking-wider">Thời gian bàn giao</p>
                <p className="font-serif text-xl sm:text-2xl font-bold text-[#316817] py-0.5">{selectedStartTime} → {selectedEndTime}</p>
                <p className="font-sans text-xs text-[#7A6E60]">{dateLabel} ({n * 45} phút)</p>
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
          className="flex-1 rounded-xl h-12 bg-[#316817] hover:bg-[#275413] text-white font-semibold uppercase tracking-wider shadow-md"
        >
          {isChecking ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Đang xác thực...
            </>
          ) : confirmExpired ? "Hết thời gian giữ chỗ"
            : isConflict ? "Vui lòng chọn lại giờ"
            : "Xác nhận đặt lịch"}
        </Button>
      </div>
    </div>
  )
}
