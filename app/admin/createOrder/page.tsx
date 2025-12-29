"use client"

export const dynamic = 'force-dynamic';

import { useState } from "react"
import ControlPanel from "@/app/components/tapBarOrder/tapbar"
import { supabase } from "@/app/lib/supabase"
import { useRouter } from "next/navigation";

interface FormData {
    category: "door" | "window"
    type: string
    width: string
    height: string
    phase: string
    frameColor: string
    meshColor: string
    side: "ซ้าย" | "ขวา" // เพิ่มส่วนนี้
}

interface CalculationResult {
    formula: string
    value: number[]
}

export default function MultiForm() {
    const [forms, setForms] = useState<FormData[]>([])
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [orderName, setOrderName] = useState("")
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
    const [orderEnd, setOrderEnd] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const router = useRouter();

    const addForm = (cat: "door" | "window") => {
        setForms([
            ...forms,
            {
                category: cat,
                type: "single",
                width: "",
                height: "",
                phase: "4",
                frameColor: "สีทา",
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

    const calculateDoorLogic = (h: number, w: number, p: number, type: string): CalculationResult => {
        const isDouble = type === "double"
        const handleDeduction = 5.5
        const frameDeduction = 0.5
        const topButtonDeduction = 2.2
        const shortDeduction = 4
        const netsizeDeduction = 1.7
        const cutDeduction = isDouble ? 4 : 2
        const phaseDeduction = 1.6

        const handle = h - handleDeduction
        const frame = h - frameDeduction
        const topButton = w - topButtonDeduction
        const short = w - shortDeduction
        const netsize = h - netsizeDeduction
        const cutNet = (w / cutDeduction) + 4
        const phase = (netsize - phaseDeduction) / p
        const rope = isDouble ? ((w / 2) + h + 5) / 2 : (w + h + 5) / 2
        const numberrope = isDouble ? (p - 1) * 2 : p - 1

        return {
            formula: `สูตรประตู (${type === 'single' ? 'บานเดี่ยว' : 'บานคู่'})`,
            value: [handle, frame, topButton, short, netsize, cutNet, phase, rope, numberrope]
        }
    }

    const calculateWindowLogic = (h: number, w: number, p: number, type: string): CalculationResult => {
        const isDouble = type === "double"
        const handleDeduction = 6.3
        const frameDeduction = 0.2
        const topButtonDeduction = 2.2
        const netsizeDeduction = 2.5
        const cutDeduction = isDouble ? 4 : 2
        const phaseDeduction = 1.6

        const handle = h - handleDeduction
        const frame = h - frameDeduction
        const topButton = w - topButtonDeduction
        const netsize = h - netsizeDeduction
        const cutNet = (w / cutDeduction) + 4
        const phase = (netsize - phaseDeduction) / p
        const rope = isDouble ? ((w / 2) + h + 5) / 2 : (w + h + 5) / 2
        const numberrope = isDouble ? (p - 1) * 2 : p - 1

        return {
            formula: `สูตรหน้าต่าง (${type === 'single' ? 'บานเดี่ยว' : 'บานคู่'})`,
            value: [handle, frame, topButton, netsize, cutNet, phase, rope, numberrope]
        }
    }

    const calculateFormula = (form: FormData): CalculationResult => {
        const width = Number(form.width)
        const height = Number(form.height)
        const phase = Number(form.phase)
        if (!width || !height) return { formula: "ยังไม่ได้กรอกขนาด", value: [0, 0, 0, 0, 0, 0, 0, 0, 0] }
        if (form.type === "free") return { formula: "บานอิสระ", value: [width * height * 1.2] }

        return form.category === "door"
            ? calculateDoorLogic(height, width, phase, form.type)
            : calculateWindowLogic(height, width, phase, form.type)
    }

    const handleSave = async () => {
        if (!orderName) return alert("กรุณาระบุชื่อหน้างาน");
        if (forms.length === 0) return alert("กรุณาเพิ่มรายการอย่างน้อย 1 รายการ");

        try {
            setIsSaving(true);

            const { data: orderData, error: orderError } = await supabase
                .from('order')
                .insert([{
                    order_name: orderName,
                    order_date: orderDate,
                    order_end: orderEnd || null,
                    status: 1
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            const orderItems = forms.map((form) => {
                const calc = calculateFormula(form);
                const isDoor = form.category === "door";
                const isDouble = form.type === "double";

                // --- ส่วนที่แก้ไข: Mapping ประเภทเป็น type_id (Int) ---
                let typeId = 0;
                if (form.type === "free") {
                    typeId = 99; // บานอิสระ
                } else if (isDoor) {
                    typeId = isDouble ? 11 : 10; // 11: ประตูบานคู่, 10: ประตูบานเดี่ยว
                } else {
                    typeId = isDouble ? 21 : 20; // 21: หน้าต่างบานคู่, 20: หน้าต่างบานเดี่ยว
                }

                return {
                    id_order: orderData.id,
                    type_id: typeId, // เปลี่ยนจาก name_type เป็น type_id และเป็นค่าตัวเลข
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

            const { error: itemsError } = await supabase
                .from('order_item')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            alert("บันทึกข้อมูลสำเร็จ!");
            router.push("/admin/summarytable");

        } catch (error: any) {
            console.error(error);
            alert("เกิดข้อผิดพลาด: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex overflow-x-hidden">
            {/* Render ส่วน UI คงเดิมตามที่คุณส่งมา... */}
            <main className={`flex-1 transition-all duration-300 py-10 px-4 ${isSidebarOpen ? "mr-80" : "mr-0"}`}>
                <div className="max-w-3xl mx-auto">
                    <header className="mb-10 text-center">
                        <h1 className="text-4xl font-black text-gray-800 uppercase tracking-tight">Order System</h1>
                        <p className="text-gray-500 mt-2">จัดการรายการประตูและหน้าต่างของคุณ</p>
                    </header>

                    <div className="relative p-8 mb-8 rounded-2xl shadow-xl border-t-8 border-gray-800 bg-white transition-all hover:shadow-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xl font-bold mb-2 text-gray-800 uppercase tracking-widest">
                                    ชื่อหน้างาน / สถานที่ติดตั้ง <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={orderName}
                                    onChange={(e) => setOrderName(e.target.value)}
                                    placeholder="ระบุชื่อลูกค้า หรือ ที่อยู่หน้างาน..."
                                    className="w-full border-2 border-gray-300 rounded-xl p-3 outline-none focus:border-gray-600 bg-gray-50/50 transition font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest">📅 วันที่เริ่มงาน</label>
                                <input
                                    type="date"
                                    value={orderDate}
                                    onChange={(e) => setOrderDate(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-xl p-3 outline-none focus:border-gray-600 bg-gray-50/50 transition cursor-pointer"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-black text-gray-500 uppercase tracking-widest">🏁 วันที่กำหนดส่งงาน</label>
                                <input
                                    type="date"
                                    value={orderEnd}
                                    onChange={(e) => setOrderEnd(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-xl p-3 outline-none focus:border-gray-600 bg-gray-50/50 transition cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {forms.length === 0 && (
                        <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl py-20 text-center">
                            <p className="text-gray-400 text-lg italic">ยังไม่มีรายการ... เพิ่มรายการใหม่ได้จากเมนูควบคุมด้านขวา</p>
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
                                        {isDoor ? "ประตู" : "หน้าต่าง"} รายการที่ {index + 1}
                                    </h3>
                                </div>

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
                                                { id: "left", label: "ฝั่งซ้าย (L)", icon: "⬅️" },
                                                { id: "right", label: "ฝั่งขวา (R)", icon: "➡️" }
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
                                        <input
                                            type="number"
                                            value={form.width}
                                            onChange={(e) => updateForm(index, "width", e.target.value)}
                                            className="w-full border-2 border-gray-300 rounded-xl p-3 outline-none focus:border-gray-400 bg-gray-50/50 transition"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-2 text-gray-800 uppercase tracking-widest">ความสูง (ซม.)</label>
                                        <input
                                            type="number"
                                            value={form.height}
                                            onChange={(e) => updateForm(index, "height", e.target.value)}
                                            className="w-full border-2 border-gray-300 rounded-xl p-3 outline-none focus:border-gray-400 bg-gray-50/50 transition"
                                            placeholder="0.00"
                                        />
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
                                    <div className="flex justify-between items-end">
                                        <div className="text-left">
                                            <p className="text-[15px] font-bold text-gray-800 uppercase mb-1">ระยะเจาะ</p>
                                            <p className={`text-2xl font-mono font-black ${isDoor ? "text-amber-600" : "text-blue-600"}`}>
                                                {(() => {
                                                    const targetIndex = isDoor ? 6 : 5;
                                                    return calc.value && calc.value.length > targetIndex ? Number(calc.value[targetIndex]).toFixed(2) : "0.00";
                                                })()}
                                                <span className="text-xs ml-1">ซม.</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </main>

            <ControlPanel
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                counts={counts}
                onAdd={addForm}
                onSummary={handleSave}
            />
        </div>
    )
}