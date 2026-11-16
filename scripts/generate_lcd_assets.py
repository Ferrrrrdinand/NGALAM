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

INITIAL_MODELS = {
    'apple': [
        'iPhone 16 Pro / 16 Pro Max',
        'iPhone 16 / 16 Plus',
        'iPhone 15 Pro / 15 Pro Max',
        'iPhone 15 / 15 Plus',
        'iPhone 14 Pro / 14 Pro Max',
        'iPhone 14 / 14 Plus',
        'iPhone 13 Pro / 13 Pro Max',
        'iPhone 13 / 13 Mini',
        'iPhone 12 / 12 Pro / 12 Pro Max',
        'iPhone 11 / 11 Pro / 11 Pro Max',
        'iPhone X / XS / XR'
    ],
    'asus': [
        'ROG Phone 8 / 8 Pro',
        'ROG Phone 7 / 7 Ultimate',
        'ROG Phone 6 / 6D',
        'ROG Phone 5 / 5s',
        'Zenfone 10',
        'Zenfone 9'
    ]
}

brand_models_set = {
    'apple': list(INITIAL_MODELS['apple']),
    'samsung': [],
    'xiaomi': [],
    'poco': [],
    'oppo': [],
    'vivo': [],
    'realme': [],
    'infinix': [],
    'iqoo': [],
    'tecno_itel': [],
    'asus': list(INITIAL_MODELS['asus']),
    'others': []
}

lcd_items = []
model_lookup = {}

tech_ignore = re.compile(r'^(CPH\d+|RMX\d+|SM-[A-Z0-9]+|[A-Z]\d{3}[A-Z]{1,2}|KJ\d+[A-Z]*|KG\d+[A-Z]*|BG\d+[A-Z]*|BF\d+|BD\d+[A-Z]*|BE\d+|KH\d+|KI\d+[A-Z]*|Z\d{4}|S\d{3}[A-Z]*|A\d{3,4}[A-Z]+|P\d{2,4}[A-Z]*|\d+(\.\d+)?[\`\"\']+)$', re.IGNORECASE)

for idx, it in enumerate(items):
    raw = it['raw']
    base = it['base']
    item_id = f"lcd-og-{idx+1:03d}"

    # Harga Barang = normal * 1.15 + 5%
    part_price = round(base * 1.15 * 1.05)
    service_fee = 100000
    total_price = part_price + service_fee
    excel_final = round(((base * 1.15) + service_fee) * 1.05)

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

        if not t or len(t) < 2 or tech_ignore.match(t):
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
        raw_token_key = re.sub(r'[^a-z0-9]', '', t_clean.lower())
        if len(raw_token_key) >= 2:
            model_lookup[raw_token_key] = item_id

    entry = {
        'id': item_id,
        'title': s,
        'brand': current_brand,
        'basePrice': base,
        'partPrice': part_price,
        'serviceFee': service_fee,
        'totalPrice': total_price,
        'excelFinalPrice': excel_final,
        'models': list(set(matched_models)),
        'raw': raw
    }
    lcd_items.append(entry)

for b in brand_models_set:
    if b != 'apple' and b != 'asus':
        brand_models_set[b].sort()

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
 * - Harga Barang = Harga Normal x 1.15 + 5%
 * - Jasa Pemasangan LCD Flat = Rp 100.000
 * - Total Estimasi = Harga Barang + Jasa Pemasangan
 */

export interface LcdItem {
  id: string;
  title: string;
  brand: string;
  basePrice: number;
  partPrice: number;
  serviceFee: number;
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
      formattedTotalPrice: 'Rp 350.000 - Rp 1.850.000',
      partTitle: 'LCD Touchscreen Grade Original Presisi',
      warranty: 'Garansi 30 Hari',
      warrantyNote: 'Garansi Resmi Layar & Sentuhan (1 Bulan)',
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
      serviceFee: item.serviceFee,
      totalPrice: item.totalPrice,
      formattedPartPrice: formatRupiah(item.partPrice),
      formattedServiceFee: formatRupiah(item.serviceFee),
      formattedTotalPrice: formatRupiah(item.totalPrice),
      partTitle: `LCD Touchscreen ${item.title} (OG Super)`,
      warranty: 'Garansi 30 Hari',
      warrantyNote: 'Garansi Resmi Layar & Sentuhan Meja Lab (1 Bulan)',
      time: '30 - 60 Menit'
    };
  }

  // Fallback untuk model iPhone / flagship yang belum ada di list LCD Flat
  return {
    found: false,
    partPrice: 250000,
    serviceFee: defaultJasa,
    totalPrice: 350000,
    formattedPartPrice: formatRupiah(250000),
    formattedServiceFee: formatRupiah(defaultJasa),
    formattedTotalPrice: 'Rp 350.000 - Rp 1.850.000',
    partTitle: 'LCD Touchscreen Grade Original Presisi',
    warranty: 'Garansi 30 Hari',
    warrantyNote: 'Garansi Resmi Layar & Sentuhan (1 Bulan)',
    time: '30 - 60 Menit'
  };
}
''')

print(f"Saved TypeScript file to {ts_path}")
