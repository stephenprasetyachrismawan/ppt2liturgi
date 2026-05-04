// Pages 1: Welcome, Settings, Upload, Parse

// ── PPTX text extraction (runs in browser via JSZip) ─────────────────────────
const extractTextFromPptxXml = (xml) => {
  const paragraphs = [];
  const paras = xml.match(/<a:p[\s>][\s\S]*?<\/a:p>/g) || [];
  for (const para of paras) {
    const runs = [];
    const tMatches = para.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g);
    for (const m of tMatches) { if (m[1]) runs.push(m[1]); }
    const line = runs.join('').trim();
    if (line) paragraphs.push(line);
  }
  return paragraphs.join('\n');
};

// ── PDF text extraction (runs in browser via PDF.js) ─────────────────────────
const extractTextFromPdf = async (fileRaw) => {
  if (!window.pdfjsLib) throw new Error("PDF.js belum dimuat");
  const arrayBuffer = await fileRaw.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group text items by Y position to reconstruct reading lines
    const lineMap = new Map();
    for (const item of textContent.items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y).push({ x: item.transform[4], str: item.str });
    }

    // Sort Y descending (PDF origin is bottom-left, we want top-down)
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    const lines = sortedYs
      .map(y => lineMap.get(y).sort((a, b) => a.x - b.x).map(i => i.str).join(''))
      .filter(l => l.trim());

    if (lines.length > 0) pages.push({ pageNum, text: lines.join('\n') });
  }
  return pages;
};

// ── Real Gemini parse pipeline ────────────────────────────────────────────────
const runGeminiParsing = async ({ fileRaw, apiKey, rules, addLog, setSlides, setStep }) => {
  const parseStart = Date.now();
  const ts = () => {
    const ms = Date.now() - parseStart;
    const s = Math.floor(ms / 1000);
    const c = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
    return `0${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}.${c}`;
  };

  const isPdf = fileRaw.name.toLowerCase().endsWith('.pdf');
  let slideTexts = [];

  // Step 1: extract text (PDF or PPTX)
  if (isPdf) {
    addLog({ t: ts(), k: "info", tag: "EXTRACT", body: "Membaca PDF dengan PDF.js…" });
    try {
      const pages = await extractTextFromPdf(fileRaw);
      slideTexts = pages.map(p => p.text);
      addLog({ t: ts(), k: "ok", tag: "EXTRACT", body: `${pages.length} halaman PDF berhasil diekstrak` });
    } catch (e) {
      addLog({ t: ts(), k: "warn", tag: "EXTRACT", body: `Gagal baca PDF: ${e.message} — fallback ke data demo` });
      setSlides(window.SAMPLE_SLIDES); setStep(1); return;
    }
  } else {
    addLog({ t: ts(), k: "info", tag: "EXTRACT", body: "Membaca PPTX dengan JSZip…" });
    try {
      const zip = await window.JSZip.loadAsync(fileRaw);
      const names = Object.keys(zip.files)
        .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
        .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));
      for (const name of names) {
        const xml = await zip.files[name].async('text');
        const text = extractTextFromPptxXml(xml);
        if (text.trim()) slideTexts.push(text);
      }
      addLog({ t: ts(), k: "ok", tag: "EXTRACT", body: `${slideTexts.length} slide dengan teks diekstrak dari ${names.length} total` });
    } catch (e) {
      addLog({ t: ts(), k: "warn", tag: "EXTRACT", body: `Gagal baca PPTX: ${e.message} — fallback ke data demo` });
      setSlides(window.SAMPLE_SLIDES); setStep(1); return;
    }
  }

  if (slideTexts.length === 0) {
    addLog({ t: ts(), k: "warn", tag: "EXTRACT", body: "Tidak ada teks ditemukan — fallback ke data demo" });
    setSlides(window.SAMPLE_SLIDES); setStep(1); return;
  }

  // Step 2: build Gemini prompt (different for PDF vs PPTX)
  const systemPrompt = rules.map(r => `[${r.k}] ${r.body}`).join('\n');
  let prompt;

  if (isPdf) {
    const fullText = slideTexts.map((t, i) => `=== Halaman ${i + 1} ===\n${t}`).join('\n\n');
    addLog({ t: ts(), k: "info", tag: "AI", body: `Mengirim ${slideTexts.length} halaman PDF ke Gemini 1.5 Flash…` });
    prompt = `${systemPrompt}

Berikut adalah teks lengkap liturgi dari PDF (${slideTexts.length} halaman).
Strukturkan seluruh teks ini menjadi JSON array slide subtitle sesuai aturan di atas.
PENTING: ikuti ALUR LITURGI dari awal sampai akhir — sisipkan setiap kidung TEPAT di titik ia dipanggil.
Jangan kumpulkan semua kidung di akhir. Label speaker (PF:, J:, L:, dll) wajib dipertahankan.

TEKS LITURGI:
${fullText}

Output hanya JSON array:`;
  } else {
    const slideInput = slideTexts.map((t, i) => `--- Slide ${i + 1} ---\n${t}`).join('\n\n');
    addLog({ t: ts(), k: "info", tag: "AI", body: `Mengirim ${slideTexts.length} slide ke Gemini 1.5 Flash…` });
    prompt = `${systemPrompt}

Berikut adalah ${slideTexts.length} slide liturgi dari PPTX:

${slideInput}

Keluarkan hanya JSON array sesuai schema di atas:`;
  }

  // Step 3: call Gemini API
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    addLog({ t: ts(), k: "info", tag: "AI", body: "Response diterima — memvalidasi schema JSON…" });

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      const m = jsonText.match(/\[[\s\S]*\]/);
      if (m) parsed = JSON.parse(m[0]);
      else throw new Error("JSON tidak valid dari Gemini");
    }

    const arr = Array.isArray(parsed) ? parsed : (parsed.slides || []);
    const validTypes = Object.keys(window.SLIDE_TYPES);
    const result = arr.map((s, i) => ({
      id: i + 1,
      type: validTypes.includes(s.type) ? s.type : 'verse',
      title: s.title || `Slide ${i + 1}`,
      subtitle: s.subtitle || '',
      body: s.body || '',
      ref: s.ref || '',
      needs_split: s.needs_split || false,
      needs_hymn_lookup: s.needs_hymn_lookup || false,
      language: s.language || 'id',
    }));

    const splitCount = result.filter(s => s.needs_split).length;
    const lookupCount = result.filter(s => s.needs_hymn_lookup).length;
    if (splitCount > 0) addLog({ t: ts(), k: "warn", tag: "AI", body: `${splitCount} slide perlu dipecah (needs_split) — gunakan tombol Split di editor` });
    if (lookupCount > 0) addLog({ t: ts(), k: "warn", tag: "AI", body: `${lookupCount} slide memerlukan lirik kidung eksternal (needs_hymn_lookup) — isi manual di editor` });

    addLog({ t: ts(), k: "ok", tag: "PARSE", body: `${result.length} slide subtitle dihasilkan dari ${slideTexts.length} ${isPdf ? 'halaman' : 'slide'} input` });
    const tokEst = Math.round(prompt.length / 4);
    addLog({ t: ts(), k: "ok", tag: "DONE", body: `Selesai — perkiraan ${tokEst.toLocaleString()} token (~gratis dengan API key AI Studio)` });

    setSlides(result);
    setStep(1);
  } catch (e) {
    addLog({ t: ts(), k: "warn", tag: "AI", body: `Error Gemini: ${e.message} — fallback ke data demo` });
    setSlides(window.SAMPLE_SLIDES);
    setStep(1);
  }
};

