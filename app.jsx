// App shell + state + Tweaks integration

const { useState, useEffect } = React;

const App = () => {
  const [page, setPage] = useState("welcome");
  const [lang, setLang] = useState("id");
  const [file, setFile] = useState(null);
  const [slides, setSlides] = useState([]);

  // tweakable preset index (Tweaks panel binds to this)
  const defaults = window.TWEAK_DEFAULTS;
  const [tweaks, setTweak] = window.useTweaks(defaults);
  const presetIndex = Math.min(window.PRESETS.length - 1, Math.max(0, tweaks.presetIndex || 0));
  const setPresetIndex = (i) => setTweak("presetIndex", i);

  const [customPreset, setCustomPreset] = useState(null);
  const [extraPresets, setExtraPresets] = useState([]);
  const [activeProvider, setActiveProvider] = useState("gemini");
  const [providers, setProviders] = useState(window.PROVIDERS);
  const [rules, setRules] = useState(window.PROMPT_RULES);
  const [showSlideshow, setShowSlideshow] = useState(false);

  // API keys persisted to localStorage
  const [apiKeys, setApiKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lts_apikeys') || '{}'); }
    catch { return {}; }
  });

  // Sync provider connected status from stored keys on mount
  useEffect(() => {
    if (Object.keys(apiKeys).length > 0) {
      setProviders(ps => ps.map(p => ({
        ...p,
        connected: apiKeys[p.id] ? true : p.connected,
      })));
    }
  }, []);

  const saveApiKey = (providerId, key) => {
    const next = { ...apiKeys, [providerId]: key };
    setApiKeys(next);
    try { localStorage.setItem('lts_apikeys', JSON.stringify(next)); } catch {}
    setProviders(ps => ps.map(p =>
      p.id === providerId ? { ...p, connected: !!key.trim() } : p
    ));
  };

  // expose slideshow trigger globally
  useEffect(() => {
    window.startSlideshow = () => setShowSlideshow(true);
  }, []);

  const t = (a, b) => lang === "id" ? a : b;

  const allPresets = [...window.PRESETS, ...extraPresets];
  const safePresetIndex = Math.min(allPresets.length - 1, Math.max(0, presetIndex));
  const preset = customPreset || allPresets[safePresetIndex];

  const steps = [
    { k: "welcome", n: "—", label: t("Beranda", "Home"), enabled: true },
    { k: "settings", n: "01", label: t("Setting", "Settings"), enabled: true, done: providers.some(p => p.connected) },
    { k: "upload", n: "02", label: "Upload", enabled: true, done: !!file },
    { k: "parse", n: "03", label: "Parse", enabled: !!file, done: slides.length > 0 },
    { k: "editor", n: "04", label: "Editor", enabled: slides.length > 0 },
    { k: "export", n: "05", label: "Export", enabled: slides.length > 0 },
  ];

  const savePreset = (name) => {
    if (!customPreset) return;
    const newPreset = { ...customPreset, name, desc: t("Preset kustom", "Custom preset") };
    const newExtras = [...extraPresets, newPreset];
    setExtraPresets(newExtras);
    const newIdx = window.PRESETS.length + newExtras.length - 1;
    setTweak("presetIndex", newIdx);
    setCustomPreset(null);
  };

  return (
    <>
      <div className="topbar">
        <div className="brand" style={{ cursor: "pointer" }} onClick={() => setPage("welcome")}>
          <div className="brand-mark">L</div>
          <div>
            <div style={{ lineHeight: 1.1 }}>LiturgiToSubtitle</div>
            <div className="mono" style={{ fontSize: 10, color: "var(--muted)", letterSpacing: ".04em" }}>v0.4 · prototype</div>
          </div>
        </div>

        <div className="grow row" style={{ justifyContent: "center" }}>
          <div className="stepnav">
            {steps.map(s => (
              <button key={s.k}
                      className={(page === s.k ? "active" : "") + (s.done ? " done" : "")}
                      disabled={!s.enabled}
                      style={{ opacity: s.enabled ? 1 : 0.4 }}
                      onClick={() => s.enabled && setPage(s.k)}>
                <span className="num">{s.n}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="row gap-2">
          <span className="chip green dot">{providers.find(p => p.id === activeProvider)?.name}</span>
          <div className="seg" style={{ height: 28 }}>
            <button className={lang === "id" ? "on" : ""} onClick={() => setLang("id")} style={{ padding: "4px 8px", fontSize: 11 }}>ID</button>
            <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")} style={{ padding: "4px 8px", fontSize: 11 }}>EN</button>
          </div>
          <button className="btn sm" onClick={() => setPage("settings")}><Icon name="cog" size={12} /></button>
        </div>
      </div>

      {page === "welcome" && <window.PageWelcome go={setPage} lang={lang} />}
      {page === "settings" && <window.PageSettings go={setPage} lang={lang} providers={providers} setProviders={setProviders} activeProvider={activeProvider} setActiveProvider={setActiveProvider} rules={rules} setRules={setRules} apiKeys={apiKeys} saveApiKey={saveApiKey} />}
      {page === "upload" && <window.PageUpload go={setPage} lang={lang} file={file} setFile={setFile} />}
      {page === "parse" && <window.PageParse go={setPage} lang={lang} file={file} slides={slides} setSlides={setSlides} apiKeys={apiKeys} activeProvider={activeProvider} rules={rules} />}
      {page === "editor" && <window.PageEditor go={setPage} lang={lang} slides={slides} setSlides={setSlides} presetIndex={safePresetIndex} setPresetIndex={setPresetIndex} customPreset={customPreset} setCustomPreset={setCustomPreset} allPresets={allPresets} savePreset={savePreset} />}
      {page === "export" && <window.PageExport go={setPage} lang={lang} slides={slides} presetIndex={safePresetIndex} customPreset={customPreset} allPresets={allPresets} />}

      {showSlideshow && <window.Slideshow slides={slides.length ? slides : window.SAMPLE_SLIDES} preset={preset} onClose={() => setShowSlideshow(false)} />}

      {/* Tweaks panel */}
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Subtitle Preset">
          <window.TweakRadio
            label="Style"
            value={safePresetIndex}
            onChange={(v) => { setPresetIndex(v); setCustomPreset(null); }}
            options={allPresets.map((p, i) => ({ value: i, label: p.name }))}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6, marginTop: 10 }}>
            {allPresets.map((p, i) => (
              <div key={i} style={{
                aspectRatio: "16/9", background: p.bg, borderRadius: 4, position: "relative", cursor: "pointer",
                border: safePresetIndex === i ? "2px solid var(--green)" : "1px solid var(--line-2)",
                display: "grid", placeItems: "center",
              }} onClick={() => { setPresetIndex(i); setCustomPreset(null); }}>
                <div style={{
                  color: p.color, fontFamily: p.font, fontStyle: p.italic ? "italic" : "normal",
                  fontWeight: p.weight, fontSize: 11, textAlign: "center", lineHeight: 1.1,
                  textShadow: "0 1px 2px rgba(0,0,0,.5)",
                }}>{p.upper ? "ABC" : "Abc"}</div>
                <span style={{ position: "absolute", bottom: 2, left: 4, fontSize: 8, color: "#fff", textShadow: "0 1px 1px rgba(0,0,0,.6)", fontWeight: 600 }}>{p.name}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>{allPresets[safePresetIndex].desc}</div>
        </window.TweakSection>
      </window.TweaksPanel>
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
