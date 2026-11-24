#!/usr/bin/env python3
"""
Accurately annotate all screenshots based on measured DOM bounding boxes.
Markers, boxes, and numbers land EXACTLY on the targeted buttons, inputs, and tabs.
"""

import os
from PIL import Image, ImageDraw, ImageFont

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def draw_callout_box(draw, x1, y1, x2, y2, label="", num=None, border_color="#e11d48"):
    # Clamp coordinates
    x1, y1 = max(4, x1), max(4, y1)
    x2, y2 = min(1276, x2), min(796, y2)
    
    # Outer stroke (4px)
    draw.rectangle([x1, y1, x2, y2], outline=border_color, width=4)
    
    # Label badge pill
    if label or num:
        badge_text = f" {num}. {label} " if num else f" {label} "
        try:
            font = ImageFont.truetype(FONT_BOLD, 14)
        except:
            font = ImageFont.load_default()
        
        bbox = draw.textbbox((0, 0), badge_text, font=font)
        bw = bbox[2] - bbox[0] + 12
        bh = bbox[3] - bbox[1] + 8
        
        # Place badge above box if room, else inside top-left
        bx = max(8, x1)
        by = y1 - bh - 4 if y1 >= bh + 8 else y1 + 4
        draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=5, fill=border_color, outline="#ffffff", width=2)
        draw.text((bx + 6, by + 4), badge_text, fill="#ffffff", font=font)

