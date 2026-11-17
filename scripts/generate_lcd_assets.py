import zipfile
import xml.etree.ElementTree as ET
import re
import json
import os

EXCEL_PATH = r'f:\Downloads\LIST_LCD_OG_SUPER_RUMUS_REVISI.xlsx'

with zipfile.ZipFile(EXCEL_PATH) as z:
    sheet = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    rows = sheet.findall('.//ns:row', ns)
    items = []
    for r in rows[3:]:
        row_dict = {}
        for c in r.findall('ns:c', ns):
            col_letter = ''.join([ch for ch in c.attrib.get('r') if ch.isalpha()])
            v = c.find('ns:v', ns)
            val = v.text if v is not None else None
            is_elem = c.find('ns:is', ns)
            if is_elem is not None:
                t_elem = is_elem.find('ns:t', ns)
                if t_elem is not None:
                    val = t_elem.text
            row_dict[col_letter] = val
        nama = row_dict.get('A')
        if nama:
            items.append({
                'raw': nama.strip(),
                'base': float(row_dict.get('B') or 0)
            })

print(f"Total raw LCD items: {len(items)}")

INITIAL_POPULAR_MODELS = {
    'apple': [
        'iPhone 16 Pro Max',
        'iPhone 16 Pro',
        'iPhone 16 / 16 Plus',
        'iPhone 15 Pro Max',
        'iPhone 15 Pro',
        'iPhone 15 / 15 Plus',
        'iPhone 14 Pro Max',
        'iPhone 14 Pro',
        'iPhone 14 / 14 Plus',
        'iPhone 13 Pro Max',
        'iPhone 13 Pro',
        'iPhone 13 / 13 Mini',
        'iPhone 12 Pro Max',
        'iPhone 12 Pro',
        'iPhone 12 / 12 Mini',
        'iPhone 11 Pro Max',
        'iPhone 11 Pro',
        'iPhone 11',
        'iPhone XS Max / XS',
        'iPhone XR',
        'iPhone X',
        'iPhone 8 / 8 Plus',
        'iPhone 7 / 7 Plus'
    ],
    'samsung': [
        'Samsung Galaxy S24 Ultra',
        'Samsung Galaxy S24+ / S24',
        'Samsung Galaxy S23 Ultra',
        'Samsung Galaxy S23+ / S23',
        'Samsung Galaxy Z Fold 5 / Z Fold 6',
        'Samsung Galaxy Z Flip 5 / Z Flip 6',
        'Samsung Galaxy A55 5G',
        'Samsung Galaxy A54 5G',
        'Samsung Galaxy A35 5G',
        'Samsung Galaxy A25 5G',
        'Samsung Galaxy A15 5G / 4G',
        'Samsung Galaxy A05 / A05s',
        'Samsung Galaxy A04 / A04s / A04e',
        'Samsung Galaxy A03 / A03s / Core',
        'Samsung Galaxy A02 / A02s',
        'Samsung Galaxy A14 5G / 4G',
        'Samsung Galaxy A13 / A12',
        'Samsung Galaxy A10 / A10s',
        'Samsung Galaxy A20 / A20s / A21s',
        'Samsung Galaxy A30 / A30s / A31',
        'Samsung Galaxy A50 / A50s / A51',
        'Samsung Galaxy A70 / A71',
        'Samsung Galaxy M12 / M20 / M21'
    ],
    'vivo': [
        'Vivo X100 Pro / X100',
        'Vivo V30 Pro / V30',
        'Vivo V29 5G / V29e',
        'Vivo V27 5G / V27e',
        'Vivo V25 / V25 Pro',
        'Vivo V21 / V21e',
        'Vivo V20 / V20 SE',
        'Vivo Y100 5G',
        'Vivo Y36 / Y35',
        'Vivo Y33s / Y33T',
        'Vivo Y27 5G / Y27 4G',
        'Vivo Y22 / Y22s',
        'Vivo Y21 / Y21s / Y21A / Y21T',
        'Vivo Y20 / Y20s / Y20A / Y20i',
        'Vivo Y17s / Y16',
        'Vivo Y15s / Y15A',
        'Vivo Y12s / Y12A',
        'Vivo Y02 / Y02s / Y02t',
        'Vivo Y01 / Y01A',
        'Vivo T1 5G / T1 Pro 5G',
        'Vivo Y91 / Y93 / Y95 / Y91C'
    ],
    'oppo': [
        'OPPO Find X7 Ultra',
        'OPPO Find N3 / Find N2 Flip',
        'OPPO Reno 11 Pro / Reno 11',
        'OPPO Reno 10 Pro+ / Reno 10',
        'OPPO Reno 8 Pro / Reno 8 5G / 8T',
        'OPPO Reno 7 / Reno 7z 5G',
        'OPPO Reno 6 / Reno 6 Pro',
        'OPPO Reno 5 / Reno 5F',
        'OPPO Reno 4 / Reno 4F',
        'OPPO A79 5G / A78 5G',
        'OPPO A58 / A38',
        'OPPO A57 2022 / A57s',
        'OPPO A54 / A54s',
        'OPPO A53 / A53s',
        'OPPO A18 / A17 / A17k',
        'OPPO A16 / A16e / A16k',
        'OPPO A15 / A15s',
        'OPPO A12 / A11k / A1k',
        'OPPO A96 / A95 / A92 / A91',
        'OPPO A31 / A5 2020 / A9 2020',
        'OPPO A3s / A5s / A7'
    ],
    'realme': [
        'Realme 12 Pro+ 5G / Realme 12+',
        'Realme 11 Pro+ / Realme 11',
        'Realme 10 Pro+ / Realme 10',
        'Realme 9 Pro+ / Realme 9 / 9i',
        'Realme 8 Pro / Realme 8 / 8i',
        'Realme 7 Pro / Realme 7 / 7i',
        'Realme GT Neo 5 / GT Neo 3',
        'Realme C67 / C65 / C63',
        'Realme C55 / C53 / C51',
        'Realme C35 / C33 / C31 / C30',
        'Realme C25 / C25s / C21 / C21Y',
        'Realme C15 / C12 / C11 2021',
        'Realme C3 / C2 / C1',
        'Realme Narzo 50 / 50A / 50i',
        'Realme Narzo 30A / 20 / 20 Pro'
    ],
    'xiaomi': [
        'Xiaomi 14 / 14 Ultra',
        'Xiaomi 13T / 13T Pro',
        'Xiaomi 12 / 12 Pro / 12 Lite',
        'Redmi Note 13 Pro+ / Note 13 Pro',
        'Redmi Note 13 5G / Note 13 4G',
        'Redmi Note 12 Pro 5G / Note 12',
        'Redmi Note 11 Pro / Note 11',
        'Redmi Note 10 Pro / Note 10',
        'Redmi Note 9 Pro / Note 9',
        'Redmi Note 8 Pro / Note 8',
        'Redmi Note 7 / Note 5 Pro',
        'Redmi 13C / Redmi 13',
        'Redmi 12 / Redmi 12C',
        'Redmi 10 / 10C / 10A',
        'Redmi 9 / 9C / 9A / 9T',
        'Redmi 8 / 8A / 7 / 7A / 6A / 5A'
    ],
    'poco': [
        'POCO F6 / F6 Pro',
        'POCO X6 Pro 5G / POCO X6',
        'POCO F5 / F5 Pro',
        'POCO X5 Pro 5G / POCO X5',
        'POCO F4 GT / POCO F4',
        'POCO X4 Pro 5G / POCO X4 GT',
        'POCO X3 Pro / POCO X3 NFC',
        'POCO F3 / POCO F2 Pro',
        'POCO M6 Pro / POCO M6',
        'POCO M5 / POCO M5s',
        'POCO M4 Pro / POCO M4 5G',
        'POCO M3 Pro 5G / POCO M3',
        'POCO C65 / POCO C40 / POCO C31'
    ],
    'infinix': [
        'Infinix GT 20 Pro / GT 10 Pro',
        'Infinix Note 40 Pro+ / Note 40',
        'Infinix Note 30 Pro / Note 30',
        'Infinix Note 12 / Note 11 / Note 10',
        'Infinix Zero 30 5G / Zero Ultra',
        'Infinix Hot 40 Pro / Hot 40i',
        'Infinix Hot 30 / Hot 30i / Hot 30 Play',
        'Infinix Hot 20 / Hot 20s / Hot 20i',
        'Infinix Hot 12 / Hot 12 Play / Hot 12i',
        'Infinix Hot 11 / Hot 11s / Hot 10 / Hot 9',
        'Infinix Smart 8 / Smart 8 HD / Smart 8 Pro',
        'Infinix Smart 7 / Smart 7 HD',
        'Infinix Smart 6 / Smart 6 Plus',
        'Infinix Smart 5 / Smart 4'
    ],
    'iqoo': [
        'iQOO 12 / 12 Pro',
        'iQOO 11',
        'iQOO Neo 9 Pro / Neo 7',
        'iQOO Z9 5G / Z9x',
        'iQOO Z7 5G / Z7x'
    ],
    'tecno_itel': [
        'Tecno Camon 30 Pro / Camon 30',
        'Tecno Camon 20 Pro / Camon 20',
        'Tecno Pova 6 Pro 5G / Pova 5 Pro',
        'Tecno Pova 4 / Pova 3 / Pova Neo',
        'Tecno Spark 20 Pro+ / Spark 20',
        'Tecno Spark 10 Pro / Spark 10C',
        'Tecno Spark 9 / Spark 8 / Spark 7',
        'itel S23+ (Curved AMOLED) / itel S23',
        'itel P55 5G / itel P55 NFC',
        'itel RS4',
        'itel A70 / itel A60 / itel A60s',
        'itel Vision 1 / Vision 2 / Vision 3'
    ],
    'asus': [
        'ROG Phone 8 / 8 Pro',
        'ROG Phone 7 / 7 Ultimate',
        'ROG Phone 6 / 6D',
        'ROG Phone 5 / 5s',
        'Zenfone 10',
        'Zenfone 9'
    ],
    'others': [
        'Google Pixel 8 Pro / Pixel 8',
        'Google Pixel 7 Pro / Pixel 7',
        'Google Pixel 6 Pro / Pixel 6',
        'Huawei P60 Pro / Mate 50'
    ]
}

