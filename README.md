# ppt2liturgi

Prototype browser-only untuk mengubah file liturgi PPTX/PDF menjadi slide subtitle live streaming.

## Integrasi Gemini API

Aplikasi sekarang diarahkan ke Google Gemini sebagai provider utama:

- Model default: `gemini-2.5-flash-lite`.
- Alasan pemilihan: model ini tercantum pada dokumentasi resmi Gemini API sebagai model Flash-Lite yang tersedia untuk paket gratis, dengan biaya input/output free tier dan rate limit free tier.
- Endpoint yang dipakai: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`.
- API key dimasukkan dari halaman **Settings → AI Provider** dan disimpan di `localStorage` browser pengguna.
- Tombol **Tes API** melakukan panggilan nyata ke Gemini API dengan prompt kecil agar pengguna dapat memastikan API key, model, dan koneksi endpoint berfungsi sebelum parsing dokumen.

> Catatan keamanan: karena aplikasi ini berjalan sepenuhnya di browser statis, API key terlihat di sisi klien. Untuk deployment publik/produksi, pertimbangkan proxy backend agar API key tidak terekspos ke browser pengguna.