const SubtitleRender = ({ slide, preset, scale = 1 }) => {
  const text = preset.upper ? slide.body.toUpperCase() : slide.body;
  const fs = preset.size * scale;
  const refFs = fs * (preset.refSize || 0.4);
  const valign = preset.valign || "center";
  const alignItems = valign === "bottom" ? "flex-end" : valign === "top" ? "flex-start" : "center";
  const padding = valign === "bottom" ? `${fs * 0.6}px 8% ${fs * 1.2}px` : valign === "top" ? `${fs * 1.2}px 8% ${fs * 0.6}px` : `0 8%`;

  const sOpacity = preset.shadowOpacity != null ? preset.shadowOpacity : 0.65;
  const sCol = preset.shadowColor || "#000000";
  const hex2rgba = (h, a) => {
    const m = h.replace("#", "");
    const r = parseInt(m.substring(0,2),16), g = parseInt(m.substring(2,4),16), b = parseInt(m.substring(4,6),16);
    return `rgba(${r||0},${g||0},${b||0},${a})`;
  };
  const shadowRgba = sCol.startsWith("#") ? hex2rgba(sCol, sOpacity) : sCol;
  const glowRgba = sCol.startsWith("#") ? hex2rgba(sCol, Math.min(1, sOpacity + 0.1)) : sCol;
  const noShadow = sOpacity === 0 || preset.shadow.color === "transparent";
  const thick = preset.shadowThick != null ? preset.shadowThick : 1;
  const outline = thick > 0 ? [
    `${thick}px 0 0 ${shadowRgba}`,
    `-${thick}px 0 0 ${shadowRgba}`,
    `0 ${thick}px 0 ${shadowRgba}`,
    `0 -${thick}px 0 ${shadowRgba}`,
    `${thick}px ${thick}px 0 ${shadowRgba}`,
    `-${thick}px -${thick}px 0 ${shadowRgba}`,
    `${thick}px -${thick}px 0 ${shadowRgba}`,
    `-${thick}px ${thick}px 0 ${shadowRgba}`,
  ].join(", ") : "";

  if (valign === "lowerthird") {
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: `${fs * 0.8}px` }}>
        <div style={{ background: hex2rgba(sCol, Math.max(0.5, sOpacity)), color: preset.color, padding: `${fs * 0.4}px ${fs * 0.8}px`, borderRadius: 6, maxWidth: "82%", textAlign: preset.align }}>
          <div style={{ fontFamily: preset.font, fontWeight: preset.weight, fontStyle: preset.italic ? "italic" : "normal", fontSize: fs, lineHeight: 1.2, whiteSpace: "pre-line" }}>{text}</div>
          {slide.ref && <div style={{ fontFamily: "Geist Mono", fontSize: refFs, marginTop: `${fs * 0.2}px`, opacity: .85, letterSpacing: ".05em" }}>{slide.ref}</div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems, justifyContent: "center", padding, textAlign: preset.align || "center" }}>
      <div>
        <div style={{
          color: preset.color,
          fontFamily: preset.font,
          fontWeight: preset.weight,
          fontStyle: preset.italic ? "italic" : "normal",
          fontSize: fs,
          lineHeight: 1.22,
          letterSpacing: preset.upper ? ".02em" : "0",
          whiteSpace: "pre-line",
          textShadow: noShadow ? "none" :
            (outline ? outline + ", " : "") +
            `${preset.shadow.x}px ${preset.shadow.y}px ${preset.shadow.blur}px ${shadowRgba}` +
            (preset.glow ? `, 0 0 ${preset.glow}px ${glowRgba}` : ""),
        }}>{text}</div>
        {slide.ref && (
          <div style={{
            display: "block", fontFamily: "Geist Mono", fontWeight: 500, color: preset.color,
            fontSize: refFs, opacity: .9, marginTop: `${fs * 0.3}px`, letterSpacing: "0.05em",
            textShadow: noShadow ? "none" : `0 1px 2px ${shadowRgba}`,
          }}>{slide.ref}</div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// WELCOME / DASHBOARD
// ============================================================
const PageWelcome = ({ go, lang }) => {
  const t = (a, b) => lang === "id" ? a : b;
  return (
    <div className="page">
      <div className="hero">
        <div>
          <span className="hero-eyebrow">
            <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--green)" }} />
            {t("Untuk GKJ, GKI & gereja Reformed lainnya", "For GKJ, GKI & Reformed churches")}
          </span>
          <h1>{t(<>Liturgi PPT, jadi <em>subtitle live</em><br />dalam 4 langkah.</>, <>Liturgy PPT to <em>live subtitles</em><br/>in 4 steps.</>)}</h1>
          <p>{t(
            "Upload slide liturgi mingguan, biarkan AI menstrukturkan ayat, kidung, dan doa, lalu edit visual subtitle dengan kontrol penuh — font, warna, shadow — sebelum diekspor sebagai PPT chroma key untuk OBS.",
            "Upload your weekly liturgy slides, let AI structure verses, hymns and prayers, then style your subtitle with full visual control before exporting a chroma key PPT for OBS."
          )}</p>
          <div className="row gap-3">
            <button className="btn primary" onClick={() => go("upload")}>
              <Icon name="upload" size={14} /> {t("Mulai dengan upload", "Start by uploading")}
            </button>
            <button className="btn" onClick={() => go("settings")}>
              <Icon name="settings" size={14} /> {t("Konfigurasi AI dulu", "Configure AI first")}
            </button>
          </div>

          <div style={{ marginTop: 32 }} className="stat-row">
            <div className="stat"><div className="k">{t("Format input", "Input")}</div><div className="v">.pptx</div></div>
            <div className="stat"><div className="k">{t("Background", "Bg")}</div><div className="v" style={{ color: "#00B140" }}>#00B140</div></div>
            <div className="stat"><div className="k">{t("Output", "Output")}</div><div className="v">.pptx</div></div>
            <div className="stat"><div className="k">{t("Engine", "Engine")}</div><div className="v">Gemini</div></div>
          </div>
        </div>

        <div className="hero-vis">
          <div className="ssbar"><i /><i /><i /></div>
          <div className="visscreen">
            <div className="label">OBS · Source: Subtitle.pptx · Chroma key</div>
            <div>
              <h2>Karena begitu besar kasih Allah<br />akan dunia ini</h2>
              <span className="ref">YOHANES 3:16a</span>
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", color: "#a8a29e", fontSize: 11, fontFamily: "Geist Mono" }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: "#ef4444", boxShadow: "0 0 8px #ef4444" }} />
            LIVE · 1080p · 30fps
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="h-eyebrow">{t("Alur 4 langkah", "4-step flow")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 12 }}>
          {[
            { n: "01", k: "settings", icon: "settings", title: t("Setting AI", "AI Setup"), desc: t("Masukkan API key Gemini (gratis dari AI Studio).", "Enter your Gemini API key (free from AI Studio).") },
            { n: "02", k: "upload", icon: "upload", title: t("Upload PPT", "Upload PPT"), desc: t("Drag-drop file liturgi mingguan dari gereja.", "Drag-drop your weekly liturgy file.") },
            { n: "03", k: "parse", icon: "sparkle", title: t("AI Parse", "AI Parse"), desc: t("Gemini mengkategorikan & memecah slide liturgi.", "Gemini classifies & splits liturgy slides.") },
            { n: "04", k: "editor", icon: "edit", title: t("Edit & Export", "Edit & Export"), desc: t("Sesuaikan visual, lalu ekspor PPT chroma key.", "Style visuals, then export chroma key PPT.") },
          ].map((s, i) => (
            <button key={i} className="card" style={{ padding: 18, textAlign: "left", border: "1px solid var(--line)", cursor: "pointer", background: "#fff" }} onClick={() => go(s.k)}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{s.n}</span>
                <Icon name={s.icon} size={18} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SETTINGS
// ============================================================
const PageSettings = ({ go, lang, providers, setProviders, activeProvider, setActiveProvider, rules, setRules, apiKeys, saveApiKey }) => {
  const t = (a, b) => lang === "id" ? a : b;
  const [section, setSection] = React.useState("ai");
  const [editingRule, setEditingRule] = React.useState(null);
  const [newRuleKey, setNewRuleKey] = React.useState("");
  const [newRuleBody, setNewRuleBody] = React.useState("");

  const sections = [
    { k: "ai", icon: "sparkle", label: t("AI Provider", "AI Provider") },
    { k: "rules", icon: "key", label: t("Prompt Rules", "Prompt Rules") },
    { k: "ocr", icon: "eye", label: "OCR Engine" },
    { k: "output", icon: "save", label: t("Default Output", "Default Output") },
    { k: "about", icon: "folder", label: t("Tentang", "About") },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="h-eyebrow">01 / {t("Pengaturan", "Settings")}</div>
          <h1 className="h-title">{t("Atur AI & aturan parsing", "Configure AI & parsing rules")}</h1>
          <div className="h-sub">{t(
            "Masukkan API key Gemini (gratis dari Google AI Studio) lalu tinjau prompt rules yang digunakan untuk membaca slide liturgi Anda.",
            "Enter your Gemini API key (free from Google AI Studio) and review the prompt rules used to read your liturgy slides."
          )}</div>
        </div>
        <button className="btn primary" onClick={() => go("upload")}>{t("Lanjut: Upload", "Next: Upload")} <Icon name="arrowR" size={14} /></button>
      </div>

      <div className="two-col">
        <nav className="side-nav">
          <div className="label">{t("Bagian", "Sections")}</div>
          <div className="col gap-2">
            {sections.map(s => (
              <a key={s.k} className={section === s.k ? "active" : ""} onClick={() => setSection(s.k)}>
                <Icon name={s.icon} size={14} />
                <span style={{ flex: 1 }}>{s.label}</span>
                {s.k === "ai" && <span className="chip green dot" style={{ fontSize: 10, padding: "1px 6px" }}>{providers.filter(p => p.connected).length}</span>}
              </a>
            ))}
          </div>
        </nav>

        <div className="card">
          {section === "ai" && (
            <>
              {/* Gemini quick-setup banner */}
              <div className="section" style={{ background: "var(--green-soft-2)", borderColor: "#bbf7d0" }}>
                <div className="row gap-3" style={{ marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1a73e8", color: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, fontFamily: "Geist Mono", flexShrink: 0 }}>GG</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Google Gemini 1.5 Flash — {t("Gratis", "Free")}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("Dapatkan API key gratis di", "Get a free API key at")} <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style={{ color: "var(--green-2)", fontFamily: "Geist Mono", fontSize: 11 }}>aistudio.google.com/apikey</a></div>
                  </div>
                  {apiKeys?.gemini && <span className="chip green dot" style={{ marginLeft: "auto" }}>{t("Tersimpan", "Saved")}</span>}
                </div>
                <div className="colorrow">
                  <Icon name="key" size={14} />
                  <input
                    className="input"
                    type="password"
                    placeholder="AIza…"
                    value={apiKeys?.gemini || ""}
                    onChange={e => saveApiKey("gemini", e.target.value)}
                    style={{ fontFamily: "Geist Mono", fontSize: 12 }}
                  />
                </div>
              </div>

              <div className="section">
                <h3>{t("Semua provider", "All providers")}</h3>
                <div className="desc">{t("Provider yang dipilih akan digunakan untuk parsing. API key disimpan di localStorage browser Anda.", "The active provider runs parsing. API keys are stored in your browser's localStorage.")}</div>
                <div className="provider-grid">
                  {providers.map(p => (
                    <div key={p.id} className={"provider " + (activeProvider === p.id ? "active" : "")} onClick={() => setActiveProvider(p.id)}>
                      {p.recommended && <span className="chip green badge">{t("Direkomendasikan", "Recommended")}</span>}
                      {!p.recommended && p.connected && <span className="chip green badge dot">{t("Terhubung", "Connected")}</span>}
                      <div className="top">
                        <div className="logo" style={{ background: p.bg }}>{p.logo}</div>
                        <div>
                          <div className="name">{p.name}</div>
                          <div className="meta">{p.model}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>{p.note}</div>
                      <div className="colorrow">
                        <Icon name="key" size={12} />
                        <input
                          className="input"
                          type="password"
                          placeholder={t("API Key…", "API Key…")}
                          value={apiKeys?.[p.id] || ""}
                          onChange={e => saveApiKey(p.id, e.target.value)}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section">
                <h3>{t("Parameter generasi", "Generation parameters")}</h3>
                <div className="desc">{t("Berlaku untuk semua provider — temperature rendah disarankan untuk parsing yang konsisten.", "Applies to all providers — low temperature recommended for consistent parsing.")}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                  <div>
                    <div className="label" style={{ marginBottom: 6 }}>Temperature</div>
                    <input type="range" min="0" max="1" step="0.05" defaultValue="0.2" />
                    <div className="row" style={{ justifyContent: "space-between" }}><span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>0.0</span><span className="mono" style={{ fontSize: 12 }}>0.20</span><span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>1.0</span></div>
                  </div>
                  <div>
                    <div className="label" style={{ marginBottom: 6 }}>Max Tokens</div>
                    <input className="input" defaultValue="4096" />
                  </div>
                  <div>
                    <div className="label" style={{ marginBottom: 6 }}>{t("Bahasa output", "Output language")}</div>
                    <select className="select" defaultValue="id">
                      <option value="id">Bahasa Indonesia</option>
                      <option value="jw">Basa Jawa</option>
                      <option value="en">English</option>
                      <option value="auto">{t("Otomatis (deteksi)", "Auto-detect")}</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {section === "rules" && (
            <>
              <div className="section">
                <h3>{t("System Prompt — terstruktur", "System Prompt — structured")}</h3>
                <div className="desc">{t(
                  "Setiap aturan dibatasi dan dapat diedit. AI hanya boleh keluaran JSON sesuai schema; tidak boleh menerjemahkan, menambah konten, atau menafsir teologis.",
                  "Each rule is scoped and editable. The AI may only output JSON matching the schema; it cannot translate, add content, or interpret theology."
                )}</div>
                <div className="col gap-2">
                  {rules.map((r, i) => (
                    editingRule && editingRule.idx === i ? (
                      <div className="rule-card col gap-2" key={r.k} style={{ padding: 14 }}>
                        <div className="row gap-2">
                          <input className="input mono" value={editingRule.k} style={{ maxWidth: 80, fontFamily: "Geist Mono", fontSize: 12, textTransform: "uppercase" }}
                                 onChange={e => setEditingRule(er => ({ ...er, k: e.target.value.toUpperCase() }))} />
                        </div>
                        <textarea className="textarea" value={editingRule.body} rows={3}
                                  onChange={e => setEditingRule(er => ({ ...er, body: e.target.value }))} />
                        <div className="row gap-2">
                          <button className="btn sm primary" onClick={() => {
                            const next = rules.slice();
                            next[i] = { k: editingRule.k, body: editingRule.body };
                            setRules(next);
                            setEditingRule(null);
                          }}><Icon name="check" size={12} /> {t("Simpan", "Save")}</button>
                          <button className="btn sm ghost" onClick={() => setEditingRule(null)}><Icon name="x" size={12} /></button>
                          <button className="btn sm ghost danger" style={{ marginLeft: "auto", color: "var(--danger)" }} onClick={() => {
                            setRules(rules.filter((_, ri) => ri !== i));
                            setEditingRule(null);
                          }}><Icon name="x" size={11} /> {t("Hapus", "Delete")}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="rule-card" key={r.k}>
                        <span className="rk">{r.k}</span>
                        <div className="rb">{r.body}</div>
                        <button className="btn sm ghost" onClick={() => setEditingRule({ idx: i, k: r.k, body: r.body })}><Icon name="edit" size={12} /></button>
                      </div>
                    )
                  ))}

                  {editingRule === "new" ? (
                    <div className="rule-card col gap-2" style={{ padding: 14 }}>
                      <input className="input" value={newRuleKey} placeholder={t("KUNCI_ATURAN", "RULE_KEY")}
                             style={{ fontFamily: "Geist Mono", fontSize: 12, textTransform: "uppercase" }}
                             onChange={e => setNewRuleKey(e.target.value.toUpperCase())} />
                      <textarea className="textarea" value={newRuleBody} rows={3}
                                placeholder={t("Deskripsi aturan…", "Rule description…")}
                                onChange={e => setNewRuleBody(e.target.value)} />
                      <div className="row gap-2">
                        <button className="btn sm primary" disabled={!newRuleKey.trim() || !newRuleBody.trim()} onClick={() => {
                          setRules([...rules, { k: newRuleKey.trim(), body: newRuleBody.trim() }]);
                          setEditingRule(null);
                          setNewRuleKey(""); setNewRuleBody("");
                        }}><Icon name="check" size={12} /> {t("Tambah", "Add")}</button>
                        <button className="btn sm ghost" onClick={() => { setEditingRule(null); setNewRuleKey(""); setNewRuleBody(""); }}><Icon name="x" size={12} /></button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn sm" style={{ alignSelf: "flex-start", marginTop: 4 }}
                            onClick={() => setEditingRule("new")}>
                      <Icon name="plus" size={12} /> {t("Tambah aturan", "Add rule")}
                    </button>
                  )}
                </div>
              </div>
              <div className="section">
                <h3>{t("Schema output JSON", "JSON output schema")}</h3>
                <div className="desc">{t("Gemini dipaksa mengikuti schema ini.", "Gemini must follow this schema.")}</div>
                <pre className="log" style={{ maxHeight: 200 }}>{`{
  "slides": [
    {
      "type": "votum|hymn|verse|creed|prayer|warta|sermon|blessing",
      "title":   "string",
      "subtitle":"string|null",
      "body":    "string",
      "ref":     "string|null",
      "language":"id|jw|en",
      "needs_split": false
    }
  ]
}`}</pre>
              </div>
            </>
          )}

          {section === "ocr" && (
            <div className="section">
              <h3>OCR Engine</h3>
              <div className="desc">{t("Untuk slide yang berisi gambar/scan. Dijalankan sebelum LLM.", "Used for slides that contain images/scans. Runs before the LLM.")}</div>
              <div className="col gap-3">
                <div className="rule-card"><span className="rk">TESSERACT</span><div className="rb">id+eng+jav language packs · confidence threshold 80%</div><span className="chip green dot">{t("aktif", "active")}</span></div>
                <div className="rule-card"><span className="rk">VISION</span><div className="rb">{t("Fallback ke Gemini Vision jika confidence <80%", "Fallback to Gemini Vision when confidence <80%")}</div><span className="chip green dot">{t("aktif", "active")}</span></div>
                <div className="rule-card"><span className="rk">PREPROC</span><div className="rb">{t("Auto-deskew, kontras +10, hilangkan watermark gereja", "Auto-deskew, +10 contrast, strip church watermark")}</div></div>
              </div>
            </div>
          )}

          {section === "output" && (
            <div className="section">
              <h3>{t("Default output PPT", "Default PPT output")}</h3>
              <div className="desc">{t("Pengaturan ekspor yang akan dipreset saat membuka editor.", "Export defaults loaded when you open the editor.")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
                <div><div className="label" style={{ marginBottom: 6 }}>{t("Resolusi", "Resolution")}</div><select className="select"><option>1920 × 1080 (16:9 Full HD)</option><option>1280 × 720 (16:9 HD)</option><option>3840 × 2160 (4K)</option></select></div>
                <div><div className="label" style={{ marginBottom: 6 }}>{t("Engine", "Engine")}</div><select className="select"><option>PptxGenJS (browser, JS plugin)</option><option>python-pptx (server)</option></select></div>
                <div><div className="label" style={{ marginBottom: 6 }}>{t("Warna chroma key", "Chroma key color")}</div><div className="colorrow"><div className="well" style={{ background: "#00B140" }} /><input className="input" defaultValue="#00B140" /></div></div>
                <div><div className="label" style={{ marginBottom: 6 }}>{t("Naming pattern", "Naming pattern")}</div><input className="input" defaultValue="Subtitle_{date}_{service}.pptx" /></div>
              </div>
            </div>
          )}

          {section === "about" && (
            <div className="section">
              <h3>LiturgiToSubtitle <span className="chip">v0.4 · prototype</span></h3>
              <div className="desc">{t(
                "Dibuat untuk tim multimedia gereja Reformed di Indonesia. Tidak terafiliasi dengan GKJ, GKI, atau institusi gereja manapun.",
                "Built for multimedia teams of Reformed churches in Indonesia. Not affiliated with GKJ, GKI, or any church institution."
              )}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// UPLOAD
// ============================================================
const PageUpload = ({ go, lang, file, setFile }) => {
  const t = (a, b) => lang === "id" ? a : b;
  const [over, setOver] = React.useState(false);
  const inputRef = React.useRef(null);

  const handleRealFile = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pptx', 'ppt', 'pdf'].includes(ext)) {
      alert('Format tidak didukung. Gunakan .pptx, .ppt, atau .pdf');
      return;
    }
    setFile({
      name: f.name,
      size: (f.size / 1024 / 1024).toFixed(1) + ' MB',
      slides: '?',
      modified: new Date(f.lastModified).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      _raw: f,
      ext,
    });
  };

  const fakeUpload = () => setFile({ name: "Liturgi Minggu 04 Mei 2026.pptx", size: "2.4 MB", slides: 14, modified: "04 Mei 2026 · 09:14" });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="h-eyebrow">02 / Upload</div>
          <h1 className="h-title">{t("Unggah liturgi mingguan", "Upload weekly liturgy")}</h1>
          <div className="h-sub">{t("Format yang didukung: .pptx, .ppt, .pdf. Teks diekstrak di browser (JSZip untuk PPTX, PDF.js untuk PDF) — file tidak pernah meninggalkan perangkat Anda.", "Supported: .pptx, .ppt, .pdf. Text is extracted in your browser (JSZip for PPTX, PDF.js for PDF) — the file never leaves your device.")}</div>
        </div>
        <button className="btn" disabled={!file} onClick={() => go("parse")}>{t("Lanjut: Parse", "Next: Parse")} <Icon name="arrowR" size={14} /></button>
      </div>

      {/* hidden file input */}
      <input ref={inputRef} type="file" accept=".pptx,.ppt,.pdf" style={{ display: "none" }}
             onChange={e => handleRealFile(e.target.files?.[0])} />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, alignItems: "start" }}>
        <div>
          <div className={"drop " + (over ? "over" : "")}
               onDragOver={e => { e.preventDefault(); setOver(true); }}
               onDragLeave={() => setOver(false)}
               onDrop={e => { e.preventDefault(); setOver(false); handleRealFile(e.dataTransfer.files[0]); }}
               onClick={() => inputRef.current?.click()}>
            <div className="ic"><Icon name="upload" size={22} /></div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{t("Tarik file ke sini, atau klik untuk pilih", "Drop a file here, or click to choose")}</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>.pptx · .ppt · .pdf — {t("maks 50 MB", "max 50 MB")}</div>
            <div style={{ display: "inline-flex", gap: 6, marginTop: 18 }}>
              <span className="chip">{t("Ekstrak lokal", "Local extract")}</span>
              <span className="chip">JSZip + PDF.js</span>
              <span className="chip green dot">Gemini 1.5 Flash</span>
            </div>
          </div>

          {file && (
            <div style={{ marginTop: 20 }}>
              <div className="label" style={{ marginBottom: 8 }}>{t("File terpilih", "Selected file")}</div>
              <div className="file-row">
                <div className="file-icon" style={{ background: file.ext === 'pdf' ? 'linear-gradient(135deg, #dc2626, #991b1b)' : undefined }}>
                  {file.ext === 'pdf' ? 'PDF' : 'PPTX'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "Geist Mono", marginTop: 2 }}>
                    {file.size} · {file.slides !== '?' ? `${file.slides} ${t("slide", "slides")}` : (file._raw ? t("menghitung…", "counting…") : "14 slides")} · {file.modified}
                  </div>
                </div>
                <button className="btn sm" onClick={() => setFile(null)}><Icon name="x" size={12} /></button>
                <button className="btn sm primary" onClick={() => go("parse")}><Icon name="sparkle" size={12} /> {t("Parse", "Parse")}</button>
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {file._raw
                  ? <span className="chip green dot">{t("File nyata — akan diparse Gemini", "Real file — Gemini will parse")}</span>
                  : <span className="chip warn dot">{t("File demo — hasil simulasi", "Demo file — simulated result")}</span>
                }
              </div>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <div className="label" style={{ marginBottom: 10 }}>{t("Atau pilih dari riwayat", "Or pick from history")}</div>
            <div className="col gap-2">
              {[
                { name: "Liturgi Minggu 27 April 2026.pptx", date: "27 Apr · GKI", slides: 12, size: "1.8 MB", modified: "27 Apr 2026 · 08:45" },
                { name: "Liturgi Jumat Agung 2026.pptx", date: "03 Apr · GKJ", slides: 18, size: "2.1 MB", modified: "03 Apr 2026 · 07:30" },
                { name: "Liturgi Paskah Subuh 2026.pptx", date: "05 Apr · GKJ", slides: 22, size: "3.0 MB", modified: "05 Apr 2026 · 05:00" },
              ].map((h, i) => (
                <div className="file-row" key={i} style={{ padding: "10px 14px" }}>
                  <Icon name="file" size={18} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "Geist Mono" }}>{h.date} · {h.slides} slides</div>
                  </div>
                  <button className="btn sm ghost" onClick={() => {
                    setFile({ name: h.name, size: h.size, slides: h.slides, modified: h.modified });
                    go("parse");
                  }}>{t("Buka", "Open")}</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="row gap-3" style={{ marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--green-soft-2)", color: "var(--green-2)", display: "grid", placeItems: "center" }}>
              <Icon name="eye" size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{t("Yang akan diparsing", "What gets parsed")}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("Pratinjau elemen yang dikenali sistem.", "Preview of recognized elements.")}</div>
            </div>
          </div>
          <div className="col gap-2">
            {[
              { icon: "cross", label: t("Votum & Salam", "Votum & Greeting"), n: 1 },
              { icon: "music", label: t("Kidung Jemaat / PKJ", "Hymns (KJ / PKJ)"), n: 2 },
              { icon: "book", label: t("Pembacaan Alkitab", "Scripture readings"), n: 1 },
              { icon: "cross", label: t("Pengakuan Iman", "Creed"), n: 1 },
              { icon: "mic", label: t("Doa Bapa Kami / Syafaat", "Lord's Prayer / Intercession"), n: 1 },
              { icon: "bullhorn", label: t("Warta Jemaat", "Announcements"), n: 1 },
              { icon: "book", label: t("Khotbah", "Sermon"), n: 1 },
              { icon: "sparkle", label: t("Berkat", "Benediction"), n: 1 },
            ].map((r, i) => (
              <div key={i} className="row gap-3" style={{ padding: "8px 10px", borderRadius: 8, background: i % 2 ? "var(--hair)" : "transparent" }}>
                <Icon name={r.icon} size={14} />
                <span style={{ fontSize: 13, flex: 1 }}>{r.label}</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>×{r.n}</span>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="row gap-3">
            <span className="chip green dot">{t("Diharapkan ~11 slide subtitle", "Expected ~11 subtitle slides")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PARSE
// ============================================================
const PageParse = ({ go, lang, file, slides, setSlides, apiKeys, activeProvider, rules }) => {
  const t = (a, b) => lang === "id" ? a : b;
  const [step, setStep] = React.useState(0);
  const [logIdx, setLogIdx] = React.useState(0);
  const [realLog, setRealLog] = React.useState([]);
  const parseStarted = React.useRef(false);

  const geminiKey = apiKeys?.gemini;
  const hasRealFile = file?._raw instanceof File;
  const isRealMode = hasRealFile && !!geminiKey;

  const addLog = React.useCallback((entry) => setRealLog(l => [...l, entry]), []);

  // Real Gemini parsing
  React.useEffect(() => {
    if (!isRealMode || parseStarted.current) return;
    parseStarted.current = true;
    runGeminiParsing({ fileRaw: file._raw, apiKey: geminiKey, rules: rules || window.PROMPT_RULES, addLog, setSlides, setStep });
  }, []);

  // Demo animation (when no real file or no API key)
  React.useEffect(() => {
    if (isRealMode) return;
    if (logIdx >= window.PARSE_LOG.length) { setStep(1); return; }
    const timer = setTimeout(() => setLogIdx(i => i + 1), 280 + Math.random() * 200);
    return () => clearTimeout(timer);
  }, [logIdx, isRealMode]);

  React.useEffect(() => {
    if (step === 1 && slides.length === 0) setSlides(window.SAMPLE_SLIDES);
  }, [step]);

  const displayLog = isRealMode ? realLog : window.PARSE_LOG.slice(0, logIdx);

  const stages = [
    { k: "extract", label: t("Ekstrak teks dari file", "Extract text from file"), n: 1 },
    { k: "ai", label: t("Gemini klasifikasi & split", "Gemini classify & split"), n: 2 },
    { k: "schema", label: t("Validasi schema JSON", "Validate JSON schema"), n: 3 },
    { k: "done", label: t("Slide siap diedit", "Slides ready to edit"), n: 4 },
  ];

  const stageDone = (i) => {
    if (step === 1) return true;
    if (isRealMode) {
      if (i === 0) return realLog.some(l => l.tag === "EXTRACT" && l.k === "ok");
      if (i === 1) return realLog.some(l => l.tag === "AI" && l.body.startsWith("Response"));
      if (i === 2) return realLog.some(l => l.tag === "PARSE");
      return false;
    }
    if (i === 0) return logIdx >= 2;
    if (i === 1) return logIdx >= 8;
    if (i === 2) return logIdx >= 9;
    return false;
  };
  const stageActive = (i) => !stageDone(i) && (i === 0 || stageDone(i - 1));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="h-eyebrow">03 / {t("Parsing", "Parsing")}</div>
          <h1 className="h-title">
            {step === 0
              ? (isRealMode ? t("Gemini sedang membaca slide…", "Gemini is reading the slides…") : t("Simulasi parsing…", "Simulating parse…"))
              : t("Parsing selesai", "Parsing complete")}
          </h1>
          <div className="h-sub">
            {isRealMode
              ? t("JSZip (PPTX) atau PDF.js (PDF) mengekstrak teks di browser; Gemini 1.5 Flash mengklasifikasi ke 8 kategori liturgi.", "JSZip (PPTX) or PDF.js (PDF) extracts text in browser; Gemini 1.5 Flash classifies into 8 liturgy categories.")
              : t("Mode demo — tidak ada file nyata atau API key Gemini. Masuk Settings untuk menghubungkan Gemini.", "Demo mode — no real file or Gemini API key. Go to Settings to connect Gemini.")}
          </div>
        </div>
        <button className="btn primary" disabled={step !== 1} onClick={() => go("editor")}>
          {step === 1 ? t("Buka editor", "Open editor") : t("Menunggu…", "Working…")} <Icon name="arrowR" size={14} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="row gap-3" style={{ marginBottom: 16 }}>
            <div className="file-icon" style={{ width: 32, height: 40, background: file?.ext === 'pdf' ? 'linear-gradient(135deg,#e53e3e,#c53030)' : undefined }}>{file?.ext === 'pdf' ? 'PDF' : 'PPTX'}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{file?.name || "Liturgi Minggu 04 Mei 2026.pptx"}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "Geist Mono" }}>
                {isRealMode ? t("File nyata · Gemini", "Real file · Gemini") : t("Demo · simulasi", "Demo · simulated")}
              </div>
            </div>
            <div className="grow" />
            <span className={"chip " + (step === 1 ? "green dot" : "warn dot")}>
              {step === 1 ? t("Selesai", "Done") : t("Sedang berjalan", "Running")}
            </span>
          </div>
          <div className="divider" style={{ margin: "8px 0 16px" }} />
          <div className="col gap-3">
            {stages.map((s, i) => (
              <div key={s.k} className="row gap-3" style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, background: stageActive(i) ? "var(--green-soft-2)" : "#fff" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: stageDone(i) ? "var(--green)" : stageActive(i) ? "#fff" : "var(--hair)", color: stageDone(i) ? "#fff" : "var(--ink)", border: stageActive(i) ? "1px dashed var(--green)" : "1px solid var(--line-2)" }}>
                  {stageDone(i) ? <Icon name="check" size={14} /> : <span className="mono" style={{ fontSize: 11 }}>{s.n}</span>}
                </div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{s.label}</div>
                {stageActive(i) && <span className="mono" style={{ fontSize: 11, color: "var(--green-2)" }}>•••</span>}
              </div>
            ))}
          </div>

          <div className="divider" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
            {[
              { k: "Mode", v: isRealMode ? "Gemini" : "Demo" },
              { k: "Slides", v: step === 1 ? `${slides.length}` : "…" },
              { k: "Est. cost", v: isRealMode ? "~$0" : "—" },
            ].map((x, i) => (
              <div key={i} style={{ padding: "10px 12px", background: "#fff" }}>
                <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>{x.k}</div>
                <div style={{ fontFamily: "Instrument Serif", fontSize: 22, marginTop: 2 }}>{x.v}</div>
              </div>
            ))}
          </div>

          {!isRealMode && step !== 1 && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--warn-soft)", borderRadius: 8, border: "1px solid #fde68a", fontSize: 12, color: "var(--warn)", lineHeight: 1.5 }}>
              {t("Tidak ada API key Gemini. ", "No Gemini API key. ")}
              <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => go("settings")}>
                {t("Buka Settings", "Open Settings")}
              </span>
              {t(" untuk menghubungkan.", " to connect.")}
            </div>
          )}
        </div>

        <div>
          <div className="row" style={{ marginBottom: 8, justifyContent: "space-between" }}>
            <div className="label">{t("Log proses", "Process log")}</div>
            <span className="chip">{isRealMode ? "Gemini 1.5 Flash · free tier" : t("Demo · simulasi", "Demo · simulated")}</span>
          </div>
          <div className="log">
            {displayLog.map((l, i) => (
              <div key={i}>
                <span className="l-time">{l.t}</span>{"  "}
                <span className={"l-" + l.k}>[{l.k.toUpperCase()}]</span>{"  "}
                <span className="l-tag">{l.tag}</span>{"  "}
                {l.body}
              </div>
            ))}
            {step === 0 && <div><span className="l-time">…</span>{"  "}<span className="l-info">[…]</span> <span style={{ opacity: .6 }}>{t("memproses…", "processing…")}</span></div>}
          </div>

          {step === 1 && (
            <div style={{ marginTop: 16 }}>
              <div className="label" style={{ marginBottom: 8 }}>{t("Pratinjau hasil parsing", "Parsed slides preview")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {slides.slice(0, 8).map(s => {
                  const meta = window.SLIDE_TYPES[s.type] || window.SLIDE_TYPES.verse;
                  return (
                    <div key={s.id} style={{ aspectRatio: "16/9", background: "var(--chroma)", borderRadius: 4, padding: 6, display: "grid", placeItems: "center", textAlign: "center", overflow: "hidden", position: "relative" }}>
                      <span style={{ position: "absolute", top: 4, left: 4, fontFamily: "Geist Mono", fontSize: 8, color: "#fff", background: meta.color, padding: "1px 4px", borderRadius: 2 }}>{meta.label}</span>
                      <div style={{ color: "#fff", fontFamily: "Plus Jakarta Sans", fontWeight: 600, fontSize: 8, lineHeight: 1.2, textShadow: "0 1px 2px rgba(0,0,0,.6)" }}>{s.body.slice(0, 50)}{s.body.length > 50 ? "…" : ""}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

window.PageWelcome = PageWelcome;
window.PageSettings = PageSettings;
window.PageUpload = PageUpload;
window.PageParse = PageParse;
window.SubtitleRender = SubtitleRender;
