import { Building2, Clock, ArrowLeft, ArrowRight, CalendarCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Customer } from "@/data/mockData"

const INTERIOR_IMGS = [
  "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=400&h=300&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1757924461488-ef9ad0670978?w=400&h=300&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1611094016919-36b65678f3d6?w=400&h=300&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1758448755778-90ebf4d0f1e7?w=400&h=300&fit=crop&auto=format",
]

interface Props { customer: Customer; onProceed: () => void; onBack: () => void }

export default function ApartmentList({ customer, onProceed, onBack }: Props) {
  const n = customer.apartments.length

  return (
    <div className="max-w-4xl mx-auto py-6 pb-28 sm:pb-6">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-[#316817] mb-1">Bước 2 — Căn hộ</p>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#2C2820]">Danh sách căn hộ</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="hidden sm:inline-flex"><ArrowLeft size={14} />Quay lại</Button>
      </div>

      {/* Customer banner — primary green */}
      <Card className="mb-6 overflow-hidden border-0 shadow-[0_4px_24px_rgba(49,104,23,0.15)] rounded-2xl">
        <div className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4" style={{ background: "linear-gradient(135deg,#1D400E 0%,#275413 100%)" }}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#B8965A] to-[#CDA85A] flex items-center justify-center flex-shrink-0 text-[#FAF7F2] font-serif text-lg sm:text-xl font-semibold shadow-md">
            {customer.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0 py-1 space-y-1">
            <p className="font-serif text-lg sm:text-2xl text-white font-normal truncate leading-snug">{customer.name}</p>
            {/* Mobile: phone only — compact spacing for phone display */}
            <p className="font-sans text-sm text-white/80 pt-0 sm:hidden">{customer.phone}</p>
            <p className="font-sans text-sm text-white/80 pt-1.5 hidden sm:block">{customer.phone} · {customer.email}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-sans text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Tổng căn</p>
            <p className="font-serif text-3xl sm:text-4xl text-[#E2BC7E] font-semibold leading-none">{n}</p>
          </div>
        </div>
      </Card>

      {/* Apartment cards */}
      <div className="space-y-3 mb-6">
        {customer.apartments.map((apt, idx) => (
          <Card key={apt.id} className="overflow-hidden rounded-xl hover:shadow-[0_4px_20px_rgba(170,207,151,0.35)] transition-shadow duration-300 border-[#E0D8CC]">
            <CardContent className="p-0">
              {/* ── Mobile: stacked card — header row + 2×2 info grid ── */}
              <div className="sm:hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-[#F7FAF5] border-b border-[#E8E0D4]">
                  <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-[#F0F7EC]">
                    <img src={INTERIOR_IMGS[idx % INTERIOR_IMGS.length]} alt={`Căn ${apt.code}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[10px] text-[#9A8E80] tracking-wider uppercase">Căn {idx + 1}</p>
                    <p className="font-serif text-lg font-semibold text-[#2C2820] leading-tight truncate">{apt.code}</p>
                  </div>
                  <Badge variant="muted" className="flex-shrink-0">{apt.type}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-3 px-4 py-3">
                  <div>
                    <p className="font-sans text-[10px] text-[#9A8E80] tracking-wider uppercase mb-0.5">Tháp / Tầng</p>
                    <p className="font-sans text-sm text-[#4A4035] font-medium">{apt.tower} · T{apt.floor}</p>
                  </div>
                  <div>
                    <p className="font-sans text-[10px] text-[#9A8E80] tracking-wider uppercase mb-0.5">Diện tích</p>
                    <p className="font-sans text-sm text-[#4A4035] font-medium">{apt.area} m²</p>
                  </div>
                </div>
              </div>

              {/* ── Desktop: unchanged horizontal layout ── */}
              <div className="hidden sm:flex items-stretch">
                {/* Image */}
                <div className="w-20 sm:w-28 md:w-36 flex-shrink-0 overflow-hidden bg-[#F0F7EC]">
                  <img src={INTERIOR_IMGS[idx % INTERIOR_IMGS.length]} alt={`Căn ${apt.code}`} className="w-full h-full object-cover" />
                </div>
                {/* Content */}
                <div className="flex-1 flex items-center px-3 sm:px-5 py-3 sm:py-4 gap-3 sm:gap-4">
                  <div className="font-serif text-2xl sm:text-3xl text-[#AACF97] font-light w-6 sm:w-8 flex-shrink-0 select-none leading-none">{idx + 1}</div>
                  <div className="w-px self-stretch bg-[#E8E0D4]" />
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-2">
                    <div>
                      <p className="font-sans text-[10px] text-[#9A8E80] tracking-wider uppercase mb-0.5">Mã căn</p>
                      <p className="font-serif text-base font-semibold text-[#2C2820]">{apt.code}</p>
                    </div>
                    <div>
                      <p className="font-sans text-[10px] text-[#9A8E80] tracking-wider uppercase mb-0.5">Tháp / Tầng</p>
                      <p className="font-sans text-sm text-[#4A4035] font-medium">{apt.tower} · T{apt.floor}</p>
                    </div>
                    <div>
                      <p className="font-sans text-[10px] text-[#9A8E80] tracking-wider uppercase mb-0.5">Diện tích</p>
                      <p className="font-sans text-sm text-[#4A4035] font-medium">{apt.area} m²</p>
                    </div>
                    <div>
                      <p className="font-sans text-[10px] text-[#9A8E80] tracking-wider uppercase mb-0.5">Loại</p>
                      <Badge variant="muted">{apt.type}</Badge>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-center flex-shrink-0 ml-2 gap-1">
                    <Clock size={14} className="text-[#B8965A]" />
                    <p className="font-sans text-[10px] text-center text-[#9A8E80] leading-tight">1 khung<br/>45 phút</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Slot summary */}
      <Card className="mb-8 border-[#AACF97] bg-[#F0F7EC] rounded-xl">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 rounded-full bg-[#316817]/10 border border-[#316817]/20 flex items-center justify-center flex-shrink-0">
              <CalendarCheck size={18} className="text-[#316817]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm text-[#4A4035] leading-relaxed">
                Quý khách có <strong className="text-[#2C2820]">{n} căn hộ</strong> — hệ thống sẽ đặt{" "}
                <strong className="text-[#316817]">{n} khung giờ liên tiếp</strong>{" "}
                ({n} × 45 phút = <strong className="text-[#2C2820]">{n * 45} phút</strong>).
              </p>
              <p className="font-sans text-xs text-[#7A8E70] mt-1">
                Chỉ hiển thị giờ bắt đầu có đủ {n} khung liên tiếp còn slot trống.
              </p>
            </div>
            {/* Big number is decorative — it repeats the sentence. Desktop only. */}
            <div className="hidden sm:block flex-shrink-0 text-center">
              <p className="font-serif text-4xl text-[#316817] font-semibold leading-none">{n}</p>
              <p className="font-sans text-[10px] text-[#7A8E70] uppercase tracking-wider mt-0.5">khung giờ</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="mb-6 hidden sm:block" />

      {/* Desktop actions — unchanged */}
      <div className="hidden sm:flex gap-3">
        <Button variant="outline" className="rounded-xl" onClick={onBack}><ArrowLeft size={14} />Quay lại</Button>
        <Button variant="default" className="flex-1 rounded-xl h-12 bg-[#316817] hover:bg-[#275413] text-white font-semibold uppercase tracking-wider shadow-md" onClick={onProceed}>
          Chọn lịch bàn giao <ArrowRight size={14} className="ml-1" />
        </Button>
      </div>

      {/* Mobile: sticky action bar so the primary CTA is always reachable */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#E0D8CC] bg-[#F5F0E8]/95 backdrop-blur-md px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex gap-2.5">
        <Button variant="outline" onClick={onBack} aria-label="Quay lại" className="rounded-xl h-12 w-12 flex-shrink-0 p-0">
          <ArrowLeft size={18} />
        </Button>
        <Button variant="default" onClick={onProceed}
          className="flex-1 rounded-xl h-12 bg-[#316817] hover:bg-[#275413] text-white font-semibold uppercase tracking-wider shadow-md">
          Chọn lịch <ArrowRight size={16} className="ml-1" />
        </Button>
      </div>
    </div>
  )
}