brand_models_set = {k: list(v) for k, v in INITIAL_POPULAR_MODELS.items()}

lcd_items = []
model_lookup = {}

IGNORED_TOKENS = {
    'CHINA', '5G', '4G', 'BLACK', 'WHITE', 'OG', 'SUPER', 'BIG', 'SMALL', 
    'OLED', 'IPS', 'TFT', 'FRAME', 'WITHOUT', 'WITH', 'NEW', 'OLD', 'PRO', 
    'PLUS', 'PRIME', 'ORIGINAL', 'GLOBAL', 'INDIA', 'INCH', 'GOLD', 'BLUE', 
    'GREEN', 'RED', 'SET', 'ONLY', 'CORNING', 'GORILLA', 'TOUCHSCREEN', 'FLEXIBLE'
}

tech_ignore = re.compile(r'^(CPH\d+|RMX\d+|SM-[A-Z0-9]+|[A-Z]\d{3}[A-Z]{1,2}|KJ\d+[A-Z]*|KG\d+[A-Z]*|BG\d+[A-Z]*|BF\d+|BD\d+[A-Z]*|BE\d+|KH\d+|KI\d+[A-Z]*|Z\d{4}|S\d{3}[A-Z]*|A\d{3,4}[A-Z]+|P\d{2,4}[A-Z]*|\d+(\.\d+)?[\`\"\']+|\d{3,4})$', re.IGNORECASE)

