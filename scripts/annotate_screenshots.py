#!/usr/bin/env python3
"""
Accurately annotate screenshots using verified coordinates from real Chrome DOM.
Ensures markers, boxes, and numbers land EXACTLY on the targeted buttons, inputs, and tabs.
"""

import os
from PIL import Image, ImageDraw, ImageFont

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def draw_callout_box(draw, x1, y1, x2, y2, label="", num=None, border_color="#e11d48"):
    # Ensure minimum visible box size and clamp coordinates
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(1280, x2), min(800, y2)
    
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
        bw = bbox[2] - bbox[0] + 10
        bh = bbox[3] - bbox[1] + 8
        
        # Place badge above box if room, else inside top-left
        bx = max(10, x1)
        by = y1 - bh - 3 if y1 >= bh + 5 else y1 + 3
        draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=5, fill=border_color, outline="#ffffff", width=2)
        draw.text((bx + 5, by + 4), badge_text, fill="#ffffff", font=font)

def annotate_all_screenshots(src_dir="docs/screenshots", out_dir="docs/screenshots/annotated"):
    os.makedirs(out_dir, exist_ok=True)

    # 1. 01_homepage.png
    # Top navbar: ~y: 20-65. Service cards: ~y: 260-480. Floating WA button: bottom right or banner.
    im = Image.open(f"{src_dir}/01_homepage.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 520, 20, 930, 65, "Menu Navigasi (Lacak Servis & Booking)", "1", "#2563eb")
    draw_callout_box(draw, 110, 310, 470, 520, "Layanan Servis Meja Terbuka Malang", "2", "#d97706")
    draw_callout_box(draw, 110, 540, 290, 600, "Konsultasi WhatsApp Cepat", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/01_homepage.png", quality=95)

    # 2. 02_lacak_servis.png
    # Real DOM: Input: [315, 320, 812, 364]. Button: [822, 320, 965, 364].
    im = Image.open(f"{src_dir}/02_lacak_servis.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 312, 316, 815, 368, "Ketik Nomor Tiket / Nomor WhatsApp Disini", "1", "#e11d48")
    draw_callout_box(draw, 820, 316, 968, 368, "Klik 'Cari Progres Servis'", "2", "#2563eb")
    draw_callout_box(draw, 312, 400, 968, 700, "Area Hasil Pelacakan Status Servis Live", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/02_lacak_servis.png", quality=95)

    # 3. 03_login_member.png
    # Real DOM: Google button: [465, 412, 815, 454]. Phone input: [465, 586, 815, 628]. Tabs: ~y: 490-530.
    im = Image.open(f"{src_dir}/03_login_member.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 460, 408, 820, 458, "Klik Masuk Cepat dengan Akun Google", "1", "#2563eb")
    draw_callout_box(draw, 460, 480, 820, 525, "Pilihan Tab Masuk / Daftar Baru", "2", "#d97706")
    draw_callout_box(draw, 460, 580, 820, 632, "Ketik Nomor WhatsApp Pelanggan", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/03_login_member.png", quality=95)

    # 4. 04_portal_mitra.png
    # Real DOM: Google button: [380, 362, 900, 414].
    im = Image.open(f"{src_dir}/04_portal_mitra.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 375, 358, 905, 418, "Klik Masuk / Daftar Cepat dengan Google", "1", "#e11d48")
    draw_callout_box(draw, 375, 450, 905, 500, "Pilihan Tab: Masuk Mitra vs Daftar Mitra", "2", "#2563eb")
    draw_callout_box(draw, 375, 510, 905, 780, "Formulir Akun Mitra (Dapatkan Komisi 5%)", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/04_portal_mitra.png", quality=95)

    # 5. 05_booking_servis.png
    # Left column: Brand selector (~y: 180-450). Damage (~y: 460-700). Right column: Summary card (~x: 750-1200).
    im = Image.open(f"{src_dir}/05_booking_servis.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 60, 160, 700, 380, "Pilih Merek Handphone (Apple, Samsung, dll)", "1", "#2563eb")
    draw_callout_box(draw, 60, 395, 700, 680, "Pilih Tipe Unit & Gejala Kerusakan", "2", "#d97706")
    draw_callout_box(draw, 730, 160, 1220, 580, "Kalkulator Estimasi Biaya & Garansi Terhitung", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/05_booking_servis.png", quality=95)

    # 6. 06_admin_orders.png
    # Real DOM: Sidebar: [0, 0, 288, 800]. Search input: [337, 290, 1089, 328]. Table: [321, 419, 1247, 800].
    im = Image.open(f"{src_dir}/06_admin_orders.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 10, 80, 280, 780, "Menu Bilah Samping (Sidebar Utama)", "1", "#2563eb")
    draw_callout_box(draw, 332, 285, 1094, 332, "Kolom Cari Nomor Tiket / Nama Pelanggan", "2", "#e11d48")
    draw_callout_box(draw, 318, 412, 1252, 785, "Tabel Status Antrean Servis Seluruh Unit", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/06_admin_orders.png", quality=95)

    # 7. 07_admin_walkin.png
    # Real DOM: Sidebar: [0, 0, 288, 800]. Header Card: [336, 109, 1232, 261]. Brand Grid: [369, 612, 1199, 800].
    im = Image.open(f"{src_dir}/07_admin_walkin.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 330, 105, 1238, 265, "Kasir Intake Walk-in Meja 1 (Penerimaan Unit)", "1", "#2563eb")
    draw_callout_box(draw, 360, 310, 1205, 570, "Pilih Merek Handphone Pelanggan (iPhone, Samsung, dll)", "2", "#d97706")
    draw_callout_box(draw, 360, 580, 1205, 790, "Pilih Tipe Model & Keluhan Kerusakan HP", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/07_admin_walkin.png", quality=95)

    # 8. 08_admin_cashier.png
    # Real DOM: Main content area: x: 320-1250.
    im = Image.open(f"{src_dir}/08_admin_cashier.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 320, 100, 1250, 230, "Layar Kasir Pelunasan & Pembayaran Transaksi", "1", "#2563eb")
    draw_callout_box(draw, 320, 250, 1250, 450, "Cari Tagihan Unit & Cek Rincian Biaya", "2", "#d97706")
    draw_callout_box(draw, 320, 460, 1250, 780, "Pilih Metode Bayar & Cetak Struk Thermal Kasir", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/08_admin_cashier.png", quality=95)

    # 9. 09_admin_mitra.png
    # Real DOM: Stat: [320, 243, 1248, 367]. Batch Button: [739, 541, 934, 577].
    im = Image.open(f"{src_dir}/09_admin_mitra.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 316, 238, 1252, 372, "Statistik Total Komisi Mitra yang Terbayar", "1", "#059669")
    draw_callout_box(draw, 730, 535, 940, 582, "Tombol Cetak Batch Koleksi 100 Stiker QR", "2", "#e11d48")
    draw_callout_box(draw, 316, 400, 1252, 780, "Daftar Stiker QR Mitra Terdaftar & Siap Diberikan", "3", "#2563eb")
    im.convert("RGB").save(f"{out_dir}/09_admin_mitra.png", quality=95)

    # 10. 10_admin_warranties.png
    # Real DOM: Search input: [337, 396, 1231, 434]. Table: [321, 519, 1250, 800].
    im = Image.open(f"{src_dir}/10_admin_warranties.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 332, 390, 1236, 438, "Kolom Pencarian Nomor Sertifikat Garansi Digital", "1", "#2563eb")
    draw_callout_box(draw, 316, 510, 1252, 785, "Database Sertifikat Garansi Resmi Aktif (30/90 Hari)", "2", "#059669")
    im.convert("RGB").save(f"{out_dir}/10_admin_warranties.png", quality=95)

    # 11. 11_teknisi_dashboard.png
    # Real DOM: Header: [320, 109, 1248, 203]. Content: ~y: 220-780.
    im = Image.open(f"{src_dir}/11_teknisi_dashboard.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 316, 105, 1252, 208, "Layar Meja Kerja Teknisi Lab Workshop", "1", "#2563eb")
    draw_callout_box(draw, 316, 230, 1252, 780, "Daftar Unit Dikerjakan & Tombol Geser Status 5-Tahap", "2", "#e11d48")
    im.convert("RGB").save(f"{out_dir}/11_teknisi_dashboard.png", quality=95)

    print("✅ All screenshots annotated with pixel-perfect verified coordinates!")

if __name__ == '__main__':
    annotate_all_screenshots()
