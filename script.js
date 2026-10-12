/* ============================================================
   Manual vs AI-Assisted Coding - script.js
   Handles: navigation, scroll effects, syntax highlighting,
   the interactive playground, Chart.js dashboards, sliders,
   animated counters, the summary modal and file download.
   Everything runs locally in the browser. No servers, no APIs.
   ============================================================ */

"use strict";

/* ------------------------------------------------------------
   0. Small helpers
------------------------------------------------------------ */
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

/* Respect users who prefer less motion */
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------
   1. Navigation bar
------------------------------------------------------------ */
const navbar = $("#navbar");
const navToggle = $("#navToggle");
const navLinks = $("#navLinks");

window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 24);
}, { passive: true });

navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", String(open));
});

/* Close the mobile menu when a link is clicked */
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  })
);

/* ------------------------------------------------------------
   2. Scroll-reveal animation
------------------------------------------------------------ */
function initReveal() {
  const targets = $$(
    ".counter-card, .compare-card, .code-card, .callout, .playground, .metric-panel, " +
    ".chart-card, .prod-card, .pc-card, .final-panel, .about-card"
  );
  targets.forEach((el) => el.classList.add("reveal"));

  if (!("IntersectionObserver" in window) || REDUCED) {
    targets.forEach((el) => el.classList.add("in-view"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in-view");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------
   3. Animated counters
------------------------------------------------------------ */
function animateCounter(el, target) {
  if (REDUCED) { el.textContent = target; return; }
  const start = performance.now();
  const dur = 1200;
  const step = (now) => {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);              /* ease-out cubic */
    el.textContent = Math.round(target * eased);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initCounters() {
  $$(".counter-num[data-target]").forEach((el) => {
    if (!("IntersectionObserver" in window) || REDUCED) {
      animateCounter(el, Number(el.dataset.target));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const suffix = el.dataset.suffix || "";
          animateCounter(el, Number(el.dataset.target));
          /* keep the suffix next to the number */
          const run = () => {
            el.textContent = el.textContent === "" ? "" : el.textContent;
          };
          run();
          /* re-add suffix without breaking animation: wrap value span */
          if (suffix && el.dataset.suffixed !== "1") {
            el.dataset.suffixed = "1";
            el.insertAdjacentText("afterend", suffix);
          }
          io.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    io.observe(el);
  });
}

/* ------------------------------------------------------------
   4. Python syntax highlighting (simple, safe)
   We escape HTML first, then wrap tokens in colour spans.
------------------------------------------------------------ */
function highlightPython(node) {
  const code = node.textContent
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const highlighted = code.replace(
    /(#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b(?:def|return|if|elif|else|for|while|import|from|in|and|or|not|print|class|lambda|None|True|False)\b)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*(?=\())/g,
    (m, comment, str, kw, num, fn) => {
      if (comment) return '<span class="tok-com">' + comment + "</span>";
      if (str)     return '<span class="tok-str">' + str + "</span>";
      if (kw)      return '<span class="tok-key">' + kw + "</span>";
      if (num)     return '<span class="tok-num">' + num + "</span>";
      if (fn)      return '<span class="tok-fn">' + fn + "</span>";
      return m;
    }
  );
  node.innerHTML = highlighted;
}

/* ------------------------------------------------------------
   5. Playground configuration (six Python-style tasks)
   jsRun() computes the same result with safe client-side logic.
------------------------------------------------------------ */
const TASKS = {
  evenOdd: {
    name: "Even / Odd",
    desc: "Check whether a given number is even or odd.",
    inputs: [
      { key: "n", label: "Enter a number", def: "10" }
    ],
    manual: `number = 10

if number % 2 == 0:
    print("Even Number")
else:
    print("Odd Number")`,
    manualNote: "Direct conditional logic: 4 small steps, runs top to bottom.",
    ai: `def check_even_odd(number):
    if number % 2 == 0:
        return "Even Number"
    return "Odd Number"

print(check_even_odd(10))`,
    aiNote: "Simulated AI suggestion: the assistant wraps the check in a reusable function and prints the returned label. Both versions print the same answer.",
    jsRun: (v) => (v.n % 2 === 0 ? "Even Number" : "Odd Number")
  },

  signCheck: {
    name: "Positive / Negative / Zero",
    desc: "Classify a number as positive, negative or zero.",
    inputs: [
      { key: "n", label: "Enter a number", def: "-7" }
    ],
    manual: `number = -7

if number > 0:
    print("Positive")
elif number < 0:
    print("Negative")
else:
    print("Zero")`,
    manualNote: "Three-branch if / elif / else chain checks the sign.",
    ai: `def describe_sign(number):
    if number > 0:
        return "Positive"
    if number < 0:
        return "Negative"
    return "Zero"

print(describe_sign(-7))`,
    aiNote: "Simulated AI suggestion: uses early returns inside a function instead of an else chain - a common AI-generated pattern that is easy to read.",
    jsRun: (v) => (v.n > 0 ? "Positive" : v.n < 0 ? "Negative" : "Zero")
  },

  largestOfTwo: {
    name: "Largest of Two",
    desc: "Find which of two numbers is larger.",
    inputs: [
      { key: "a", label: "First number", def: "15" },
      { key: "b", label: "Second number", def: "8" }
    ],
    manual: `a = 15
b = 8

if a > b:
    largest = a
else:
    largest = b

print("Largest number:", largest)`,
    manualNote: "Assigns the larger value to a variable, then prints it.",
    ai: `def largest(a, b):
    return a if a > b else b

print("Largest number:", largest(15, 8))`,
    aiNote: "Simulated AI suggestion: a single-line conditional expression returns the larger value - compact, but beginners should understand ternary syntax first.",
    jsRun: (v) => "Largest number: " + Math.max(v.a, v.b)
  },

  sumOfTwo: {
    name: "Sum of Two",
    desc: "Add two numbers together and show the total.",
    inputs: [
      { key: "a", label: "First number", def: "12" },
      { key: "b", label: "Second number", def: "30" }
    ],
    manual: `a = 12
b = 30

sum = a + b

print("Sum:", sum)`,
    manualNote: "Straightforward arithmetic - assign, add, print.",
    ai: `def add(a, b):
    """Return the sum of two numbers."""
    return a + b

print("Sum:", add(12, 30))`,
    aiNote: "Simulated AI suggestion: adds a docstring and parameterised function so the same addition can be reused and documented elsewhere.",
    jsRun: (v) => "Sum: " + (v.a + v.b)
  },

  leapYear: {
    name: "Leap Year",
    desc: "Check whether a given year is a leap year.",
    inputs: [
      { key: "y", label: "Enter a year", def: "2024" }
    ],
    manual: `year = 2024

if year % 4 == 0:
    if year % 100 == 0:
        if year % 400 == 0:
            print("Leap Year")
        else:
            print("Not a Leap Year")
    else:
        print("Leap Year")
else:
    print("Not a Leap Year")`,
    manualNote: "Nested conditions follow the full leap-year rule: divisible by 4, except centuries, unless divisible by 400.",
    ai: `def is_leap(year):
    return (year % 4 == 0 and year % 100 != 0) or year % 400 == 0

print("Leap Year" if is_leap(2024) else "Not a Leap Year")`,
    aiNote: "Simulated AI suggestion: the assistant combines the whole rule into one boolean expression - much shorter, easier to test, and identical in logic.",
    jsRun: (v) => {
      const y = Math.abs(v.y);
      return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
        ? "Leap Year"
        : "Not a Leap Year";
    }
  },

  factorial: {
    name: "Factorial",
    desc: "Calculate the factorial of a non-negative whole number.",
    inputs: [
      { key: "n", label: "Enter a whole number (0-20)", def: "5" }
    ],
    manual: `number = 5
factorial = 1

while number > 0:
    factorial = factorial * number
    number = number - 1

print("Factorial:", factorial)`,
    manualNote: "A while loop multiplies the total down from the input number to 1.",
    ai: `def factorial(n):
    if n == 0 or n == 1:
        return 1
    return n * factorial(n - 1)

print("Factorial:", factorial(5))`,
    aiNote: "Simulated AI suggestion: a recursive function that calls itself until it reaches the base case (0 or 1). Elegant, but recursion needs a clear stopping condition.",
    jsRun: (v) => {
      const n = v.n;
      if (!Number.isInteger(n)) throw new Error("Please enter a whole number.");
      if (n < 0) throw new Error("Factorial needs a non-negative number.");
      if (n > 20) throw new Error("Keep it under 21 to stay in safe range.");
      let f = 1;
      for (let i = 2; i <= n; i++) f *= i;
      return "Factorial: " + f;
    }
  }
};

/* ------------------------------------------------------------
   6. Playground UI
------------------------------------------------------------ */
const taskButtons = $("#taskButtons");
const pgInputs = $("#pgInputs");
const pgCode = $("#pgCode");
const pgFileLabel = $("#pgFileLabel");
const pgTag = $("#pgTag");
const pgNotesText = $("#pgNotesText");
const pgOutput = $("#pgOutput");
const pgOutputBox = $("#pgOutputBox");
const tabManual = $('.tab-btn[data-tab="manual"]');
const tabAi = $('.tab-btn[data-tab="ai"]');

let currentTask = "evenOdd";
let currentTab = "manual";

function renderTaskButtons() {
  taskButtons.innerHTML = "";
  Object.keys(TASKS).forEach((key) => {
    const btn = document.createElement("button");
    btn.className = "task-chip" + (key === currentTask ? " active" : "");
    btn.textContent = TASKS[key].name;
    btn.addEventListener("click", () => selectTask(key));
    taskButtons.appendChild(btn);
  });
}

function selectTask(key) {
  currentTask = key;
  $$(".task-chip").forEach((b, i) =>
    b.classList.toggle("active", Object.keys(TASKS)[i] === key)
  );
  renderInputs();
  renderCode();
  clearOutput();
}

function renderInputs() {
  const task = TASKS[currentTask];
  pgInputs.innerHTML = "";
  task.inputs.forEach((inp) => {
    const field = document.createElement("div");
    field.className = "pg-field";
    const label = document.createElement("label");
    label.textContent = inp.label;
    const input = document.createElement("input");
    input.type = "number";
    input.value = inp.def;
    input.dataset.key = inp.key;
    field.appendChild(label);
    field.appendChild(input);
    pgInputs.appendChild(field);
  });
}

function renderCode() {
  const task = TASKS[currentTask];
  const isAi = currentTab === "ai";
  pgCode.textContent = isAi ? task.ai : task.manual;
  highlightPython(pgCode);

  pgFileLabel.textContent =
    (isAi ? "ai_" : "manual_") + currentTask + ".py";
  pgTag.className = isAi ? "tag-ai" : "tag-manual";
  pgTag.textContent = isAi ? "AI-ASSISTED" : "MANUAL";

  pgNotesText.innerHTML = isAi ? task.aiNote : task.manualNote;
}

function setTab(tab) {
  currentTab = tab;
  tabManual.classList.toggle("active", tab === "manual");
  tabAi.classList.toggle("active", tab === "ai");
  renderCode();
}
tabManual.addEventListener("click", () => setTab("manual"));
tabAi.addEventListener("click", () => setTab("ai"));

function readInputs() {
  const task = TASKS[currentTask];
  const values = {};
  pgInputs.querySelectorAll("input[type=number]").forEach((inp) => {
    values[inp.dataset.key] = parseFloat(inp.value);
  });
  return values;
}

function runExample() {
  const task = TASKS[currentTask];
  try {
    const out = task.jsRun(readInputs());
    pgOutput.className = "pg-output";
    pgOutput.textContent =
      "> " + (currentTab === "ai" ? "(simulated AI output) " : "") + ">>> " + out;
  } catch (err) {
    pgOutput.className = "pg-output err";
    pgOutput.textContent = "> Error: " + err.message;
  }
  pgOutputBox.classList.add("flash");
  setTimeout(() => pgOutputBox.classList.remove("flash"), 400);
}

function clearOutput() {
  pgOutput.className = "pg-output";
  pgOutput.textContent = "> (Run the example to see the output)";
}

$("#pgRun").addEventListener("click", runExample);

$("#pgReset").addEventListener("click", () => {
  renderInputs();
  renderCode();
  clearOutput();
});

/* Small highlight animation for the output box */
const style = document.createElement("style");
style.textContent = ".pg-output-box.flash { box-shadow: 0 0 0 3px rgba(34,197,94,0.35); }";
document.head.appendChild(style);

/* ------------------------------------------------------------
   7. Comparative analysis: metrics, sliders and charts
   NOTE: all values are illustrative demo numbers (0-100),
   clearly labelled, NOT results from a real experiment.
------------------------------------------------------------ */
const METRICS = [
  { id: "devTime",     label: "Development time",   lowerBetter: true,  manual: 80, ai: 40, desc: "Time needed to write a small program. Lower is better." },
  { id: "debug",       label: "Debugging effort",   lowerBetter: true,  manual: 75, ai: 30, desc: "Effort to find and fix bugs. Lower is better." },
  { id: "readability", label: "Code readability",   lowerBetter: false, manual: 60, ai: 82, desc: "How easy the code is to read. Higher is better." },
  { id: "learning",    label: "Learning support",   lowerBetter: false, manual: 42, ai: 88, desc: "Help a beginner gets from the approach. Higher is better." },
  { id: "errDetect",   label: "Error detection",    lowerBetter: false, manual: 55, ai: 82, desc: "Ability to spot potential errors. Higher is better." },
  { id: "productivity",label: "Productivity",       lowerBetter: false, manual: 50, ai: 86, desc: "Amount of useful work per unit of time. Higher is better." }
];

const DEFAULTS = {
  manual: { devTime: 80, debug: 75, readability: 60, learning: 42, errDetect: 55, productivity: 50 },
  ai:     { devTime: 40, debug: 30, readability: 82, learning: 88, errDetect: 82, productivity: 86 }
};

const state = {
  manual: { ...DEFAULTS.manual },
  ai: { ...DEFAULTS.ai }
};

let barChart, radarChart;

const CHART_COLORS = {
  manualFill: "rgba(249, 115, 22, 0.80)",
  manualBorder: "#fb923c",
  manualBg: "rgba(249, 115, 22, 0.18)",
  aiFill: "rgba(139, 92, 246, 0.80)",
  aiBorder: "#a78bfa",
  aiBg: "rgba(139, 92, 246, 0.22)"
};

function performanceFor(mid, val) {
  const m = METRICS.find((x) => x.id === mid);
  return m.lowerBetter ? 100 - val : val;   /* radar always shows higher = better */
}

function buildCharts() {
  const labels = METRICS.map((m) => m.label);
  const gridColor = "rgba(255,255,255,0.08)";
  const tickColor = "#a6b0d0";

  barChart = new Chart($("#barChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Manual Coding", data: METRICS.map((m) => state.manual[m.id]), backgroundColor: CHART_COLORS.manualFill, borderColor: CHART_COLORS.manualBorder, borderWidth: 2, borderRadius: 9, categoryPercentage: 0.6 },
        { label: "AI-Assisted Coding", data: METRICS.map((m) => state.ai[m.id]), backgroundColor: CHART_COLORS.aiFill, borderColor: CHART_COLORS.aiBorder, borderWidth: 2, borderRadius: 9, categoryPercentage: 0.6 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: REDUCED ? 0 : 1000, easing: "easeOutQuart" },
      plugins: {
        legend: { labels: { color: tickColor, usePointStyle: true, pointStyle: "rectRounded", padding: 18 } },
        tooltip: { backgroundColor: "rgba(12,16,40,0.95)", borderColor: "rgba(255,255,255,0.15)", borderWidth: 1, titleColor: "#fff", bodyColor: "#dbe6ff" }
      },
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: gridColor }, ticks: { color: tickColor, stepSize: 20 } },
        x: { grid: { display: false }, ticks: { color: tickColor } }
      }
    }
  });

  radarChart = new Chart($("#radarChart"), {
    type: "radar",
    data: {
      labels,
      datasets: [
        { label: "Manual Coding", data: METRICS.map((m) => performanceFor(m.id, state.manual[m.id])), backgroundColor: CHART_COLORS.manualBg, borderColor: CHART_COLORS.manualBorder, borderWidth: 2, pointBackgroundColor: CHART_COLORS.manualBorder },
        { label: "AI-Assisted Coding", data: METRICS.map((m) => performanceFor(m.id, state.ai[m.id])), backgroundColor: CHART_COLORS.aiBg, borderColor: CHART_COLORS.aiBorder, borderWidth: 2, pointBackgroundColor: CHART_COLORS.aiBorder }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: REDUCED ? 0 : 1000, easing: "easeOutQuart" },
      plugins: {
        legend: { labels: { color: tickColor, usePointStyle: true, pointStyle: "rectRounded", padding: 18 } },
        tooltip: { backgroundColor: "rgba(12,16,40,0.95)", borderColor: "rgba(255,255,255,0.15)", borderWidth: 1, titleColor: "#fff", bodyColor: "#dbe6ff" }
      },
      scales: {
        r: { min: 0, max: 100, ticks: { stepSize: 20, color: tickColor, backdropColor: "transparent" }, pointLabels: { color: tickColor, font: { size: 12 } }, grid: { color: gridColor }, angleLines: { color: gridColor } }
      }
    }
  });
}

function renderSliders() {
  const wrap = $("#metricSliders");
  wrap.innerHTML = "";
  METRICS.forEach((m) => {
    const row = document.createElement("div");
    row.className = "metric-row";

    const name = document.createElement("div");
    name.className = "m-name";
    name.textContent = m.label;
    const unit = document.createElement("span");
    unit.className = "m-units";
    unit.textContent = m.lowerBetter ? "(lower is better)" : "(higher is better)";
    name.appendChild(unit);
    const tip = document.createElement("button");
    tip.type = "button";
    tip.className = "tip-badge";
    tip.dataset.tip = m.desc;
    tip.textContent = "?";
    name.appendChild(tip);

    const controls = document.createElement("div");
    controls.className = "m-controls";

    ["manual", "ai"].forEach((who) => {
      const group = document.createElement("div");
      group.className = "slider-group slider-" + who;

      const label = document.createElement("span");
      label.className = "slider-label";
      label.innerHTML = '<span class="s-dot"></span>' + (who === "manual" ? "Manual" : "AI-Assisted");

      const input = document.createElement("input");
      input.type = "range";
      input.min = "0";
      input.max = "100";
      input.value = state[who][m.id];
      input.className = "m-slider m-slider-" + who;
      input.dataset.metric = m.id;
      input.dataset.who = who;
      input.dataset.tip = m.desc;

      const val = document.createElement("span");
      val.className = "slider-value-" + who;
      val.textContent = state[who][m.id];

      input.addEventListener("input", () => {
        state[who][m.id] = Number(input.value);
        val.textContent = input.value;
        updateChartsAndCards();
      });

      group.appendChild(label);
      group.appendChild(input);
      group.appendChild(val);
      controls.appendChild(group);
    });

    row.appendChild(name);
    row.appendChild(controls);
    wrap.appendChild(row);
  });
}

function updateChartsAndCards() {
  const labels = METRICS.map((m) => m.label);

  barChart.data.datasets[0].data = METRICS.map((m) => state.manual[m.id]);
  barChart.data.datasets[1].data = METRICS.map((m) => state.ai[m.id]);
  barChart.update();

  radarChart.data.datasets[0].data = METRICS.map((m) => performanceFor(m.id, state.manual[m.id]));
  radarChart.data.datasets[1].data = METRICS.map((m) => performanceFor(m.id, state.ai[m.id]));
  radarChart.update();

  updateProductivityCards();
}

function updateProductivityCards() {
  const m = state.manual;
  const a = state.ai;

  const timeSaved = m.devTime > a.devTime ? Math.round(((m.devTime - a.devTime) / m.devTime) * 100) : 0;
  const readabilityGain = Math.max(0, a.readability - m.readability);
  const productivityLift = Math.max(0, a.productivity - m.productivity);

  setCounterValue($("#cardTimeSaved"), timeSaved);
  setCounterValue($("#cardReadability"), readabilityGain);
  setCounterValue($("#cardProductivity"), productivityLift);
}

function setCounterValue(el, target) {
  if (el.dataset.last === String(target)) return;
  el.dataset.last = String(target);
  animateCounter(el, target);
}

$("#resetMetrics").addEventListener("click", () => {
  Object.assign(state.manual, DEFAULTS.manual);
  Object.assign(state.ai, DEFAULTS.ai);
  renderSliders();
  updateChartsAndCards();
});

/* ------------------------------------------------------------
   8. Final result bars (animate when visible)
------------------------------------------------------------ */
function initFinalBars() {
  const rows = $$("#finalBars .fbar-fill");
  const getWidth = (el) => Number.parseFloat(el.style.width) || 0;
  const targets = rows.map(getWidth);

  rows.forEach((el) => { el.style.width = "0"; });

  const animate = () => {
    rows.forEach((el, i) => {
      const target = targets[i];
      if (REDUCED) { el.style.width = target + "%"; return; }
      const start = performance.now();
      const dur = 1300;
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.style.width = (target * eased).toFixed(1) + "%";
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };

  if (!("IntersectionObserver" in window) || REDUCED) { animate(); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { animate(); io.disconnect(); }
    });
  }, { threshold: 0.35 });
  io.observe($("#finalBars"));
}

/* ------------------------------------------------------------
   9. Summary modal + downloadable text file
------------------------------------------------------------ */
const modal = $("#summaryModal");

function buildSummaryHTML() {
  const rows = METRICS.map((m) => {
    const better = m.lowerBetter ? "lower = better" : "higher = better";
    return "<li><strong>" + m.label + ":</strong> Manual " + state.manual[m.id] +
           " vs AI " + state.ai[m.id] + " (" + better + ")</li>";
  }).join("");

  return (
    "<section><h3>What this project shows</h3><ul>" +
    "<li>Manual coding builds fundamentals, control and deep understanding.</li>" +
    "<li>AI-assisted coding speeds up routine tasks, explains code and helps find bugs.</li>" +
    "<li>AI output must always be reviewed, tested and validated by a human.</li>" +
    "<li>The best approach combines AI assistance with strong programming fundamentals.</li>" +
    "</ul></section>" +
    "<section><h3>Current demo comparison (editable slider values)</h3><ul>" + rows + "</ul></section>" +
    "<section><h3>Demo data disclaimer</h3>" +
    "<p style='color:#a6b0d0;font-size:0.9rem'>All numeric values in the dashboard are illustrative examples for education only. They are not measurements from a real research study and do not claim to be scientifically proven.</p></section>"
  );
}

function buildSummaryText() {
  const line = "==============================================";
  const rows = METRICS.map((m) =>
    "- " + m.label + ": Manual " + state.manual[m.id] + " / AI " + state.ai[m.id] +
    " (" + (m.lowerBetter ? "lower is better" : "higher is better") + ")"
  ).join("\n");

  return (
    line + "\nManual vs AI-Assisted Coding - Project Summary\n" + line +
    "\n\nTask: A colourless, free, offline comparison of two development approaches.\n" +
    "\nKey idea:\nThe same Python program can be written by hand (manual coding) or with\nhelp from an AI tool. Both can be correct. AI can be faster for routine work,\nbut every AI-generated line must still be reviewed by a human.\n" +
    "\nInteractions: 6 demo tasks, 6 comparison metrics with sliders, 2 charts.\n" +
    "\nCurrent demo comparison (0-100):\n" + rows +
    "\n\nConclusion:\nAI-assisted coding can improve developer productivity, accelerate repetitive\ntasks, and support debugging and learning. However, AI-generated code must be\nreviewed, tested and validated by a human developer. The most effective approach\nis to combine AI assistance with strong programming fundamentals.\n" +
    "\nDisclaimer:\nAll dashboard values are illustrative demo data for education only, not results\nfrom a real experiment.\n" +
    "\nMade with HTML5, CSS3, JavaScript and Chart.js (100% offline).\n"
  );
}

$("#viewSummary").addEventListener("click", () => {
  $("#modalBody").innerHTML = buildSummaryHTML();
  modal.classList.add("open");
});
$("#modalClose").addEventListener("click", () => modal.classList.remove("open"));
$("#modalClose2").addEventListener("click", () => modal.classList.remove("open"));
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.remove("open");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") modal.classList.remove("open");
});

$("#downloadBtn").addEventListener("click", () => {
  const blob = new Blob([buildSummaryText()], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "manual-vs-ai-coding-summary.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

/* ------------------------------------------------------------
   10. Initialise everything
------------------------------------------------------------ */
function init() {
  /* Highlight the static Python blocks in Section B */
  $$(".py-block").forEach(highlightPython);

  renderTaskButtons();
  selectTask("evenOdd");

  renderSliders();
  buildCharts();
  updateProductivityCards();

  initCounters();
  initReveal();
  initFinalBars();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}