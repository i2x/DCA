// dca.js (AUTO DCA STATUS + COLOR HIGHLIGHTS) — fixed cycle columns
(() => {
  const START_DATE = "2026-03-04";
  const WEEKLY_BUDGET = 1500;

  const ORDER = [
    "SCBS&P500",
    "ES-GDIV",
    "SCBS&P500",
    "KF-HJAPAND",
    "ES-GDIV",
    "SCBS&P500",
    "ES-GDIV",
    "SCBS&P500",
    "KT-PROPERTY-D",
    "KF-HJAPAND",
  ];

  const out = document.getElementById("dcaOut");
  const cmdHintEl = document.getElementById("cmdHint");

  const pad2 = (n) => String(n).padStart(2, "0");
  const fmtDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const money = (n) => `฿${Number(n || 0).toLocaleString("en-US")}`;

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

  const atMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d, days) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

  // Monday=1 (JS: Sun=0..Sat=6)
  const daysUntilNextMonday = (d) => {
    const dow = d.getDay();
    const delta = (1 - dow + 7) % 7;
    return delta === 0 ? 7 : delta;
  };
  const nextMonday = (d) => addDays(atMidnight(d), daysUntilNextMonday(d));

  const mondayOfWeek = (d) => {
    const m = atMidnight(d);
    const dow = m.getDay();
    const diff = (dow + 6) % 7; // days since Monday
    return addDays(m, -diff);
  };

  const parseYMD = (ymd) => {
    const [y, m, day] = ymd.split("-").map(Number);
    return new Date(y, (m - 1), day);
  };

  const START = parseYMD(START_DATE);
  const FIRST_RESET = nextMonday(START);

  function getState(now) {
    const today = atMidnight(now);

    if (today < FIRST_RESET) {
      return {
        today,
        resetAt: FIRST_RESET,
        weekNo: 1,
        periodStart: START,
        periodEnd: addDays(FIRST_RESET, -1),
        stepIndex: 0,
      };
    }

    const thisMon = mondayOfWeek(today);
    const weeksSinceFirst = Math.floor((thisMon - FIRST_RESET) / (7 * 24 * 3600 * 1000));
    const stepIndex = 1 + weeksSinceFirst;

    return {
      today,
      resetAt: addDays(thisMon, 7),
      weekNo: stepIndex + 1,
      periodStart: thisMon,
      periodEnd: addDays(thisMon, 6),
      stepIndex,
    };
  }

  function periodForStep(stepIndex) {
    if (stepIndex === 0) return { start: START, end: addDays(FIRST_RESET, -1) };
    const start = addDays(FIRST_RESET, (stepIndex - 1) * 7);
    return { start, end: addDays(start, 6) };
  }

  function fundForStep(stepIndex) {
    return ORDER[(stepIndex % ORDER.length + ORDER.length) % ORDER.length];
  }

  const span = (cls, text) => `<span class="${cls}">${esc(text)}</span>`;

  function render() {
    const now = new Date();
    const st = getState(now);

    const resetInDays = Math.ceil((st.resetAt - now) / (24 * 3600 * 1000));
    const cycleNo = Math.floor(st.stepIndex / ORDER.length) + 1;
    const stepInCycle = (st.stepIndex % ORDER.length) + 1; // 1..10
    const buyFund = fundForStep(st.stepIndex);

    // schedule rows
    const rows = [];
    for (let i = 0; i < 4; i++) {
      const idx = st.stepIndex + i;
      const { start, end } = periodForStep(idx);
      const wNo = idx + 1;
      const sIn = (idx % ORDER.length) + 1;

      const label = i === 0 ? "THIS " : `NEXT${i}`;
      const line =
        `${label.padEnd(6)} ` +
        `W${String(wNo).padStart(3, "0")}  ` +
        `S${sIn}/${ORDER.length}   ` +
        `${fmtDate(start)} -> ${fmtDate(end)}   ` +
        `${fundForStep(idx)}`;

      if (i === 0) {
        rows.push(
          `<span class="hlRow">${esc(line).replace(
            esc(buyFund),
            `<span class="green">${esc(buyFund)}</span>`
          )}</span>`
        );
      } else {
        rows.push(span("muted", line));
      }
    }

    // ===== CYCLE ORDER (fixed-width columns) =====
    // กำหนดความกว้างต่อช่องให้เท่ากัน (ปรับได้: 16/17/18)
    const COL_W = 16;

    const fmtItem = (idx1, fund, active) => {
      const n = String(idx1).padStart(2, "0");
      const txt = (`${n} ${fund}`).padEnd(COL_W, " "); // สำคัญ: pad ให้กว้างเท่ากัน
      return active ? `<span class="hlCycle">${esc(txt)}</span>` : span("dim", txt);
    };

    const items = ORDER.map((f, i) => fmtItem(i + 1, f, (i + 1 === stepInCycle)));

    // 5 ช่องต่อบรรทัด
    const line1 = items.slice(0, 5).join(" ");
    const line2 = items.slice(5, 10).join(" ");

    const html =
`${span("green", "$")} ${span("green", "dca")} ${span("dim", "status")} ${span("green", "▉")}

${span("dim", "TODAY".padEnd(10))} ${span("white", fmtDate(st.today))}
${span("dim", "RESET IN".padEnd(10))} ${span("yellow", `${resetInDays} day(s)`)}  ${span("yellow", `(next Monday: ${fmtDate(st.resetAt)})`)}
${span("dim", "WEEK".padEnd(10))} ${span("white", `#${st.weekNo}`)}  ${span("muted", `(${fmtDate(st.periodStart)} -> ${fmtDate(st.periodEnd)})`)}
${span("dim", "CYCLE".padEnd(10))} ${span("blue", `#${cycleNo}`)}  ${span("blue", `step ${stepInCycle}/${ORDER.length}`)}

${span("white", "BUY THIS WEEK:")} ${span("green", buyFund)}  ${span("muted", `[${money(WEEKLY_BUDGET)}]`)}

${span("dim", "SCHEDULE (THIS + NEXT 3)")}
${rows.join("\n")}

${span("dim", `CYCLE ORDER (${ORDER.length})`)}
  ${line1}
  ${line2}
`;

    out.innerHTML = html;
    if (cmdHintEl) cmdHintEl.textContent = "dca status";
  }

  render();
  setInterval(render, 30_000);
})();