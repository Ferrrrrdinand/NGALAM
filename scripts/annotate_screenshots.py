#!/usr/bin/env python3
"""
Annotate screenshots with clear, professional numbered markers, callout banners,
and highlight boxes so gaptek clients can immediately see where to click and look.
"""

import os
from PIL import Image, ImageDraw, ImageFont

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def draw_badge(draw, text, x, y, bg_color="#dc2626", text_color="#ffffff", font_size=18, radius=12, pad=6):
    try:
        font = ImageFont.truetype(FONT_BOLD, font_size)
    except:
        font = ImageFont.load_default()
    
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    
    w = max(tw + pad * 2, th + pad * 2)
    h = th + pad * 2
    
    # Pill / circle
    draw.rounded_rectangle([x, y, x + w, y + h], radius=radius, fill=bg_color, outline="#ffffff", width=2)
    draw.text((x + (w - tw) / 2, y + (h - th) / 2 - 1), text, fill=text_color, font=font)
    return x + w, y + h

def draw_callout_box(draw, x1, y1, x2, y2, label="", num=None, border_color="#e11d48", bg_fill=(225, 29, 72, 35)):
    # Highlight rect
    draw.rectangle([x1, y1, x2, y2], outline=border_color, width=4)
    if label or num:
        badge_text = f" {num}. {label} " if num else f" {label} "
        try:
            font = ImageFont.truetype(FONT_BOLD, 15)
        except:
            font = ImageFont.load_default()
        
        bbox = draw.textbbox((0, 0), badge_text, font=font)
        bw = bbox[2] - bbox[0] + 12
        bh = bbox[3] - bbox[1] + 8
        
        bx = max(10, x1)
        by = max(10, y1 - bh - 4)
        draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=6, fill=border_color, outline="#ffffff", width=2)
        draw.text((bx + 6, by + 4), badge_text, fill="#ffffff", font=font)

