#!/usr/bin/env python3
"""
Generate a comprehensive, beginner-friendly (gaptek-friendly) illustrated PDF Guide Book
for Ngalam Fix Pro with step-by-step instructions, visual callouts, and real screenshots.
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
        if self._pageNumber == 1:
            return  # No header/footer on cover

        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header
        self.drawString(18 * mm, 287 * mm, "NGALAM FIX PRO — PANDUAN PENGGUNA LENGKAP BERGAMBAR")
        self.setFont("Helvetica", 8)
        self.drawRightString(192 * mm, 287 * mm, "SOP & PANDUAN PRAKTIS SETIAP ROLE")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.6)
        self.line(18 * mm, 284 * mm, 192 * mm, 284 * mm)

        # Footer
        self.line(18 * mm, 14 * mm, 192 * mm, 14 * mm)
        self.drawString(18 * mm, 9.5 * mm, "Dokumentasi Resmi Hak Cipta © 2026 Ngalam Fix Pro. Layanan Servis HP & iPhone Malang.")
        page_text = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(192 * mm, 9.5 * mm, page_text)
        self.restoreState()

def create_illustrated_pdf(filename="docs/NGALAM_FIX_PRO_GUIDE_BOOK.pdf"):
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

    # Custom Typography Styles
    cover_title = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=c_primary,
        spaceAfter=8
    )

    h1_style = ParagraphStyle(
        'SectionHeading1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionHeading2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=c_accent,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.2,
        leading=13.5,
        textColor=c_slate,
        spaceAfter=6
    )

    step_box_style = ParagraphStyle(
        'StepBoxText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#0f172a")
    )

    img_caption_style = ParagraphStyle(
        'ImageCaption',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748b"),
        alignment=1,
        spaceBefore=3,
        spaceAfter=8
    )

    table_hdr = ParagraphStyle(
        'TableHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=1
    )

    table_txt = ParagraphStyle(
        'TableTxt',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#1e293b")
    )

    story = []

    def make_box(content_html, bg_hex="#f1f5f9", border_hex="#cbd5e1", title=None):
        full_text = ""
        if title:
            full_text += f"<font size='9.5' color='{border_hex}'><b>{title}</b></font><br/><br/>"
        full_text += content_html
        p = Paragraph(full_text, step_box_style)
        t = Table([[p]], colWidths=[174 * mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(bg_hex)),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor(border_hex)),
            ('TOPPADDING', (0,0), (-1,-1), 7),
            ('BOTTOMPADDING', (0,0), (-1,-1), 7),
            ('LEFTPADDING', (0,0), (-1,-1), 9),
            ('RIGHTPADDING', (0,0), (-1,-1), 9),
        ]))
        return t

    def add_screenshot(img_rel_path, caption_text, width=170*mm, height=88*mm):
        if os.path.exists(img_rel_path):
            img = Image(img_rel_path, width=width, height=height)
            caption = Paragraph(f"<b>Gambar Panduan:</b> {caption_text}", img_caption_style)
            return KeepTogether([img, caption])
        return Paragraph(f"<i>[Gambar: {caption_text}]</i>", img_caption_style)

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 15 * mm))
    story.append(Paragraph("<font color='#d97706'><b>BUKU PANDUAN PENGGUNA LENGKAP (EDISI BERGAMBAR 2026)</b></font>", ParagraphStyle('Sub', fontName='Helvetica-Bold', fontSize=10.5, spaceAfter=8)))
    story.append(Paragraph("SOP & PANDUAN OPERASIONAL SETIAP ROLE<br/><font color='#d97706'>NGALAM FIX PRO</font>", cover_title))
    story.append(Paragraph(
        "Buku petunjuk praktis langkah-demi-langkah yang dirancang khusus agar <b>mudah dipahami oleh siapa saja (bahkan bagi pengguna awam / gaptek)</b>. "
        "Memuat alur lengkap Kasir Meja 1, Teknisi Lab, Mitra Afiliasi, Pelanggan, dan Super Admin disertai tangkapan layar antarmuka asli sistem.",
        body_style
    ))
    story.append(HRFlowable(width="100%", thickness=2.5, color=c_accent, spaceBefore=4, spaceAfter=14))

    # Screenshot Homepage di Halaman Depan
    story.append(add_screenshot("docs/screenshots/01_homepage.png", "Halaman Utama Website Resmi Ngalam Fix Pro (https://ngalamfixpro.com)", width=174*mm, height=92*mm))

    story.append(Spacer(1, 4 * mm))
    meta_box = [
        [Paragraph("<b>Alamat Website Resmi</b>", table_txt), Paragraph("<code>https://ngalamfixpro.com</code> (Online 24 Jam)", table_txt)],
        [Paragraph("<b>Lokasi Workshop Lab</b>", table_txt), Paragraph("Jl. Galunggung No. 12, Malang, Jawa Timur", table_txt)],
        [Paragraph("<b>Layanan CS WhatsApp</b>", table_txt), Paragraph("+62 811-3185-858 (Respon Cepat)", table_txt)],
        [Paragraph("<b>Target Pembaca</b>", table_txt), Paragraph("Kasir Counter, Teknisi Handphone, Pengemudi Ojek Online / Toko Mitra, Pelanggan, & Owner", table_txt)],
    ]
    t_meta = Table(meta_box, colWidths=[50 * mm, 124 * mm])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
    ]))
    story.append(t_meta)

    story.append(PageBreak())

    # =========================================================================
    # BAB 1: PENGENALAN SISTEM & STRUKTUR PERAN
    # =========================================================================
    story.append(Paragraph("BAB 1: MEMAHAMI PERAN (ROLE) & HAK AKSES", h1_style))
    story.append(Paragraph(
        "Website Ngalam Fix Pro memiliki 5 kelompok pengguna utama. Setiap peran memiliki halaman khusus, tombol, "
        "dan hak akses tersendiri sehingga aman dan tidak tertukar satu sama lain:",
        body_style
    ))

    role_summary_data = [
        [Paragraph("Peran / Role", table_hdr), Paragraph("Siapa Penggunanya?", table_hdr), Paragraph("Dimana Halaman Masuknya?", table_hdr), Paragraph("Apa Fungsi Utamanya?", table_hdr)],
        [
            Paragraph("<b>1. Kasir (Meja 1)</b>", table_txt),
            Paragraph("Petugas kasir di konter depan workshop.", table_txt),
            Paragraph("<code>/login?tab=staff</code>", table_txt),
            Paragraph("Menerima HP rusak, mencetak nota pendaftaran, memproses bayar & struk kasir.", table_txt)
        ],
        [
            Paragraph("<b>2. Teknisi Lab</b>", table_txt),
            Paragraph("Ahli reparasi hardware di meja kerja terbuka.", table_txt),
            Paragraph("<code>/login?tab=staff</code>", table_txt),
            Paragraph("Membongkar HP, mengganti LCD/baterai, update status servis tahap 1 s/d 5.", table_txt)
        ],
        [
            Paragraph("<b>3. Mitra Afiliasi</b>", table_txt),
            Paragraph("Ojol, konter HP rekanan, teman komunitas.", table_txt),
            Paragraph("<code>/mitra</code>", table_txt),
            Paragraph("Membagikan stiker QR Code unik, dapat komisi 5% tiap order berhasil.", table_txt)
        ],
        [
            Paragraph("<b>4. Pelanggan (Member)</b>", table_txt),
            Paragraph("Konsumen yang HP-nya sedang diservis.", table_txt),
            Paragraph("<code>/lacak</code> & <code>/login</code>", table_txt),
            Paragraph("Cek progres pengerjaan HP secara live, lihat kartu garansi digital, klaim garansi.", table_txt)
        ],
        [
            Paragraph("<b>5. Super Admin</b>", table_txt),
            Paragraph("Pemilik workshop / Manajer toko.", table_txt),
            Paragraph("<code>/login?tab=staff</code>", table_txt),
            Paragraph("Mengatur seluruh order, cek buku kas omzet, unduh file Excel, pasang banner iklan.", table_txt)
        ],
    ]
    t_roles = Table(role_summary_data, colWidths=[34*mm, 42*mm, 38*mm, 60*mm])
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

    # Kotak Penjelasan Gaptek Friendly
    tips_gaptek = (
        "<b>TIPS BAGI PENGGUNA AWAM:</b><br/>"
        "• Jika Anda <b>Pelanggan biasa</b>, Anda tidak perlu repot menghafal password akun staf. Cukup buka menu <b>'Lacak Servis'</b> dan ketik nomor HP atau nomor tiket Anda!<br/>"
        "• Jika Anda <b>Mitra</b>, cukup klik tombol <b>'Masuk dengan Google'</b> di portal mitra, akun Anda langsung otomatis jadi tanpa harus pusing isi form panjang."
    )
    story.append(make_box(tips_gaptek, bg_hex="#ecfdf5", border_hex="#059669", title="💡 PANDUAN MUDAH UNTUK PEMULA"))

    story.append(PageBreak())

    # =========================================================================
    # BAB 2: PANDUAN LENGKAP KASIR (MEJA 1 FRONT DESK)
    # =========================================================================
    story.append(Paragraph("BAB 2: PANDUAN ROLE KASIR & FRONT DESK (MEJA 1)", h1_style))
    story.append(Paragraph(
        "Petugas kasir adalah wajah utama workshop saat pelanggan datang membawa HP rusak (Walk-in). "
        "Berikut langkah mudah penerimaan barang hingga pencetakan struk:",
        body_style
    ))

    story.append(Paragraph("Langkah 1: Membuka Menu Pendaftaran Unit Walk-in", h2_style))
    story.append(Paragraph(
        "1. Masuk ke halaman login staf di <code>https://ngalamfixpro.com/login?tab=staff</code>.<br/>"
        "2. Masukkan Username: <b>kasir</b> dan Password kasir Anda, lalu tekan tombol <b>'Masuk ke Panel Kasir'</b>.<br/>"
        "3. Pada menu bilah samping kiri (sidebar), klik menu <b>'Intake Walk-in Meja 1'</b> (ikon tanda plus kuning).",
        body_style
    ))

    story.append(add_screenshot("docs/screenshots/07_admin_walkin.png", "Layar Kasir Meja 1: Formulir Pendaftaran Unit Walk-in Offline", width=174*mm, height=88*mm))

    story.append(Paragraph("Langkah 2: Mengisi Formulir Masuk HP Pelanggan", h2_style))
    story.append(Paragraph(
        "• <b>Pilih Merek HP:</b> Klik logo merek handphone pelanggan (iPhone, Samsung, Xiaomi, Oppo, Vivo, Realme, Infinix, dll).<br/>"
        "• <b>Pilih Tipe HP:</b> Klik daftar tipe model HP yang muncul (misal: <i>iPhone 13</i>, <i>Samsung A54</i>). Jika tipe HP model langka, centang 'Model Lain' dan ketik tipenya.<br/>"
        "• <b>Pilih Kerusakan:</b> Klik kerusakan yang dikeluhkan (contoh: <i>LCD Pecah/Blank</i>, <i>Ganti Baterai Drop</i>, <i>Konektor Cas Longgar</i>). Estimasi harga sparepart & jasa akan terhitung otomatis di layar.<br/>"
        "• <b>Data Pelanggan:</b> Ketik Nama Pelanggan dan Nomor WhatsApp aktif (wajib diawali 08... agar notifikasi tiket terkirim).<br/>"
        "• <b>Klik Tombol Hijau:</b> Tekan tombol <b>'Daftarkan Unit & Masukkan Antrean Lab'</b>.",
        body_style
    ))

    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("Langkah 3: Cetak Tanda Terima Fisik (Thermal 80mm)", h2_style))
    story.append(Paragraph(
        "Setelah mendaftar, layar akan memunculkan <b>Nomor Tiket Servis</b> (contoh: <code>NGF-20261124-8821</code>). "
        "Tekan tombol <b>'Cetak Tanda Terima'</b>. Printer thermal otomatis mencetak tanda terima untuk diberikan kepada pelanggan "
        "sebagai bukti sah saat pengambilan HP.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # BAB 2.2: KASIR PELUNASAN & STRUK CETAK
    # =========================================================================
    story.append(Paragraph("BAB 2.2: ALUR PEMBAYARAN KASIR & CETAK STRUK LUNAS", h1_style))
    story.append(Paragraph(
        "Saat pengerjaan HP telah selesai dan pelanggan datang untuk mengambil unitnya:",
        body_style
    ))

    story.append(add_screenshot("docs/screenshots/08_admin_cashier.png", "Layar Kasir Pelunasan Transaksi & Aktivasi Garansi Resmi", width=174*mm, height=88*mm))

    pembayaran_steps = (
        "<b>URUTAN PROSES PELUNASAN KASIR:</b><br/>"
        "<b>1. Cari Order HP:</b> Buka tab <b>'Kasir & Pembayaran'</b>. Cari nama pemilik HP atau nomor tiket di kotak pencarian.<br/>"
        "<b>2. Pilih Cara Bayar:</b> Kasir menanyakan metode bayar ke pelanggan (Uang Tunai / Cash, QRIS Scan, atau Transfer Bank).<br/>"
        "<b>3. Konfirmasi Lunas:</b> Tekan tombol hijau <b>'Konfirmasi Lunas & Aktifkan Garansi Sekarang'</b>.<br/>"
        "<b>4. Cetak Struk:</b> Klik tombol <b>'Cetak Struk Thermal'</b>. Mesin printer thermal 80mm/58mm langsung mengeluarkan struk bersih tanpa terpotong.<br/>"
        "<b>5. Garansi Otomatis Hidup:</b> Sertifikat garansi digital di sistem seketika aktif (30 Hari untuk Hardware / 90 Hari untuk Baterai)."
    )
    story.append(make_box(pembayaran_steps, bg_hex="#fffbeb", border_hex="#d97706", title="📝 SOP PENYELESAIAN DI MEJA KASIR"))

    story.append(Spacer(1, 6 * mm))

    # Antrean Servis Utama
    story.append(Paragraph("Melihat Seluruh Antrean Servis Toko", h2_style))
    story.append(Paragraph(
        "Kasir dan seluruh staf dapat memantau urutan antrean HP di tab <b>'Antrian Servis Unit'</b>. "
        "Di sini terlihat jelas HP mana yang baru masuk, sedang dikerjakan teknisi, atau sudah siap diambil:",
        body_style
    ))
    story.append(add_screenshot("docs/screenshots/06_admin_orders.png", "Layar Daftar Semua Antrean Servis Unit Masuk", width=174*mm, height=88*mm))

    story.append(PageBreak())

    # =========================================================================
    # BAB 3: PANDUAN ROLE TEKNISI LAB WORKSHOP
    # =========================================================================
    story.append(Paragraph("BAB 3: PANDUAN ROLE TEKNISI LAB WORKSHOP", h1_style))
    story.append(Paragraph(
        "Teknisi bekerja di meja terbuka dengan peralatan lab modern. Tugas teknisi sangat sederhana di sistem: "
        "<b>cukup geser tombol tahapan status sesuai kondisi pengerjaan fisik HP yang sebenarnya</b>.",
        body_style
    ))

    story.append(add_screenshot("docs/screenshots/11_teknisi_dashboard.png", "Layar Meja Kerja Teknisi: Kontrol Cepat Tahapan Servis HP", width=174*mm, height=90*mm))

    story.append(Paragraph("Arti 5 Tahapan Servis yang Wajib Diketahui Teknisi:", h2_style))

    tahap_data = [
        [Paragraph("Nomor Tahap", table_hdr), Paragraph("Nama Status", table_hdr), Paragraph("Kapan Teknisi Menekan Tombol Ini?", table_hdr), Paragraph("Apa yang Terlihat di HP Pelanggan?", table_hdr)],
        [
            Paragraph("<b>Tahap 1</b>", table_txt),
            Paragraph("<font color='#d97706'><b>Antrean Masuk</b></font>", table_txt),
            Paragraph("Saat HP baru diterima dari meja kasir depan.", table_txt),
            Paragraph("Pelanggan tahu unitnya sudah masuk antrean lab.", table_txt)
        ],
        [
            Paragraph("<b>Tahap 2</b>", table_txt),
            Paragraph("<font color='#2563eb'><b>Pemeriksaan / Bongkar</b></font>", table_txt),
            Paragraph("Saat teknisi mulai membongkar baut & ukur tegangan IC.", table_txt),
            Paragraph("Pelanggan tahu HP sedang dianalisis di meja terbuka.", table_txt)
        ],
        [
            Paragraph("<b>Tahap 3</b>", table_txt),
            Paragraph("<font color='#7c3aed'><b>Pengerjaan Hardware</b></font>", table_txt),
            Paragraph("Saat teknisi memasang sparepart baru (LCD / baterai / fleksibel).", table_txt),
            Paragraph("Pelanggan melihat status 'Proses Pemasangan Komponen'.", table_txt)
        ],
        [
            Paragraph("<b>Tahap 4</b>", table_txt),
            Paragraph("<font color='#059669'><b>Quality Control (QC)</b></font>", table_txt),
            Paragraph("Saat pengetesan layar sentuh, kamera, audio, dan tes cas.", table_txt),
            Paragraph("Pelanggan tahu HP sudah lulus uji kelayakan fungsi.", table_txt)
        ],
        [
            Paragraph("<b>Tahap 5</b>", table_txt),
            Paragraph("<font color='#16a34a'><b>Unit Siap Diambil</b></font>", table_txt),
            Paragraph("HP dipindahkan ke loket kasir depan siap diserahkan.", table_txt),
            Paragraph("Sistem mengirim WA: 'HP Anda sudah selesai & siap diambil'.", table_txt)
        ],
    ]
    t_tahap = Table(tahap_data, colWidths=[24*mm, 38*mm, 58*mm, 54*mm])
    t_tahap.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
    ]))
    story.append(t_tahap)

    story.append(PageBreak())

    # =========================================================================
    # BAB 4: PANDUAN ROLE MITRA AFILIASI
    # =========================================================================
    story.append(Paragraph("BAB 4: PANDUAN LENGKAP ROLE MITRA AFILIASI BISNIS", h1_style))
    story.append(Paragraph(
        "Program Kemitraan Ngalam Fix Pro adalah peluang penghasilan bagi siapa saja (Ojol, pemilik konter pulsa, "
        "pedagang, teman komunitas). Cukup kenalkan teman/pelanggan Anda yang HP-nya rusak, Anda mendapatkan "
        "<b>komisi bagi hasil 5% bersih</b> dari total nilai perbaikan!",
        body_style
    ))

    story.append(add_screenshot("docs/screenshots/04_portal_mitra.png", "Portal Masuk & Registrasi Cepat Mitra Resmi Ngalam Fix Pro", width=174*mm, height=88*mm))

    story.append(Paragraph("Cara Mudah Mendaftar & Menggunakan Akun Mitra:", h2_style))
    story.append(Paragraph(
        "<b>1. Buka Halaman Mitra:</b> Buka link <code>https://ngalamfixpro.com/mitra</code> di HP Anda.<br/>"
        "<b>2. Klik Tombol Google:</b> Tekan tombol <b>'Masuk / Daftar dengan Google'</b>. Pilih akun Google Anda. Selesai! Anda langsung terdaftar sebagai Mitra Resmi.<br/>"
        "<b>3. Isi Nomor WhatsApp:</b> Masukkan nomor WA Anda agar admin dapat mentransfer uang komisi.<br/>"
        "<b>4. Dapatkan Kode Unik Anda:</b> Anda akan menerima Kode Referral Unik (contoh: <code>MTR-005</code>) dan QR Code bergambar logo toko.",
        body_style
    ))

    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("Cara Mendapatkan Komisi (Sangat Mudah!):", h2_style))
    story.append(Paragraph(
        "• <b>Cara 1 (Pakai Stiker QR):</b> Download gambar QR Code Anda, cetak dan tempel di etalase toko atau helm Anda. "
        "Setiap kali ada orang yang men-scan stiker Anda lalu servis HP di Ngalam Fix Pro, Anda otomatis dapat komisi 5%.<br/>"
        "• <b>Cara 2 (Bagi Link WA):</b> Klik tombol 'Salin Link Booking', kirimkan ke grup WhatsApp keluarga atau teman. "
        "Saat mereka memesan dari link tersebut, komisi langsung masuk ke akun Anda.<br/>"
        "• <b>Tarik Uang Komisi:</b> Jika saldo Anda sudah mencapai minimal Rp 50.000, tekan tombol <b>'Tarik Saldo Komisi'</b>. "
        "Uang akan langsung ditransfer ke rekening bank atau dompet digital (DANA, Gopay, OVO, ShopeePay) Anda.",
        body_style
    ))

    story.append(Spacer(1, 4 * mm))
    # Screenshot Koleksi 100 Stiker Mitra di Admin
    story.append(add_screenshot("docs/screenshots/09_admin_mitra.png", "Layar Manajemen 100 Koleksi Stiker QR Code Mitra Siap Pakai", width=174*mm, height=82*mm))

    story.append(PageBreak())

    # =========================================================================
    # BAB 5: PANDUAN ROLE PELANGGAN (KONSUMEN & GARANSI)
    # =========================================================================
    story.append(Paragraph("BAB 5: PANDUAN ROLE PELANGGAN (KONSUMEN)", h1_style))
    story.append(Paragraph(
        "Bagi pelanggan atau pemilik smartphone, website Ngalam Fix Pro memberikan kemudahan tanpa ribet. "
        "Tidak perlu login atau instal aplikasi apapun untuk sekadar mengecek progres servis HP Anda!",
        body_style
    ))

    story.append(Paragraph("Fitur 1: Lacak Servis Online 24 Jam (Tanpa Perlu Login)", h2_style))
    story.append(Paragraph(
        "1. Buka <code>https://ngalamfixpro.com/lacak</code> di browser HP manapun.<br/>"
        "2. Ketikkan <b>Nomor Tiket</b> (contoh: <code>NGF-20261124-7891</code>) ATAU ketik <b>Nomor WhatsApp</b> yang didaftarkan.<br/>"
        "3. Tekan tombol <b>'Cari Progres Servis'</b>. Layar akan menampilkan tahapan pengerjaan HP Anda secara transparan.",
        body_style
    ))

    story.append(add_screenshot("docs/screenshots/02_lacak_servis.png", "Layar Lacak Servis: Pantau Progres Pengerjaan HP Transparan 24 Jam", width=174*mm, height=88*mm))

    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("Fitur 2: Portal Member & Akses Sertifikat Garansi", h2_style))
    story.append(Paragraph(
        "Jika pelanggan ingin melihat seluruh riwayat nota lama dan kartu garansi digital resmi:<br/>"
        "• Buka menu <b>'Portal Member'</b> di <code>https://ngalamfixpro.com/login</code>.<br/>"
        "• Cukup 1 kali klik <b>'Masuk Cepat dengan Google'</b>.<br/>"
        "• Kartu Garansi Digital Anda akan langsung muncul di layar beserta batas waktu kadaluarsanya.",
        body_style
    ))

    story.append(add_screenshot("docs/screenshots/03_login_member.png", "Layar Portal Member: Login Cepat 1-Klik Akun Pelanggan", width=174*mm, height=88*mm))

    story.append(PageBreak())

    # =========================================================================
    # BAB 5.2: SISTEM GARANSI RESMI & FORM BOOKING
    # =========================================================================
    story.append(Paragraph("BAB 5.2: JAMINAN GARANSI RESMI & BOOKING ONLINE", h1_style))
    story.append(Paragraph(
        "Ngalam Fix Pro menjamin kepuasan pelanggan dengan standar garansi laboratorium terpanjang di Malang:",
        body_style
    ))

    garansi_box = (
        "<b>KETENTUAN MASA BERLAKU GARANSI RESMI:</b><br/>"
        "• <b>Ganti Baterai:</b> <b>GARANSI 90 HARI PENUH (3 BULAN)</b>. Jika baterai kembung, drop drastis, atau tidak mengisi, kami ganti baru tanpa biaya tambahan.<br/>"
        "• <b>Ganti Layar LCD & Komponen Hardware:</b> <b>GARANSI 30 HARI (1 BULAN)</b> untuk perbaikan IC, fleksibel, konektor cas, dan layar touchscreen.<br/>"
        "• <b>Cara Klaim Garansi 1-Klik:</b> Cukup buka portal member, klik tombol 'Klaim Garansi' pada tiket Anda. Anda langsung dilayani di meja prioritas!"
    )
    story.append(make_box(garansi_box, bg_hex="#eff6ff", border_hex="#2563eb", title="🛡️ STANDAR GARANSI RESMI ANTI-RIBET"))

    story.append(Spacer(1, 4 * mm))
    story.append(add_screenshot("docs/screenshots/10_admin_warranties.png", "Layar Sistem Database Sertifikat Garansi Resmi Digital", width=174*mm, height=86*mm))

    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("Formulir Pesan / Booking Servis dari Rumah", h2_style))
    story.append(Paragraph(
        "Bagi pelanggan yang ingin konsultasi atau pesan jadwal servis sebelum datang ke workshop, "
        "tersedia halaman booking interaktif lengkap dengan kalkulator estimasi biaya otomatis:",
        body_style
    ))
    story.append(add_screenshot("docs/screenshots/05_booking_servis.png", "Formulir Booking Servis Online Lengkap Pemilih Merek & Estimasi Biaya", width=174*mm, height=86*mm))

    story.append(PageBreak())

    # =========================================================================
    # BAB 6: FAQ & PANDUAN MENGATASI KENDALA (TROUBLESHOOTING)
    # =========================================================================
    story.append(Paragraph("BAB 6: PERTANYAAN UMUM & SOLUSI KENDALA (FAQ)", h1_style))
    story.append(Paragraph(
        "Rangkuman tanya-jawab paling sering untuk membantu staf, mitra, maupun pelanggan awam saat mengalami kesulitan:",
        body_style
    ))

    faq_data = [
        [Paragraph("Pertanyaan / Kendala", table_hdr), Paragraph("Penyebab Umum", table_hdr), Paragraph("Solusi Cepat & Mudah", table_hdr)],
        [
            Paragraph("<b>Hasil cetak struk kasir kosong (blank)?</b>", table_txt),
            Paragraph("Printer belum terhubung kabel atau ukuran kertas belum diatur ke 80mm.", table_txt),
            Paragraph("Pastikan printer thermal aktif dan di jendela cetak pilih ukuran 80mm/58mm. Sistem sudah otomatis memposisikan teks di bagian atas.", table_txt)
        ],
        [
            Paragraph("<b>Login Google muncul pesan sesi kedaluwarsa?</b>", table_txt),
            Paragraph("Browser menolak cookie pihak ketiga pada klik pertama.", table_txt),
            Paragraph("Sistem terbaru sudah menempelkan token otomatis di URL. Cukup refresh halaman 1 kali atau klik login Google ulang.", table_txt)
        ],
        [
            Paragraph("<b>Pelanggan lupa nomor tiket servisnya?</b>", table_txt),
            Paragraph("Nota fisik terselip atau hilang di rumah.", table_txt),
            Paragraph("Kasir dapat mencari di komputer cukup dengan mengetik Nama Pelanggan atau Nomor WhatsApp di kolom pencarian antrean.", table_txt)
        ],
        [
            Paragraph("<b>Apakah komisi mitra langsung masuk setelah scan?</b>", table_txt),
            Paragraph("Komisi masuk setelah HP selesai diperbaiki dan dilunasi di kasir.", table_txt),
            Paragraph("Mitra dapat memantau status order di dashboard. Begitu kasir menekan tombol 'Lunas', saldo komisi 5% detik itu juga bertambah.", table_txt)
        ],
        [
            Paragraph("<b>Bagaimana jika status refresh kembali ke antrean?</b>", table_txt),
            Paragraph("Fitur penyimpanan tab sebelumnya belum aktif.", table_txt),
            Paragraph("Sistem saat ini sudah mengingat tab terakhir Anda di URL (?tab=...) dan memori lokal, sehingga tidak akan berpindah tab saat refresh.", table_txt)
        ],
    ]
    t_faq = Table(faq_data, colWidths=[52*mm, 52*mm, 70*mm])
    t_faq.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_faq)
    story.append(Spacer(1, 8 * mm))

    # Lembar Pengesahan
    story.append(Paragraph("LEMBAR PENGESAHAN DOKUMEN SISTEM", h2_style))
    sign_data = [
        [
            Paragraph("<b>Disusun Oleh:</b><br/><br/><br/>Tim Engineering & UI/UX Sistem<br/><b>Ngalam Fix Pro Malang</b>", table_txt),
            Paragraph("<b>Disahkan Oleh:</b><br/><br/><br/>Direksi Operasional Workshop<br/><b>Ngalam Fix Pro Malang</b>", table_txt),
            Paragraph("<b>Status Dokumen:</b><br/><br/><br/>RESMI & TERUJI<br/><b>Edisi Produksi 2026</b>", table_txt)
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
    print(f"✅ Selesai membuat Illustrated Guide Book PDF: {filename} ({os.path.getsize(filename)} bytes)")

if __name__ == '__main__':
    create_illustrated_pdf()
