// Demo data + presets

const SAMPLE_SLIDES = [
  { id: 1, type: "votum", title: "Votum & Salam", subtitle: "Pdt. Yohanes Wijaya", body: "Pertolongan kita adalah dalam nama TUHAN, yang menjadikan langit dan bumi.", ref: "Mazmur 124:8" },
  { id: 2, type: "hymn", title: "KJ 10:1 — Pujilah, Hai Jiwaku", subtitle: "Bait 1", body: "Pujilah, hai jiwaku, Tuhan,\nPujilah dengan suka hati.\nKar'na rahmat-Nya tak berkesudahan,\nKasih setia-Nya nyata sekali.", ref: "Kidung Jemaat 10" },
  { id: 3, type: "hymn", title: "KJ 10:2 — Pujilah, Hai Jiwaku", subtitle: "Bait 2", body: "Pujilah, hai jiwaku, Tuhan,\nIa baik dan Ia setia.\nDikaruniakan-Nya kekuatan,\nMenghibur jiwa yang berdukacita.", ref: "Kidung Jemaat 10" },
  { id: 4, type: "verse", title: "Pembacaan Alkitab", subtitle: "Yohanes 3:16", body: "Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal", ref: "Yohanes 3:16a" },
  { id: 5, type: "verse", title: "Pembacaan Alkitab (lanjutan)", subtitle: "Yohanes 3:16", body: "supaya setiap orang yang percaya kepada-Nya tidak binasa, melainkan beroleh hidup yang kekal.", ref: "Yohanes 3:16b" },
  { id: 6, type: "creed", title: "Pengakuan Iman Rasuli", subtitle: "Bagian 1", body: "Aku percaya kepada Allah, Bapa yang Mahakuasa, Khalik langit dan bumi.", ref: "Pengakuan Iman" },
  { id: 7, type: "prayer", title: "Doa Bapa Kami", subtitle: "Diucapkan bersama", body: "Bapa kami yang di sorga, dikuduskanlah nama-Mu, datanglah Kerajaan-Mu", ref: "Matius 6:9-13" },
  { id: 8, type: "warta", title: "Warta Jemaat", subtitle: "Pengumuman Mingguan", body: "Persekutuan Doa Pemuda Jumat, 19.00 WIB di Gedung Serbaguna lantai 2.", ref: "Warta — 04 Mei 2026" },
  { id: 9, type: "sermon", title: "Khotbah", subtitle: "Hidup dalam Kasih Karunia", body: "1. Kasih yang memberi\n2. Kasih yang menyelamatkan\n3. Kasih yang memanggil", ref: "Pdt. Yohanes Wijaya" },
  { id: 10, type: "hymn", title: "KJ 405:1 — Kaulah, Ya Tuhan, Suryaku", subtitle: "Bait 1", body: "Kaulah, ya Tuhan, suryaku,\nFirman-Mu t'rang yang menuntun.\nDi dalam susah dan g'lap pun,\nKau t'rang bagiku selalu.", ref: "Kidung Jemaat 405" },
  { id: 11, type: "blessing", title: "Berkat", subtitle: "Bilangan 6:24-26", body: "TUHAN memberkati engkau dan melindungi engkau; TUHAN menyinari engkau dengan wajah-Nya dan memberi engkau kasih karunia.", ref: "Bilangan 6:24-25" },
];

const SLIDE_TYPES = {
  votum: { label: "Votum", icon: "cross", color: "#7c3aed" },
  hymn: { label: "Pujian", icon: "music", color: "#0891b2" },
  verse: { label: "Ayat", icon: "book", color: "#15803d" },
  creed: { label: "Pengakuan", icon: "cross", color: "#9333ea" },
  prayer: { label: "Doa", icon: "mic", color: "#ea580c" },
  warta: { label: "Warta", icon: "bullhorn", color: "#b45309" },
  sermon: { label: "Khotbah", icon: "book", color: "#be123c" },
  blessing: { label: "Berkat", icon: "sparkle", color: "#15803d" },
};

const PRESETS = [
  {
    name: "Klasik GKJ",
    desc: "Kuning di bawah, ukuran nyaman dibaca — default chroma key",
    bg: "#00B140",
    color: "#FFE600",
    font: "Plus Jakarta Sans",
    weight: 700,
    size: 42,
    align: "center",
    valign: "bottom",
    shadow: { x: 0, y: 3, blur: 4, color: "rgba(0,0,0,.65)" },
    glow: 14,
    refSize: 0.42,
  },
  {
    name: "Bold Streaming",
    desc: "Oswald uppercase, kontras tinggi, untuk pujian energik",
    bg: "#00B140",
    color: "#FFE600",
    font: "Oswald",
    weight: 600,
    size: 52,
    align: "center",
    valign: "bottom",
    shadow: { x: 0, y: 4, blur: 6, color: "rgba(0,0,0,.7)" },
    glow: 24,
    refSize: 0.36,
    upper: true,
  },
  {
    name: "Hymn Serif",
    desc: "Instrument Serif, italic — untuk lirik pujian klasik",
    bg: "#00B140",
    color: "#FFE600",
    font: "Instrument Serif",
    weight: 400,
    size: 48,
    italic: true,
    align: "center",
    valign: "center",
    shadow: { x: 0, y: 2, blur: 4, color: "rgba(0,0,0,.4)" },
    glow: 12,
    refSize: 0.38,
  },
  {
    name: "Lower Third",
    desc: "Teks di bawah dengan band hitam — untuk warta & nama",
    bg: "#00B140",
    color: "#FFFFFF",
    font: "Geist",
    weight: 600,
    size: 42,
    align: "center",
    valign: "lowerthird",
    shadow: { x: 0, y: 1, blur: 0, color: "transparent" },
    glow: 0,
    refSize: 0.5,
  },
];

