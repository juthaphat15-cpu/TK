"use client"

import { useState, useEffect } from "react"
import ControlPanel from "@/app/components/tapBarOrder/tapbar"
import { supabase } from "@/app/lib/supabase"
import { useRouter, useParams } from "next/navigation";
import { Vault, AlertCircle, CheckCircle2 } from "lucide-react";

interface FormData {
    category: "door" | "window"
    type: string
    width: string
    height: string
    phase: string
    frameColor: string
    meshColor: string
    side: "ซ้าย" | "ขวา"
}

interface CalculationResult {
    formula: string
    value: number[]
}

export default function MultiForm() {
    const [forms, setForms] = useState<FormData[]>([])
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [orderName, setOrderName] = useState("")
    const [orderDate, setOrderDate] = useState("")
    const [orderEnd, setOrderEnd] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false) // เพิ่ม State สำหรับ Modal

    const router = useRouter();
    const params = useParams();
    const orderId = params.id;

    useEffect(() => {
        if (orderId) {
            const fetchOrderHeader = async () => {
                const { data, error } = await supabase
                    .from('order')
                    .select('order_name, order_date, order_end')
                    .eq('id', orderId)
                    .single();

                if (data) {
                    setOrderName(data.order_name);
                    setOrderDate(data.order_date);
                    setOrderEnd(data.order_end || "");
                }
            };
            fetchOrderHeader();
        }
    }, [orderId]);

    const addForm = (cat: "door" | "window") => {
        setForms([
            ...forms,
            {
                category: cat,
                type: "single",
                width: "",
                height: "",
                phase: "4",
                frameColor: "สีขาว",
                meshColor: "สีเทา",
                side: "ซ้าย"
            }
        ])
    }

    const removeForm = (index: number) => {
        setForms(forms.filter((_, i) => i !== index))
    }

    const updateForm = (index: number, field: keyof FormData, value: string) => {
        const newForms = [...forms]
        // @ts-ignore
        newForms[index][field] = value
        setForms(newForms)
    }

    const counts = {
        door: forms.filter(f => f.category === "door").length,
        window: forms.filter(f => f.category === "window").length
    }

    // Logic คำนวณ (เหมือนเดิม)
    const calculateDoorLogic = (h: number, w: number, p: number, type: string): CalculationResult => {
        const isDouble = type === "double"
        const handleDeduction = 5.5, frameDeduction = 0.5, topButtonDeduction = 2.2, shortDeduction = 4, netsizeDeduction = 1.7, cutDeduction = isDouble ? 4 : 2, phaseDeduction = 1.6
        const handle = h - handleDeduction, frame = h - frameDeduction, topButton = w - topButtonDeduction, short = w - shortDeduction, netsize = h - netsizeDeduction, cutNet = (w / cutDeduction) + 4, phase = (netsize - phaseDeduction) / p, rope = isDouble ? ((w / 2) + h + 5) / 2 : (w + h + 5) / 2, numberrope = isDouble ? (p - 1) * 2 : p - 1
        return { formula: `สูตรประตู (${type === 'single' ? 'บานเดี่ยว' : 'บานคู่'})`, value: [handle, frame, topButton, short, netsize, cutNet, phase, rope, numberrope] }
    }

    const calculateWindowLogic = (h: number, w: number, p: number, type: string): CalculationResult => {
        const isDouble = type === "double"
        const handleDeduction = 6.3, frameDeduction = 0.2, topButtonDeduction = 2.2, netsizeDeduction = 2.5, cutDeduction = isDouble ? 4 : 2, phaseDeduction = 1.6
        const handle = h - handleDeduction, frame = h - frameDeduction, topButton = w - topButtonDeduction, netsize = h - netsizeDeduction, cutNet = (w / cutDeduction) + 4, phase = (netsize - phaseDeduction) / p, rope = isDouble ? ((w / 2) + h + 5) / 2 : (w + h + 5) / 2, numberrope = isDouble ? (p - 1) * 2 : p - 1
        return { formula: `สูตรหน้าต่าง (${type === 'single' ? 'บานเดี่ยว' : 'บานคู่'})`, value: [handle, frame, topButton, netsize, cutNet, phase, rope, numberrope] }
    }

    const calculateFormula = (form: FormData): CalculationResult => {
        const width = Number(form.width), height = Number(form.height), phase = Number(form.phase)
        if (!width || !height) return { formula: "", value: [0, 0, 0, 0, 0, 0, 0, 0, 0] }
        if (form.type === "free") return { formula: "บานอิสระ", value: [width * height * 1.2] }
        return form.category === "door" ? calculateDoorLogic(height, width, phase, form.type) : calculateWindowLogic(height, width, phase, form.type)
    }

    // ฟังก์ชันเปิด Modal เช็คความเรียบร้อย
    const openSubmitModal = () => {
        if (forms.length === 0) return alert("กรุณาเพิ่มรายการอย่างน้อย 1 รายการ");
        const hasEmptyFields = forms.some(f => !f.width || !f.height);
        if (hasEmptyFields) return alert("กรุณากรอกขนาด กว้าง/สูง ให้ครบทุกรายการ");
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const orderItems = forms.map((form) => {
                const calc = calculateFormula(form);
                const isDoor = form.category === "door";
                const isDouble = form.type === "double";
                let typeId = form.type === "free" ? 99 : (isDoor ? (isDouble ? 11 : 10) : (isDouble ? 21 : 20));

                return {
                    id_order: orderId,
                    type_id: typeId,
                    side: isDoor ? form.side : null,
                    frame_color: form.frameColor,
                    mesh_color: form.meshColor,
                    width: parseFloat(form.width),
                    height: parseFloat(form.height),
                    handle: calc.value[0],
                    frame: calc.value[1],
                    topbutton: calc.value[2],
                    short: isDoor ? calc.value[3] : null,
                    netsize: isDoor ? calc.value[4] : calc.value[3],
                    cutnet: Math.round(isDoor ? calc.value[5] : calc.value[4]),
                    phasedrill: isDoor ? calc.value[6] : calc.value[5],
                    rope: isDoor ? calc.value[7] : calc.value[6],
                    number_rope: isDoor ? calc.value[8] : calc.value[7]
                };
            });

            const { error: itemsError } = await supabase.from('order_item').insert(orderItems);
            if (itemsError) throw itemsError;

            setIsModalOpen(false);
            router.push(`/admin/summarytable/preview/${orderId}`);

        } catch (error: any) {
            alert("เกิดข้อผิดพลาด: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex overflow-x-hidden">
            <main className={`flex-1 transition-all duration-300 py-10 px-4 ${isSidebarOpen ? "mr-80" : "mr-0"}`}>
                <div className="max-w-3xl mx-auto">
                    <header className="mb-10 text-center">
                        <h1 className="text-4xl font-black text-gray-800 uppercase tracking-tight">Add New Items</h1>
                        <p className="text-blue-600 font-bold mt-2 italic">กำลังเพิ่มรายการลงในใบงานเดิม</p>
                    </header>

                    {/* Section Header: ReadOnly */}
                    <div className="relative p-8 mb-8 rounded-2xl shadow-xl border-t-8 border-blue-900 bg-gray-50 opacity-90 transition-all">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xl font-bold mb-2 text-gray-500 uppercase tracking-widest">
                                    ชื่อหน้างาน / สถานที่ติดตั้ง (แก้ไขไม่ได้)
                                </label>
                                <input
                                    type="text"
                                    value={orderName}
                                    readOnly
                                    className="w-full text-2xl border-2 border-gray-200 rounded-xl p-3 outline-none bg-gray-200 font-bold text-gray-600 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    {forms.length === 0 && (
                        <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl py-20 text-center">
                            <p className="text-gray-400 text-lg italic">กดปุ่มที่แถบขวาเพื่อเริ่มเพิ่มรายการประตู/หน้าต่าง</p>
                        </div>
                    )}

                    {forms.map((form, index) => {
                        const calc = calculateFormula(form)
                        const isDoor = form.category === "door"
                        return (
                            <div key={index} className={`relative p-8 mb-8 rounded-2xl shadow-xl border-t-8 bg-white transition-all hover:shadow-2xl ${isDoor ? "border-amber-500" : "border-blue-500"}`}>
                                <button onClick={() => removeForm(index)} className="absolute top-4 right-4 bg-red-100 text-red-500 rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition">✕</button>
                                <div className="flex items-center gap-2 mb-6">
                                    <span className={`w-3 h-3 rounded-full ${isDoor ? "bg-amber-500" : "bg-blue-500"}`}></span>
                                    <h3 className={`text-2xl font-bold ${isDoor ? "text-amber-600" : "text-blue-600"}`}>
                                        {isDoor ? "ประตู" : "หน้าต่าง"} (รายการใหม่ที่ {index + 1})
                                    </h3>
                                </div>

                                {/* inputs (กว้าง, สูง, ประเภท ฯลฯ) - โค้ดส่วนนี้เหมือนเดิมของคุณ */}
                                <div className="mb-6">
                                    <label className="block font-semibold mb-3 text-gray-700 uppercase text-sm tracking-wider">ประเภทบาน</label>
                                    <div className="flex gap-3">
                                        {[{ id: "single", label: "บานเดี่ยว" }, { id: "double", label: "บานคู่" }, { id: "free", label: "บานอิสระ" }].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => updateForm(index, "type", item.id)}
                                                className={`flex-1 py-2 rounded-xl font-bold border-2 transition-all ${form.type === item.id
                                                    ? (isDoor ? "bg-amber-500 border-amber-500 text-white" : "bg-blue-500 border-blue-500 text-white")
                                                    : "bg-white border-gray-300 text-gray-800 hover:border-gray-400"
                                                    }`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {isDoor && form.type === "single" && (
                                    <div className="mb-6">
                                        <label className="block font-semibold mb-3 text-gray-700 uppercase text-sm tracking-wider">
                                            ฝั่งติดตั้ง (ตำแหน่งมือจับ/บานพับ)
                                        </label>
                                        <div className="flex gap-3">
                                            {[
                                                { id: "ซ้าย", label: "ฝั่งซ้าย (L)", icon: "⬅️" },
                                                { id: "ขวา", label: "ฝั่งขวา (R)", icon: "➡️" }
                                            ].map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => updateForm(index, "side", item.id)}
                                                    className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${form.side === item.id
                                                        ? "bg-amber-600 border-amber-600 text-white shadow-md"
                                                        : "bg-white border-gray-300 text-gray-600 hover:border-amber-300"
                                                        }`}
                                                >
                                                    <span>{item.icon}</span>
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold mb-2 text-gray-800 uppercase tracking-widest">ความกว้าง (ซม.)</label>
                                        <input type="number" value={form.width} onChange={(e) => updateForm(index, "width", e.target.value)} className="w-full border-2 border-gray-300 rounded-xl p-3 outline-none focus:border-gray-400 bg-gray-50/50 transition" placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-2 text-gray-800 uppercase tracking-widest">ความสูง (ซม.)</label>
                                        <input type="number" value={form.height} onChange={(e) => updateForm(index, "height", e.target.value)} className="w-full border-2 border-gray-300 rounded-xl p-3 outline-none focus:border-gray-400 bg-gray-50/50 transition" placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div className="space-y-1">
                                        <label className="text-[12px] font-black text-gray-700 uppercase">ระยะเจาะ</label>
                                        <select value={form.phase} onChange={(e) => updateForm(index, "phase", e.target.value)} className="w-full border-b-2 p-2 focus:border-gray-400 outline-none cursor-pointer">
                                            <option>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>7</option><option>8</option><option>9</option><option>10</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[12px] font-black text-gray-700 uppercase">สีกรอบ</label>
                                        <select value={form.frameColor} onChange={(e) => updateForm(index, "frameColor", e.target.value)} className="w-full border-b-2 p-2 focus:border-gray-400 outline-none cursor-pointer">
                                            <option>ดำ</option><option>เทา</option><option>ขาว</option><option>ไม้</option><option>อลูมิเนียม</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[12px] font-black text-gray-700 uppercase">สีมุ้ง</label>
                                        <select value={form.meshColor} onChange={(e) => updateForm(index, "meshColor", e.target.value)} className="w-full border-b-2 p-2 focus:border-gray-400 outline-none cursor-pointer">
                                            <option>เทา</option><option>ดำ</option><option>กันแมวดำ</option><option>กันแมวเทา</option>
                                        </select>
                                    </div>
                                </div>
                                <div className={`p-5 rounded-2xl border ${isDoor ? "bg-amber-50/50 border-amber-100" : "bg-blue-50/50 border-blue-100"}`}>
                                    <p className="text-[15px] font-bold text-gray-800 uppercase mb-1">ระยะเจาะคำนวณ</p>
                                    <p className={`text-2xl font-mono font-black ${isDoor ? "text-amber-600" : "text-blue-600"}`}>
                                        {(() => {
                                            const targetIndex = isDoor ? 6 : 5;
                                            return calc.value && calc.value.length > targetIndex ? Number(calc.value[targetIndex]).toFixed(2) : "0.00";
                                        })()}
                                        <span className="text-xs ml-1">ซม.</span>
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </main>

            {/* Modal ยืนยันการบันทึก */}
            {isModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                        <div className="p-8 text-center">
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6">
                                <CheckCircle2 className="h-12 w-12 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">ยืนยันการเพิ่มรายการ</h3>
                            <p className="text-gray-500 font-medium mb-8">
                                คุณกำลังจะเพิ่มรายการใหม่จำนวน <span className="text-blue-600 font-bold">{forms.length} รายการ</span>
                                ลงในใบงาน <span className="text-gray-800 font-bold">"{orderName}"</span>
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? "กำลังบันทึก..." : "ยืนยันบันทึก"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ControlPanel
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                counts={counts}
                onAdd={addForm}
                onSummary={openSubmitModal} // เปลี่ยนมาเปิด Modal แทน
            />
        </div>
    )
}