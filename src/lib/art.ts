/* Catalogue constants + generated SVG product art (no external images) */
import type { Product } from '../types';
export const CATS = [
  { id: 'men', name: 'Men', icon: '👔', color: '#2874f0' },
  { id: 'women', name: 'Women', icon: '👗', color: '#e91e63' },
  { id: 'kids', name: 'Kids', icon: '🧒', color: '#ff9800' },
  { id: 'ethnic', name: 'Ethnic Wear', icon: '🪔', color: '#c2185b' },
  { id: 'western', name: 'Western Wear', icon: '🧥', color: '#00897b' },
  { id: 'accessories', name: 'Accessories', icon: '👜', color: '#6a1b9a' },
];

export const COLORS: Record<string, string> = {
  'Black': '#1f2430', 'White': '#f1f1f1', 'Navy Blue': '#1f3a6b', 'Maroon': '#7b1e3a',
  'Olive': '#6b7a3a', 'Mustard': '#d9a21b', 'Red': '#d1343c', 'Pink': '#e8789a',
  'Sky Blue': '#5aa7e0', 'Teal': '#1e8c8c', 'Grey': '#8c93a0', 'Beige': '#d9c5a3',
  'Green': '#2e8b57', 'Purple': '#7a4fb5', 'Peach': '#f2a98c', 'Tan': '#b07a4a',
  'Orange': '#f08a2c', 'Rust': '#b5502a', 'Blue': '#2f6fd0', 'Yellow': '#f2c744',
};

export const SIZE_SETS: Record<string, string[]> = {
  A: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  N: ['28', '30', '32', '34', '36', '38'],
  K: ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'],
  O: ['Free Size'],
};

