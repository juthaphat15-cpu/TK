"use client"

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Info, Loader2 } from 'lucide-react'
import { supabase } from "@/app/lib/supabase"
import SubmitOrderModal from "@/app/components/common/modalSubmit" // ตรวจสอบ path ให้ถูกต้อง

export default function EditOrderItemPage() {
    const params = useParams()
    const router = useRouter()
    const itemId = params.id

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<any>(null)
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)

    const FRAME_COLORS = ["ขาว", "ดำ", "ชา", "อลูมิเนียม", "ลายไม้"]
    const MESH_COLORS = ["เทา", "ดำ", "กันแมวดำ", "กันแมวเทา"]

    useEffect(() => {
        const fetchItemData = async () => {
            try {
                const { data, error } = await supabase
                    .from('order_item')
                    .select('*')
                    .eq('id', itemId)
                    .single()

                if (error) throw error
                setFormData(data)
            } catch (error: any) {
                console.error('Error:', error.message)
                router.back()
            } finally {
                setLoading(false)
            }
        }
        if (itemId) fetchItemData()
    }, [itemId, router])

    const handleInputChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value })
    }

    // ฟังก์ชันบันทึกข้อมูลจริง
    const handleUpdate = async () => {
        setSaving(true)
        const finalCutnet = Math.round(Number(formData.cutnet))

        try {
            const { error } = await supabase
                .from('order_item')
                .update({
                    frame_color: formData.frame_color,
                    mesh_color: formData.mesh_color,
                    cutnet: finalCutnet
                })
                .eq('id', itemId)

            if (error) throw error
            
            setIsSubmitModalOpen(false) // ปิด Modal ยืนยัน
            router.back() // กลับหน้าเดิม
        } catch (error: any) {
            alert('ไม่สามารถบันทึกได้: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-100">
            <Loader2 className="animate-spin text-amber-500" size={40} />
            <p className="font-bold italic text-gray-500">กำลังดึงข้อมูล...</p>
        </div>
    )

    return (
        <div className="bg-gray-100 min-h-screen p-4 md:p-10 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => router.back()} 
                        className="p-3 bg-white rounded-2xl shadow-sm hover:bg-gray-50 border border-gray-200 transition-all active:scale-90"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">
                        แก้ไขรายการ <span className="text-amber-600">#{formData?.id}</span>
                    </h1>
                </div>

                <div className="space-y-6">
                    {/* Editable Section */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                        <h2 className="text-lg font-black mb-6 flex items-center gap-2 text-gray-800 uppercase tracking-tight">
                            <span className="w-2 h-6 bg-amber-500 rounded-full"></span> ส่วนที่แก้ไขได้
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 tracking-widest px-1">สีกรอบ</label>
                                <select
                                    value={formData?.frame_color || ''}
                                    onChange={(e) => handleInputChange("frame_color", e.target.value)}
                                    className="w-full p-4 bg-amber-50/50 border-2 border-amber-100 rounded-2xl outline-none font-bold text-gray-700 focus:border-amber-500 transition-all cursor-pointer"
                                >
                                    <option value="">เลือกสีกรอบ</option>
                                    {FRAME_COLORS.map(color => <option key={color} value={color}>{color}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 tracking-widest px-1">สีมุ้ง</label>
                                <select
                                    value={formData?.mesh_color || ''}
                                    onChange={(e) => handleInputChange("mesh_color", e.target.value)}
                                    className="w-full p-4 bg-amber-50/50 border-2 border-amber-100 rounded-2xl outline-none font-bold text-gray-700 focus:border-amber-500 transition-all cursor-pointer"
                                >
                                    <option value="">เลือกสีมุ้ง</option>
                                    {MESH_COLORS.map(color => <option key={color} value={color}>{color}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-blue-400 uppercase mb-2 tracking-widest px-1">จำนวนจีบ (ปรับแก้มือ)</label>
                                <input
                                    type="number"
                                    value={formData?.cutnet ? Math.round(Number(formData.cutnet)) : ''}
                                    onChange={(e) => handleInputChange("cutnet", e.target.value)}
                                    className="w-full p-4 bg-blue-50/50 border-2 border-blue-100 rounded-2xl outline-none font-bold text-blue-700 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Read-Only Info */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-md border border-gray-100 opacity-80">
                        <h2 className="text-xs font-black mb-4 text-gray-400 uppercase tracking-[0.2em]">ขนาดและประเภทเดิม</h2>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">กว้าง</p>
                                <p className="text-xl font-black text-gray-600">{formData?.width} <span className="text-[10px]">ซม.</span></p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">สูง</p>
                                <p className="text-xl font-black text-gray-600">{formData?.height} <span className="text-[10px]">ซม.</span></p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl flex flex-col justify-center">
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">ประเภท</p>
                                <p className="text-[13px] font-black text-gray-500 leading-tight">
                                    {getLabelFromTypeId(formData?.type_id)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Calculation Results */}
                    <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl text-white">
                        <h2 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
                            <Info size={20} className="text-amber-400" /> ข้อมูลการผลิต
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <ResultField label="มือจับ" value={formData?.handle} />
                            <ResultField label="รางข้าง/เฟรม" value={formData?.frame} />
                            <ResultField label="บน-ล่าง" value={formData?.topbutton} />
                            <ResultField label="รางเตี้ย" value={formData?.short} />
                            <ResultField label="ขนาดผ้ามุ้ง" value={formData?.netsize} />
                            <ResultField label="ระยะเจาะ" value={formData?.phasedrill} />
                            <ResultField label="ความยาวเชือก" value={formData?.rope} />
                            <ResultField label="จำนวนเชือก" value={formData?.number_rope} isInt />
                        </div>
                    </div>

                    {/* Submit Button - Now opens Confirmation Modal */}
                    <button
                        type="button"
                        onClick={() => setIsSubmitModalOpen(true)}
                        className="w-full bg-amber-500 text-white p-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-amber-600 transition-all shadow-xl shadow-amber-200 active:scale-[0.98]"
                    >
                        <Save size={24} /> บันทึกการแก้ไข
                    </button>
                </div>
            </div>

            {/* Confirmation Alert Modal */}
            <SubmitOrderModal 
                isOpen={isSubmitModalOpen}
                onClose={() => setIsSubmitModalOpen(false)}
                onConfirm={handleUpdate}
                isLoading={saving}
                title="ยืนยันการแก้ไข"
                message="คุณต้องการบันทึกการเปลี่ยนแปลงของรายการนี้ใช่หรือไม่?"
            />
        </div>
    )
}

// Helper Functions
function getLabelFromTypeId(typeId: any) {
    const types: Record<number, string> = {
        10: "ประตู (บานเดี่ยว)",
        11: "ประตู (บานคู่)",
        20: "หน้าต่าง (บานเดี่ยว)",
        21: "หน้าต่าง (บานคู่)",
        99: "บานอิสระ"
    };
    return types[Number(typeId)] || "ไม่ระบุประเภท";
}

function ResultField({ label, value, isInt = false }: { label: string, value: any, isInt?: boolean }) {
    const numValue = Number(value);
    const isValid = !isNaN(numValue) && value !== null && value !== undefined;
    const displayValue = isValid ? (isInt ? Math.round(numValue) : numValue.toFixed(1)) : "0.0";

    return (
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
            <p className="text-[9px] font-black text-gray-500 uppercase mb-1 tracking-widest">{label}</p>
            <p className="text-xl font-mono font-black text-amber-400">{displayValue}</p>
        </div>
    )
}