const PROVIDERS = [
  { id: "openai", name: "OpenAI", model: "gpt-4o", logo: "AI", bg: "#10a37f", connected: true, recommended: true, note: "Vision + cepat" },
  { id: "anthropic", name: "Anthropic Claude", model: "claude-sonnet-4.5", logo: "AN", bg: "#d97757", connected: false, note: "Konteks panjang, parsing rapi" },
  { id: "gemini", name: "Google Gemini", model: "gemini-2.5-pro", logo: "GG", bg: "#1a73e8", connected: false, note: "Multimodal, kuota gratis" },
  { id: "ollama", name: "Local Ollama", model: "llama3.1:8b", logo: "OL", bg: "#0c0a09", connected: true, note: "Offline, privat" },
];

const PROMPT_RULES = [
  { k: "ROLE", body: "Anda adalah parser liturgi gereja Reformed (GKJ/GKI). Ekstrak setiap elemen liturgi dari slide PowerPoint yang diberikan menjadi struktur JSON terurut." },
  { k: "TYPES", body: "Kategorikan setiap slide ke salah satu: votum, hymn, verse, creed, prayer, warta, sermon, blessing. Jangan ciptakan kategori baru di luar daftar." },
  { k: "SPLIT", body: "Untuk lirik kidung (KJ/PKJ), pisahkan setiap bait sebagai slide tersendiri. Untuk ayat panjang (>40 kata), pisahkan per kalimat dengan akhiran -a, -b, -c pada referensi." },
  { k: "REF", body: "Untuk slide ayat Alkitab, ekstrak referensi (kitab pasal:ayat) dan tampilkan di bawah teks. Format: \"Yohanes 3:16\", bukan \"Joh. 3.16\"." },
  { k: "CLEAN", body: "Buang nomor slide, footer, header gereja, dan watermark. Jangan menerjemahkan teks; pertahankan bahasa asli (Indonesia/Jawa/Inggris)." },
  { k: "TYPO", body: "Perbaiki typo OCR umum (misal '1' → 'I', 'rn' → 'm') hanya untuk kata yang jelas salah baca. Jangan ubah ejaan kuno hymn (mis. 'kar'na', 't'rang')." },
  { k: "MAX", body: "Maksimum 80 karakter per baris pada slide subtitle. Bila lebih panjang, tandai needs_split: true sehingga editor dapat memecah otomatis." },
  { k: "META", body: "Sertakan field: type, title, subtitle, body, ref, needs_split, language. Output dalam JSON array, tanpa komentar atau penjelasan tambahan." },
];

const PARSE_LOG = [
  { t: "00:00.04", k: "info", tag: "UPLOAD", body: "Liturgi Minggu 04 Mei 2026.pptx diterima — 14 slide, 2.4 MB" },
  { t: "00:00.12", k: "info", tag: "EXTRACT", body: "python-pptx: ekstrak text frame, image shape, notes_slide" },
  { t: "00:00.31", k: "info", tag: "OCR", body: "Slide 4 & 9 berisi gambar — Tesseract id+eng dijalankan" },
  { t: "00:01.18", k: "ok", tag: "OCR", body: "2/2 slide berhasil di-OCR (confidence rata-rata 94.2%)" },
  { t: "00:01.22", k: "info", tag: "AI", body: "GPT-4o: kirim 14 slide untuk klasifikasi & strukturisasi" },
  { t: "00:03.04", k: "info", tag: "AI", body: "applying RULE.SPLIT — KJ 10 dipecah menjadi 2 bait" },
  { t: "00:03.41", k: "info", tag: "AI", body: "applying RULE.REF — Yohanes 3:16 split menjadi -a, -b" },
  { t: "00:04.12", k: "warn", tag: "AI", body: "Slide 12 (warta) >80 chars — needs_split: true" },
  { t: "00:04.55", k: "ok", tag: "PARSE", body: "11 slide subtitle dihasilkan dari 14 slide input" },
  { t: "00:04.60", k: "ok", tag: "DONE", body: "siap diedit — token used: 4,128 in / 1,902 out (~$0.024)" },
];

window.SAMPLE_SLIDES = SAMPLE_SLIDES;
window.SLIDE_TYPES = SLIDE_TYPES;
window.PRESETS = PRESETS;
window.PROVIDERS = PROVIDERS;
window.PROMPT_RULES = PROMPT_RULES;
window.PARSE_LOG = PARSE_LOG;
