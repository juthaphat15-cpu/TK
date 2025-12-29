"use client"

interface ControlPanelProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  counts: { door: number; window: number };
  onAdd: (cat: "door" | "window") => void;
  onSummary: () => void;
}

export default function ControlPanel({ isOpen, setIsOpen, counts, onAdd, onSummary }: ControlPanelProps) {


  return (
    <>
      {/* ปุ่ม Toggle สำหรับเปิด Sidebar (จะโชว์เมื่อ Sidebar ปิดอยู่) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-amber-600 text-white p-3 rounded-l-2xl shadow-lg z-50 hover:bg-amber-700 transition-all"
        >
          <span className="writing-mode-vertical">เมนูควบคุม</span>
        </button>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar Panel */}
      <div className={`fixed right-0 top-0 h-full bg-white w-80 shadow-2xl z-50 transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">แผงควบคุม</h2>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-red-500 text-2xl">✕</button>
          </div>

          {/* ส่วนแสดงจำนวน Form */}
          <div className="space-y-4 mb-10">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <p className="text-amber-800 font-semibold">🚪 จำนวนประตู</p>
              <p className="text-3xl font-bold text-amber-600">{counts.door} <span className="text-sm font-normal text-gray-500">รายการ</span></p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <p className="text-blue-800 font-semibold">🪟 จำนวนหน้าต่าง</p>
              <p className="text-3xl font-bold text-blue-600">{counts.window} <span className="text-sm font-normal text-gray-500">รายการ</span></p>
            </div>
          </div>

          {/* ปุ่มกดสร้าง Form */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-gray-400 uppercase">เพิ่มรายการใหม่</p>
            <button
              onClick={() => onAdd("door")}
              className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition shadow-md"
            >
              ➕ เพิ่มประตู
            </button>
            <button
              onClick={() => onAdd("window")}
              className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition shadow-md"
            >
              ➕ เพิ่มหน้าต่าง
            </button>
          </div>

          <div className="mt-auto">
            <button
              onClick={onSummary}
              className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg"
            >
              📋 บันทึกข้อมูล

            </button>
          </div>
        </div>
      </div>
    </>
  );
}