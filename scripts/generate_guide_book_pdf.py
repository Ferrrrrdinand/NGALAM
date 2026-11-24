#!/usr/bin/env python3
"""
Generate comprehensive, professional PDF Guide Book for Ngalam Fix Pro
Covering all system flows, role architectures, operational standards, and step-by-step guides.
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Suppress headers/footers on cover page

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header
        self.drawString(20 * mm, 285 * mm, "NGALAM FIX PRO — BUKU PANDUAN SISTEM & ALUR OPERASIONAL")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(20 * mm, 282 * mm, 190 * mm, 282 * mm)

        # Footer
        self.line(20 * mm, 15 * mm, 190 * mm, 15 * mm)
        self.drawString(20 * mm, 10 * mm, "Dokumentasi Resmi Hak Cipta © 2026 Ngalam Fix Pro. Seluruh Hak Dilindungi.")
        page_text = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(190 * mm, 10 * mm, page_text)
        self.restoreState()

def build_pdf(filename="docs/NGALAM_FIX_PRO_GUIDE_BOOK.pdf"):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=22 * mm,
        bottomMargin=20 * mm
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#0f172a") # Slate 900
    accent_color = colors.HexColor("#d97706")  # Amber 600
    emerald_color = colors.HexColor("#059669") # Emerald 600
    body_color = colors.HexColor("#334155")    # Slate 700

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=colors.HexColor("#0f172a"),
        alignment=0,
        spaceAfter=10
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=25
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=accent_color,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=body_color,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'Callout_Text',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b")
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=1
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1e293b")
    )

    story = []

    # ==========================================
    # COVER PAGE
    # ==========================================
    story.append(Spacer(1, 20 * mm))
    story.append(Paragraph("<b>BUKU PANDUAN RESMI SISTEM OPERASIONAL</b>", ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=10, textColor=accent_color, spaceAfter=8)))
    story.append(Paragraph("NGALAM FIX PRO", title_style))
    story.append(Paragraph("Standar Operasional Prosedur (SOP), Arsitektur Fitur, dan Alur Kerja Lintas Peran (Administrator, Kasir Meja 1, Teknisi Lab, Mitra Afiliasi, dan Pelanggan/Member).", subtitle_style))
    
    story.append(HRFlowable(width="100%", thickness=3, color=accent_color, spaceBefore=5, spaceAfter=20))

    meta_table_data = [
        [Paragraph("<b>Domain Utama</b>", table_cell_style), Paragraph("https://ngalamfixpro.com", table_cell_style)],
        [Paragraph("<b>Status Sistem</b>", table_cell_style), Paragraph("Produksi (cPanel Node.js + MySQL + Vite)", table_cell_style)],
        [Paragraph("<b>Lokasi Workshop</b>", table_cell_style), Paragraph("Jl. Galunggung No. 12, Malang, Jawa Timur", table_cell_style)],
        [Paragraph("<b>Call Center / WhatsApp</b>", table_cell_style), Paragraph("+62 811-3185-858", table_cell_style)],
        [Paragraph("<b>Versi Dokumen</b>", table_cell_style), Paragraph("Edisi Lengkap 2026.1 (Revisi Komprehensif)", table_cell_style)],
        [Paragraph("<b>Sasaran Pembaca</b>", table_cell_style), Paragraph("Seluruh Staf Operasional, Teknisi, Kasir, Mitra Bisnis, & Tim Pengembang", table_cell_style)],
    ]
    meta_table = Table(meta_table_data, colWidths=[50 * mm, 120 * mm])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)

    story.append(Spacer(1, 25 * mm))

    # Ringkasan Cepat Box
    callout_data = [[
        Paragraph(
            "<b>PENTING:</b> Dokumen ini wajib dijadikan acuan baku dalam pelaksanaan servis meja terbuka, "
            "penerbitan struk transaksi kasir, aktivasi sertifikat garansi digital, perhitungan bagi hasil komisi mitra, "
            "serta penanganan komplain klaim garansi di workshop Ngalam Fix Pro.",
            callout_style
        )
    ]]
    callout_table = Table(callout_data, colWidths=[170 * mm])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fef3c7")), # Amber 100
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#f59e0b")),   # Amber 500
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(callout_table)

    story.append(PageBreak())

    # ==========================================
    # DAFTAR ISI & STRUKTUR PERAN
    # ==========================================
    story.append(Paragraph("1. STRUKTUR PERAN (ROLE) & HAK AKSES", h1_style))
    story.append(Paragraph(
        "Aplikasi Ngalam Fix Pro menerapkan kontrol akses berbasis peran (Role-Based Access Control / RBAC) "
        "yang memisahkan kewenangan staf internal, mitra eksternal, dan konsumen umum secara terisolasi dan aman.",
        body_style
    ))

    roles_data = [
        [Paragraph("Role / Hak Akses", table_header_style), Paragraph("Portal Akses", table_header_style), Paragraph("Kredensial / Login", table_header_style), Paragraph("Cakupan Wewenang", table_header_style)],
        [
            Paragraph("<b>Super Admin</b>", table_cell_style),
            Paragraph("<code>/login</code> (Tab Staf)", table_cell_style),
            Paragraph("ID Akun Admin + Password", table_cell_style),
            Paragraph("Akses penuh ke seluruh antrean servis, kasir, log sistem, konfigurasi iklan, laporan keuangan, & master data.", table_cell_style)
        ],
        [
            Paragraph("<b>Kasir (Front Desk)</b>", table_cell_style),
            Paragraph("<code>/login</code> (Tab Staf)", table_cell_style),
            Paragraph("Username Kasir + PIN/Sandi", table_cell_style),
            Paragraph("Intake pendaftaran unit walk-in (Meja 1), pelunasan kasir, cetak struk thermal 80mm/58mm, aktivasi garansi.", table_cell_style)
        ],
        [
            Paragraph("<b>Teknisi Lab</b>", table_cell_style),
            Paragraph("<code>/login</code> (Tab Staf)", table_cell_style),
            Paragraph("Username Teknisi + Sandi", table_cell_style),
            Paragraph("Pembaruan status 5-tahap pengerjaan unit (Antrean → Pengecekan → Pengerjaan → Selesai → Diambil).", table_cell_style)
        ],
        [
            Paragraph("<b>Mitra Afiliasi</b>", table_cell_style),
            Paragraph("<code>/mitra</code>", table_cell_style),
            Paragraph("Google OAuth 2.0 / Username + PIN", table_cell_style),
            Paragraph("Dashboard komisi (5%), cetak & unduh stiker QR Code unik mitra, pantau order rujukan, ajukan penarikan saldo.", table_cell_style)
        ],
        [
            Paragraph("<b>Pelanggan / Member</b>", table_cell_style),
            Paragraph("<code>/login</code> & <code>/lacak</code>", table_cell_style),
            Paragraph("Google OAuth / Nomor WhatsApp", table_cell_style),
            Paragraph("Tracking live progres unit servis, akses sertifikat garansi online, klaim garansi 1-klik, komisi referral member.", table_cell_style)
        ]
    ]

    roles_table = Table(roles_data, colWidths=[32 * mm, 38 * mm, 40 * mm, 60 * mm])
    roles_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(roles_table)
    story.append(Spacer(1, 5 * mm))

    # ==========================================
    # PERAN 1: KASIR & FRONT DESK (MEJA 1)
    # ==========================================
    story.append(Paragraph("2. PANDUAN ROLE: KASIR & FRONT DESK (MEJA 1)", h1_style))
    story.append(Paragraph(
        "Kasir bertanggung jawab terhadap titik awal penerimaan unit pelanggan fisik (Walk-in), "
        "pembayaran pelunasan di loket, dan pencetakan fisik tanda terima serta struk transaksi kasir.",
        body_style
    ))

    story.append(Paragraph("A. Alur Intake Pendaftaran Unit Masuk (Walk-in)", h2_style))
    story.append(Paragraph("• <b>Langkah 1:</b> Masuk ke Dashboard Staf (<code>/admin</code>), pilih tab <b>'Intake Walk-in Meja 1'</b>.", bullet_style))
    story.append(Paragraph("• <b>Langkah 2:</b> Pilih Merek Smartphone (iPhone, Samsung, Xiaomi, Oppo, Vivo, Realme, dll). Sistem akan menyajikan dropdown tipe unit populer beserta opsi custom model.", bullet_style))
    story.append(Paragraph("• <b>Langkah 3:</b> Pilih gejala kerusakan (LCD Pecah/Blank, Baterai Drop, IC Power/Mati Total, Konektor Cas, Kamera, dll). Estimasi biaya dasar akan otomatis terkalkulasi sesuai katalog lab.", bullet_style))
    story.append(Paragraph("• <b>Langkah 4:</b> Masukkan Nama Pelanggan dan Nomor WhatsApp aktif (format diawali 08... atau 62...).", bullet_style))
    story.append(Paragraph("• <b>Langkah 5:</b> Tekan tombol <b>'Daftarkan Unit & Masukkan Antrean Lab'</b>.", bullet_style))
    story.append(Paragraph("• <b>Langkah 6:</b> Sistem otomatis menerbitkan <b>Nomor Tiket Unik</b> (contoh: <code>NGF-20261124-7891</code>). Kasir dapat mencetak slip pendaftaran kasir (thermal 80mm) dan mengirimkan ringkasan tiket ke nomor WhatsApp pelanggan secara langsung.", bullet_style))

    story.append(Paragraph("B. Alur Pelunasan Kasir & Cetak Struk Transaksi", h2_style))
    story.append(Paragraph("• <b>Langkah 1:</b> Buka tab <b>'Kasir & Pembayaran'</b> atau <b>'Antrian Servis Unit'</b>.", bullet_style))
    story.append(Paragraph("• <b>Langkah 2:</b> Cari order berdasarkan Nomor Tiket atau Nama Pelanggan.", bullet_style))
    story.append(Paragraph("• <b>Langkah 3:</b> Pilih metode pembayaran (Tunai / Cash, QRIS Statis/Dinamis, atau Transfer Bank).", bullet_style))
    story.append(Paragraph("• <b>Langkah 4:</b> Tekan tombol <b>'Konfirmasi Pelunasan & Aktifkan Garansi'</b>. Transaksi seketika tercatat di buku kas keuangan dan sertifikat garansi aktif otomatis.", bullet_style))
    story.append(Paragraph("• <b>Langkah 5:</b> Tekan tombol <b>'Cetak Struk Thermal Kasir'</b>. Dialog printer sistem operasi akan muncul. Hasil struk sudah terformat presisi untuk kertas 80mm tanpa terpotong atau halaman kosong.", bullet_style))

    story.append(Spacer(1, 4 * mm))

    # ==========================================
    # PERAN 2: TEKNISI LAB & WORKSHOP
    # ==========================================
    story.append(Paragraph("3. PANDUAN ROLE: TEKNISI LAB WORKSHOP", h1_style))
    story.append(Paragraph(
        "Teknisi fokus pada pengerjaan fisik perangkat di meja laboratorium terbuka dan wajib memperbarui "
        "tahapan (step) servis secara berkala agar pelanggan dapat memantau secara langsung melalui sistem live tracking.",
        body_style
    ))

    tech_steps = [
        [Paragraph("Tahap", table_header_style), Paragraph("Label Status", table_header_style), Paragraph("Aksi Teknisi", table_header_style), Paragraph("Notifikasi Pelanggan", table_header_style)],
        [Paragraph("<b>Step 1</b>", table_cell_style), Paragraph("Antrean Masuk", table_cell_style), Paragraph("Penerimaan unit dari meja intake kasir.", table_cell_style), Paragraph("Unit masuk waiting list lab.", table_cell_style)],
        [Paragraph("<b>Step 2</b>", table_cell_style), Paragraph("Pemeriksaan Awal", table_cell_style), Paragraph("Bongkar unit, cek short circuit / arus daya DC Power.", table_cell_style), Paragraph("Status 'Sedang Didiagnosis Meja Terbuka'.", table_cell_style)],
        [Paragraph("<b>Step 3</b>", table_cell_style), Paragraph("Pengerjaan Hardware", table_cell_style), Paragraph("Penggantian sparepart (LCD, baterai, solder IC, dll).", table_cell_style), Paragraph("Status 'Proses Perbaikan Komponen'.", table_cell_style)],
        [Paragraph("<b>Step 4</b>", table_cell_style), Paragraph("Quality Control (QC)", table_cell_style), Paragraph("Uji charging, display touchscreen, kamera, speaker.", table_cell_style), Paragraph("Status 'Lolos Uji Fungsi & QC'.", table_cell_style)],
        [Paragraph("<b>Step 5</b>", table_cell_style), Paragraph("Unit Siap Diambil", table_cell_style), Paragraph("Unit dipindahkan ke loket kasir / pick-up point.", table_cell_style), Paragraph("Kirim pesan WhatsApp otomatis ke pelanggan.", table_cell_style)],
    ]
    tech_table = Table(tech_steps, colWidths=[20 * mm, 38 * mm, 62 * mm, 50 * mm])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(tech_table)

    story.append(PageBreak())

    # ==========================================
    # PERAN 3: MITRA AFILIASI BISNIS
    # ==========================================
    story.append(Paragraph("4. PANDUAN ROLE: MITRA AFILIASI BISNIS", h1_style))
    story.append(Paragraph(
        "Sistem Afiliasi Mitra Ngalam Fix Pro dirancang untuk menghubungkan konter HP rekanan, ojek online, "
        "dan komunitas lokal dengan sistem komisi otomatis 5% dari setiap nilai transaksi servis yang berhasil.",
        body_style
    ))

    story.append(Paragraph("A. Pendaftaran & Login Mitra", h2_style))
    story.append(Paragraph("• Akses portal resmi di <code>https://ngalamfixpro.com/mitra</code>.", bullet_style))
    story.append(Paragraph("• Mitra dapat mendaftar cepat menggunakan akun <b>Google 1-Klik</b> atau mengisi form registrasi (Nama, Kategori Mitra, WhatsApp, Username, Sandi).", bullet_style))
    story.append(Paragraph("• Setiap mitra baru otomatis menerima <b>Kode Unik Referral</b> (contoh: <code>MTR-007</code>) dan QR Code eksklusif.", bullet_style))

    story.append(Paragraph("B. Pemasaran & Operasional Stiker QR Code", h2_style))
    story.append(Paragraph("• <b>Cetak Stiker Fisik:</b> Di dashboard mitra tersedia tombol <b>'Cetak QR Stiker'</b> dan <b>'Unduh PNG Kartu'</b>. Mitra dapat menempelkan stiker ini di etalase toko atau helm/kendaraan.", bullet_style))
    story.append(Paragraph("• <b>Scan oleh Konsumen:</b> Saat konsumen memindai QR Code mitra, mereka diarahkan ke halaman booking dengan kode referal mitra terkunci otomatis di formulir.", bullet_style))
    story.append(Paragraph("• <b>Koleksi 100 Stiker Batch:</b> Admin kasir juga dapat mencetak lembar batch 100 stiker siap pakai melalui panel Mitra Admin untuk dibagikan saat sosialisasi lapangan.", bullet_style))

    story.append(Paragraph("C. Perhitungan & Penarikan Saldo Komisi (Payout)", h2_style))
    story.append(Paragraph("• Komisi 5% otomatis dikreditkan ke saldo akun mitra saat status order mencapai tahap Pelunasan Kasir.", bullet_style))
    story.append(Paragraph("• Mitra dapat melihat rincian histori unit yang masuk dari referensinya secara transparan.", bullet_style))
    story.append(Paragraph("• Penarikan dana dapat diajukan langsung melalui tombol <b>'Tarik Saldo Komisi'</b> (minimal Rp 50.000) ke rekening bank atau e-wallet mitra.", bullet_style))

    story.append(Spacer(1, 4 * mm))

    # ==========================================
    # PERAN 4: PELANGGAN (MEMBER) & GARANSI
    # ==========================================
    story.append(Paragraph("5. PANDUAN ROLE: PELANGGAN & SISTEM GARANSI", h1_style))
    story.append(Paragraph(
        "Pelanggan menikmati transparansi total pengerjaan tanpa perlu khawatir kecurangan komponen, "
        "didukung sistem garansi resmi digital anti-hilang.",
        body_style
    ))

    story.append(Paragraph("A. Portal Member & Login Cepat", h2_style))
    story.append(Paragraph("• Buka menu <b>'Portal Member'</b> di <code>https://ngalamfixpro.com/login</code>.", bullet_style))
    story.append(Paragraph("• <b>Login Google:</b> Cukup 1 klik tombol Masuk dengan Google. Sesi login tersinkronisasi instan.", bullet_style))
    story.append(Paragraph("• <b>Login WhatsApp + PIN:</b> Pelanggan dapat masuk menggunakan nomor handphone yang didaftarkan saat servis unit.", bullet_style))

    story.append(Paragraph("B. Masa Berlaku Garansi Resmi Workshop", h2_style))
    story.append(Paragraph("• <b>Garansi Resmi Baterai:</b> <b>90 Hari Penuh (3 Bulan)</b> untuk penggantian baterai original/premium lab.", bullet_style))
    story.append(Paragraph("• <b>Garansi Servis Hardware / Komponen:</b> <b>30 Hari (1 Bulan)</b> untuk perbaikan LCD, IC, konektor cas, dan motherboard.", bullet_style))
    story.append(Paragraph("• <b>Sertifikat Garansi Digital:</b> Tercatat di database cloud dengan Nomor Seri Garansi unik, tanggal mulai, dan batas akhir kedaluwarsa.", bullet_style))

    story.append(Paragraph("C. Alur Klaim Garansi 1-Klik", h2_style))
    story.append(Paragraph("• Pelanggan masuk ke tab <b>'Garansi Resmi'</b> pada Portal Member.", bullet_style))
    story.append(Paragraph("• Tekan tombol <b>'Klaim Garansi Servis'</b> pada unit yang masih dalam masa garansi aktif.", bullet_style))
    story.append(Paragraph("• Isi keluhan kendala yang dialami. Tiket klaim akan langsung diteruskan ke meja pimpinan teknisi prioritas tanpa antre dari nol.", bullet_style))

    story.append(Spacer(1, 4 * mm))

    # ==========================================
    # PERAN 5: SUPER ADMINISTRATOR
    # ==========================================
    story.append(Paragraph("6. PANDUAN ROLE: SUPER ADMINISTRATOR", h1_style))
    story.append(Paragraph(
        "Super Admin memiliki wewenang penuh atas operasional, keuangan, dan kontrol sistem digital Ngalam Fix Pro.",
        body_style
    ))
    story.append(Paragraph("• <b>Manajemen Kasir & Buku Keuangan:</b> Rekapitulasi omzet harian, laba kotor, biaya sparepart, dan komisi terbayar.", bullet_style))
    story.append(Paragraph("• <b>Export Data:</b> Kemampuan mengunduh laporan transaksi dalam format file Microsoft Excel (.xlsx) untuk pembukuan akuntansi.", bullet_style))
    story.append(Paragraph("• <b>Kelola Iklan & Banner Promosi:</b> Konfigurasi banner promo, diskon khusus member, dan pop-up informasi berkala.", bullet_style))
    story.append(Paragraph("• <b>Audit Log Aktivitas:</b> Memantau setiap login staf, perubahan status servis, dan riwayat transaksi untuk integritas data keamanan.", bullet_style))

    story.append(Spacer(1, 10 * mm))

    # Tanda Tangan Pengesahan
    sign_data = [
        [
            Paragraph("Dibuat & Diverifikasi Oleh:<br/><br/><br/><b>Tim Sistem Operasional & Dev</b><br/>Ngalam Fix Pro", table_cell_style),
            Paragraph("Disetujui & Ditetapkan Oleh:<br/><br/><br/><b>Pimpinan Workshop / Management</b><br/>Ngalam Fix Pro Malang", table_cell_style)
        ]
    ]
    sign_table = Table(sign_data, colWidths=[85 * mm, 85 * mm])
    sign_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(KeepTogether([sign_table]))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✅ Berhasil membuat Guide Book PDF: {filename} ({os.path.getsize(filename)} bytes)")

if __name__ == '__main__':
    build_pdf()