def annotate_screenshots(src_dir="docs/screenshots", out_dir="docs/screenshots/annotated"):
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. 01_homepage.png
    im = Image.open(f"{src_dir}/01_homepage.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 340, 15, 680, 60, "Menu Navigasi Utama Website", "1", "#2563eb")
    draw_callout_box(draw, 100, 310, 480, 480, "Layanan Meja Terbuka & Teknisi", "2", "#d97706")
    draw_callout_box(draw, 50, 490, 260, 560, "Tombol Konsultasi CS WhatsApp", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/01_homepage.png", quality=95)

    # 2. 02_lacak_servis.png
    im = Image.open(f"{src_dir}/02_lacak_servis.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 350, 200, 930, 260, "Ketikkan Nomor Tiket / Nomor WhatsApp Disini", "1", "#e11d48")
    draw_callout_box(draw, 810, 205, 925, 255, "Klik Cari", "2", "#2563eb")
    draw_callout_box(draw, 360, 290, 920, 660, "Tampilan Live Progres Servis & Estimasi Biaya", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/02_lacak_servis.png", quality=95)

    # 3. 03_login_member.png
    im = Image.open(f"{src_dir}/03_login_member.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 420, 250, 860, 310, "Tombol Masuk 1-Klik Akun Google", "1", "#2563eb")
    draw_callout_box(draw, 420, 340, 860, 410, "Tab Masuk Pelanggan vs Tab Staf Kasir", "2", "#d97706")
    draw_callout_box(draw, 420, 430, 860, 620, "Opsi Masuk Menggunakan No. HP & PIN", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/03_login_member.png", quality=95)

    # 4. 04_portal_mitra.png
    im = Image.open(f"{src_dir}/04_portal_mitra.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 420, 220, 860, 280, "Tombol Masuk / Daftar Google Khusus Mitra", "1", "#e11d48")
    draw_callout_box(draw, 420, 310, 860, 365, "Pilihan Tab Masuk vs Daftar Baru", "2", "#2563eb")
    draw_callout_box(draw, 420, 380, 860, 640, "Formulir Akun Mitra (Dapat Kode Unik 5% Komisi)", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/04_portal_mitra.png", quality=95)

    # 5. 05_booking_servis.png
    im = Image.open(f"{src_dir}/05_booking_servis.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 60, 160, 420, 420, "Pilih Merek Handphone (iPhone, Samsung, dll)", "1", "#2563eb")
    draw_callout_box(draw, 60, 440, 420, 720, "Pilih Tipe Unit & Masalah Kerusakan", "2", "#d97706")
    draw_callout_box(draw, 450, 160, 880, 520, "Kalkulator Estimasi Biaya & Garansi Terhitung", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/05_booking_servis.png", quality=95)

    # 6. 06_admin_orders.png
    im = Image.open(f"{src_dir}/06_admin_orders.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 20, 100, 240, 680, "Menu Bilah Samping (Sidebar) Setiap Fitur", "1", "#2563eb")
    draw_callout_box(draw, 270, 80, 700, 130, "Kolom Cari Tiket / Nama Pelanggan", "2", "#e11d48")
    draw_callout_box(draw, 270, 150, 1240, 720, "Tabel Antrean Servis Seluruh Unit", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/06_admin_orders.png", quality=95)

    # 7. 07_admin_walkin.png
    im = Image.open(f"{src_dir}/07_admin_walkin.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 300, 100, 850, 300, "Langkah 1: Klik Logo Merek HP Pelanggan", "1", "#2563eb")
    draw_callout_box(draw, 300, 310, 850, 450, "Langkah 2: Pilih Jenis Kerusakan Unit", "2", "#d97706")
    draw_callout_box(draw, 300, 460, 850, 620, "Langkah 3: Masukkan Nama & No. WhatsApp Aktif", "3", "#059669")
    draw_callout_box(draw, 300, 640, 850, 710, "Langkah 4: Klik 'Daftarkan Unit' & Cetak Nota", "4", "#e11d48")
    im.convert("RGB").save(f"{out_dir}/07_admin_walkin.png", quality=95)

    # 8. 08_admin_cashier.png
    im = Image.open(f"{src_dir}/08_admin_cashier.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 270, 80, 600, 130, "Pencarian Tagihan / Tiket Belum Lunas", "1", "#2563eb")
    draw_callout_box(draw, 270, 150, 1240, 480, "Daftar Transaksi Pelunasan Meja Kasir", "2", "#d97706")
    draw_callout_box(draw, 950, 160, 1220, 230, "Tombol Bayar & Cetak Struk Kasir", "3", "#059669")
    im.convert("RGB").save(f"{out_dir}/08_admin_cashier.png", quality=95)

    # 9. 09_admin_mitra.png
    im = Image.open(f"{src_dir}/09_admin_mitra.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 270, 70, 1240, 140, "Statistik Total Komisi Mitra Terbayar", "1", "#059669")
    draw_callout_box(draw, 900, 160, 1240, 210, "Tombol Cetak Batch 100 Stiker QR Siap Pakai", "2", "#e11d48")
    draw_callout_box(draw, 270, 220, 1240, 720, "Katalog Stiker QR Mitra Terdaftar & Siap Diberikan", "3", "#2563eb")
    im.convert("RGB").save(f"{out_dir}/09_admin_mitra.png", quality=95)

    # 10. 10_admin_warranties.png
    im = Image.open(f"{src_dir}/10_admin_warranties.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 270, 70, 800, 130, "Kolom Cek Nomor Seri Garansi Digital", "1", "#2563eb")
    draw_callout_box(draw, 270, 150, 1240, 700, "Database Sertifikat Garansi Aktif (30 Hari / 90 Hari)", "2", "#059669")
    im.convert("RGB").save(f"{out_dir}/10_admin_warranties.png", quality=95)

    # 11. 11_teknisi_dashboard.png
    im = Image.open(f"{src_dir}/11_teknisi_dashboard.png").convert("RGBA")
    draw = ImageDraw.Draw(im)
    draw_callout_box(draw, 270, 80, 700, 130, "Pencarian Unit yang Sedang Dikerjakan", "1", "#2563eb")
    draw_callout_box(draw, 270, 160, 1240, 680, "Tombol Geser Tahapan Servis (Step 1 s/d 5)", "2", "#e11d48")
    im.convert("RGB").save(f"{out_dir}/11_teknisi_dashboard.png", quality=95)

    print("All 11 screenshots successfully annotated with visual markers!")

if __name__ == '__main__':
    annotate_screenshots()
