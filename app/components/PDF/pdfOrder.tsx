// src/app/components/PDF/pdfOrder.tsx
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fontNormal, fontBold } from './fontTh'; 

interface OrderItem {
    id: string
    type_id: number
    side: string
    width: number
    height: number
    frame_color: string
    mesh_color: string
    handle: number
    frame: number
    topbutton: number
    short: number
    netsize: number
    cutnet: number
    phasedrill: number
    rope: number
    number_rope: number
}

interface OrderHeader {
    order_name: string
    order_date: string
}

const getTypeName = (typeId: number) => {
    switch (typeId) {
        case 10: return { label: "ประตู", isDouble: false };
        case 11: return { label: "ประตู(คู่)", isDouble: true };
        case 20: return { label: "หน้าต่าง", isDouble: false };
        case 21: return { label: "หน้าต่าง(คู่)", isDouble: true };
        case 99: return { label: "บานอิสระ", isDouble: false };
        default: return { label: "ไม่ระบุประเภท", isDouble: false };
    }
}

export const generateOrderPDF = (items: OrderItem[], header: OrderHeader | null) => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    doc.addFileToVFS("THSarabunNew.ttf", fontNormal);
    doc.addFont("THSarabunNew.ttf", "THSarabun", "normal");
    doc.addFileToVFS("THSarabunNew-Bold.ttf", fontBold);
    doc.addFont("THSarabunNew-Bold.ttf", "THSarabun", "bold");
    doc.setFont("THSarabun", "normal");

    doc.setFont("THSarabun", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); 
    doc.text(`ใบสั่งงาน: ${header?.order_name || '-'}`, 14, 15);

    doc.setFont("THSarabun", "normal");
    doc.setFontSize(12);
    doc.text(`วันที่: ${header ? new Date(header.order_date).toLocaleDateString('th-TH') : '-'}`, 14, 22);

    const tableData = items.map((item, index) => {
        const typeInfo = getTypeName(item.type_id);
        
        // ใช้ตรรกะ x2 แบบเดียวกับใน page.tsx
        const doubleSuffix = typeInfo.isDouble ? ' (x2)' : '';

        return [
            index + 1,
            `${typeInfo.label} ${item.side || ''}`,
            item.frame_color,
            item.mesh_color,
            item.width,
            item.height,
            // ช่องมือจับ เพิ่ม x2 ถ้าเป็นบานคู่
            item.handle ? `${item.handle.toFixed(1)}${doubleSuffix}` : "-",
            item.frame?.toFixed(1),
            item.topbutton?.toFixed(1),
            item.short ? item.short.toFixed(1) : "-",
            item.netsize?.toFixed(1),
            // ช่องจีบ เพิ่ม x2 ถ้าเป็นบานคู่
            item.cutnet ? `${item.cutnet.toFixed(0)}${doubleSuffix}` : "-",
            item.phasedrill?.toFixed(1),
            item.rope ? Math.floor(item.rope) : "-",
            item.number_rope
        ];
    });

    autoTable(doc, {
        startY: 28,
        theme: 'grid', 
        head: [
            [
                { content: 'บานที่', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'ประเภท', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'สี', colSpan: 2, styles: { halign: 'center' } },
                { content: 'ขนาด', colSpan: 2, styles: { halign: 'center' } },
                { content: 'ขนาดเส้นที่ต้องตัด', colSpan: 4, styles: { halign: 'center' } },
                { content: 'ขนาดผ้ามุ้ง', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'จีบ', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'ระยะเจาะ', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'ความยาวเชือก', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                { content: 'จำนวนเชือก', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
            ],
            [
                { content: 'กรอบ', styles: { halign: 'center' } },
                { content: 'ผ้ามุ้ง', styles: { halign: 'center' } },
                { content: 'กว้าง', styles: { halign: 'center' } },
                { content: 'สูง', styles: { halign: 'center' } },
                { content: 'มือจับ', styles: { halign: 'center' } },
                { content: 'รางข้าง', styles: { halign: 'center' } },
                { content: 'บนล่าง', styles: { halign: 'center' } },
                { content: 'เตี้ย', styles: { halign: 'center' } },
            ]
        ],
        body: tableData,
        styles: {
            font: 'THSarabun',
            fontSize: 12,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            cellPadding: 1.5,
            fillColor: [255, 255, 255],
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineWidth: 0.2,
            lineColor: [0, 0, 0]
        },
        alternateRowStyles: {
            fillColor: [255, 255, 255],
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'left', cellWidth: 35 },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' },
            6: { halign: 'center', cellWidth: 18 },
            7: { halign: 'center' },
            8: { halign: 'center' },
            9: { halign: 'center' },
            10: { halign: 'center' },
            11: { halign: 'center', cellWidth: 15 },
            12: { halign: 'center' },
            13: { halign: 'center' },
            14: { halign: 'center' },
        },
    });

    const fileName = `Order_${header?.order_name || 'doc'}.pdf`;
    doc.save(fileName);
};