"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Navbar() {
    const router = useRouter()
    const [open, setOpen] = useState(false)

    const handleNavigate = (path: string) => {
        router.push(path)
        setOpen(false)
    }

    return (
        <>
            <nav className="fixed top-0 left-0 w-full h-[130px] bg-white shadow-md z-50 flex flex-col justify-center">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        <div
                            className="flex-shrink-0 cursor-pointer"
                            // onClick={() => router.push("/")}
                        >
                            <h1 className="text-5xl font-bold text-black">
                                TK
                            </h1>
                        </div>

                        <div className="hidden md:flex space-x-4 items-center">
                            <button
                                onClick={() => router.push("/admin/summarytable")}
                                className="bg-amber-500  border-2 border-amber-600 text-xl text-white font-bold px-4 py-2 rounded-lg
                                hover:scale-110
                                 hover:bg-amber-600 transition shadow-sm"
                            >
                                ตารางงานทั้งหมด
                            </button>
                            <button
                                // onClick={() => router.push("/")}
                                className="bg-neutral-900 border-2 border-gray-400 text-white text-xl font-bold px-4 py-2 rounded-lg
                                hover:scale-110
                                 hover:bg-gray-800 transition"
                            >
                                📄 ใบเสนอราคา
                            </button>
                        </div>

                        <div className="flex items-center md:hidden">
                            <button
                                onClick={() => setOpen(!open)}
                                className="text-gray-700 hover:text-amber-500 focus:outline-none p-2"
                            >
                                <span className="text-2xl">☰</span>
                            </button>
                        </div>

                    </div>
                </div>

                {open && (
                    <div className="md:hidden bg-white border-t border-gray-100 shadow-lg w-full absolute top-[130px] left-0">
                        <div className="px-4 pt-2 pb-4 space-y-2 flex flex-col items-center">
                            <button
                                onClick={() => handleNavigate("/admin/summarytable")}
                                className="w-full text-center bg-amber-500 text-white font-bold px-4 py-3 rounded-lg hover:bg-amber-600 transition"
                            >
                                สร้างออเดอร์
                            </button>
                            <button
                                // onClick={() => handleNavigate("/")}
                                className="w-full text-center bg-gray-100 text-black font-bold px-4 py-3 rounded-lg hover:bg-gray-200 transition"
                            >
                                📄 ใบเสนอราคา
                            </button>
                        </div>
                    </div>
                )}
            </nav>
            <div className="h-16"></div>
        </>
    )
}