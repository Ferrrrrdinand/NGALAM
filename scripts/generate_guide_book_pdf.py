#!/usr/bin/env python3
"""
Generate a comprehensive, premium, beginner-friendly (gaptek-friendly) illustrated PDF Guide Book
for Ngalam Fix Pro.

Key improvements:
1. Formal Cover Page with decorative header/footer suppress.
2. Formal Table of Contents (Daftar Isi) with dotted leaders and page numbers.
3. Preserved exact 16:10 aspect ratio for all screenshots (width 170mm x height 106.25mm) so images never appear squished / gepeng.
4. Annotated screenshots with numbered markers (1, 2, 3...) pointing to exact buttons/forms.
5. Consistent page layout, clear chapter headings, and gaptek-friendly step-by-step boxes.
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Image
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
        # Suppress headers/footers on Cover Page (Page 1)
        if self._pageNumber == 1:
            return

        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))

        # Running Header
        self.drawString(18 * mm, 287 * mm, "NGALAM FIX PRO — BUKU PANDUAN PENGGUNA BERGAMBAR")
        self.setFont("Helvetica", 8)
        self.drawRightString(192 * mm, 287 * mm, "SOP RESMI OPERASIONAL & KEMITRAAN 2026")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.6)
        self.line(18 * mm, 284 * mm, 192 * mm, 284 * mm)

        # Running Footer
        self.line(18 * mm, 14 * mm, 192 * mm, 14 * mm)
        self.drawString(18 * mm, 9.5 * mm, "Dokumentasi Resmi Hak Cipta © 2026 Ngalam Fix Pro. Workshop Servis HP & iPhone Malang.")
        page_text = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(192 * mm, 9.5 * mm, page_text)
        self.restoreState()

def build_complete_pdf(filename="docs/NGALAM_FIX_PRO_GUIDE_BOOK.pdf"):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=20 * mm,
        bottomMargin=18 * mm
    )

    styles = getSampleStyleSheet()

    # Brand Colors
    c_primary = colors.HexColor("#0f172a") # Slate 900
    c_accent  = colors.HexColor("#d97706") # Amber 600
    c_blue    = colors.HexColor("#1d4ed8") # Blue 700
    c_green   = colors.HexColor("#047857") # Emerald 700
    c_slate   = colors.HexColor("#334155") # Slate 700
    c_border  = colors.HexColor("#cbd5e1") # Slate 300

    # Typography
    cover_title = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=c_primary,
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'ChapterHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SubHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_accent,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'MainBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=c_slate,
        spaceAfter=5
    )

    step_box_style = ParagraphStyle(
        'StepBoxStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.8,
        leading=13,
        textColor=colors.HexColor("#0f172a")
    )

    caption_style = ParagraphStyle(
        'CaptionStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748b"),
        alignment=1,
        spaceBefore=4,
        spaceAfter=8
    )

    tbl_hdr = ParagraphStyle(
        'TblHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=1
    )

    tbl_cell = ParagraphStyle(
        'TblCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11,
        textColor=colors.HexColor("#1e293b")
    )

    toc_title_style = ParagraphStyle(
        'TocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=c_primary
    )

    toc_page_style = ParagraphStyle(
        'TocPage',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=c_accent,
        alignment=2
    )

    story = []

    def make_box(content_html, bg_hex="#f1f5f9", border_hex="#cbd5e1", title=None):
        full_text = ""
        if title:
            full_text += f"<font size='9' color='{border_hex}'><b>{title}</b></font><br/><br/>"
        full_text += content_html
        p = Paragraph(full_text, step_box_style)
        t = Table([[p]], colWidths=[174 * mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(bg_hex)),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor(border_hex)),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        return t

    # Exact 16:10 aspect ratio calculation
    # Width 170mm -> Height = 170 / 1.6 = 106.25mm
    # For compact screens (height 95mm -> width 152mm)
    def add_screenshot(img_filename, caption_text, width=170*mm, height=106.25*mm, use_annotated=True):
        annotated_path = f"docs/screenshots/annotated/{img_filename}"
        normal_path = f"docs/screenshots/{img_filename}"
        if use_annotated and os.path.exists(annotated_path):
            chosen_path = annotated_path
        else:
            chosen_path = normal_path

        if os.path.exists(chosen_path):
            img = Image(chosen_path, width=width, height=height)
            caption = Paragraph(f"<b>Gambar Panduan:</b> {caption_text}", caption_style)
            return KeepTogether([img, caption])
        return Paragraph(f"<i>[Gambar: {caption_text}]</i>", caption_style)

    # =========================================================================
    # HALAMAN 1: COVER RESMI EKSKLUSIF
    # =========================================================================
    story.append(Spacer(1, 20 * mm))
    story.append(Paragraph("<font color='#d97706'><b>BUKU PANDUAN PENGGUNA BERGAMBAR (EDISI LENGKAP 2026)</b></font>", ParagraphStyle('CoverBadge', fontName='Helvetica-Bold', fontSize=10.5, spaceAfter=8)))
    story.append(Paragraph("PETUNJUK OPERASIONAL & ALUR SISTEM<br/><font color='#d97706'>NGALAM FIX PRO</font>", cover_title))
    story.append(Paragraph(
        "Buku pedoman resmi alur kerja terpadu seluruh peran sistem: <b>Kasir Meja 1, Teknisi Lab Workshop, "
        "Mitra Bisnis Afiliasi, Pelanggan / Member, dan Super Admin</b>. Disusun secara visual langkah-demi-langkah "
        "disertai tangkapan layar berpenanda nomor agar sangat mudah dimengerti bahkan oleh pengguna awam (gaptek).",
        body_style
    ))
    story.append(HRFlowable(width="100%", thickness=2.5, color=c_accent, spaceBefore=6, spaceAfter=14))

    # Hero Cover Image (Homepage) - Menggunakan screenshot bersih ASLI tanpa penanda/garis kotak
    story.append(add_screenshot("01_homepage.png", "Tampilan Utama Website Resmi Ngalam Fix Pro (https://ngalamfixpro.com)", width=174*mm, height=108.75*mm, use_annotated=False))

    story.append(Spacer(1, 4 * mm))
    cover_meta = [
        [Paragraph("<b>Alamat Website Resmi</b>", tbl_cell), Paragraph("<code>https://ngalamfixpro.com</code> (Online 24 Jam)", tbl_cell)],
        [Paragraph("<b>Lokasi Workshop Lab</b>", tbl_cell), Paragraph("Jl. Galunggung No. 12, Malang, Jawa Timur", tbl_cell)],
        [Paragraph("<b>Call Center & CS WhatsApp</b>", tbl_cell), Paragraph("+62 811-3185-858 (Konsultasi & Layanan Cepat)", tbl_cell)],
        [Paragraph("<b>Sasaran Pembaca</b>", tbl_cell), Paragraph("Kasir Counter, Teknisi Lab, Mitra Driver Ojol / Rekanan, Pelanggan, & Pimpinan Toko", tbl_cell)],
        [Paragraph("<b>Status Dokumen</b>", tbl_cell), Paragraph("RESMI & TERVERIFIKASI (Standar Mutu Lab 2026)", tbl_cell)],
    ]
    t_cover_meta = Table(cover_meta, colWidths=[52 * mm, 122 * mm])
    t_cover_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_cover_meta)

    story.append(PageBreak())

    # =========================================================================
    # HALAMAN 2: DAFTAR ISI (TABLE OF CONTENTS) & PENGENALAN PERAN
    # =========================================================================
    story.append(Paragraph("DAFTAR ISI & STRUKTUR PANDUAN", h1_style))
    story.append(Paragraph(
        "Gunakan daftar isi di bawah ini untuk langsung menuju bab panduan yang sesuai dengan tugas atau kebutuhan Anda:",
        body_style
    ))
    story.append(Spacer(1, 2 * mm))

    toc_items = [
        ("BAB 1: MEMAHAMI PERAN (ROLE) & HAK AKSES PENGGUNA", "Halaman 3"),
        ("• Tabel Pemetaan 5 Peran Utama & Kredensial Akses", "Halaman 3"),
        ("• Tips Praktis bagi Pengguna Awam / Gaptek", "Halaman 3"),
        ("BAB 2: PANDUAN ROLE KASIR & FRONT DESK (MEJA 1)", "Halaman 4"),
        ("• Langkah 1 s/d 4: Pendaftaran Unit Walk-in Offline", "Halaman 4"),
        ("• Penjelasan Penanda Screenshot Meja 1 Kasir", "Halaman 4"),
        ("BAB 3: ALUR PELUNASAN KASIR & CETAK STRUK THERMAL", "Halaman 5"),
        ("• SOP Transaksi Bayar & Aktivasi Garansi Resmi", "Halaman 5"),
        ("• Memantau Seluruh Antrean Servis Toko", "Halaman 6"),
        ("BAB 4: PANDUAN ROLE TEKNISI LAB WORKSHOP", "Halaman 7"),
        ("• Layar Meja Kerja & Kontrol Tahapan Pengerjaan", "Halaman 7"),
        ("• Arti & Panduan 5 Tahap Servis Lab (Step 1 s/d 5)", "Halaman 7"),
        ("BAB 5: PANDUAN ROLE MITRA AFILIASI BISNIS", "Halaman 8"),
        ("• Pendaftaran Instan Google OAuth & Kode Referral", "Halaman 8"),
        ("• Pemanfaatan Stiker QR Code & Perhitungan Komisi 5%", "Halaman 8"),
        ("• Layar Manajemen 100 Stiker Batch Siap Pakai", "Halaman 9"),
        ("BAB 6: PANDUAN ROLE PELANGGAN (KONSUMEN)", "Halaman 10"),
        ("• Lacak Progres Servis Live 24 Jam (Tanpa Login)", "Halaman 10"),
        ("• Portal Member Google 1-Klik & Riwayat Transaksi", "Halaman 10"),
        ("BAB 7: JAMINAN GARANSI RESMI & BOOKING ONLINE", "Halaman 11"),
        ("• Standar Garansi Baterai 90 Hari & Hardware 30 Hari", "Halaman 11"),
        ("• Database Sertifikat Garansi & Klaim 1-Klik", "Halaman 11"),
        ("• Formulir Pemesanan Servis dari Rumah", "Halaman 12"),
        ("BAB 8: PERTANYAAN UMUM (FAQ) & LEMBAR PENGESAHAN", "Halaman 13"),
        ("• Solusi Masalah Cetak Blank, Sesi Login, & Tiket Lupa", "Halaman 13"),
        ("• Lembar Pengesahan Dokumen Direksi Ngalam Fix Pro", "Halaman 13"),
    ]

    toc_table_data = []
    for title, pg in toc_items:
        is_sub = title.startswith("•")
        t_style = ParagraphStyle('SubToc', parent=toc_title_style, fontName='Helvetica', leftIndent=10, textColor=colors.HexColor("#475569")) if is_sub else toc_title_style
        dots = ". " * 32 if not is_sub else ". " * 30
        toc_table_data.append([
            Paragraph(f"{title} <font color='#cbd5e1'>{dots}</font>", t_style),
            Paragraph(pg, toc_page_style)
        ])

    t_toc = Table(toc_table_data, colWidths=[146 * mm, 28 * mm])
    t_toc.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 1.8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.8),
    ]))
    story.append(t_toc)

    story.append(PageBreak())

    # =========================================================================
    # HALAMAN 3: BAB 1 - MEMAHAMI PERAN & AKSES
    # =========================================================================
    story.append(Paragraph("BAB 1: MEMAHAMI PERAN (ROLE) & HAK AKSES PENGGUNA", h1_style))
    story.append(Paragraph(
        "Website Ngalam Fix Pro dirancang menggunakan sistem hak akses berlapis (Role-Based Access Control). "
        "Artinya, setiap pengguna hanya melihat tombol dan menu yang dibutuhkan sesuai tugasnya:",
        body_style
    ))

    role_table_data = [
        [Paragraph("Peran Pengguna", tbl_hdr), Paragraph("Kredensial / Login", tbl_hdr), Paragraph("Alamat URL Masuk", tbl_hdr), Paragraph("Wewenang Utama", tbl_hdr)],
        [
            Paragraph("<b>1. Kasir (Meja 1)</b>", tbl_cell),
            Paragraph("Username: <code>kasir</code><br/>+ Password Kasir", tbl_cell),
            Paragraph("<code>/login?tab=staff</code>", tbl_cell),
            Paragraph("Menerima HP rusak, mencetak nota pendaftaran, konfirmasi pembayaran lunas, cetak struk kasir.", tbl_cell)
        ],
        [
            Paragraph("<b>2. Teknisi Lab</b>", tbl_cell),
            Paragraph("Username: <code>rian</code> dll<br/>+ Password Teknisi", tbl_cell),
            Paragraph("<code>/login?tab=staff</code>", tbl_cell),
            Paragraph("Membongkar HP di meja terbuka, ganti sparepart, update tombol tahapan servis 1 s/d 5.", tbl_cell)
        ],
        [
            Paragraph("<b>3. Mitra Afiliasi</b>", tbl_cell),
            Paragraph("Akun Google 1-Klik /<br/>Username & Sandi", tbl_cell),
            Paragraph("<code>/mitra</code>", tbl_cell),
            Paragraph("Melihat saldo komisi 5%, cetak stiker QR Code unik, memantau order dari referensinya.", tbl_cell)
        ],
        [
            Paragraph("<b>4. Pelanggan (Member)</b>", tbl_cell),
            Paragraph("Nomor Tiket / WhatsApp /<br/>Google 1-Klik", tbl_cell),
            Paragraph("<code>/lacak</code> &<br/><code>/login</code>", tbl_cell),
            Paragraph("Memantau posisi pengerjaan HP secara live, melihat kartu garansi digital, ajukan klaim garansi.", tbl_cell)
        ],
        [
            Paragraph("<b>5. Super Admin</b>", tbl_cell),
            Paragraph("Username: <code>admin</code><br/>+ Password Super", tbl_cell),
            Paragraph("<code>/login?tab=staff</code>", tbl_cell),
            Paragraph("Akses semua fitur, pantau buku kas keuangan, unduh rekapan Excel, pasang banner iklan.", tbl_cell)
        ],
    ]
    t_roles = Table(role_table_data, colWidths=[34*mm, 40*mm, 38*mm, 62*mm])
    t_roles.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
    ]))
    story.append(t_roles)
    story.append(Spacer(1, 5 * mm))

    # Tips Gaptek Friendly Box
    tips_gaptek = (
        "<b>PANDUAN MUDAH BAGI PENGGUNA AWAM (GAPTEK):</b><br/>"
        "• <b>Jika Anda Pelanggan:</b> Anda <b>TIDAK PERLU</b> login atau membuat akun! Cukup buka menu <b>'Lacak Servis'</b> di HP Anda, ketik nomor tiket atau nomor WhatsApp, progres HP Anda langsung terlihat jelas.<br/>"
        "• <b>Jika Anda Mitra Ojol / Toko:</b> Cukup klik 1 kali tombol <b>'Masuk dengan Google'</b> di portal mitra, akun Anda langsung jadi otomatis tanpa harus menghafal username baru.<br/>"
        "• <b>Jika Anda Kasir / Teknisi:</b> Pastikan membuka tab <b>'Login Staf Workshop'</b> pada halaman login."
    )
    story.append(make_box(tips_gaptek, bg_hex="#ecfdf5", border_hex="#059669", title="💡 TIPS PRAKTIS UNTUK PEMULA"))

    story.append(PageBreak())

    # =========================================================================
    # HALAMAN 4: BAB 2 - KASIR WALK-IN MEJA 1
    # =========================================================================
    story.append(Paragraph("BAB 2: PANDUAN ROLE KASIR & FRONT DESK (MEJA 1)", h1_style))
    story.append(Paragraph(
        "Petugas kasir bertugas melayani pelanggan yang datang langsung ke toko membawa smartphone rusak (Walk-in). "
        "Ikuti urutan langkah bernomor sesuai penanda pada gambar di bawah:",
        body_style
    ))

    # Gambar Meja 1 Walk-in dengan penanda
    story.append(add_screenshot("07_admin_walkin.png", "Layar Kasir Meja 1: Formulir Pendaftaran Unit Walk-in dengan Penanda Nomor", width=170*mm, height=106.25*mm))

    story.append(Paragraph("Panduan Langkah Pendaftaran Unit Masuk:", h2_style))
    penjelasan_walkin = (
        "<b>LANGKAH-LANGKAH PENDAFTARAN (SESUAI NOMOR PENANDA):</b><br/>"
        "<b>[1] PILIH MEREK HP:</b> Klik logo merek handphone pelanggan (iPhone, Samsung, Xiaomi, Oppo, Vivo, Realme, dll).<br/>"
        "<b>[2] PILIH TIPE & KERUSAKAN:</b> Pilih tipe model HP pada dropdown yang muncul, lalu klik keluhan kerusakan (misal: <i>LCD Pecah/Blank</i>, <i>Baterai Drop</i>). Estimasi harga sparepart & jasa akan otomatis terhitung di sistem.<br/>"
        "<b>[3] DATA PELANGGAN:</b> Masukkan Nama Pelanggan dan Nomor WhatsApp aktif (format 08... atau 62...). Nomor ini akan otomatis menerima pesan WhatsApp notifikasi nomor tiket pendaftaran.<br/>"
        "<b>[4] SIMPAN & CETAK NOTA:</b> Klik tombol hijau <b>'Daftarkan Unit & Masukkan Antrean Lab'</b>. Layar akan menampilkan Nomor Tiket Unik (contoh: <code>NGF-20261124-7891</code>). Klik <b>'Cetak Tanda Terima'</b> untuk mencetak nota kasir thermal 80mm."
    )
    story.append(make_box(penjelasan_walkin, bg_hex="#eff6ff", border_hex="#2563eb", title="📌 CARA MENERIMA HP DARI KONSUMEN"))

    story.append(PageBreak())

    # =========================================================================
    # HALAMAN 5: BAB 3 - KASIR PELUNASAN & STRUK CETAK
    # =========================================================================
    story.append(Paragraph("BAB 3: ALUR PELUNASAN KASIR & CETAK STRUK TRANSAKSI", h1_style))
    story.append(Paragraph(
        "Saat pengerjaan HP telah selesai di lab dan pelanggan datang ke counter untuk mengambil unit serta membayar tagihan:",
        body_style
    ))

    # Screenshot Kasir Pelunasan dengan Penanda
    story.append(add_screenshot("08_admin_cashier.png", "Layar Kasir Pelunasan Transaksi & Aktivasi Garansi Resmi (Lengkap Penanda)", width=170*mm, height=106.25*mm))

    story.append(Paragraph("Panduan Langkah Pelunasan Transaksi Kasir:", h2_style))
    penjelasan_kasir = (
        "<b>URUTAN PROSES PELUNASAN KASIR (SESUAI NOMOR PENANDA):</b><br/>"
        "<b>[1] CARI TAGIHAN:</b> Ketik nama pelanggan atau nomor tiket servis pada kolom pencarian.<br/>"
        "<b>[2] CEK RINCIAN BIAYA:</b> Periksa rincian biaya sparepart, jasa servis, dan diskon promo member (jika ada).<br/>"
        "<b>[3] METODE BAYAR & CETAK STRUK:</b><br/>"
        "• Tanyakan cara bayar pelanggan: Uang Tunai (Cash), QRIS Scan, atau Transfer Bank.<br/>"
        "• Klik tombol hijau <b>'Konfirmasi Lunas & Aktifkan Garansi Sekarang'</b>.<br/>"
        "• Klik tombol hitam <b>'Cetak Struk Thermal'</b>. Mesin printer thermal 80mm akan mencetak struk kasir rapi & jelas.<br/>"
        "• Sertifikat Garansi Digital di sistem detik itu juga langsung aktif!"
    )
    story.append(make_box(penjelasan_kasir, bg_hex="#fffbeb", border_hex="#d97706", title="💳 SOP PENYELESAIAN DI MEJA KASIR"))

    story.append(PageBreak())

    # =========================================================================
    # HALAMAN 6: BAB 3.2 - ANTREAN SERVIS UTAMA
    # =========================================================================
    story.append(Paragraph("BAB 3.2: MEMANTAU SELURUH ANTREAN SERVIS TOKO", h1_style))
    story.append(Paragraph(
        "Menu <b>'Antrian Servis Unit'</b> adalah pusat pemantauan seluruh unit yang ada di toko. "
        "Kasir, teknisi, dan admin dapat saling melihat status pengerjaan secara real-time tanpa salah paham:",
        body_style
    ))

    # Screenshot Antrean Servis dengan Penanda
    story.append(add_screenshot("06_admin_orders.png", "Layar Antrean Servis Unit: Pusat Kontrol Status Seluruh Handphone Masuk", width=170*mm, height=106.25*mm))

    story.append(Paragraph("Fungsi Bagian-Bagian Layar Antrean:", h2_style))
    penjelasan_antrean = (
        "<b>PENJELASAN ELEMEN LAYAR ANTREAN:</b><br/>"
        "<b>[1] BILAH NAVIGASI KIRI (SIDEBAR):</b> Akses cepat berpindah antar menu (Antrean, Meja Walk-in, Kasir, Teknisi, Mitra, Garansi, dll). Tab yang aktif akan otomatis tersimpan di memori browser Anda.<br/>"
        "<b>[2] KOLOM CARI CEPAT:</b> Cukup ketik beberapa huruf nama pelanggan, merek HP, atau nomor WhatsApp untuk menemukan data unit.<br/>"
        "<b>[3] TABEL STATUS ANTREAN:</b> Menampilkan nomor tiket, nama pemilik, tipe HP, estimasi biaya, nama teknisi yang memegang, dan tombol aksi detail pengerjaan."
    )
    story.append(make_box(penjelasan_antrean, bg_hex="#f8fafc", border_hex="#64748b", title="🔍 PANDUAN NAVIGASI DAFTAR ANTREAN"))

    story.append(PageBreak())

    # =========================================================================
    # HALAMAN 7: BAB 4 - TEKNISI LAB WORKSHOP
    # =========================================================================
    story.append(Paragraph("BAB 4: PANDUAN ROLE TEKNISI LAB WORKSHOP", h1_style))
    story.append(Paragraph(
        "Teknisi bekerja di meja laboratorium terbuka. Tugas teknisi di sistem sangat mudah: "
        "<b>cukup geser tombol tahapan status sesuai kondisi pengerjaan fisik HP yang sebenarnya di meja kerja</b>.",
        body_style
    ))

    # Screenshot Meja Teknisi dengan Penanda
    story.append(add_screenshot("11_teknisi_dashboard.png", "Layar Meja Kerja Teknisi: Kontrol Cepat Tahapan Servis HP (Step 1 s/d 5)", width=170*mm, height=106.25*mm))

    story.append(Paragraph("Panduan 5 Tahapan Servis yang Wajib Digeser Teknisi:", h2_style))

    tahap_data = [
        [Paragraph("Tahap", tbl_hdr), Paragraph("Nama Status", tbl_hdr), Paragraph("Kapan Teknisi Menekan Tombol Ini?", tbl_hdr), Paragraph("Apa yang Terlihat di HP Pelanggan?", tbl_hdr)],
        [
            Paragraph("<b>Step 1</b>", tbl_cell),
            Paragraph("<font color='#d97706'><b>Antrean Masuk</b></font>", tbl_cell),
            Paragraph("Saat HP baru diterima dari meja kasir depan.", tbl_cell),
            Paragraph("Pelanggan tahu unitnya sudah masuk antrean lab.", tbl_cell)
        ],
        [
            Paragraph("<b>Step 2</b>", tbl_cell),
            Paragraph("<font color='#2563eb'><b>Pemeriksaan Awal</b></font>", tbl_cell),
            Paragraph("Saat teknisi mulai membongkar baut & ukur tegangan IC.", tbl_cell),
            Paragraph("Pelanggan tahu HP sedang dianalisis di meja terbuka.", tbl_cell)
        ],
        [
            Paragraph("<b>Step 3</b>", tbl_cell),
            Paragraph("<font color='#7c3aed'><b>Pengerjaan Hardware</b></font>", tbl_cell),
            Paragraph("Saat teknisi memasang sparepart baru (LCD / baterai / fleksibel).", tbl_cell),
            Paragraph("Pelanggan melihat status 'Proses Pemasangan Komponen'.", tbl_cell)
        ],
        [
            Paragraph("<b>Step 4</b>", tbl_cell),
            Paragraph("<font color='#059669'><b>Quality Control (QC)</b></font>", tbl_cell),
            Paragraph("Saat pengetesan layar sentuh, kamera, audio, dan tes cas.", tbl_cell),
            Paragraph("Pelanggan tahu HP sudah lulus uji kelayakan fungsi.", tbl_cell)
        ],
        [
            Paragraph("<b>Step 5</b>", tbl_cell),
            Paragraph("<font color='#16a34a'><b>Unit Siap Diambil</b></font>", tbl_cell),
            Paragraph("HP dipindahkan ke loket kasir depan siap diserahkan.", tbl_cell),
            Paragraph("Sistem mengirim WhatsApp: 'HP Anda sudah selesai & siap diambil'.", tbl_cell)
        ],
    ]
    t_tahap = Table(tahap_data, colWidths=[22*mm, 38*mm, 60*mm, 54*mm])
    t_tahap.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_tahap)

    story.append(PageBreak())

    # =========================================================================
    # HALAMAN 8: BAB 5 - MITRA AFILIASI BISNIS
    # =========================================================================
    story.append(Paragraph("BAB 5: PANDUAN ROLE MITRA AFILIASI BISNIS", h1_style))
    story.append(Paragraph(
        "Program Kemitraan Ngalam Fix Pro adalah peluang penghasilan bagi siapa saja (Driver Ojek Online, Pemilik Konter Pulsa, "
        "Komunitas, Teman Kantor). Kenalkan teman yang HP-nya rusak, Anda mendapatkan <b>komisi 5% bersih</b> dari total nilai servis!",
        body_style
    ))

    # Screenshot Portal Mitra dengan Penanda
    story.append(add_screenshot("04_portal_mitra.png", "Portal Masuk & Registrasi Cepat Mitra Resmi (Lengkap Penanda Nomor)", width=170*mm, height=106.25*mm))

    story.append(Paragraph("Cara Daftar & Mendapatkan Uang Komisi:", h2_style))
    penjelasan_mitra = (
        "<b>LANGKAH MUDAH BERGABUNG SEBAGAI MITRA:</b><br/>"
        "<b>[1] DAFTAR GOOGLE 1-KLIK:</b> Buka <code>https://ngalamfixpro.com/mitra</code>. Klik tombol 'Masuk / Daftar dengan Google'. Akun Anda detik itu juga langsung aktif!<br/>"
        "<b>[2] KODE REFERRAL & STIKER QR:</b> Setiap mitra otomatis mendapatkan Kode Referral unik (contoh: <code>MTR-005</code>). Download gambar QR Code Anda, lalu tempel di etalase atau kendaraan.<br/>"
        "<b>[3] BAGIKAN KE TEMAN:</b> Klik 'Salin Link Booking', kirimkan ke WhatsApp rekan atau grup Anda. Begitu mereka melakukan perbaikan di Ngalam Fix Pro, komisi 5% otomatis masuk ke saldo Anda!<br/>"
        "<b>[4] PENARIKAN UANG (PAYOUT):</b> Saat saldo mencapai minimal Rp 50.000, tekan tombol 'Tarik Saldo Komisi'. Dana langsung ditransfer ke rekening bank atau e-wallet Anda (DANA, Gopay, OVO, ShopeePay)."
    )
    story.append(make_box(penjelasan_mitra, bg_hex="#ecfdf5", border_hex="#047857", title="💰 PANDUAN PENGHASILAN MITRA RESMI"))

    story.append(PageBreak())

    # =========================================================================
    # HALAMAN 9: BAB 5.2 - KOLEKSI 100 STIKER QR MITRA
    # =========================================================================
    story.append(Paragraph("BAB 5.2: DISTRIBUSI KOLEKSI 100 STIKER QR MITRA", h1_style))
    story.append(Paragraph(
        "Untuk mempermudah tim lapangan dan kasir, sistem menyediakan koleksi 100 Stiker QR Code siap pakai. "
        "Stiker ini dapat dicetak sekaligus dalam lembaran stiker untuk dibagikan ke driver ojol dan konter rekanan:",
        body_style
    ))

    # Screenshot 100 Stiker Mitra dengan Penanda
    story.append(add_screenshot("09_admin_mitra.png", "Layar Manajemen & Cetak Koleksi 100 Stiker QR Code Mitra Siap Pakai", width=170*mm, height=106.25*mm))

    story.append(Paragraph("Fitur Manajemen Stiker Mitra:", h2_style))
    penjelasan_stiker_mitra = (
        "<b>FITUR PADA LAYAR STIKER MITRA:</b><br/>"
        "<b>[1] STATISTIK KOMISI MITRA:</b> Melihat total uang komisi yang sudah dibayarkan kepada mitra rekanan di Malang.<br/>"
        "<b>[2] TOMBOL CETAK 100 STIKER (.ZIP):</b> Kasir atau admin dapat mendownload seluruh 100 file stiker dalam format ZIP atau mencetaknya langsung ke kertas stiker A4.<br/>"
        "<b>[3] STATUS KEPEMILIKAN STIKER:</b> Stiker yang belum bertuan bertuliskan 'Belum Ada Pemilik'. Saat dibagikan ke mitra baru, kasir cukup mengetik nama dan nomor HP mitra untuk mengaktifkan komisinya."
    )
    story.append(make_box(penjelasan_stiker_mitra, bg_hex="#fffbeb", border_hex="#d97706", title="🏷️ PANDUAN CETAK & BAGIKAN STIKER"))

    story.append(PageBreak())

    # =========================================================================
    # HALAMAN 10: BAB 6 - PELANGGAN & LACAK SERVIS LIVE
    # =========================================================================
    story.append(Paragraph("BAB 6: PANDUAN ROLE PELANGGAN (KONSUMEN)", h1_style))
    story.append(Paragraph(
        "Bagi pelanggan yang sedang memperbaiki smartphone, website Ngalam Fix Pro memberikan kenyamanan maksimal. "
        "<b>Tidak perlu login atau instal aplikasi apapun untuk mengecek progres pengerjaan HP Anda!</b>",
        body_style
    ))

    # Screenshot Lacak Servis dengan Penanda
    story.append(add_screenshot("02_lacak_servis.png", "Layar Lacak Servis Online: Pantau Progres Pengerjaan HP Transparan 24 Jam", width=170*mm, height=106.25*mm))

    story.append(Paragraph("Cara Mudah Melacak Servis HP Anda:", h2_style))
    penjelasan_lacak = (
        "<b>CARA CEK STATUS SERVIS SECARA LIVE:</b><br/>"
        "<b>[1] KETIK TIKET / NOMOR HP:</b> Buka link <code>https://ngalamfixpro.com/lacak</code>. Ketikkan Nomor Tiket Anda (contoh: <code>NGF-20261124-7891</code>) ATAU ketik Nomor WhatsApp Anda.<br/>"
        "<b>[2] KLIK CARI:</b> Tekan tombol biru <b>'Cari Progres Servis'</b>.<br/>"
        "<b>[3] LIHAT PROGRES LIVE:</b> Layar seketika menampilkan posisi pengerjaan unit Anda (apakah sedang dibongkar, dipasang sparepart, atau sudah siap diambil di kasir) secara transparan!"
    )
    story.append(make_box(penjelasan_lacak, bg_hex="#eff6ff", border_hex="#2563eb", title="📱 PANDUAN LACAK MANDIRI KONSUMEN"))

    story.append(PageBreak())

    # =========================================================================
    # HALAMAN 11: BAB 7 - JAMINAN GARANSI RESMI & DATABASE
    # =========================================================================
    story.append(Paragraph("BAB 7: JAMINAN GARANSI RESMI & DATABASE SERTIFIKAT", h1_style))
    story.append(Paragraph(
        "Seluruh perbaikan di Ngalam Fix Pro dilindungi garansi digital anti-hilang. "
        "Bahkan jika struk kertas Anda hilang, hak garansi tetap tercatat aman di database cloud workshop:",
        body_style
    ))

    # Screenshot Warranties dengan Penanda
    story.append(add_screenshot("10_admin_warranties.png", "Layar Database Sertifikat Garansi Resmi Digital (Hardware & Baterai)", width=170*mm, height=106.25*mm))

    garansi_box = (
        "<b>STANDAR MASA BERLAKU GARANSI RESMI WORKSHOP:</b><br/>"
        "• <b>Ganti Baterai:</b> <b>GARANSI 90 HARI PENUH (3 BULAN)</b>. Jika baterai kembung, boros drastis, atau tidak mengisi, kami ganti baterai baru tanpa dipungut biaya apapun!<br/>"
        "• <b>Ganti Layar LCD & Komponen Hardware:</b> <b>GARANSI 30 HARI (1 BULAN)</b> untuk perbaikan IC, fleksibel, konektor cas, dan touchscreen.<br/>"
        "• <b>Klaim Garansi 1-Klik:</b> Cukup buka portal member atau datang langsung ke workshop. Sebutkan nomor HP Anda, unit langsung ditangani di meja prioritas!"
    )
    story.append(make_box(garansi_box, bg_hex="#eff6ff", border_hex="#1d4ed8", title="🛡️ KETENTUAN GARANSI RESMI MEJA LAB"))

    story.append(PageBreak())

    # =========================================================================
    # HALAMAN 12: BAB 7.2 - FORMULIR BOOKING ONLINE DARI RUMAH
    # =========================================================================
    story.append(Paragraph("BAB 7.2: PESAN JADWAL SERVIS DARI RUMAH (BOOKING)", h1_style))
    story.append(Paragraph(
        "Bagi pelanggan yang ingin mengetahui perkiraan biaya atau ingin menjadwalkan servis sebelum datang ke toko, "
        "tersedia halaman booking online interaktif:",
        body_style
    ))

    # Screenshot Booking dengan Penanda
    story.append(add_screenshot("05_booking_servis.png", "Formulir Booking Servis Online: Registrasi Pelanggan untuk Reservasi Servis", width=170*mm, height=106.25*mm))

    story.append(Paragraph("Langkah Pesan Servis dari Rumah:", h2_style))
    penjelasan_booking = (
        "<b>CARA MENGGUNAKAN FORMULIR BOOKING ONLINE:</b><br/>"
        "<b>[1] MASUKKAN NAMA LENGKAP:</b> Buka link <code>https://ngalamfixpro.com/booking</code>, isi nama lengkap pemilik smartphone pada kolom yang tersedia.<br/>"
        "<b>[2] MASUKKAN NOMOR WHATSAPP:</b> Masukkan nomor WA aktif (contoh: <code>081234567890</code>). Nomor ini digunakan untuk konfirmasi jadwal dan update perbaikan.<br/>"
        "<b>[3] KLIK LANJUTKAN:</b> Tekan tombol <b>'Lanjutkan'</b> untuk memilih merek, tipe HP, estimasi biaya suku cadang, dan klaim garansi resmi secara online!"
    )
    story.append(make_box(penjelasan_booking, bg_hex="#f8fafc", border_hex="#64748b", title="🏡 PANDUAN BOOKING DARI RUMAH"))

    story.append(PageBreak())

    # =========================================================================
    # HALAMAN 13: BAB 8 - FAQ & LEMBAR PENGESAHAN DOKUMEN
    # =========================================================================
    story.append(Paragraph("BAB 8: PERTANYAAN UMUM (FAQ) & PENGESAHAN DOKUMEN", h1_style))
    story.append(Paragraph(
        "Rangkuman solusi kendala yang paling sering ditanyakan untuk membantu staf, mitra, maupun pelanggan awam:",
        body_style
    ))

    faq_data = [
        [Paragraph("Pertanyaan / Kendala", tbl_hdr), Paragraph("Penyebab Masalah", tbl_hdr), Paragraph("Solusi Cepat & Mudah", tbl_hdr)],
        [
            Paragraph("<b>Hasil cetak struk kasir kosong (blank)?</b>", tbl_cell),
            Paragraph("Printer belum terhubung atau ukuran kertas belum disetel ke 80mm.", tbl_cell),
            Paragraph("Sistem terbaru sudah dilengkapi penataan cetak presisi. Pastikan printer thermal aktif dan pilih ukuran kertas 80mm / 58mm.", tbl_cell)
        ],
        [
            Paragraph("<b>Login Google muncul tulisan sesi kedaluwarsa?</b>", tbl_cell),
            Paragraph("Browser sempat memblokir cookie pada saat perpindahan halaman.", tbl_cell),
            Paragraph("Sistem sudah menyematkan token otomatis pada link callback. Cukup klik tombol Login Google ulang atau refresh halaman 1 kali.", tbl_cell)
        ],
        [
            Paragraph("<b>Pelanggan lupa nomor tiket servisnya?</b>", tbl_cell),
            Paragraph("Nota fisik terselip atau tertinggal di rumah.", tbl_cell),
            Paragraph("Kasir dapat mencari di komputer cukup dengan mengetik Nama Pelanggan atau Nomor WhatsApp pada kolom pencarian antrean.", tbl_cell)
        ],
        [
            Paragraph("<b>Kapan komisi mitra 5% masuk ke saldo?</b>", tbl_cell),
            Paragraph("Komisi masuk setelah pengerjaan unit HP selesai dan dilunasi di kasir.", tbl_cell),
            Paragraph("Mitra dapat memantau status order di dashboard. Saat kasir menekan tombol 'Lunas', saldo komisi detik itu juga bertambah.", tbl_cell)
        ],
        [
            Paragraph("<b>Apakah saat refresh halaman tab admin berubah?</b>", tbl_cell),
            Paragraph("Pengaturan tab sebelumnya belum tersimpan otomatis.", tbl_cell),
            Paragraph("Sistem saat ini sudah menyimpan posisi tab terakhir Anda di URL (?tab=...) dan memori browser, sehingga tidak akan berpindah saat refresh.", tbl_cell)
        ],
    ]
    t_faq = Table(faq_data, colWidths=[52*mm, 52*mm, 70*mm])
    t_faq.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_faq)
    story.append(Spacer(1, 6 * mm))

    # Lembar Pengesahan Resmi
    story.append(Paragraph("LEMBAR PENGESAHAN DOKUMEN SISTEM OPERASIONAL", h2_style))
    sign_data = [
        [
            Paragraph("<b>Disusun Oleh:</b><br/><br/><br/>Tim Engineering & UI/UX Sistem<br/><b>Ngalam Fix Pro Malang</b>", tbl_cell),
            Paragraph("<b>Disahkan Oleh:</b><br/><br/><br/>Direksi Operasional Workshop<br/><b>Ngalam Fix Pro Malang</b>", tbl_cell),
            Paragraph("<b>Status Dokumen:</b><br/><br/><br/>RESMI & TERUJI<br/><b>Edisi Produksi 2026</b>", tbl_cell)
        ]
    ]
    t_sign = Table(sign_data, colWidths=[58*mm, 58*mm, 58*mm])
    t_sign.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(KeepTogether([t_sign]))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✅ Berhasil membuat Master Illustrated Guide Book PDF: {filename} ({os.path.getsize(filename)} bytes)")

if __name__ == '__main__':
    build_complete_pdf()
