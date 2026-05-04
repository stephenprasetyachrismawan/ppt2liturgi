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
  { id: "gemini", name: "Google Gemini", model: "gemini-2.0-flash", logo: "GG", bg: "#1a73e8", connected: false, recommended: false, note: "Gratis via AI Studio · kuota cukup" },
  { id: "ollama", name: "Local Ollama", model: "llama3.1:8b", logo: "OL", bg: "#0c0a09", connected: false, note: "Offline, privat" },
];

const PROMPT_RULES = [
  { k: "ROLE", body: "Anda adalah parser liturgi deterministik untuk gereja Reformed (GKJ/GKI). Tugasmu HANYA mengkonversi teks liturgi menjadi JSON array slide subtitle yang terurut. Ikuti setiap aturan secara ketat — jangan berimprovisasi, jangan menebak, jangan diam-diam mengubah aturan." },
  { k: "TYPES", body: "Kategorikan setiap slide ke salah satu type: votum, hymn, verse, creed, prayer, warta, sermon, blessing. Jangan ciptakan type baru." },
  { k: "SPEAKER", body: "WAJIB pertahankan semua label speaker/peran: PF:, Psw:, P:, PL:, J:, L:, WL:, U:, MJ:, MJ1:, MJ2:, MJ3:, L1:, L2:, Pnt:, P1:, P2:, dan sejenisnya. Format: 'ROLE: teks'. Jangan hilangkan label. Jangan pisahkan label dari teksnya. Jika teks berlanjut ke slide berikutnya, ulangi label speaker agar tetap jelas." },
  { k: "SLASH", body: "Hapus SEMUA karakter '/' dan '\\' dari teks yang akan ditampilkan. Jika penghapusan menyebabkan kata bergabung tak terbaca, ganti dengan satu spasi. Pastikan tidak ada satu pun slash tersisa di output." },
  { k: "HYMN_ORDER", body: "KRITIS: Setiap kidung/lagu HARUS disisipkan TEPAT di titik liturgi di mana ia dipanggil dalam teks liturgi utama — BUKAN dikumpulkan di akhir. Jika dokumen memiliki halaman lampiran/apendiks kidung di belakang, gunakan HANYA sebagai sumber teks lirik. Urutan slide mengikuti alur ibadah dari awal hingga akhir." },
  { k: "SPLIT", body: "Maksimum 2 baris per slide. Target sekitar 94 karakter total per slide. Pecah per frasa atau klausa alami. Jangan pecah di tengah kata. Jangan pecah judul lagu atau judul seksi ke slide berbeda. Jangan pisahkan label speaker dari teksnya di akhir slide. Tandai needs_split: true jika slide melebihi 94 karakter." },
  { k: "STANZA", body: "Setiap bait/stanza kidung HARUS dimulai di slide baru yang terpisah. Jangan pernah mencampur baris terakhir bait N dengan baris pertama bait N+1 dalam satu slide. Refrain yang berulang dibuat slide tersendiri. Selesaikan satu bait penuh sebelum bait berikutnya dimulai." },
  { k: "LYRICS", body: "Untuk lirik: buang tanda '-' di awal baris jika hanya sebagai bullet visual. Tulis teks refrain secara lengkap — jangan disingkat menjadi 'Refr.' atau 'Ref.' kecuali teks refrain sudah ditampilkan penuh sebelumnya. Pastikan segmentasi lirik terasa natural untuk dinyanyikan." },
  { k: "HYMN_LOOKUP", body: "Jika teks menyebut kidung tapi lirik tidak tersedia atau tidak lengkap di dokumen, isi body dengan '[Lirik KODE nomor:bait diperlukan]', set needs_hymn_lookup: true, dan sertakan referensi lengkap di field ref (contoh: 'KJ 28:1-2', 'PKJ 13:1,3', 'NKB 172:1-2')." },
  { k: "REF", body: "Referensi Alkitab: format 'Yohanes 3:16', bukan 'Joh. 3.16'. Untuk kidung: 'KJ 28:1', 'PKJ 13:1,3', 'NKB 172:1-2'. Sertakan di field ref." },
  { k: "CLEAN", body: "Pertahankan teks PERSIS seperti tertulis di dokumen kecuali normalisasi yang diizinkan: hapus slash, normalisasi label speaker, buang bullet '-' lirik. Jangan terjemahkan, jangan ringkas, jangan tambah kata, jangan hapus instruksi liturgi." },
  { k: "META", body: "Field wajib per slide: type (string), title (judul seksi/lagu), subtitle (label speaker atau 'Bait N'/info bait), body (teks maks 2 baris ~94 karakter), ref (referensi Alkitab/kidung atau null), language (id/jw/en), needs_split (boolean), needs_hymn_lookup (boolean). Output HANYA JSON array, tanpa komentar atau penjelasan." },
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
