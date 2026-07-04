// Génère les icônes de l'application sans aucune dépendance externe :
// - icon.png (32 x 32) pour la barre des tâches
// - build/icon.png (512 x 512) pour les installateurs Windows et Mac
// Usage : node tools/make-icon.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const BLEU_CIEL = [64, 158, 240, 255];
const BLANC = [255, 255, 255, 255];

function drawIcon(SIZE) {
  const pixels = Buffer.alloc(SIZE * SIZE * 4);

  function setPixel(x, y, [r, g, b, a]) {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    const i = (y * SIZE + x) * 4;
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
    pixels[i + 3] = a;
  }

  const centre = (SIZE - 1) / 2;
  const rayon = SIZE / 2 - Math.max(0.5, SIZE / 64);

  // Disque bleu ciel.
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - centre;
      const dy = y - centre;
      if (dx * dx + dy * dy <= rayon * rayon) setPixel(x, y, BLEU_CIEL);
    }
  }

  // Avion en papier blanc pointant vers la droite.
  const queue = Math.round(SIZE * 0.25);
  const nez = Math.round(SIZE * 0.78);
  for (let x = queue; x <= nez; x++) {
    const demi = Math.round((nez - x) * 0.42);
    for (let y = Math.round(centre) - demi; y <= Math.round(centre) + demi; y++) {
      setPixel(x, y, BLANC);
    }
  }
  // Encoche à l'arrière pour dessiner la silhouette "avion en papier".
  const finEncoche = queue + Math.round(SIZE * 0.16);
  for (let x = queue; x <= finEncoche; x++) {
    const demi = Math.round((finEncoche - x) * 0.45);
    for (let y = Math.round(centre) - demi; y <= Math.round(centre) + demi; y++) {
      setPixel(x, y, BLEU_CIEL);
    }
  }

  return pixels;
}

// Encodage PNG minimal (signature + IHDR + IDAT + IEND).
function crc32(buf) {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(pixels, SIZE) {
  const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
  for (let y = 0; y < SIZE; y++) {
    raw[y * (SIZE * 4 + 1)] = 0;
    pixels.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; // profondeur : 8 bits par canal
  ihdr[9] = 6; // type de couleur : RVB + transparence

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const cibles = [
  { taille: 32, fichier: path.join(__dirname, '..', 'icon.png') },
  { taille: 512, fichier: path.join(__dirname, '..', 'build', 'icon.png') },
];

for (const { taille, fichier } of cibles) {
  fs.mkdirSync(path.dirname(fichier), { recursive: true });
  const png = encodePng(drawIcon(taille), taille);
  fs.writeFileSync(fichier, png);
  console.log(`${fichier} généré (${taille} x ${taille}, ${png.length} octets)`);
}
