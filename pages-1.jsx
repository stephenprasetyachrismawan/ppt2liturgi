// Pages 1: Welcome, Settings, Upload, Parse

const SubtitleRender = ({ slide, preset, scale = 1 }) => {
  const text = preset.upper ? slide.body.toUpperCase() : slide.body;
  const fs = preset.size * scale;
  const refFs = fs * (preset.refSize || 0.4);
  const valign = preset.valign || "center";
  const alignItems = valign === "bottom" ? "flex-end" : valign === "top" ? "flex-start" : "center";
  const padding = valign === "bottom" ? `${fs * 0.6}px 8% ${fs * 1.2}px` : valign === "top" ? `${fs * 1.2}px 8% ${fs * 0.6}px` : `0 8%`;

  // Compute effective shadow from shadowColor + shadowOpacity (overrides preset.shadow.color)
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
  // Outline thickness: replicate shadow at 8 directions for a stroke effect
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
            <div className="stat"><div className="k">{t("Engine", "Engine")}</div><div className="v">PptxGenJS</div></div>
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
            { n: "01", k: "settings", icon: "settings", title: t("Setting AI", "AI Setup"), desc: t("Pilih provider, masukkan API key, atur prompt rules.", "Pick provider, enter API key, define prompt rules.") },
            { n: "02", k: "upload", icon: "upload", title: t("Upload PPT", "Upload PPT"), desc: t("Drag-drop file liturgi mingguan dari gereja.", "Drag-drop your weekly liturgy file.") },
            { n: "03", k: "parse", icon: "sparkle", title: t("AI Parse", "AI Parse"), desc: t("OCR + LLM mengkategorikan & memecah slide.", "OCR + LLM classifies & splits slides.") },
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
const PageSettings = ({ go, lang, providers, setProviders, activeProvider, setActiveProvider, rules, setRules }) => {
  const t = (a, b) => lang === "id" ? a : b;
  const [section, setSection] = React.useState("ai");
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
            "Sambungkan minimal satu provider AI dan tinjau prompt rules yang akan digunakan untuk membaca slide liturgi Anda.",
            "Connect at least one AI provider and review the prompt rules used to read your liturgy slides."
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
              <div className="section">
                <h3>{t("Pilih provider aktif", "Active provider")}</h3>
                <div className="desc">{t("Provider yang dipilih akan digunakan untuk parsing & OCR. Kunci API disimpan lokal di browser.", "The selected provider will run parsing & OCR. API keys are stored locally in your browser.")}</div>
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
                        <input className="input" defaultValue={p.connected ? "sk-•••••••••••••••a91f" : ""} placeholder={t("API Key…", "API Key…")} onClick={e => e.stopPropagation()} />
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
                  "Setiap aturan dibatasi dan dapat dinonaktifkan. AI hanya boleh keluaran JSON sesuai schema; tidak boleh menerjemahkan, menambah konten, atau menafsir teologis.",
                  "Each rule is scoped and toggleable. The AI may only output JSON matching the schema; it cannot translate, add content, or interpret theology."
                )}</div>
                <div className="col gap-2">
                  {rules.map((r, i) => (
                    <div className="rule-card" key={r.k}>
                      <span className="rk">{r.k}</span>
                      <div className="rb">{r.body}</div>
                      <button className="btn sm ghost"><Icon name="edit" size={12} /></button>
                    </div>
                  ))}
                  <button className="btn sm" style={{ alignSelf: "flex-start", marginTop: 4 }}><Icon name="plus" size={12} /> {t("Tambah aturan", "Add rule")}</button>
                </div>
              </div>
              <div className="section">
                <h3>{t("Schema output JSON", "JSON output schema")}</h3>
                <div className="desc">{t("AI dipaksa mengikuti schema ini. Field tambahan di luar daftar akan dibuang.", "The AI must follow this schema. Fields outside this list are discarded.")}</div>
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
                <div className="rule-card"><span className="rk">VISION</span><div className="rb">{t("Fallback ke GPT-4o Vision jika confidence <80%", "Fallback to GPT-4o Vision when confidence <80%")}</div><span className="chip green dot">{t("aktif", "active")}</span></div>
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
  const fakeUpload = () => setFile({ name: "Liturgi Minggu 04 Mei 2026.pptx", size: "2.4 MB", slides: 14, modified: "04 Mei 2026 · 09:14" });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="h-eyebrow">02 / Upload</div>
          <h1 className="h-title">{t("Unggah liturgi mingguan", "Upload weekly liturgy")}</h1>
          <div className="h-sub">{t("Format yang didukung: .pptx, .ppt, .pdf. File diproses secara lokal di browser; tidak diunggah ke server.", "Supported: .pptx, .ppt, .pdf. Files are processed locally in your browser, not uploaded to a server.")}</div>
        </div>
        <button className="btn" disabled={!file} onClick={() => go("parse")}>{t("Lanjut: Parse", "Next: Parse")} <Icon name="arrowR" size={14} /></button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, alignItems: "start" }}>
        <div>
          <div className={"drop " + (over ? "over" : "")}
               onDragOver={e => { e.preventDefault(); setOver(true); }}
               onDragLeave={() => setOver(false)}
               onDrop={e => { e.preventDefault(); setOver(false); fakeUpload(); }}
               onClick={fakeUpload}>
            <div className="ic"><Icon name="upload" size={22} /></div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{t("Tarik file ke sini, atau klik untuk pilih", "Drop a file here, or click to choose")}</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>.pptx · .ppt · .pdf — {t("maks 50 MB", "max 50 MB")}</div>
            <div style={{ display: "inline-flex", gap: 6, marginTop: 18 }}>
              <span className="chip">{t("AI siap", "AI ready")}</span>
              <span className="chip">OCR id+jav</span>
              <span className="chip green dot">GPT-4o</span>
            </div>
          </div>

          {file && (
            <div style={{ marginTop: 20 }}>
              <div className="label" style={{ marginBottom: 8 }}>{t("File terpilih", "Selected file")}</div>
              <div className="file-row">
                <div className="file-icon">PPTX</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "Geist Mono", marginTop: 2 }}>{file.size} · {file.slides} slides · {file.modified}</div>
                </div>
                <button className="btn sm" onClick={() => setFile(null)}><Icon name="x" size={12} /></button>
                <button className="btn sm primary" onClick={() => go("parse")}><Icon name="sparkle" size={12} /> {t("Parse", "Parse")}</button>
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className="chip">14 slides</span>
                <span className="chip">2 {t("gambar", "images")}</span>
                <span className="chip">{t("font: Calibri, Times New Roman", "fonts: Calibri, Times New Roman")}</span>
                <span className="chip warn dot">{t("2 slide butuh OCR", "2 slides need OCR")}</span>
              </div>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <div className="label" style={{ marginBottom: 10 }}>{t("Atau pilih dari riwayat", "Or pick from history")}</div>
            <div className="col gap-2">
              {[
                { name: "Liturgi Minggu 27 April 2026.pptx", date: "27 Apr · GKI", slides: 12 },
                { name: "Liturgi Jumat Agung 2026.pptx", date: "03 Apr · GKJ", slides: 18 },
                { name: "Liturgi Paskah Subuh 2026.pptx", date: "05 Apr · GKJ", slides: 22 },
              ].map((h, i) => (
                <div className="file-row" key={i} style={{ padding: "10px 14px" }}>
                  <Icon name="file" size={18} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "Geist Mono" }}>{h.date} · {h.slides} slides</div>
                  </div>
                  <button className="btn sm ghost">{t("Buka", "Open")}</button>
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
const PageParse = ({ go, lang, file, slides, setSlides }) => {
  const t = (a, b) => lang === "id" ? a : b;
  const [step, setStep] = React.useState(0); // 0=running, 1=done
  const [logIdx, setLogIdx] = React.useState(0);

  React.useEffect(() => {
    if (logIdx >= window.PARSE_LOG.length) { setStep(1); return; }
    const t = setTimeout(() => setLogIdx(i => i + 1), 280 + Math.random() * 200);
    return () => clearTimeout(t);
  }, [logIdx]);

  React.useEffect(() => { if (step === 1 && slides.length === 0) setSlides(window.SAMPLE_SLIDES); }, [step]);

  const stages = [
    { k: "extract", label: t("Ekstrak teks & gambar", "Extract text & images"), n: 1 },
    { k: "ocr", label: "OCR (id+eng+jav)", n: 2 },
    { k: "ai", label: t("AI klasifikasi & split", "AI classify & split"), n: 3 },
    { k: "schema", label: t("Validasi schema JSON", "Validate JSON schema"), n: 4 },
  ];

  const stageDone = (i) => {
    if (step === 1) return true;
    if (i === 0) return logIdx >= 2;
    if (i === 1) return logIdx >= 4;
    if (i === 2) return logIdx >= 8;
    if (i === 3) return logIdx >= 10;
    return false;
  };
  const stageActive = (i) => !stageDone(i) && (i === 0 || stageDone(i - 1));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="h-eyebrow">03 / {t("Parsing", "Parsing")}</div>
          <h1 className="h-title">{step === 0 ? t("AI sedang membaca slide…", "AI is reading the slides…") : t("Parsing selesai", "Parsing complete")}</h1>
          <div className="h-sub">{t(
            "OCR mengekstrak teks dari gambar; LLM mengklasifikasi tiap slide ke 8 kategori liturgi dan memecah lirik bait demi bait.",
            "OCR pulls text from images; the LLM classifies slides into 8 liturgy categories and splits hymns verse-by-verse."
          )}</div>
        </div>
        <button className="btn primary" disabled={step !== 1} onClick={() => go("editor")}>
          {step === 1 ? t("Buka editor", "Open editor") : t("Menunggu…", "Working…")} <Icon name="arrowR" size={14} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="row gap-3" style={{ marginBottom: 16 }}>
            <div className="file-icon" style={{ width: 32, height: 40 }}>PPTX</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{file?.name || "Liturgi Minggu 04 Mei 2026.pptx"}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "Geist Mono" }}>{file?.slides || 14} slides → 11 subtitle</div>
            </div>
            <div className="grow" />
            <span className={"chip " + (step === 1 ? "green dot" : "warn dot")}>{step === 1 ? t("Selesai", "Done") : t("Sedang berjalan", "Running")}</span>
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
                {stageDone(i) && <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{["1.2s", "1.0s", "2.8s", "0.5s"][i]}</span>}
              </div>
            ))}
          </div>

          <div className="divider" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
            {[
              { k: "Slides parsed", v: step === 1 ? "11 / 14" : `${Math.min(11, Math.floor(logIdx * 1.3))} / 14` },
              { k: "Tokens used", v: step === 1 ? "6,030" : `${Math.floor(logIdx * 600)}` },
              { k: "Est. cost", v: step === 1 ? "$0.024" : "—" },
            ].map((x, i) => (
              <div key={i} style={{ padding: "10px 12px", background: "#fff" }}>
                <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>{x.k}</div>
                <div style={{ fontFamily: "Instrument Serif", fontSize: 22, marginTop: 2 }}>{x.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="row" style={{ marginBottom: 8, justifyContent: "space-between" }}>
            <div className="label">{t("Log proses", "Process log")}</div>
            <span className="chip">GPT-4o · temperature 0.20</span>
          </div>
          <div className="log">
            {window.PARSE_LOG.slice(0, logIdx).map((l, i) => (
              <div key={i}>
                <span className="l-time">{l.t}</span>{"  "}
                <span className={"l-" + l.k}>[{l.k.toUpperCase()}]</span>{"  "}
                <span className="l-tag">{l.tag}</span>{"  "}
                {l.body}
              </div>
            ))}
            {step === 0 && <div><span className="l-time">{("00:0" + (logIdx * 0.4).toFixed(2)).slice(0, 8)}</span>{"  "}<span className="l-info">[…]</span> <span style={{ opacity: .6 }}>{t("memproses…", "processing…")}</span></div>}
          </div>

          {step === 1 && (
            <div style={{ marginTop: 16 }}>
              <div className="label" style={{ marginBottom: 8 }}>{t("Pratinjau hasil parsing", "Parsed slides preview")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {window.SAMPLE_SLIDES.slice(0, 8).map(s => {
                  const meta = window.SLIDE_TYPES[s.type];
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
