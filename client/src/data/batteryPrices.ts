/**
 * BATTERY PRICING DATABASE & ESTIMATOR (NGALAM FIX PRO)
 * Sistem perhitungan harga baterai presisi mirip LCD:
 * - Multiplier Part Baterai: Harga Pokok x 1.20 (20% margin part)
 * - Jasa Pemasangan Spreadsheet Baterai: Rp 100.000 (Flat dalam sheet)
 * - Subtotal = Part + Jasa
 * - Affiliate 5% = Subtotal x 5%
 * - Harga Akhir Konsumen = Subtotal + Affiliate 5%
 * - JIKA TIDAK ADA DI SPREADSHEET (Fallback Android / Tipe Lain):
 *   Jasa mulai dari Rp 150.000 (Khusus Baterai: Start from Rp 150.000)
 */

export interface BatteryItem {
  id: string;
  title: string;
  brand: string;
  basePrice: number;
  partPrice: number;
  serviceFee: number;
  subtotal: number;
  affiliateFee: number;
  totalPrice: number;
  type: 'standard' | 'high_capacity' | 'cell_only' | 'genuine' | 'used_original';
  models: string[];
}

export interface BatteryEstimateResult {
  found: boolean;
  item?: BatteryItem;
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

export const BATTERY_ITEMS: BatteryItem[] = [
  {
    "id": "batt-ip-001",
    "title": "BATTERY IPHONE 11",
    "brand": "apple",
    "basePrice": 170000,
    "partPrice": 204000,
    "serviceFee": 100000,
    "subtotal": 304000,
    "affiliateFee": 15200,
    "totalPrice": 319200,
    "type": "standard",
    "models": [
      "iphone 11"
    ]
  },
  {
    "id": "batt-ip-002",
    "title": "BATTERY IPHONE 13 PRO",
    "brand": "apple",
    "basePrice": 229000,
    "partPrice": 274800,
    "serviceFee": 100000,
    "subtotal": 374800,
    "affiliateFee": 18740,
    "totalPrice": 393540,
    "type": "standard",
    "models": [
      "iphone 13 pro"
    ]
  },
  {
    "id": "batt-ip-003",
    "title": "BATTERY IPHONE XR CELL ONLY",
    "brand": "apple",
    "basePrice": 84000,
    "partPrice": 100800,
    "serviceFee": 100000,
    "subtotal": 200800,
    "affiliateFee": 10040,
    "totalPrice": 210840,
    "type": "cell_only",
    "models": [
      "iphone xr"
    ]
  },
  {
    "id": "batt-ip-004",
    "title": "BATTERY IPHONE 11 CELL ONLY",
    "brand": "apple",
    "basePrice": 88000,
    "partPrice": 105600,
    "serviceFee": 100000,
    "subtotal": 205600,
    "affiliateFee": 10280,
    "totalPrice": 215880,
    "type": "cell_only",
    "models": [
      "iphone 11"
    ]
  },
  {
    "id": "batt-ip-005",
    "title": "BATTERY IPHONE 7G",
    "brand": "apple",
    "basePrice": 99000,
    "partPrice": 118800,
    "serviceFee": 100000,
    "subtotal": 218800,
    "affiliateFee": 10940,
    "totalPrice": 229740,
    "type": "standard",
    "models": [
      "iphone 7"
    ]
  },
  {
    "id": "batt-ip-006",
    "title": "BATTERY IPHONE XS",
    "brand": "apple",
    "basePrice": 175000,
    "partPrice": 210000,
    "serviceFee": 100000,
    "subtotal": 310000,
    "affiliateFee": 15500,
    "totalPrice": 325500,
    "type": "standard",
    "models": [
      "iphone xs"
    ]
  },
  {
    "id": "batt-ip-007",
    "title": "BATTERY IPHONE 11 PRO",
    "brand": "apple",
    "basePrice": 234000,
    "partPrice": 280800,
    "serviceFee": 100000,
    "subtotal": 380800,
    "affiliateFee": 19040,
    "totalPrice": 399840,
    "type": "standard",
    "models": [
      "iphone 11 pro"
    ]
  },
  {
    "id": "batt-ip-008",
    "title": "BATTERY IPHONE 7P",
    "brand": "apple",
    "basePrice": 121000,
    "partPrice": 145200,
    "serviceFee": 100000,
    "subtotal": 245200,
    "affiliateFee": 12260,
    "totalPrice": 257460,
    "type": "standard",
    "models": [
      "iphone 7 plus"
    ]
  },
  {
    "id": "batt-ip-009",
    "title": "BATTERY IPHONE XS MAX",
    "brand": "apple",
    "basePrice": 192000,
    "partPrice": 230400,
    "serviceFee": 100000,
    "subtotal": 330400,
    "affiliateFee": 16520,
    "totalPrice": 346920,
    "type": "standard",
    "models": [
      "iphone xs max"
    ]
  },
  {
    "id": "batt-ip-010",
    "title": "BATTERY IPHONE 11 PRO MAX",
    "brand": "apple",
    "basePrice": 246000,
    "partPrice": 295200,
    "serviceFee": 100000,
    "subtotal": 395200,
    "affiliateFee": 19760,
    "totalPrice": 414960,
    "type": "standard",
    "models": [
      "iphone 11 pro max"
    ]
  },
  {
    "id": "batt-ip-011",
    "title": "BATTERY IPHONE 8G",
    "brand": "apple",
    "basePrice": 109000,
    "partPrice": 130800,
    "serviceFee": 100000,
    "subtotal": 230800,
    "affiliateFee": 11540,
    "totalPrice": 242340,
    "type": "standard",
    "models": [
      "iphone 8"
    ]
  },
  {
    "id": "batt-ip-012",
    "title": "BATTERY IPHONE 12 / 12 PRO",
    "brand": "apple",
    "basePrice": 170000,
    "partPrice": 204000,
    "serviceFee": 100000,
    "subtotal": 304000,
    "affiliateFee": 15200,
    "totalPrice": 319200,
    "type": "standard",
    "models": [
      "iphone 12",
      "iphone 12 pro"
    ]
  },
  {
    "id": "batt-ip-013",
    "title": "BATTERY IPHONE 8P",
    "brand": "apple",
    "basePrice": 134000,
    "partPrice": 160800,
    "serviceFee": 100000,
    "subtotal": 260800,
    "affiliateFee": 13040,
    "totalPrice": 273840,
    "type": "standard",
    "models": [
      "iphone 8 plus"
    ]
  },
  {
    "id": "batt-ip-014",
    "title": "BATTERY IPHONE 12 PRO MAX",
    "brand": "apple",
    "basePrice": 239000,
    "partPrice": 286800,
    "serviceFee": 100000,
    "subtotal": 386800,
    "affiliateFee": 19340,
    "totalPrice": 406140,
    "type": "standard",
    "models": [
      "iphone 12 pro max"
    ]
  },
  {
    "id": "batt-ip-015",
    "title": "BATTERY IPHONE X",
    "brand": "apple",
    "basePrice": 173000,
    "partPrice": 207600,
    "serviceFee": 100000,
    "subtotal": 307600,
    "affiliateFee": 15380,
    "totalPrice": 322980,
    "type": "standard",
    "models": [
      "iphone x"
    ]
  },
  {
    "id": "batt-ip-016",
    "title": "BATTERY IPHONE 13",
    "brand": "apple",
    "basePrice": 182000,
    "partPrice": 218400,
    "serviceFee": 100000,
    "subtotal": 318400,
    "affiliateFee": 15920,
    "totalPrice": 334320,
    "type": "standard",
    "models": [
      "iphone 13"
    ]
  },
  {
    "id": "batt-ip-017",
    "title": "BATTERY IPHONE XR",
    "brand": "apple",
    "basePrice": 137000,
    "partPrice": 164400,
    "serviceFee": 100000,
    "subtotal": 264400,
    "affiliateFee": 13220,
    "totalPrice": 277620,
    "type": "standard",
    "models": [
      "iphone xr"
    ]
  },
  {
    "id": "batt-ip-018",
    "title": "BATTERY IPHONE 14 PRO MAX",
    "brand": "apple",
    "basePrice": 297000,
    "partPrice": 356400,
    "serviceFee": 100000,
    "subtotal": 456400,
    "affiliateFee": 22820,
    "totalPrice": 479220,
    "type": "standard",
    "models": [
      "iphone 14 pro max"
    ]
  },
  {
    "id": "batt-ip-019",
    "title": "BATTERY IPHONE 14",
    "brand": "apple",
    "basePrice": 200000,
    "partPrice": 240000,
    "serviceFee": 100000,
    "subtotal": 340000,
    "affiliateFee": 17000,
    "totalPrice": 357000,
    "type": "standard",
    "models": [
      "iphone 14"
    ]
  },
  {
    "id": "batt-ip-020",
    "title": "BATTERY IPHONE 14 PRO",
    "brand": "apple",
    "basePrice": 272000,
    "partPrice": 326400,
    "serviceFee": 100000,
    "subtotal": 426400,
    "affiliateFee": 21320,
    "totalPrice": 447720,
    "type": "standard",
    "models": [
      "iphone 14 pro"
    ]
  },
  {
    "id": "batt-ip-021",
    "title": "BATTERY IPHONE 13 PRO MAX",
    "brand": "apple",
    "basePrice": 262000,
    "partPrice": 314400,
    "serviceFee": 100000,
    "subtotal": 414400,
    "affiliateFee": 20720,
    "totalPrice": 435120,
    "type": "standard",
    "models": [
      "iphone 13 pro max"
    ]
  },
  {
    "id": "batt-ip-022",
    "title": "BATTERY IPHONE 14 PLUS",
    "brand": "apple",
    "basePrice": 218000,
    "partPrice": 261600,
    "serviceFee": 100000,
    "subtotal": 361600,
    "affiliateFee": 18080,
    "totalPrice": 379680,
    "type": "standard",
    "models": [
      "iphone 14 plus"
    ]
  },
  {
    "id": "batt-ip-023",
    "title": "BATTERY IPHONE 12 MINI",
    "brand": "apple",
    "basePrice": 158000,
    "partPrice": 189600,
    "serviceFee": 100000,
    "subtotal": 289600,
    "affiliateFee": 14480,
    "totalPrice": 304080,
    "type": "standard",
    "models": [
      "iphone 12 mini"
    ]
  },
  {
    "id": "batt-ip-024",
    "title": "BATTERY IPHONE SE 2020",
    "brand": "apple",
    "basePrice": 120000,
    "partPrice": 144000,
    "serviceFee": 100000,
    "subtotal": 244000,
    "affiliateFee": 12200,
    "totalPrice": 256200,
    "type": "standard",
    "models": [
      "iphone se 2020"
    ]
  },
  {
    "id": "batt-ip-025",
    "title": "BATTERY IPHONE 6SP",
    "brand": "apple",
    "basePrice": 99000,
    "partPrice": 118800,
    "serviceFee": 100000,
    "subtotal": 218800,
    "affiliateFee": 10940,
    "totalPrice": 229740,
    "type": "standard",
    "models": [
      "iphone 6s plus"
    ]
  },
  {
    "id": "batt-ip-026",
    "title": "BATTERY IPHONE 6S",
    "brand": "apple",
    "basePrice": 101000,
    "partPrice": 121200,
    "serviceFee": 100000,
    "subtotal": 221200,
    "affiliateFee": 11060,
    "totalPrice": 232260,
    "type": "standard",
    "models": [
      "iphone 6s"
    ]
  },
  {
    "id": "batt-ip-027",
    "title": "BATTERY IPHONE 6P",
    "brand": "apple",
    "basePrice": 94000,
    "partPrice": 112800,
    "serviceFee": 100000,
    "subtotal": 212800,
    "affiliateFee": 10640,
    "totalPrice": 223440,
    "type": "standard",
    "models": [
      "iphone 6 plus"
    ]
  },
  {
    "id": "batt-ip-028",
    "title": "BATTERY IPHONE 6G",
    "brand": "apple",
    "basePrice": 79000,
    "partPrice": 94800,
    "serviceFee": 100000,
    "subtotal": 194800,
    "affiliateFee": 9740,
    "totalPrice": 204540,
    "type": "standard",
    "models": [
      "iphone 6"
    ]
  },
  {
    "id": "batt-ip-029",
    "title": "BATTERY IPHONE 15 PRO",
    "brand": "apple",
    "basePrice": 259000,
    "partPrice": 310800,
    "serviceFee": 100000,
    "subtotal": 410800,
    "affiliateFee": 20540,
    "totalPrice": 431340,
    "type": "standard",
    "models": [
      "iphone 15 pro"
    ]
  },
  {
    "id": "batt-ip-030",
    "title": "BATTERY IPHONE 14 PRO MAX CELL ONLY",
    "brand": "apple",
    "basePrice": 214000,
    "partPrice": 256800,
    "serviceFee": 100000,
    "subtotal": 356800,
    "affiliateFee": 17840,
    "totalPrice": 374640,
    "type": "cell_only",
    "models": [
      "iphone 14 pro max"
    ]
  },
  {
    "id": "batt-ip-031",
    "title": "BATTERY IPHONE 14 PRO CELL ONLY",
    "brand": "apple",
    "basePrice": 155000,
    "partPrice": 186000,
    "serviceFee": 100000,
    "subtotal": 286000,
    "affiliateFee": 14300,
    "totalPrice": 300300,
    "type": "cell_only",
    "models": [
      "iphone 14 pro"
    ]
  },
  {
    "id": "batt-ip-032",
    "title": "BATTERY IPHONE 14 CELL ONLY",
    "brand": "apple",
    "basePrice": 95000,
    "partPrice": 114000,
    "serviceFee": 100000,
    "subtotal": 214000,
    "affiliateFee": 10700,
    "totalPrice": 224700,
    "type": "cell_only",
    "models": [
      "iphone 14"
    ]
  },
  {
    "id": "batt-ip-033",
    "title": "BATTERY IPHONE 13 PRO MAX CELL ONLY",
    "brand": "apple",
    "basePrice": 189000,
    "partPrice": 226800,
    "serviceFee": 100000,
    "subtotal": 326800,
    "affiliateFee": 16340,
    "totalPrice": 343140,
    "type": "cell_only",
    "models": [
      "iphone 13 pro max"
    ]
  },
  {
    "id": "batt-ip-034",
    "title": "BATTERY IPHONE 17 PRO MAX",
    "brand": "apple",
    "basePrice": 403000,
    "partPrice": 483600,
    "serviceFee": 100000,
    "subtotal": 583600,
    "affiliateFee": 29180,
    "totalPrice": 612780,
    "type": "standard",
    "models": [
      "iphone 17 pro max"
    ]
  },
  {
    "id": "batt-ip-035",
    "title": "BATTERY IPHONE 17 PRO",
    "brand": "apple",
    "basePrice": 390000,
    "partPrice": 468000,
    "serviceFee": 100000,
    "subtotal": 568000,
    "affiliateFee": 28400,
    "totalPrice": 596400,
    "type": "standard",
    "models": [
      "iphone 17 pro"
    ]
  },
  {
    "id": "batt-ip-036",
    "title": "BATTERY IPHONE 17",
    "brand": "apple",
    "basePrice": 309000,
    "partPrice": 370800,
    "serviceFee": 100000,
    "subtotal": 470800,
    "affiliateFee": 23540,
    "totalPrice": 494340,
    "type": "standard",
    "models": [
      "iphone 17"
    ]
  },
  {
    "id": "batt-ip-037",
    "title": "BATTERY IPHONE 14 PLUS CELL ONLY",
    "brand": "apple",
    "basePrice": 119000,
    "partPrice": 142800,
    "serviceFee": 100000,
    "subtotal": 242800,
    "affiliateFee": 12140,
    "totalPrice": 254940,
    "type": "cell_only",
    "models": [
      "iphone 14 plus"
    ]
  },
  {
    "id": "batt-ip-038",
    "title": "BATTERY IPHONE 15 PLUS CELL ONLY",
    "brand": "apple",
    "basePrice": 142000,
    "partPrice": 170400,
    "serviceFee": 100000,
    "subtotal": 270400,
    "affiliateFee": 13520,
    "totalPrice": 283920,
    "type": "cell_only",
    "models": [
      "iphone 15 plus"
    ]
  },
  {
    "id": "batt-ip-039",
    "title": "BATTERY IPHONE 13 MINI CELL ONLY",
    "brand": "apple",
    "basePrice": 83000,
    "partPrice": 99600,
    "serviceFee": 100000,
    "subtotal": 199600,
    "affiliateFee": 9980,
    "totalPrice": 209580,
    "type": "cell_only",
    "models": [
      "iphone 13 mini"
    ]
  },
  {
    "id": "batt-ip-040",
    "title": "BATTERY IPHONE 13 PRO CELL ONLY",
    "brand": "apple",
    "basePrice": 152000,
    "partPrice": 182400,
    "serviceFee": 100000,
    "subtotal": 282400,
    "affiliateFee": 14120,
    "totalPrice": 296520,
    "type": "cell_only",
    "models": [
      "iphone 13 pro"
    ]
  },
  {
    "id": "batt-ip-041",
    "title": "BATTERY IPHONE X CELL ONLY",
    "brand": "apple",
    "basePrice": 101000,
    "partPrice": 121200,
    "serviceFee": 100000,
    "subtotal": 221200,
    "affiliateFee": 11060,
    "totalPrice": 232260,
    "type": "cell_only",
    "models": [
      "iphone x"
    ]
  },
  {
    "id": "batt-ip-042",
    "title": "BATTERY IPHONE XS MAX CELL ONLY",
    "brand": "apple",
    "basePrice": 107000,
    "partPrice": 128400,
    "serviceFee": 100000,
    "subtotal": 228400,
    "affiliateFee": 11420,
    "totalPrice": 239820,
    "type": "cell_only",
    "models": [
      "iphone xs max"
    ]
  },
  {
    "id": "batt-ip-043",
    "title": "BATTERY IPHONE XS CELL ONLY",
    "brand": "apple",
    "basePrice": 115000,
    "partPrice": 138000,
    "serviceFee": 100000,
    "subtotal": 238000,
    "affiliateFee": 11900,
    "totalPrice": 249900,
    "type": "cell_only",
    "models": [
      "iphone xs"
    ]
  },
  {
    "id": "batt-ip-044",
    "title": "BP BATTERY IPHONE 7G HC",
    "brand": "apple",
    "basePrice": 157000,
    "partPrice": 188400,
    "serviceFee": 100000,
    "subtotal": 288400,
    "affiliateFee": 14420,
    "totalPrice": 302820,
    "type": "high_capacity",
    "models": [
      "iphone 7"
    ]
  },
  {
    "id": "batt-ip-045",
    "title": "BP BATTERY IPHONE 7P HC",
    "brand": "apple",
    "basePrice": 160000,
    "partPrice": 192000,
    "serviceFee": 100000,
    "subtotal": 292000,
    "affiliateFee": 14600,
    "totalPrice": 306600,
    "type": "high_capacity",
    "models": [
      "iphone 7 plus"
    ]
  },
  {
    "id": "batt-ip-046",
    "title": "BP BATTERY IPHONE 8G HC",
    "brand": "apple",
    "basePrice": 188000,
    "partPrice": 225600,
    "serviceFee": 100000,
    "subtotal": 325600,
    "affiliateFee": 16280,
    "totalPrice": 341880,
    "type": "high_capacity",
    "models": [
      "iphone 8"
    ]
  },
  {
    "id": "batt-ip-047",
    "title": "BP BATTERY IPHONE 8P HC",
    "brand": "apple",
    "basePrice": 212000,
    "partPrice": 254400,
    "serviceFee": 100000,
    "subtotal": 354400,
    "affiliateFee": 17720,
    "totalPrice": 372120,
    "type": "high_capacity",
    "models": [
      "iphone 8 plus"
    ]
  },
  {
    "id": "batt-ip-048",
    "title": "BP BATTERY IPHONE X HC",
    "brand": "apple",
    "basePrice": 268000,
    "partPrice": 321600,
    "serviceFee": 100000,
    "subtotal": 421600,
    "affiliateFee": 21080,
    "totalPrice": 442680,
    "type": "high_capacity",
    "models": [
      "iphone x"
    ]
  },
  {
    "id": "batt-ip-049",
    "title": "BP BATTERY IPHONE XR HC",
    "brand": "apple",
    "basePrice": 268000,
    "partPrice": 321600,
    "serviceFee": 100000,
    "subtotal": 421600,
    "affiliateFee": 21080,
    "totalPrice": 442680,
    "type": "high_capacity",
    "models": [
      "iphone xr"
    ]
  },
  {
    "id": "batt-ip-050",
    "title": "BP BATTERY IPHONE XS HC",
    "brand": "apple",
    "basePrice": 282000,
    "partPrice": 338400,
    "serviceFee": 100000,
    "subtotal": 438400,
    "affiliateFee": 21920,
    "totalPrice": 460320,
    "type": "high_capacity",
    "models": [
      "iphone xs"
    ]
  },
  {
    "id": "batt-ip-051",
    "title": "BP BATTERY IPHONE XS MAX HC",
    "brand": "apple",
    "basePrice": 282000,
    "partPrice": 338400,
    "serviceFee": 100000,
    "subtotal": 438400,
    "affiliateFee": 21920,
    "totalPrice": 460320,
    "type": "high_capacity",
    "models": [
      "iphone xs max"
    ]
  },
  {
    "id": "batt-ip-052",
    "title": "BP BATTERY IPHONE 11 HC",
    "brand": "apple",
    "basePrice": 230000,
    "partPrice": 276000,
    "serviceFee": 100000,
    "subtotal": 376000,
    "affiliateFee": 18800,
    "totalPrice": 394800,
    "type": "high_capacity",
    "models": [
      "iphone 11"
    ]
  },
  {
    "id": "batt-ip-053",
    "title": "BP BATTERY IPHONE 11 PRO HC",
    "brand": "apple",
    "basePrice": 313000,
    "partPrice": 375600,
    "serviceFee": 100000,
    "subtotal": 475600,
    "affiliateFee": 23780,
    "totalPrice": 499380,
    "type": "high_capacity",
    "models": [
      "iphone 11 pro"
    ]
  },
  {
    "id": "batt-ip-054",
    "title": "BP BATTERY IPHONE 11 PRO MAX HC",
    "brand": "apple",
    "basePrice": 348000,
    "partPrice": 417600,
    "serviceFee": 100000,
    "subtotal": 517600,
    "affiliateFee": 25880,
    "totalPrice": 543480,
    "type": "high_capacity",
    "models": [
      "iphone 11 pro max"
    ]
  },
  {
    "id": "batt-ip-055",
    "title": "BP BATTERY IPHONE 12 / 12 PRO HCSD USED",
    "brand": "apple",
    "basePrice": 343000,
    "partPrice": 411600,
    "serviceFee": 100000,
    "subtotal": 511600,
    "affiliateFee": 25580,
    "totalPrice": 537180,
    "type": "used_original",
    "models": [
      "iphone 12",
      "iphone 12 pro"
    ]
  },
  {
    "id": "batt-ip-056",
    "title": "BP BATTERY IPHONE 12 PRO MAX HCSD USED",
    "brand": "apple",
    "basePrice": 362000,
    "partPrice": 434400,
    "serviceFee": 100000,
    "subtotal": 534400,
    "affiliateFee": 26720,
    "totalPrice": 561120,
    "type": "used_original",
    "models": [
      "iphone 12 pro max"
    ]
  },
  {
    "id": "batt-ip-057",
    "title": "BP BATTERY IPHONE 12 PRO MAX HCSD GENUINE",
    "brand": "apple",
    "basePrice": 605000,
    "partPrice": 726000,
    "serviceFee": 100000,
    "subtotal": 826000,
    "affiliateFee": 41300,
    "totalPrice": 867300,
    "type": "genuine",
    "models": [
      "iphone 12 pro max"
    ]
  },
  {
    "id": "batt-ip-058",
    "title": "BP BATTERY IPHONE 13 HCSD USED",
    "brand": "apple",
    "basePrice": 292000,
    "partPrice": 350400,
    "serviceFee": 100000,
    "subtotal": 450400,
    "affiliateFee": 22520,
    "totalPrice": 472920,
    "type": "used_original",
    "models": [
      "iphone 13"
    ]
  },
  {
    "id": "batt-ip-059",
    "title": "BP BATTERY IPHONE 13 PRO HCSD USED",
    "brand": "apple",
    "basePrice": 357000,
    "partPrice": 428400,
    "serviceFee": 100000,
    "subtotal": 528400,
    "affiliateFee": 26420,
    "totalPrice": 554820,
    "type": "used_original",
    "models": [
      "iphone 13 pro"
    ]
  },
  {
    "id": "batt-ip-060",
    "title": "BP BATTERY IPHONE 13 PRO MAX HCSD USED",
    "brand": "apple",
    "basePrice": 395000,
    "partPrice": 474000,
    "serviceFee": 100000,
    "subtotal": 574000,
    "affiliateFee": 28700,
    "totalPrice": 602700,
    "type": "used_original",
    "models": [
      "iphone 13 pro max"
    ]
  },
  {
    "id": "batt-ip-061",
    "title": "BP BATTERY IPHONE 14 HCSD USED",
    "brand": "apple",
    "basePrice": 292000,
    "partPrice": 350400,
    "serviceFee": 100000,
    "subtotal": 450400,
    "affiliateFee": 22520,
    "totalPrice": 472920,
    "type": "used_original",
    "models": [
      "iphone 14"
    ]
  },
  {
    "id": "batt-ip-062",
    "title": "BP BATTERY IPHONE 14 PLUS HCSD USED",
    "brand": "apple",
    "basePrice": 327000,
    "partPrice": 392400,
    "serviceFee": 100000,
    "subtotal": 492400,
    "affiliateFee": 24620,
    "totalPrice": 517020,
    "type": "used_original",
    "models": [
      "iphone 14 plus"
    ]
  },
  {
    "id": "batt-ip-063",
    "title": "BP BATTERY IPHONE 14 PRO HCSD USED",
    "brand": "apple",
    "basePrice": 372000,
    "partPrice": 446400,
    "serviceFee": 100000,
    "subtotal": 546400,
    "affiliateFee": 27320,
    "totalPrice": 573720,
    "type": "used_original",
    "models": [
      "iphone 14 pro"
    ]
  },
  {
    "id": "batt-ip-064",
    "title": "BP BATTERY IPHONE 14 PRO MAX HCSD USED",
    "brand": "apple",
    "basePrice": 421000,
    "partPrice": 505200,
    "serviceFee": 100000,
    "subtotal": 605200,
    "affiliateFee": 30260,
    "totalPrice": 635460,
    "type": "used_original",
    "models": [
      "iphone 14 pro max"
    ]
  },
  {
    "id": "batt-ip-065",
    "title": "BP BATTERY IPHONE 15 HCSD USED",
    "brand": "apple",
    "basePrice": 299000,
    "partPrice": 358800,
    "serviceFee": 100000,
    "subtotal": 458800,
    "affiliateFee": 22940,
    "totalPrice": 481740,
    "type": "used_original",
    "models": [
      "iphone 15"
    ]
  },
  {
    "id": "batt-ip-066",
    "title": "BP BATTERY IPHONE 15 PLUS HCSD USED",
    "brand": "apple",
    "basePrice": 327000,
    "partPrice": 392400,
    "serviceFee": 100000,
    "subtotal": 492400,
    "affiliateFee": 24620,
    "totalPrice": 517020,
    "type": "used_original",
    "models": [
      "iphone 15 plus"
    ]
  },
  {
    "id": "batt-ip-067",
    "title": "BP BATTERY IPHONE 15 PRO HCSD USED",
    "brand": "apple",
    "basePrice": 383000,
    "partPrice": 459600,
    "serviceFee": 100000,
    "subtotal": 559600,
    "affiliateFee": 27980,
    "totalPrice": 587580,
    "type": "used_original",
    "models": [
      "iphone 15 pro"
    ]
  },
  {
    "id": "batt-ip-068",
    "title": "BP BATTERY IPHONE 15 PRO MAX HCSD USED",
    "brand": "apple",
    "basePrice": 432000,
    "partPrice": 518400,
    "serviceFee": 100000,
    "subtotal": 618400,
    "affiliateFee": 30920,
    "totalPrice": 649320,
    "type": "used_original",
    "models": [
      "iphone 15 pro max"
    ]
  },
  {
    "id": "batt-ip-069",
    "title": "BP BATTERY IPHONE 12 MINI HCSD USED",
    "brand": "apple",
    "basePrice": 265000,
    "partPrice": 318000,
    "serviceFee": 100000,
    "subtotal": 418000,
    "affiliateFee": 20900,
    "totalPrice": 438900,
    "type": "used_original",
    "models": [
      "iphone 12 mini"
    ]
  },
  {
    "id": "batt-ip-070",
    "title": "BP BATTERY IPHONE 13 MINI HCSD USED",
    "brand": "apple",
    "basePrice": 268000,
    "partPrice": 321600,
    "serviceFee": 100000,
    "subtotal": 421600,
    "affiliateFee": 21080,
    "totalPrice": 442680,
    "type": "used_original",
    "models": [
      "iphone 13 mini"
    ]
  },
  {
    "id": "batt-ip-071",
    "title": "BP BATTERY IPHONE SE 2020 HC",
    "brand": "apple",
    "basePrice": 171000,
    "partPrice": 205200,
    "serviceFee": 100000,
    "subtotal": 305200,
    "affiliateFee": 15260,
    "totalPrice": 320460,
    "type": "high_capacity",
    "models": [
      "iphone se 2020"
    ]
  },
  {
    "id": "batt-ip-072",
    "title": "BP BATTERY IPHONE 12 / 12 PRO HCSD GENUINE",
    "brand": "apple",
    "basePrice": 520000,
    "partPrice": 624000,
    "serviceFee": 100000,
    "subtotal": 724000,
    "affiliateFee": 36200,
    "totalPrice": 760200,
    "type": "genuine",
    "models": [
      "iphone 12",
      "iphone 12 pro"
    ]
  },
  {
    "id": "batt-ip-073",
    "title": "BP BATTERY IPHONE 12 MINI HCSD GENUINE",
    "brand": "apple",
    "basePrice": 505000,
    "partPrice": 606000,
    "serviceFee": 100000,
    "subtotal": 706000,
    "affiliateFee": 35300,
    "totalPrice": 741300,
    "type": "genuine",
    "models": [
      "iphone 12 mini"
    ]
  },
  {
    "id": "batt-ip-074",
    "title": "BP BATTERY IPHONE 13 HCSD GENUINE",
    "brand": "apple",
    "basePrice": 535000,
    "partPrice": 642000,
    "serviceFee": 100000,
    "subtotal": 742000,
    "affiliateFee": 37100,
    "totalPrice": 779100,
    "type": "genuine",
    "models": [
      "iphone 13"
    ]
  },
  {
    "id": "batt-ip-075",
    "title": "BP BATTERY IPHONE 14 PRO HCSD GENUINE",
    "brand": "apple",
    "basePrice": 694000,
    "partPrice": 832800,
    "serviceFee": 100000,
    "subtotal": 932800,
    "affiliateFee": 46640,
    "totalPrice": 979440,
    "type": "genuine",
    "models": [
      "iphone 14 pro"
    ]
  },
  {
    "id": "batt-ip-076",
    "title": "BP BATTERY IPHONE 14 PRO MAX HCSD GENUINE",
    "brand": "apple",
    "basePrice": 572000,
    "partPrice": 686400,
    "serviceFee": 100000,
    "subtotal": 786400,
    "affiliateFee": 39320,
    "totalPrice": 825720,
    "type": "genuine",
    "models": [
      "iphone 14 pro max"
    ]
  },
  {
    "id": "batt-ip-077",
    "title": "BP BATTERY IPHONE 15 PRO MAX HCSD GENUINE",
    "brand": "apple",
    "basePrice": 699000,
    "partPrice": 838800,
    "serviceFee": 100000,
    "subtotal": 938800,
    "affiliateFee": 46940,
    "totalPrice": 985740,
    "type": "genuine",
    "models": [
      "iphone 15 pro max"
    ]
  },
  {
    "id": "batt-ip-078",
    "title": "BP BATTERY IPHONE 15 HCSD GENUINE",
    "brand": "apple",
    "basePrice": 547000,
    "partPrice": 656400,
    "serviceFee": 100000,
    "subtotal": 756400,
    "affiliateFee": 37820,
    "totalPrice": 794220,
    "type": "genuine",
    "models": [
      "iphone 15"
    ]
  },
  {
    "id": "batt-ip-079",
    "title": "BP BATTERY IPHONE 14 PLUS HCSD GENUINE",
    "brand": "apple",
    "basePrice": 637000,
    "partPrice": 764400,
    "serviceFee": 100000,
    "subtotal": 864400,
    "affiliateFee": 43220,
    "totalPrice": 907620,
    "type": "genuine",
    "models": [
      "iphone 14 plus"
    ]
  },
  {
    "id": "batt-ip-080",
    "title": "BATTERY IPHONE 12 / 12 PRO CELL ONLY",
    "brand": "apple",
    "basePrice": 81000,
    "partPrice": 97200,
    "serviceFee": 100000,
    "subtotal": 197200,
    "affiliateFee": 9860,
    "totalPrice": 207060,
    "type": "cell_only",
    "models": [
      "iphone 12",
      "iphone 12 pro"
    ]
  },
  {
    "id": "batt-ip-081",
    "title": "BATTERY IPHONE 12 PRO MAX CELL ONLY",
    "brand": "apple",
    "basePrice": 163000,
    "partPrice": 195600,
    "serviceFee": 100000,
    "subtotal": 295600,
    "affiliateFee": 14780,
    "totalPrice": 310380,
    "type": "cell_only",
    "models": [
      "iphone 12 pro max"
    ]
  },
  {
    "id": "batt-ip-082",
    "title": "BATTERY IPHONE 15 PRO CELL ONLY",
    "brand": "apple",
    "basePrice": 157000,
    "partPrice": 188400,
    "serviceFee": 100000,
    "subtotal": 288400,
    "affiliateFee": 14420,
    "totalPrice": 302820,
    "type": "cell_only",
    "models": [
      "iphone 15 pro"
    ]
  },
  {
    "id": "batt-ip-083",
    "title": "BATTERY IPHONE 11 PRO CELL ONLY",
    "brand": "apple",
    "basePrice": 150000,
    "partPrice": 180000,
    "serviceFee": 100000,
    "subtotal": 280000,
    "affiliateFee": 14000,
    "totalPrice": 294000,
    "type": "cell_only",
    "models": [
      "iphone 11 pro"
    ]
  },
  {
    "id": "batt-ip-084",
    "title": "BP BATTERY IPHONE 13 MINI HCSD GENUINE",
    "brand": "apple",
    "basePrice": 508000,
    "partPrice": 609600,
    "serviceFee": 100000,
    "subtotal": 709600,
    "affiliateFee": 35480,
    "totalPrice": 745080,
    "type": "genuine",
    "models": [
      "iphone 13 mini"
    ]
  },
  {
    "id": "batt-ip-085",
    "title": "BP BATTERY IPHONE 15 PLUS HCSD GENUINE",
    "brand": "apple",
    "basePrice": 678000,
    "partPrice": 813600,
    "serviceFee": 100000,
    "subtotal": 913600,
    "affiliateFee": 45680,
    "totalPrice": 959280,
    "type": "genuine",
    "models": [
      "iphone 15 plus"
    ]
  },
  {
    "id": "batt-ip-086",
    "title": "BP BATTERY IPHONE 15 PRO HCSD GENUINE",
    "brand": "apple",
    "basePrice": 661000,
    "partPrice": 793200,
    "serviceFee": 100000,
    "subtotal": 893200,
    "affiliateFee": 44660,
    "totalPrice": 937860,
    "type": "genuine",
    "models": [
      "iphone 15 pro"
    ]
  },
  {
    "id": "batt-ip-087",
    "title": "BP BATTERY IPHONE 13 PRO HCSD GENUINE",
    "brand": "apple",
    "basePrice": 622000,
    "partPrice": 746400,
    "serviceFee": 100000,
    "subtotal": 846400,
    "affiliateFee": 42320,
    "totalPrice": 888720,
    "type": "genuine",
    "models": [
      "iphone 13 pro"
    ]
  },
  {
    "id": "batt-ip-088",
    "title": "BP BATTERY IPHONE 13 PRO MAX HCSD GENUINE",
    "brand": "apple",
    "basePrice": 660000,
    "partPrice": 792000,
    "serviceFee": 100000,
    "subtotal": 892000,
    "affiliateFee": 44600,
    "totalPrice": 936600,
    "type": "genuine",
    "models": [
      "iphone 13 pro max"
    ]
  },
  {
    "id": "batt-ip-089",
    "title": "BP BATTERY IPHONE 14 HCSD GENUINE",
    "brand": "apple",
    "basePrice": 562000,
    "partPrice": 674400,
    "serviceFee": 100000,
    "subtotal": 774400,
    "affiliateFee": 38720,
    "totalPrice": 813120,
    "type": "genuine",
    "models": [
      "iphone 14"
    ]
  },
  {
    "id": "batt-ip-090",
    "title": "BATTERY IPHONE 13 MINI",
    "brand": "apple",
    "basePrice": 164000,
    "partPrice": 196800,
    "serviceFee": 100000,
    "subtotal": 296800,
    "affiliateFee": 14840,
    "totalPrice": 311640,
    "type": "standard",
    "models": [
      "iphone 13 mini"
    ]
  },
  {
    "id": "batt-ip-091",
    "title": "BATTERY IPHONE 15 PLUS",
    "brand": "apple",
    "basePrice": 241000,
    "partPrice": 289200,
    "serviceFee": 100000,
    "subtotal": 389200,
    "affiliateFee": 19460,
    "totalPrice": 408660,
    "type": "standard",
    "models": [
      "iphone 15 plus"
    ]
  },
  {
    "id": "batt-ip-092",
    "title": "BATTERY IPHONE 11 PRO MAX CELL ONLY",
    "brand": "apple",
    "basePrice": 188000,
    "partPrice": 225600,
    "serviceFee": 100000,
    "subtotal": 325600,
    "affiliateFee": 16280,
    "totalPrice": 341880,
    "type": "cell_only",
    "models": [
      "iphone 11 pro max"
    ]
  },
  {
    "id": "batt-ip-093",
    "title": "BATTERY IPHONE 15 PRO MAX",
    "brand": "apple",
    "basePrice": 287000,
    "partPrice": 344400,
    "serviceFee": 100000,
    "subtotal": 444400,
    "affiliateFee": 22220,
    "totalPrice": 466620,
    "type": "standard",
    "models": [
      "iphone 15 pro max"
    ]
  },
  {
    "id": "batt-ip-094",
    "title": "BATTERY IPHONE 13 CELL ONLY",
    "brand": "apple",
    "basePrice": 93000,
    "partPrice": 111600,
    "serviceFee": 100000,
    "subtotal": 211600,
    "affiliateFee": 10580,
    "totalPrice": 222180,
    "type": "cell_only",
    "models": [
      "iphone 13"
    ]
  },
  {
    "id": "batt-ip-095",
    "title": "BATTERY IPHONE 15 CELL ONLY",
    "brand": "apple",
    "basePrice": 96000,
    "partPrice": 115200,
    "serviceFee": 100000,
    "subtotal": 215200,
    "affiliateFee": 10760,
    "totalPrice": 225960,
    "type": "cell_only",
    "models": [
      "iphone 15"
    ]
  },
  {
    "id": "batt-ip-096",
    "title": "BATTERY IPHONE 12 MINI CELL ONLY",
    "brand": "apple",
    "basePrice": 88000,
    "partPrice": 105600,
    "serviceFee": 100000,
    "subtotal": 205600,
    "affiliateFee": 10280,
    "totalPrice": 215880,
    "type": "cell_only",
    "models": [
      "iphone 12 mini"
    ]
  }
];

export function formatRupiah(num: number): string {
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

/**
 * Normalisasi nama model untuk pencarian presisi
 */
function normalizeModel(str: string): string {
  return str
    .toLowerCase()
    .replace(/^apples+/i, '')
    .replace(/[^a-z0-9]/g, '');
}

// Map model normalized string -> BatteryItem
// Prioritas: standard > used_original > high_capacity > genuine > cell_only
const TYPE_PRIORITY: Record<string, number> = {
  standard: 1,
  used_original: 2,
  high_capacity: 3,
  genuine: 4,
  cell_only: 5
};

const BATTERY_LOOKUP: Record<string, BatteryItem> = {};

BATTERY_ITEMS.forEach((item) => {
  item.models.forEach((m) => {
    const key = normalizeModel(m);
    const existing = BATTERY_LOOKUP[key];
    if (!existing || TYPE_PRIORITY[item.type] < TYPE_PRIORITY[existing.type]) {
      BATTERY_LOOKUP[key] = item;
    }
  });
});

/**
 * Mendapatkan estimasi harga servis baterai
 * Jika ada di spreadsheet: Part x 1.20 + Jasa Rp 100.000 + 5%
 * Jika TIDAK ada di spreadsheet: Jasa Mulai Rp 150.000 (khusus baterai)
 */
export function getBatteryEstimate(brand: string, modelName: string): BatteryEstimateResult {
  const cleanBrand = (brand || '').toLowerCase().trim();
  const cleanModel = (modelName || '').toLowerCase().trim();
  const norm = normalizeModel(cleanModel);

  let matched: BatteryItem | undefined = undefined;

  if (cleanBrand === 'apple' || norm.startsWith('iphone') || norm.startsWith('ip')) {
    // Coba exact normalized lookup
    matched = BATTERY_LOOKUP[norm];

    // Jika belum ketemu, coba cari substring / fuzzy
    if (!matched) {
      for (const [key, item] of Object.entries(BATTERY_LOOKUP)) {
        if (norm.length >= 4 && (norm.includes(key) || key.includes(norm))) {
          matched = item;
          break;
        }
      }
    }

    // Jika model gabungan (misal 'iPhone 15 / 15 Plus')
    if (!matched && cleanModel.includes('/')) {
      const parts = cleanModel.split('/');
      for (const p of parts) {
        const subNorm = normalizeModel(p.includes('iphone') ? p : 'iphone ' + p);
        if (BATTERY_LOOKUP[subNorm]) {
          matched = BATTERY_LOOKUP[subNorm];
          break;
        }
      }
    }
  }

  if (matched) {
    return {
      found: true,
      item: matched,
      partPrice: matched.partPrice,
      serviceFee: matched.serviceFee,
      totalPrice: matched.totalPrice,
      formattedPartPrice: formatRupiah(matched.partPrice),
      formattedServiceFee: formatRupiah(matched.serviceFee),
      formattedTotalPrice: formatRupiah(matched.totalPrice),
      partTitle: matched.title + ' (Grade Original)',
      warranty: 'Garansi 90 Hari',
      warrantyNote: 'Garansi Baterai Original (3 Bulan Penuh) • Pemasangan Meja Transparan',
      time: '30 - 45 Menit'
    };
  }

  // Fallback untuk model yang belum ada di spreadsheet (Android atau model iPhone lainnya)
  // Aturan user: "jika tidak ada di spreadsheet buatkan seperti biasa dan untuk jasanya untuk baterai mulai dari 150 hanya untuk baterai"
  return {
    found: false,
    partPrice: 0,
    serviceFee: 150000,
    totalPrice: 150000,
    formattedPartPrice: 'Konsul via WhatsApp',
    formattedServiceFee: 'Start from Rp 150.000',
    formattedTotalPrice: 'Mulai Rp 150.000 + Part',
    partTitle: 'Baterai Original Grade Presisi',
    warranty: 'Garansi 90 Hari',
    warrantyNote: 'Garansi Baterai Original (3 Bulan Penuh) • Jasa Pasang Mulai Rp 150.000',
    time: '30 - 45 Menit'
  };
}