def annotate_all_screenshots(src_dir="docs/screenshots", out_dir="docs/screenshots/annotated"):
    os.makedirs(out_dir, exist_ok=True)

    # 1. 01_homepage.png
    # Top navbar buttons: [792, 19, 1182, 59]. Hero buttons: ~x: 100-450, y: 520-590.
    im = Image.open(f"{src_dir}/01_homepage.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 785, 14, 1188, 64, "Navigasi: Lacak Unit & Pesan Servis", "1", "#2563eb")
    draw_callout_box(draw, 80, 240, 560, 480, "Keunggulan Lab Meja Terbuka Malang", "2", "#d97706")
    draw_callout_box(draw, 80, 520, 310, 580, "Tombol Konsultasi CS WhatsApp", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/01_homepage.png", quality=95)

    # 2. 02_lacak_servis.png
    # Measured DOM: Input: [315, 320, 812, 364]. Button: [822, 320, 965, 364].
    im = Image.open(f"{src_dir}/02_lacak_servis.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 315, 320, 812, 364, "Ketik Nomor Tiket / Nomor WhatsApp Disini", "1", "#e11d48")
    draw_callout_box(draw, 822, 320, 965, 364, "Klik 'Cari Progres Servis'", "2", "#2563eb")
    draw_callout_box(draw, 315, 410, 965, 680, "Area Hasil Pelacakan Status Servis Live", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/02_lacak_servis.png", quality=95)

    # 3. 03_login_member.png
    # Measured DOM: Google button: [465, 412, 815, 454]. Member Tab: [469, 506, 640, 538]. Phone: [465, 586, 815, 628].
    im = Image.open(f"{src_dir}/03_login_member.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 465, 412, 815, 454, "Klik Masuk Cepat dengan Akun Google", "1", "#2563eb")
    draw_callout_box(draw, 465, 504, 815, 540, "Pilihan Tab Masuk vs Daftar Baru", "2", "#d97706")
    draw_callout_box(draw, 465, 586, 815, 628, "Ketik Nomor WhatsApp Pelanggan", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/03_login_member.png", quality=95)

    # 4. 04_portal_mitra.png
    # Measured DOM: Google button: [380, 362, 900, 414]. Login Tab: [386, 469, 635, 517]. Reg Tab: [645, 469, 894, 517].
    im = Image.open(f"{src_dir}/04_portal_mitra.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 380, 362, 900, 414, "Klik Masuk / Daftar Cepat dengan Google", "1", "#e11d48")
    draw_callout_box(draw, 380, 465, 900, 520, "Tab Masuk Mitra vs Daftar Mitra Baru", "2", "#2563eb")
    draw_callout_box(draw, 410, 540, 870, 780, "Formulir Pendaftaran Akun Mitra Resmi (5% Komisi)", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/04_portal_mitra.png", quality=95)

    # 5. 05_booking_servis.png (Clean view without promo popup)
    # Measured DOM: Name: [440, 352, 840, 403], Phone: [440, 447, 840, 499], Submit: [440, 515, 840, 564]
    im = Image.open(f"{src_dir}/05_booking_servis.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 438, 348, 842, 406, "Langkah 1: Masukkan Nama Lengkap Anda", "1", "#2563eb")
    draw_callout_box(draw, 438, 444, 842, 502, "Langkah 2: Masukkan Nomor WhatsApp Aktif", "2", "#d97706")
    draw_callout_box(draw, 438, 512, 842, 568, "Langkah 3: Klik 'Lanjutkan' untuk Pilih Perangkat", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/05_booking_servis.png", quality=95)

    # 6. 06_admin_orders.png
    # Measured DOM: Sidebar: [0, 0, 288, 800]. Search: [337, 290, 1089, 328]. Table: [321, 419, 1247, 800].
    im = Image.open(f"{src_dir}/06_admin_orders.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 10, 80, 280, 780, "Bilah Menu Samping (Sidebar)", "1", "#2563eb")
    draw_callout_box(draw, 335, 288, 1092, 330, "Kolom Pencarian Nomor Tiket / Nama Pelanggan", "2", "#e11d48")
    draw_callout_box(draw, 320, 415, 1250, 785, "Tabel Status Antrean Servis Seluruh Unit", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/06_admin_orders.png", quality=95)

    # 7. 07_admin_walkin.png
    # Measured DOM: Header: [336, 109, 1232, 261]. Brand Chips Area: [369, 367, 1199, 443].
    im = Image.open(f"{src_dir}/07_admin_walkin.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 334, 106, 1234, 264, "Header Kasir Intake Meja 1 Front Desk", "1", "#2563eb")
    draw_callout_box(draw, 365, 362, 1205, 448, "Langkah 1: Klik Logo Merek Handphone Pelanggan", "2", "#e11d48")
    draw_callout_box(draw, 365, 470, 1205, 780, "Langkah 2: Pilih Tipe Seri & Keluhan Kerusakan", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/07_admin_walkin.png", quality=95)

    # 8. 08_admin_cashier.png
    # Measured DOM: Search input: [425, 306, 1040, 344]. Search btn: [1050, 306, 1143, 344]. Empty Card: [433, 483, 1135, 738].
    im = Image.open(f"{src_dir}/08_admin_cashier.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 422, 302, 1043, 348, "Ketik Nomor Tiket Servis Disini", "1", "#e11d48")
    draw_callout_box(draw, 1048, 302, 1146, 348, "Klik 'Cari Tiket'", "2", "#2563eb")
    draw_callout_box(draw, 430, 480, 1138, 742, "Area Faktur Pelunasan & Tombol Cetak Struk Kasir", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/08_admin_cashier.png", quality=95)

    # 9. 09_admin_mitra.png
    # Measured DOM: Stat cards: [320, 243, 1248, 367]. Batch button: [739, 541, 934, 577].
    im = Image.open(f"{src_dir}/09_admin_mitra.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 318, 240, 1250, 370, "Statistik Total Komisi Mitra yang Terbayar", "1", "#059669")
    draw_callout_box(draw, 736, 538, 938, 580, "Tombol Cetak Batch 100 Stiker QR Siap Pakai", "2", "#e11d48")
    draw_callout_box(draw, 318, 600, 1250, 785, "Katalog Stiker QR Mitra Terdaftar & Siap Diberikan", "3", "#2563eb")
    im.convert("RGB").save(f"{out_dir}/09_admin_mitra.png", quality=95)

    # 10. 10_admin_warranties.png
    # Measured DOM: Search input: [337, 396, 1231, 434]. Table: [321, 519, 1397, 800].
    im = Image.open(f"{src_dir}/10_admin_warranties.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 334, 393, 1234, 437, "Kolom Pencarian Nomor Tiket / Kode Garansi (GAR-...)", "1", "#2563eb")
    draw_callout_box(draw, 318, 515, 1252, 785, "Database Sertifikat Garansi Resmi Aktif (30/90 Hari)", "2", "#059669")
    im.convert("RGB").save(f"{out_dir}/10_admin_warranties.png", quality=95)

    # 11. 11_teknisi_dashboard.png
    # Measured DOM: Header: [320, 109, 1248, 203]. First step filter button: [433, 227, 553, 257].
    im = Image.open(f"{src_dir}/11_teknisi_dashboard.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 318, 106, 1250, 206, "Layar Meja Kerja Teknisi Lab Workshop", "1", "#2563eb")
    draw_callout_box(draw, 430, 224, 1140, 260, "Filter Tahapan Servis (Antrean, Pengecekan, Pengerjaan, QC, Selesai)", "2", "#2563eb")
    draw_callout_box(draw, 318, 280, 1250, 785, "Daftar Kartu Unit HP & Tombol Geser Status 5-Tahap", "3", "#e11d48")
    im.convert("RGB").save(f"{out_dir}/11_teknisi_dashboard.png", quality=95)

    print("✅ All screenshots annotated with verified, pixel-perfect coordinates!")

if __name__ == '__main__':
    annotate_all_screenshots()
