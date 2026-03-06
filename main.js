// main.js (AUTO ONLY: no controls, no keys)
(() => {
  const SEP = "---FRAME---";
  const DEFAULT_FPS = 4;
  const DEFAULT_FRAMES_PER_SCENE = 24;

  // true = สุ่ม scene เมื่อจบ 1 รอบ, false = วนตามลำดับ
  const RANDOM_NEXT = true;

  const out = document.getElementById("asciiOut");
  // const sceneNameEl = document.getElementById("sceneName");
  // const frameIndexEl = document.getElementById("frameIndex");
  // const frameTotalEl = document.getElementById("frameTotal");
  const fpsLabelEl = document.getElementById("fpsLabel");
  const statusLabelEl = document.getElementById("statusLabel");
  const cmdHintEl = document.getElementById("cmdHint");

  const parseFrames = (raw) =>
    String(raw || "")
      .split(SEP)
      .map(s => s.replace(/^\s*\r?\n/, "").replace(/\r?\n\s*$/, ""))
      .filter(s => s.trim().length);

  const normalize = (scene) => {
    const frames = parseFrames(scene?.raw);
    const max = Number.isFinite(scene?.framesPerScene) ? scene.framesPerScene : DEFAULT_FRAMES_PER_SCENE;
    const fps = Number.isFinite(scene?.fps) ? scene.fps : DEFAULT_FPS;
    return {
      name: scene?.name || scene?.key || "scene",
      fps: Math.max(1, fps | 0),
      frames: frames.length > max ? frames.slice(0, max) : frames,
    };
  };

  const scenes = (window.SCENES || []).map(normalize).filter(s => s.frames.length);

  if (!scenes.length) {
    out.textContent = `[no scenes]\nload ./scenes/*.js first`;
    statusLabelEl.textContent = "error";
    cmdHintEl.textContent = "missing scenes";
    return;
  }

  let si = 0, fi = 0, timer = 0;

  const pickNextScene = () => {
    if (!RANDOM_NEXT) return (si + 1) % scenes.length;
    if (scenes.length === 1) return 0;
    let next = si;
    while (next === si) next = (Math.random() * scenes.length) | 0;
    return next;
  };

  const render = () => {
    const s = scenes[si];
    const total = s.frames.length;

    // sceneNameEl.textContent = s.name;
    // fpsLabelEl.textContent = String(2);
    // frameTotalEl.textContent = String(total);
    cmdHintEl.textContent = RANDOM_NEXT ? "auto (random)" : "auto (loop)";

    out.textContent = s.frames[fi] || "";
    // frameIndexEl.textContent = String(fi + 1);
  };

  const schedule = () => {
    if (timer) clearTimeout(timer);
    const fps = scenes[si]?.fps || DEFAULT_FPS;
    timer = setTimeout(tick, Math.max(1, (1000 / fps) | 0));
  };

  const tick = () => {
    const s = scenes[si];

    fi++;
    if (fi >= s.frames.length) {
      fi = 0;
      si = pickNextScene();
    }
    render();
    schedule();
  };

  render();
  schedule();
})();