for idx, it in enumerate(items):
    raw = it['raw']
    base = it['base']
    item_id = f"lcd-og-{idx+1:03d}"

    # Di Excel persis:
    # Kolom C (HARGA x 1,15) = round(base * 1.15)
    # Kolom D (JASA) = 100000 (Jasa pasang flat 100 ribu seluruhnya)
    # Kolom E (SUBTOTAL) = C + D
    # Kolom F (AFFILIATE 5%) = round(E * 0.05)
    # Kolom G (HARGA AKHIR) = E + F = round((C + 100000) * 1.05)
    part_price = round(base * 1.15)
    service_fee = 100000
    subtotal = part_price + service_fee
    affiliate_fee = round(subtotal * 0.05)
    total_price = subtotal + affiliate_fee
    excel_final = total_price

    s = re.sub(r'^LCD\s*\+\s*TS\s*', '', raw, flags=re.IGNORECASE)
    s = re.sub(r'\s*(BLACK\s+)?OG\s+SUPER.*$', '', s, flags=re.IGNORECASE)
    s = re.sub(r'[\`\"\']+$', '', s).strip()

    tokens = [t.strip() for t in re.split(r'[\/\(\)\,]+', s) if t.strip()]

    current_brand = 'others'
    u_raw = raw.upper()
    if 'SMS' in u_raw or 'SAMSUNG' in u_raw:
        current_brand = 'samsung'
    elif 'VIVO' in u_raw:
        current_brand = 'vivo'
    elif 'INFINIX' in u_raw:
        current_brand = 'infinix'
    elif 'XMI' in u_raw or 'REDMI' in u_raw or 'XIAOMI' in u_raw:
        current_brand = 'xiaomi'
    elif 'OPP' in u_raw:
        current_brand = 'oppo'
    elif 'REALME' in u_raw:
        current_brand = 'realme'
    elif 'TECNO' in u_raw or 'ITEL' in u_raw:
        current_brand = 'tecno_itel'

    matched_models = []

    for t in tokens:
        t_upper = t.upper()
        raw_token = t.strip()

        # index technical tokens for search lookup
        norm_raw = re.sub(r'[^a-z0-9]', '', raw_token.lower())
        if len(norm_raw) >= 2:
            model_lookup[norm_raw] = item_id

        if 'REALME' in t_upper:
            current_brand = 'realme'
            t = re.sub(r'^REALME\s*', '', t, flags=re.IGNORECASE).strip()
        elif 'POCO' in t_upper:
            current_brand = 'poco'
            t = re.sub(r'^POCO\s*', '', t, flags=re.IGNORECASE).strip()
        elif 'REDMI' in t_upper:
            current_brand = 'xiaomi'
            t = re.sub(r'^REDMI\s*', '', t, flags=re.IGNORECASE).strip()
        elif 'IQOO' in t_upper:
            current_brand = 'iqoo'
            t = re.sub(r'^IQOO\s*', '', t, flags=re.IGNORECASE).strip()
        elif 'OPP' in t_upper or 'OPPO' in t_upper:
            current_brand = 'oppo'
            t = re.sub(r'^(OPP|OPPO)\s*', '', t, flags=re.IGNORECASE).strip()
        elif 'VIVO' in t_upper:
            current_brand = 'vivo'
            t = re.sub(r'^VIVO\s*', '', t, flags=re.IGNORECASE).strip()
        elif 'SMS' in t_upper or 'SAMSUNG' in t_upper or 'GAL' in t_upper:
            current_brand = 'samsung'
            t = re.sub(r'^(SMS|SAMSUNG|GAL)\s*', '', t, flags=re.IGNORECASE).strip()
        elif 'INFINIX' in t_upper:
            current_brand = 'infinix'
            t = re.sub(r'^INFINIX\s*', '', t, flags=re.IGNORECASE).strip()
        elif 'TECNO' in t_upper:
            current_brand = 'tecno_itel'
            t = re.sub(r'^TECNO\s*', '', t, flags=re.IGNORECASE).strip()
        elif 'ITEL' in t_upper:
            current_brand = 'tecno_itel'
            t = re.sub(r'^ITEL\s*', '', t, flags=re.IGNORECASE).strip()

        if not t or len(t) < 2 or t.upper() in IGNORED_TOKENS or tech_ignore.match(t):
            continue

        t_clean = t.strip()
        if current_brand == 'samsung':
            if not t_clean.lower().startswith(('galaxy', 'samsung')):
                formatted = f"Samsung Galaxy {t_clean}"
            else:
                formatted = f"Samsung {t_clean}"
        elif current_brand == 'vivo':
            formatted = f"Vivo {t_clean}" if not t_clean.lower().startswith('vivo') else t_clean
        elif current_brand == 'oppo':
            formatted = f"OPPO {t_clean}" if not t_clean.lower().startswith('oppo') else t_clean
        elif current_brand == 'realme':
            formatted = f"Realme {t_clean}" if not t_clean.lower().startswith('realme') else t_clean
        elif current_brand == 'xiaomi':
            if not (t_clean.lower().startswith('redmi') or t_clean.lower().startswith('mi ') or t_clean.lower().startswith('xiaomi')):
                formatted = f"Redmi {t_clean}"
            else:
                formatted = t_clean
        elif current_brand == 'poco':
            formatted = f"POCO {t_clean}" if not t_clean.lower().startswith('poco') else t_clean
        elif current_brand == 'infinix':
            formatted = f"Infinix {t_clean}" if not t_clean.lower().startswith('infinix') else t_clean
        elif current_brand == 'iqoo':
            formatted = f"iQOO {t_clean}" if not t_clean.lower().startswith('iqoo') else t_clean
        elif current_brand == 'tecno_itel':
            if not (t_clean.lower().startswith(('tecno', 'itel', 'spark', 'pop'))):
                formatted = f"Tecno / itel {t_clean}"
            else:
                formatted = t_clean
        else:
            formatted = t_clean

        formatted = re.sub(r'\s+', ' ', formatted).strip()
        matched_models.append(formatted)

        if formatted not in brand_models_set[current_brand]:
            brand_models_set[current_brand].append(formatted)

        norm_key = re.sub(r'[^a-z0-9]', '', formatted.lower())
        model_lookup[norm_key] = item_id

    entry = {
        'id': item_id,
        'title': s,
        'brand': current_brand,
        'basePrice': base,
        'partPrice': part_price,
        'serviceFee': service_fee,
        'affiliateFee': affiliate_fee,
        'totalPrice': total_price,
        'excelFinalPrice': excel_final,
        'models': list(set(matched_models)),
        'raw': raw
    }
    lcd_items.append(entry)

