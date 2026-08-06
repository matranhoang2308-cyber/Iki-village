import { useState } from "react"
import { Phone, Mail, Search, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Customer, CUSTOMERS } from "@/data/mockData"

const HERO_IMG    = "https://images.unsplash.com/photo-1776361984975-84bbbb539f80?w=1400&h=900&fit=crop&auto=format"
const INTERIOR_IMG = "https://images.unsplash.com/photo-1757924461488-ef9ad0670978?w=400&h=300&fit=crop&auto=format"
const BUILDING_IMG = "https://images.unsplash.com/photo-1702902111874-8181f1e36269?w=400&h=300&fit=crop&auto=format"

interface Props { onCustomerFound: (c: Customer) => void }

export default function CustomerLookup({ onCustomerFound }: Props) {
  const [query, setQuery]           = useState("")
  const [searchType, setSearchType] = useState<"phone" | "email">("phone")
  const [status, setStatus]         = useState<"idle" | "searching" | "not-found">("idle")

  const handleSearch = () => {
    if (!query.trim()) return
    setStatus("searching")
    setTimeout(() => {
      const q = query.trim().toLowerCase()
      const found = CUSTOMERS.find((c) =>
        searchType === "phone"
          ? c.phone.replace(/\s/g, "") === q.replace(/\s/g, "")
          : c.email.toLowerCase() === q
      )
      found ? onCustomerFound(found) : setStatus("not-found")
    }, 900)
  }

  const handleRetry = () => { setQuery(""); setStatus("idle") }

  return (
    <div className="relative min-h-screen pt-16 flex flex-col justify-start lg:justify-between overflow-hidden">
      {/* ── Background Image Full Screen ── */}
      <img
        src={HERO_IMG}
        alt="IKI Village"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      {/* Light overlay vừa đủ giữ tương phản chữ */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.25) 0%, rgba(18,43,9,0.15) 50%, rgba(0,0,0,0.30) 100%)",
        }}
      />

      {/* ── Main Container: Grid 2 cột theo mẫu ── */}
      {/* Mobile spacing: 24px header→text, 40px text→form card. `items-center`
          would centre the column vertically and swallow those exact gaps, so
          mobile pins content to the top instead. */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 lg:py-16 grid lg:grid-cols-12 gap-10 sm:gap-8 items-start lg:items-center auto-rows-min lg:auto-rows-auto flex-1">
        
        {/* ── CỘT BÊN TRÁI (Nội dung Hình 1) ── */}
        <div className="lg:col-span-7 flex flex-col justify-start lg:justify-center text-white space-y-0 sm:space-y-6 pr-0 lg:pr-10">
          {/* Eyebrow tag nổi bật sắc nét — ẩn trên mobile để title lên cao hơn */}
          <div className="hidden sm:inline-flex items-center gap-3 bg-[#316817]/90 backdrop-blur-md px-4 py-2 rounded-full border border-[#7AB463]/50 shadow-lg w-fit">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E2BC7E] animate-pulse" />
            <span className="font-sans text-xs sm:text-sm tracking-[0.2em] uppercase text-white font-bold">
              Hệ thống đặt lịch bàn giao
            </span>
          </div>

          {/* Tiêu đề chính H1 nổi bật với Text Shadow & Tương phản cao */}
          <div className="space-y-1 mt-0 sm:mt-[24px]">
            <h1
              className="font-serif text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] leading-none"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4.375rem)", fontWeight: 500 }}
            >
              Chào mừng đến
            </h1>
            <h1
              className="font-serif text-[#D5EACB] drop-shadow-[0_6px_16px_rgba(0,0,0,0.9)] leading-tight tracking-wide whitespace-nowrap"
              style={{ fontSize: "clamp(4rem, 8vw, 7.5rem)", fontWeight: 700 }}
            >
              IKI Village
            </h1>
          </div>

          {/* Mô tả / Subtitle — mobile cách title 16px, desktop giữ 20px */}
          <p className="font-sans text-[18px] sm:text-[28px] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] max-w-xl leading-relaxed font-normal -mt-3">
            Vui lòng cung cấp số điện thoại hoặc email để tra cứu thông tin và đặt lịch ký HĐMB.
          </p>
        </div>

        {/* ── CỘT BÊN PHẢI (Form Card Widget - Cấp 1 về Hành động) ── */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-2xl border border-white/50 text-[#2C2820]">
            
            {/* Header Form bổ sung tiêu đề Form để rõ cấp bậc trong Card */}
            <div className="mb-6 pb-4 border-b border-[#E0D8CC]/60">
              <h2 className="font-sans text-lg font-bold text-[#2C2820] tracking-tight">
                Tra cứu thông tin
              </h2>
              <p className="font-sans text-xs text-[#7A6E60] mt-0.5">
                Nhập thông tin của bạn đã đăng ký
              </p>
            </div>

            {status !== "not-found" ? (
              <div className="space-y-5">
                <Tabs
                  value={searchType}
                  onValueChange={(v) => {
                    setSearchType(v as "phone" | "email")
                    setQuery("")
                    setStatus("idle")
                  }}
                >
                  <TabsList className="grid grid-cols-2 mb-5 p-1 bg-[#F5F0E8] rounded-xl border border-[#E0D8CC]/40">
                    <TabsTrigger value="phone" className="rounded-lg py-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2">
                      <Phone size={15} className="shrink-0" />
                      <span className="leading-none">Số điện thoại</span>
                    </TabsTrigger>
                    <TabsTrigger value="email" className="rounded-lg py-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2">
                      <Mail size={15} className="shrink-0" />
                      <span className="leading-none">Email</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="phone">
                    <div className="space-y-2">
                      <Label htmlFor="phone-in" className="text-[11px] tracking-wider uppercase text-[#7A6E60] font-bold">
                        SỐ ĐIỆN THOẠI ĐĂNG KÝ
                      </Label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#316817]" />
                        <Input
                          id="phone-in"
                          type="tel"
                          placeholder="Ví dụ: 0901 234 567"
                          value={query}
                          onChange={(e) => {
                            setQuery(e.target.value)
                            setStatus("idle")
                          }}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          className="pl-10 h-12 bg-[#FAF7F2] border-[#E0D8CC] rounded-xl focus:ring-2 focus:ring-[#316817] text-base font-medium"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="email">
                    <div className="space-y-2">
                      <Label htmlFor="email-in" className="text-[11px] tracking-wider uppercase text-[#7A6E60] font-bold">
                        ĐỊA CHỈ EMAIL ĐĂNG KÝ
                      </Label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#316817]" />
                        <Input
                          id="email-in"
                          type="email"
                          placeholder="Ví dụ: ten@email.com"
                          value={query}
                          onChange={(e) => {
                            setQuery(e.target.value)
                            setStatus("idle")
                          }}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          className="pl-10 h-12 bg-[#FAF7F2] border-[#E0D8CC] rounded-xl focus:ring-2 focus:ring-[#316817] text-base font-medium"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Demo hint */}
                <div className="p-3 bg-[#F0F7EC] border border-[#AACF97] rounded-xl text-xs font-sans text-[#275413] leading-relaxed">
                  <span className="text-[#316817] font-bold">Demo — </span>thử với{" "}
                  {(["0901234567", "0987654321", "0912345678"] as const).map((label) => (
                    <button
                      key={label}
                      onClick={() => {
                        setSearchType("phone")
                        setQuery(label)
                        setStatus("idle")
                      }}
                      className="text-[#B8965A] font-semibold underline underline-offset-2 mr-2 bg-transparent border-none cursor-pointer text-xs hover:text-[#9A7A44]"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <Button
                  variant="default"
                  className="w-full h-12 rounded-xl text-sm font-semibold tracking-wider uppercase shadow-xl bg-[#316817] hover:bg-[#1C3E0C] text-white transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={handleSearch}
                  disabled={!query.trim() || status === "searching"}
                >
                  {status === "searching" ? (
                    <>
                      <svg className="animate-spin shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25" />
                        <path d="M21 12a9 9 0 00-9-9" />
                      </svg>
                      <span className="leading-none">Đang tra cứu...</span>
                    </>
                  ) : (
                    <>
                      <Search size={16} className="shrink-0" />
                      <span className="leading-none">Tra cứu thông tin</span>
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Card className="border-[#EDD4AC] bg-[#FDF8F0] rounded-xl">
                <CardContent className="p-6">
                  <div className="flex gap-4 mb-4">
                    <div className="w-10 h-10 bg-[#FDF8F0] border border-[#EDD4AC] flex items-center justify-center flex-shrink-0 rounded-full">
                      <AlertCircle size={20} className="text-[#C4714A]" />
                    </div>
                    <div>
                      <p className="font-serif text-base font-medium text-[#2C2820] mb-1">Không tìm thấy</p>
                      <p className="font-sans text-xs text-[#7A6E60] leading-relaxed">
                        Thông tin <strong className="text-[#2C2820]">"{query}"</strong> chưa được đăng ký. Kiểm tra lại hoặc gọi{" "}
                        <a href="tel:19001234" className="text-[#B8965A]">1900 1234</a>.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full rounded-xl" onClick={handleRetry}>Thử lại</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
