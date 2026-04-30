// Pages 2: Editor + Export + Slideshow

const PageEditor = ({ go, lang, slides, setSlides, presetIndex, setPresetIndex, customPreset, setCustomPreset }) => {
  const t = (a, b) => lang === "id" ? a : b;
  const [active, setActive] = React.useState(0);
  const [editingText, setEditingText] = React.useState(false);
  const slide = slides[active];
  const preset = customPreset || window.PRESETS[presetIndex];

  const updateSlide = (patch) => {
    const next = slides.slice();
    next[active] = { ...next[active], ...patch };
    setSlides(next);
  };

  const updatePreset = (patch) => {
    setCustomPreset({ ...preset, ...patch });
  };

  const reorderUp = (i) => {
    if (i === 0) return;
    const next = slides.slice();
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setSlides(next);
    setActive(i - 1);
  };
  const reorderDown = (i) => {
    if (i === slides.length - 1) return;
    const next = slides.slice();
    [next[i + 1], next[i]] = [next[i], next[i + 1]];
    setSlides(next);
    setActive(i + 1);
  };

  const splitSlide = () => {
    if (!slide.body.includes("\n")) return;
    const parts = slide.body.split("\n").filter(Boolean);
    const next = slides.slice();
    next.splice(active, 1, ...parts.map((b, i) => ({
      ...slide,
      id: slide.id * 100 + i,
      body: b,
      subtitle: slide.subtitle + ` (${i + 1}/${parts.length})`,
    })));
    setSlides(next);
  };

  return (
    <div className="page" style={{ paddingTop: 20 }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="h-eyebrow">04 / Editor</div>
          <h1 className="h-title" style={{ fontSize: 36 }}>{t("Sesuaikan visual subtitle", "Style your subtitle visuals")}</h1>
          <div className="h-sub">{t(
            "Klik teks pada kanvas untuk mengedit. Gunakan inspector untuk font, warna, shadow, dan posisi. Preset di kanan menyimpan kombinasi style favorit.",
            "Click text on the canvas to edit. Use the inspector for font, color, shadow, and position. Presets save your favorite style combos."
          )}</div>
        </div>
        <div className="row gap-2">
          <button className="btn" onClick={() => go("parse")}><Icon name="arrowL" size={14} /> {t("Kembali", "Back")}</button>
          <button className="btn" onClick={() => window.startSlideshow && window.startSlideshow()}><Icon name="play" size={14} /> Slideshow</button>
          <button className="btn primary" onClick={() => go("export")}><Icon name="download" size={14} /> {t("Ekspor PPT", "Export PPT")}</button>
        </div>
      </div>

      <div className="editor-grid">
        {/* SLIDE LIST */}
        <div className="editor-col">
          <div className="editor-toolbar">
            <span className="label" style={{ flex: 1 }}>{slides.length} {t("slide", "slides")}</span>
            <button className="btn sm ghost" title={t("Tambah slide", "Add slide")}><Icon name="plus" size={12} /></button>
          </div>
          <div className="slide-list">
            {slides.map((s, i) => {
              const meta = window.SLIDE_TYPES[s.type];
              const txt = preset.upper ? s.body.toUpperCase() : s.body;
              return (
                <div key={s.id} className={"slide-card " + (i === active ? "active" : "")} onClick={() => setActive(i)}>
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <div className="thumb" style={{ background: preset.bg }}>
                    <div className="thumb-text" style={{ fontFamily: preset.font, fontStyle: preset.italic ? "italic" : "normal" }}>{txt.slice(0, 50)}{txt.length > 50 ? "…" : ""}</div>
                  </div>
                  <div className="meta">
                    <div className="t">{s.title}</div>
                    <div className="s" style={{ color: meta.color }}>● <span style={{ color: "var(--muted-2)" }}>{meta.label}</span></div>
                  </div>
                  <span className="grip"><Icon name="grip" size={12} /></span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CANVAS */}
        <div className="editor-col col">
          <div className="editor-toolbar">
            <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>SLIDE {String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
            <span className="chip" style={{ background: window.SLIDE_TYPES[slide.type].color, color: "#fff", borderColor: "transparent" }}>{window.SLIDE_TYPES[slide.type].label}</span>
            <div className="grow" />
            <div className="seg" style={{ marginRight: 4 }}>
              <button className={preset.align === "left" ? "on" : ""} onClick={() => updatePreset({ align: "left" })}><Icon name="alignL" size={12} /></button>
              <button className={preset.align === "center" ? "on" : ""} onClick={() => updatePreset({ align: "center" })}><Icon name="alignC" size={12} /></button>
              <button className={preset.align === "right" ? "on" : ""} onClick={() => updatePreset({ align: "right" })}><Icon name="alignR" size={12} /></button>
            </div>
            <button className="btn sm ghost" onClick={splitSlide}><Icon name="split" size={12} /> {t("Pecah", "Split")}</button>
            <button className="btn sm ghost" onClick={() => reorderUp(active)} disabled={active === 0}>↑</button>
            <button className="btn sm ghost" onClick={() => reorderDown(active)} disabled={active === slides.length - 1}>↓</button>
          </div>
          <div className="canvas-wrap">
            <div className="canvas-frame" style={{ background: preset.bg }}>
              <div className="corner-tag">CHROMA · 1920×1080 · {preset.bg.toUpperCase()}</div>
              <window.SubtitleRender slide={slide} preset={preset} scale={0.6} />
            </div>
          </div>
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--line)", display: "flex", gap: 16, alignItems: "center", background: "var(--hair)" }}>
            <div className="label">{t("Edit teks slide ini", "Edit slide text")}</div>
            <input className="input" value={slide.body} onChange={e => updateSlide({ body: e.target.value })} style={{ fontSize: 13 }} />
            <input className="input" value={slide.ref || ""} onChange={e => updateSlide({ ref: e.target.value })} placeholder="Ref" style={{ maxWidth: 200, fontSize: 13, fontFamily: "Geist Mono" }} />
          </div>
        </div>

        {/* INSPECTOR */}
        <div className="editor-col">
          <div className="editor-toolbar">
            <span className="label" style={{ flex: 1 }}>Inspector</span>
            <button className="btn sm ghost"><Icon name="save" size={12} /></button>
          </div>
          <div className="inspector">
            {/* Preset */}
            <div className="insp-group">
              <h4>{t("Template Preset", "Style Preset")}</h4>
              <div className="preset-row">
                {window.PRESETS.map((p, i) => (
                  <div key={i} className={"preset-card " + (presetIndex === i && !customPreset ? "on" : "")} style={{ background: p.bg }}
                       onClick={() => { setPresetIndex(i); setCustomPreset(null); }}>
                    <div style={{ color: p.color, fontFamily: p.font, fontStyle: p.italic ? "italic" : "normal", fontWeight: p.weight, fontSize: 9, textAlign: "center", textShadow: "0 1px 1px rgba(0,0,0,.5)", lineHeight: 1.1 }}>
                      {p.upper ? "ABC" : "Abc"}
                    </div>
                    <span className="lbl">{p.name}</span>
                  </div>
                ))}
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{preset.name} — {preset.desc || (customPreset ? t("kustom", "custom") : "")}</div>
            </div>

            {/* Typography */}
            <div className="insp-group">
              <h4><Icon name="type" size={11} /> {t("Tipografi", "Typography")}</h4>
              <div className="field-row">
                <label>Font</label>
                <select className="select" value={preset.font} onChange={e => updatePreset({ font: e.target.value })}>
                  <option>Plus Jakarta Sans</option>
                  <option>Geist</option>
                  <option>Oswald</option>
                  <option>Bebas Neue</option>
                  <option>Instrument Serif</option>
                  <option>Calibri</option>
                  <option>Times New Roman</option>
                </select>
              </div>
              <div className="field-row">
                <label>Weight</label>
                <select className="select" value={preset.weight} onChange={e => updatePreset({ weight: +e.target.value })}>
                  <option value={400}>400 Regular</option>
                  <option value={500}>500 Medium</option>
                  <option value={600}>600 Semibold</option>
                  <option value={700}>700 Bold</option>
                </select>
              </div>
              <div className="field-row">
                <label>{t("Ukuran", "Size")}</label>
                <div className="row gap-2">
                  <input type="range" min="24" max="96" value={preset.size} onChange={e => updatePreset({ size: +e.target.value })} />
                  <span className="mono" style={{ fontSize: 11, width: 32, textAlign: "right" }}>{preset.size}px</span>
                </div>
              </div>
              <div className="field-row">
                <label>{t("Gaya", "Style")}</label>
                <div className="row gap-2">
                  <button className={"btn sm " + (preset.italic ? "primary" : "")} onClick={() => updatePreset({ italic: !preset.italic })}><Icon name="italic" size={11} /></button>
                  <button className={"btn sm " + (preset.upper ? "primary" : "")} onClick={() => updatePreset({ upper: !preset.upper })}>AA</button>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="insp-group">
              <h4><Icon name="palette" size={11} /> {t("Warna", "Colors")}</h4>
              <div className="field-row">
                <label>{t("Teks", "Text")}</label>
                <div className="colorrow">
                  <div className="well" style={{ background: preset.color }} />
                  <input className="input" value={preset.color} onChange={e => updatePreset({ color: e.target.value })} />
                </div>
              </div>
              <div className="field-row">
                <label>Background</label>
                <div className="colorrow">
                  <div className="well" style={{ background: preset.bg }} />
                  <input className="input" value={preset.bg} onChange={e => updatePreset({ bg: e.target.value })} />
                </div>
              </div>
              <div className="field-row">
                <label>{t("Cepat", "Quick")}</label>
                <div className="swatches">
                  {["#00B140", "#0F0F0F", "#1E40AF", "#7C2D12", "#581C87"].map(c => (
                    <div key={c} className={"swatch " + (preset.bg === c ? "on" : "")} style={{ background: c }} onClick={() => updatePreset({ bg: c })} />
                  ))}
                </div>
              </div>
            </div>

            {/* Shadow */}
            <div className="insp-group">
              <h4>{t("Shadow & Outline", "Shadow & Outline")}</h4>
              <div className="field-row">
                <label>{t("Warna", "Color")}</label>
                <div className="colorrow">
                  <div className="well" style={{ background: preset.shadowColor || "#000000" }} />
                  <input className="input" value={preset.shadowColor || "#000000"} onChange={e => updatePreset({ shadowColor: e.target.value })} />
                </div>
              </div>
              <div className="field-row">
                <label>{t("Cepat", "Quick")}</label>
                <div className="swatches">
                  {["#000000", "#1c1917", "#7c2d12", "#1e3a8a", "#581c87", "#7f1d1d"].map(c => (
                    <div key={c} className={"swatch " + ((preset.shadowColor || "#000000") === c ? "on" : "")} style={{ background: c }} onClick={() => updatePreset({ shadowColor: c })} />
                  ))}
                </div>
              </div>
              <div className="field-row">
                <label>{t("Kegelapan", "Darkness")}</label>
                <div className="row gap-2"><input type="range" min="0" max="1" step="0.05" value={preset.shadowOpacity ?? 0.65} onChange={e => updatePreset({ shadowOpacity: +e.target.value })} /><span className="mono" style={{ fontSize: 11, width: 32, textAlign: "right" }}>{Math.round((preset.shadowOpacity ?? 0.65) * 100)}%</span></div>
              </div>
              <div className="field-row">
                <label>{t("Tebal", "Thickness")}</label>
                <div className="row gap-2"><input type="range" min="0" max="6" step="0.5" value={preset.shadowThick ?? 1} onChange={e => updatePreset({ shadowThick: +e.target.value })} /><span className="mono" style={{ fontSize: 11, width: 32, textAlign: "right" }}>{preset.shadowThick ?? 1}</span></div>
              </div>
              <div className="field-row">
                <label>Offset Y</label>
                <div className="row gap-2"><input type="range" min="0" max="10" value={preset.shadow.y} onChange={e => updatePreset({ shadow: { ...preset.shadow, y: +e.target.value } })} /><span className="mono" style={{ fontSize: 11, width: 24, textAlign: "right" }}>{preset.shadow.y}</span></div>
              </div>
              <div className="field-row">
                <label>Blur</label>
                <div className="row gap-2"><input type="range" min="0" max="20" value={preset.shadow.blur} onChange={e => updatePreset({ shadow: { ...preset.shadow, blur: +e.target.value } })} /><span className="mono" style={{ fontSize: 11, width: 24, textAlign: "right" }}>{preset.shadow.blur}</span></div>
              </div>
              <div className="field-row">
                <label>Glow</label>
                <div className="row gap-2"><input type="range" min="0" max="40" value={preset.glow} onChange={e => updatePreset({ glow: +e.target.value })} /><span className="mono" style={{ fontSize: 11, width: 24, textAlign: "right" }}>{preset.glow}</span></div>
              </div>
            </div>

            {/* Position */}
            <div className="insp-group">
              <h4>{t("Posisi vertikal", "Vertical position")}</h4>
              <div className="seg">
                {[["top", t("Atas", "Top")], ["center", t("Tengah", "Center")], ["bottom", t("Bawah", "Bottom")], ["lowerthird", "L3"]].map(([k, v]) => (
                  <button key={k} className={preset.valign === k ? "on" : ""} onClick={() => updatePreset({ valign: k })}>{v}</button>
                ))}
              </div>
              <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 6, lineHeight: 1.5 }}>{t("L3 = Lower Third (band hitam di bawah, untuk warta).", "L3 = Lower Third (black band at bottom, for announcements).")}</div>
            </div>

            {/* Save preset */}
            {customPreset && (
              <button className="btn sm" style={{ alignSelf: "stretch" }}><Icon name="save" size={12} /> {t("Simpan sebagai preset baru", "Save as new preset")}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// EXPORT
// ============================================================
const PageExport = ({ go, lang, slides, presetIndex, customPreset }) => {
  const t = (a, b) => lang === "id" ? a : b;
  const preset = customPreset || window.PRESETS[presetIndex];
  const [exportFormat, setExportFormat] = React.useState("pptx");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="h-eyebrow">05 / Export</div>
          <h1 className="h-title">{t("Ekspor untuk live streaming", "Export for live streaming")}</h1>
          <div className="h-sub">{t(
            "PPT chroma key siap di-load di OBS sebagai sumber Window Capture. Ganti slide pakai keyboard atau klik selama ibadah berlangsung.",
            "Chroma-key PPT ready to load in OBS as a Window Capture source. Advance slides via keyboard or click during the service."
          )}</div>
        </div>
        <button className="btn" onClick={() => go("editor")}><Icon name="arrowL" size={14} /> {t("Kembali edit", "Back to editor")}</button>
      </div>

      <div className="export-grid">
        <div>
          <div className="card" style={{ padding: 24 }}>
            <div className="row gap-3" style={{ marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--green-soft-2)", color: "var(--green-2)", display: "grid", placeItems: "center" }}>
                <Icon name="download" size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Subtitle_2026-05-04_GKJ.{exportFormat}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{slides.length} {t("slide", "slides")} · 1920×1080 · {preset.bg}</div>
              </div>
            </div>

            <div className="label" style={{ marginBottom: 8 }}>{t("Format", "Format")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 16 }}>
              {[
                { k: "pptx", icon: "file", title: ".pptx (PptxGenJS)", desc: t("Editable di PowerPoint, font tertanam.", "Editable in PowerPoint, fonts embedded.") },
                { k: "pdf", icon: "file", title: ".pdf", desc: t("Untuk arsip atau backup.", "For archive or backup.") },
                { k: "html", icon: "play", title: ".html (Slideshow)", desc: t("Standalone, langsung play di browser.", "Standalone, plays in browser.") },
                { k: "png", icon: "eye", title: ".png ZIP", desc: t("Per slide, untuk OBS Image Source.", "Per slide, for OBS Image Source.") },
              ].map(o => (
                <div key={o.k} className={"provider " + (exportFormat === o.k ? "active" : "")} style={{ padding: 12 }} onClick={() => setExportFormat(o.k)}>
                  <div className="row gap-2" style={{ marginBottom: 4 }}>
                    <Icon name={o.icon} size={14} />
                    <div className="name" style={{ fontSize: 12 }}>{o.title}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{o.desc}</div>
                </div>
              ))}
            </div>

            <div className="label" style={{ marginBottom: 8 }}>{t("Opsi", "Options")}</div>
            <div className="col gap-2" style={{ marginBottom: 16 }}>
              {[
                { k: "embed", l: t("Sertakan font (embed)", "Embed fonts"), on: true },
                { k: "notes", l: t("Sertakan speaker notes (referensi ayat)", "Include speaker notes (verse refs)"), on: true },
                { k: "bookmark", l: t("Tambah bookmark per kategori liturgi", "Add bookmarks per liturgy section"), on: true },
                { k: "json", l: t("Sertakan source JSON (untuk re-edit)", "Include source JSON (re-edit)"), on: false },
              ].map(o => (
                <label key={o.k} className="row gap-3" style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 8, cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked={o.on} />
                  <span style={{ fontSize: 13, flex: 1 }}>{o.l}</span>
                </label>
              ))}
            </div>

            <button className="btn primary" style={{ width: "100%", padding: "12px 16px", fontSize: 14, justifyContent: "center" }}>
              <Icon name="download" size={14} /> {t("Ekspor & download sekarang", "Export & download now")}
            </button>
            <div className="row gap-2" style={{ marginTop: 10, justifyContent: "center" }}>
              <button className="btn sm ghost" onClick={() => window.startSlideshow && window.startSlideshow()}><Icon name="play" size={12} /> {t("Coba slideshow dulu", "Try slideshow first")}</button>
              <span style={{ color: "var(--line-2)" }}>·</span>
              <button className="btn sm ghost"><Icon name="folder" size={12} /> {t("Buka folder ekspor", "Open export folder")}</button>
            </div>
          </div>

          <div className="card" style={{ padding: 18, marginTop: 16 }}>
            <div className="row gap-2" style={{ marginBottom: 10 }}>
              <Icon name="bullhorn" size={14} />
              <div style={{ fontWeight: 600, fontSize: 13 }}>{t("Petunjuk OBS", "OBS instructions")}</div>
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--muted)", lineHeight: 1.8 }}>
              <li>{t("Buka file .pptx di PowerPoint, jalankan Slide Show.", "Open the .pptx in PowerPoint, run Slide Show.")}</li>
              <li>{t("Di OBS, tambahkan Window Capture → pilih jendela PowerPoint.", "In OBS, add Window Capture → select PowerPoint.")}</li>
              <li>{t("Klik kanan source → Filter → Chroma Key → warna ", "Right-click source → Filter → Chroma Key → color ")}<span className="mono">#00B140</span>.</li>
              <li>{t("Atur similarity ~400, smoothness ~80.", "Set similarity ~400, smoothness ~80.")}</li>
            </ol>
          </div>
        </div>

        <div>
          <div className="label" style={{ marginBottom: 8 }}>{t("Pratinjau ekspor", "Export preview")}</div>
          <div className="export-preview" style={{ background: preset.bg }}>
            <div className="corner-tag" style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,.5)", color: "#fff", fontFamily: "Geist Mono", fontSize: 10, padding: "3px 6px", borderRadius: 3 }}>
              EXPORT · 1920×1080 · {preset.bg.toUpperCase()}
            </div>
            <window.SubtitleRender slide={slides[3] || slides[0]} preset={preset} scale={0.55} />
          </div>

          <div className="obs-cap" style={{ marginTop: 12 }}>
            <span className="led" />
            <span>OBS · Chroma Key Filter · sim 400 · smooth 80</span>
            <span style={{ flex: 1 }} />
            <span style={{ color: "#4ade80" }}>● LIVE 1080p30</span>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="label" style={{ marginBottom: 8 }}>{t("Semua slide", "All slides")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
              {slides.map((s, i) => (
                <div key={s.id} style={{ aspectRatio: "16/9", background: preset.bg, borderRadius: 4, padding: 4, position: "relative", overflow: "hidden" }}>
                  <span style={{ position: "absolute", top: 3, left: 4, fontFamily: "Geist Mono", fontSize: 8, color: "rgba(255,255,255,.7)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 4, textAlign: "center" }}>
                    <div style={{ color: preset.color, fontFamily: preset.font, fontStyle: preset.italic ? "italic" : "normal", fontWeight: preset.weight, fontSize: 7, lineHeight: 1.2, textShadow: "0 1px 1px rgba(0,0,0,.5)" }}>{(preset.upper ? s.body.toUpperCase() : s.body).slice(0, 40)}{s.body.length > 40 ? "…" : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SLIDESHOW (fullscreen)
// ============================================================
const Slideshow = ({ slides, preset, onClose }) => {
  const [i, setI] = React.useState(0);
  const slide = slides[i];

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") setI(x => Math.min(slides.length - 1, x + 1));
      if (e.key === "ArrowLeft") setI(x => Math.max(0, x - 1));
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length, onClose]);

  return (
    <div className="slideshow-overlay" style={{ background: preset.bg }} onClick={() => setI(x => Math.min(slides.length - 1, x + 1))}>
      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        <window.SubtitleRender slide={slide} preset={preset} scale={1.2} />
      </div>
      <div className="ssctrls" onClick={e => e.stopPropagation()}>
        <button onClick={() => setI(x => Math.max(0, x - 1))}><Icon name="arrowL" size={14} /></button>
        <span>{String(i + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
        <button onClick={() => setI(x => Math.min(slides.length - 1, x + 1))}><Icon name="arrowR" size={14} /></button>
        <span style={{ width: 1, height: 14, background: "rgba(255,255,255,.3)", margin: "0 4px" }} />
        <kbd style={{ background: "rgba(255,255,255,.15)", border: 0, color: "#fff" }}>← →</kbd>
        <span style={{ opacity: .7 }}>nav</span>
        <kbd style={{ background: "rgba(255,255,255,.15)", border: 0, color: "#fff" }}>Esc</kbd>
        <button onClick={onClose} title="Close"><Icon name="x" size={14} /></button>
      </div>
    </div>
  );
};

window.PageEditor = PageEditor;
window.PageExport = PageExport;
window.Slideshow = Slideshow;