# Ensure lookup also links the popular models to their respective matched LCD item
for brand, m_list in brand_models_set.items():
    for m in m_list:
        clean = re.sub(r'[^a-z0-9]', '', m.lower())
        if clean not in model_lookup:
            stripped = re.sub(r'^(samsunggalaxy|samsung|vivo|oppo|realme|xiaomi|redmi|poco|infinix|iqoo|tecnoitel|asus)\s*', '', clean)
            if stripped in model_lookup:
                model_lookup[clean] = model_lookup[stripped]

# Save JSON file for backend
os.makedirs('data', exist_ok=True)
json_path = 'data/lcd_og_super.json'
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump({
        'items': lcd_items,
        'brandModels': brand_models_set,
        'lookup': model_lookup
    }, f, indent=2, ensure_ascii=False)
print(f"Saved JSON database to {json_path}")

# Save TypeScript file for client
ts_path = 'client/src/data/lcdPrices.ts'
os.makedirs(os.path.dirname(ts_path), exist_ok=True)
with open(ts_path, 'w', encoding='utf-8') as f:
    f.write('''/**
 * LCD OG SUPER - Database Estimasi Harga Servis LCD Presisi
 * Sumber data: LIST_LCD_OG_SUPER_RUMUS_REVISI.xlsx
 * Formula:
 * - Harga Barang (Part LCD) = Harga Pokok x 1.15 (Kolom C Excel)
 * - Jasa Pemasangan LCD Flat = Rp 100.000 Flat Seluruh Tipe (Kolom D Excel)
 * - Subtotal = Harga Barang + Jasa Pasang (Kolom E Excel)
 * - Affiliate 5% = Subtotal x 5% (Kolom F Excel)
 * - Total Konsumen (Harga Akhir) = Subtotal + Affiliate 5% (Kolom G Excel)
 */

export interface LcdItem {
  id: string;
  title: string;
  brand: string;
  basePrice: number;
  partPrice: number;
  serviceFee: number;
  affiliateFee?: number;
  totalPrice: number;
  excelFinalPrice: number;
  models: string[];
  raw: string;
}

export interface LcdEstimateResult {
  found: boolean;
  item?: LcdItem;
  partPrice: number;
  serviceFee: number;
  totalPrice: number;
  formattedPartPrice: string;
  formattedServiceFee: string;
  formattedTotalPrice: string;
  partTitle: string;
  warranty: string;
  warrantyNote: string;
  time: string;
}

export const LCD_ITEMS: LcdItem[] = ''')
    f.write(json.dumps(lcd_items, indent=2, ensure_ascii=False))
    f.write(';\n\n')

    f.write('export const LCD_MODELS_BY_BRAND: Record<string, string[]> = ')
    f.write(json.dumps(brand_models_set, indent=2, ensure_ascii=False))
    f.write(';\n\n')

    f.write('export const LCD_MODEL_LOOKUP: Record<string, string> = ')
    f.write(json.dumps(model_lookup, indent=2, ensure_ascii=False))
    f.write(';\n\n')

    f.write('''const LCD_ITEM_BY_ID: Record<string, LcdItem> = Object.fromEntries(
  LCD_ITEMS.map((it) => [it.id, it])
);

export function formatRupiah(num: number): string {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

/**
 * Mencari estimasi biaya LCD berdasarkan merek dan nama tipe HP
 * Seluruh jasa ganti LCD adalah Rp 100.000 FLAT.
 */
export function getLcdEstimate(brand: string, modelName: string): LcdEstimateResult {
  const defaultJasa = 100000;
  
  if (!modelName) {
    return {
      found: false,
      partPrice: 250000,
      serviceFee: defaultJasa,
      totalPrice: 350000,
      formattedPartPrice: formatRupiah(250000),
      formattedServiceFee: formatRupiah(defaultJasa),
      formattedTotalPrice: 'Part + Jasa Flat Rp 100.000',
      partTitle: 'LCD Touchscreen Grade Original Presisi',
      warranty: 'Garansi 30 Hari',
      warrantyNote: 'Garansi Resmi Layar & Sentuhan (1 Bulan) • Jasa Pasang Flat Rp 100.000',
      time: '30 - 60 Menit'
    };
  }

  const clean = modelName.toLowerCase().trim();
  const norm = clean.replace(/[^a-z0-9]/g, '');

  let matchedId = LCD_MODEL_LOOKUP[norm];

  // Fuzzy search jika belum langsung ketemu
  if (!matchedId) {
    // Coba hapus kata merek di depan (mis. 'samsung galaxy a02s' -> 'a02s')
    const stripped = clean
      .replace(/^(samsung\s*(galaxy)?|vivo|oppo|realme|xiaomi|redmi|poco|infinix|iqoo|tecno|itel|rog)\s*/i, '')
      .replace(/[^a-z0-9]/g, '');
    if (stripped && LCD_MODEL_LOOKUP[stripped]) {
      matchedId = LCD_MODEL_LOOKUP[stripped];
    }
  }

  if (!matchedId) {
    // Cari yang mengandung substring
    for (const [k, id] of Object.entries(LCD_MODEL_LOOKUP)) {
      if (k.length >= 3 && (norm.includes(k) || k.includes(norm))) {
        matchedId = id;
        break;
      }
    }
  }

  const item = matchedId ? LCD_ITEM_BY_ID[matchedId] : undefined;

  if (item) {
    return {
      found: true,
      item,
      partPrice: item.partPrice,
      serviceFee: 100000,
      totalPrice: item.totalPrice,
      formattedPartPrice: formatRupiah(item.partPrice),
      formattedServiceFee: 'Rp 100.000',
      formattedTotalPrice: formatRupiah(item.totalPrice),
      partTitle: `LCD Touchscreen ${item.title} (OG Super)`,
      warranty: 'Garansi 30 Hari',
      warrantyNote: 'Garansi Resmi Layar & Sentuhan Meja Lab (1 Bulan) • Jasa Pasang Flat Rp 100.000',
      time: '30 - 60 Menit'
    };
  }

  // Fallback untuk model iPhone / flagship yang belum ada di list Excel
  return {
    found: false,
    partPrice: 250000,
    serviceFee: defaultJasa,
    totalPrice: 350000,
    formattedPartPrice: 'Estimasi Part Sesuai Tipe',
    formattedServiceFee: 'Rp 100.000',
    formattedTotalPrice: 'Mulai Rp 350.000 (Part + Jasa Flat 100 rb)',
    partTitle: 'LCD Touchscreen Grade Original Presisi',
    warranty: 'Garansi 30 Hari',
    warrantyNote: 'Garansi Resmi Layar & Sentuhan (1 Bulan) • Jasa Pasang Flat Rp 100.000 Seluruh Tipe',
    time: '30 - 60 Menit'
  };
}
''')

print(f"Saved TypeScript file to {ts_path}")