export const hash = (s: unknown): number => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export const soldOut = (p: Pick<Product,'id'|'sizes'>, size: string) => p.sizes.length > 1 && hash(p.id + size) % 9 === 0;
/* ---------- SVG garment art ---------- */
export const clamp = (n: number) => Math.max(0, Math.min(255, n));
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + amt), g = clamp(((n >> 8) & 255) + amt), b = clamp((n & 255) + amt);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}
export const PATHS: Record<string, string> = {
  tee: 'M70 30 L40 50 L20 90 L48 100 L56 80 L56 210 L144 210 L144 80 L152 100 L180 90 L160 50 L130 30 Q100 55 70 30Z',
  shirt: 'M70 30 L38 46 L20 160 L48 166 L56 90 L56 212 L144 212 L144 90 L152 166 L180 160 L162 46 L130 30 Q100 55 70 30Z',
  dress: 'M76 22 L124 22 L128 78 L166 218 L34 218 L72 78Z',
  kurta: 'M72 28 L40 45 L22 120 L46 126 L58 84 L58 228 L142 228 L142 84 L154 126 L178 120 L160 45 L128 28 Q100 52 72 28Z',
  saree: 'M62 20 L122 20 L162 70 L152 226 L50 226 L46 70Z',
  pants: 'M60 20 L140 20 L152 222 L108 222 L100 84 L92 222 L48 222Z',
  shorts: 'M60 40 L140 40 L150 140 L106 140 L100 90 L94 140 L50 140Z',
  jacket: 'M70 28 L38 44 L22 156 L50 162 L56 92 L56 208 L144 208 L144 92 L150 162 L178 156 L162 44 L130 28 Q100 50 70 28Z',
};
export function extras(type: string, _hex: string, dark: string, light: string): string {
  const s = `fill="none" stroke="${dark}" stroke-width="2.5" stroke-linecap="round"`;
  switch (type) {
    case 'tee': return `<path d="M70 30 Q100 58 130 30" ${s}/>`;
    case 'shirt': return `<path d="M70 30 L100 66 L130 30 L118 24 L100 46 L82 24Z" fill="${light}" stroke="${dark}" stroke-width="2"/><path d="M100 66 V212" ${s}/>` +
      [90, 120, 150, 180].map(y => `<circle cx="100" cy="${y}" r="3" fill="${dark}"/>`).join('');
    case 'dress': return `<path d="M76 22 Q100 48 124 22" ${s}/><path d="M72 78 Q100 90 128 78" ${s}/>`;
    case 'kurta': return `<path d="M72 28 Q100 70 128 28" ${s}/><path d="M100 62 V140" ${s}/>` +
      [76, 96, 116].map(y => `<circle cx="100" cy="${y}" r="2.6" fill="${light}"/>`).join('') + `<path d="M58 200 H142" ${s} stroke-dasharray="4 4"/>`;
    case 'saree': return `<path d="M62 20 L162 70 L152 226" ${s}/><path d="M80 90 L150 120 M78 140 L150 170" ${s} stroke="${light}"/>`;
    case 'pants': return `<path d="M60 34 H140" ${s}/><path d="M100 34 V84" ${s}/><circle cx="100" cy="40" r="3" fill="${light}"/>`;
    case 'shorts': return `<path d="M60 54 H140" ${s}/><path d="M100 54 V90" ${s}/>`;
    case 'jacket': return `<path d="M100 42 V208" ${s}/><path d="M64 150 H88 M112 150 H136" ${s}/><path d="M70 28 Q100 50 130 28" ${s}/>`;
  }
  return '';
}
export function offbody(type: string, hex: string, dark: string, light: string): string | null {
  switch (type) {
    case 'bag': return `<path d="M68 96 Q68 36 100 36 Q132 36 132 96" fill="none" stroke="${dark}" stroke-width="7" stroke-linecap="round"/><rect x="42" y="86" width="116" height="104" rx="14" fill="${hex}" stroke="${dark}" stroke-width="2.5"/><rect x="88" y="112" width="24" height="16" rx="3" fill="${light}" stroke="${dark}"/>`;
    case 'watch': return `<rect x="82" y="14" width="36" height="212" rx="12" fill="${dark}"/><circle cx="100" cy="120" r="50" fill="${hex}" stroke="${dark}" stroke-width="5"/><circle cx="100" cy="120" r="39" fill="#fafafa"/><path d="M100 120 V92 M100 120 L120 130" stroke="#222" stroke-width="3" stroke-linecap="round"/>` +
      [0, 90, 180, 270].map(a => `<circle cx="${100 + 33 * Math.sin(a * Math.PI / 180)}" cy="${120 - 33 * Math.cos(a * Math.PI / 180)}" r="2.2" fill="#222"/>`).join('');
    case 'shades': return `<path d="M14 110 L40 106 M160 106 L186 110" stroke="${dark}" stroke-width="6" stroke-linecap="round"/><ellipse cx="62" cy="122" rx="40" ry="30" fill="${dark}" opacity=".92"/><ellipse cx="138" cy="122" rx="40" ry="30" fill="${dark}" opacity=".92"/><path d="M98 118 Q100 110 102 118" stroke="${hex}" stroke-width="5" fill="none"/><path d="M40 108 Q52 102 64 108" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none"/>`;
    case 'scarf': return `<path d="M30 40 Q100 10 170 40 L160 90 Q100 66 40 90Z" fill="${hex}" stroke="${dark}" stroke-width="2.5"/><path d="M70 82 L56 215 L100 200 L110 90Z" fill="${hex}" stroke="${dark}" stroke-width="2.5"/><path d="M62 190 l8 -3 M70 150 l10 -2" stroke="${light}" stroke-width="3"/>`;
    case 'belt': return `<rect x="14" y="106" width="172" height="28" rx="6" fill="${hex}" stroke="${dark}" stroke-width="2.5"/><rect x="84" y="96" width="32" height="48" rx="5" fill="none" stroke="#c9a227" stroke-width="6"/><path d="M30 120 H70 M130 120 H170" stroke="${light}" stroke-width="2" stroke-dasharray="5 4"/>`;
  }
  return null;
}
export const artCache = new Map<string, string>();
export function art(type: string, colorName: string, variant = 0, kid = false): string {
  const key = [type, colorName, variant, kid].join('|');
  const hit = artCache.get(key);
  if (hit) return hit;
  const hex = COLORS[colorName] || '#888888';
  const dark = shade(hex, -50), light = shade(hex, 45);
  const bg = ['#f3f5fb', '#fff3e3', '#e9f5f0'][variant % 3];
  const bg2 = ['#e3e9f7', '#fde0bd', '#d3ebe1'][variant % 3];
  const uid = 'c' + (hash(key) % 99999);
  let inner = offbody(type, hex, dark, light);
  if (!inner) {
    const d = PATHS[type];
    let pattern = '';
    if (variant === 1) pattern = `<g clip-path="url(#${uid})" opacity=".28">${Array.from({ length: 14 }, (_, i) => `<rect x="${i * 15 - 5}" y="0" width="6" height="240" fill="#fff"/>`).join('')}</g>`;
    if (variant === 2) pattern = `<g clip-path="url(#${uid})" opacity=".3">${Array.from({ length: 80 }, (_, i) => `<circle cx="${(i % 10) * 20 + (Math.floor(i / 10) % 2) * 10}" cy="${Math.floor(i / 10) * 30 + 10}" r="3" fill="#fff"/>`).join('')}</g>`;
    inner = `<defs><clipPath id="${uid}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="${hex}" stroke="${dark}" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="url(#shine)" opacity=".5"/>${pattern}${extras(type, hex, dark, light)}`;
  }
  const g = kid ? `<g transform="translate(26 46) scale(.74)">${inner}</g>` : inner;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${bg2}"/></linearGradient><linearGradient id="shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient></defs><rect width="200" height="240" fill="url(#bg)"/><ellipse cx="100" cy="228" rx="62" ry="6" fill="#000" opacity=".1"/>${g}</svg>`;
  const uri = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  artCache.set(key, uri);
  return uri;
}
type ImgSrc = Pick<Product,'type'|'colors'|'kid'> & Partial<Pick<Product,'images'|'thumbnails'>>;
/** Real photo when the product has one (small thumbnail), else generated SVG art. */
export const productImg = (p: ImgSrc, color?: string, v = 0) => {
  const t = p.thumbnails?.length ? p.thumbnails : p.images;
  return t?.length ? t[v % t.length] : art(p.type, color || p.colors[0], v, p.kid);
};
/** Large photo for the product page; falls back to productImg. */
export const productImgFull = (p: ImgSrc, color?: string, v = 0) =>
  p.images?.length ? p.images[v % p.images.length] : productImg(p, color, v);
/** How many gallery views a product has (real photos, max 5, else 3 generated variants). */
export const imgCount = (p: ImgSrc) => (p.thumbnails?.length || p.images?.length ? Math.min(5, (p.thumbnails?.length || p.images!.length)) : 3);
/* ---------- deterministic reviews ---------- */
export const REVIEWERS = ['Aditi S.', 'Rahul M.', 'Sneha K.', 'Arjun P.', 'Meera R.', 'Vikram T.', 'Pooja N.', 'Karan D.', 'Ananya B.', 'Imran Q.'];
export const REVIEW_TXT = [
  ['Great fit and fabric', 'Exactly as shown. Fabric feels premium and the stitching is neat. Ordered my usual size and it fit perfectly.'],
  ['Value for money', 'Looks way better than the price suggests. Colour is true to the photos and it survived the first wash.'],
  ['Good, but runs slightly large', 'Quality is nice, but I would suggest sizing down if you are between sizes.'],
  ['Loved it!', 'Received lots of compliments. Delivery was quick and packaging was good.'],
  ['Decent product', 'Overall okay. Colour is slightly lighter than the picture but the material is comfortable.'],
  ['Perfect for the season', 'Light, breathable and comfortable all day. Will buy more colours.'],
];
export function reviewsFor(p: Pick<Product,'id'|'rating'>) {
  return Array.from({ length: 4 }, (_, i) => {
    const h = hash(p.id * 31 + i);
    const [title, text] = REVIEW_TXT[h % REVIEW_TXT.length];
    return { who: REVIEWERS[(h >> 3) % REVIEWERS.length], stars: Math.max(3, Math.min(5, Math.round(p.rating + ((h % 3) - 1) * 0.6))), title, text, days: 3 + (h % 80) };
  });
}
