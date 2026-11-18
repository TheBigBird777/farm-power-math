(function () {
  "use strict";
  // ---------- shared helpers
  function $(id) { return document.getElementById(id); }
  function num(id) { var v = parseFloat($(id).value); return isFinite(v) ? v : NaN; }
  function fmt(n, d) { if (!isFinite(n)) return "–"; return n.toLocaleString("en-US", { maximumFractionDigits: d === undefined ? 1 : d, minimumFractionDigits: 0 }); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // ---------- wire data: copper, ohms per 1000 ft at 75 C (NEC Ch.9 Table 8), 75 C ampacity (NEC 310.16) and small-conductor limits (240.4(D))
  var WIRES = [
    { awg: "14",  r: 3.07,   amp: 20,  limit: 15 },
    { awg: "12",  r: 1.93,   amp: 25,  limit: 20 },
    { awg: "10",  r: 1.21,   amp: 35,  limit: 30 },
    { awg: "8",   r: 0.764,  amp: 50 },
    { awg: "6",   r: 0.491,  amp: 65 },
    { awg: "4",   r: 0.308,  amp: 85 },
    { awg: "3",   r: 0.245,  amp: 100 },
    { awg: "2",   r: 0.194,  amp: 115 },
    { awg: "1",   r: 0.154,  amp: 130 },
    { awg: "1/0", r: 0.122,  amp: 150 },
    { awg: "2/0", r: 0.0967, amp: 175 },
    { awg: "3/0", r: 0.0766, amp: 200 },
    { awg: "4/0", r: 0.0608, amp: 230 }
  ];
  function rating(w) { return w.limit ? Math.min(w.amp, w.limit) : w.amp; }

  // Exposed for testing
  var Calc = {
    voltageDrop: function (phase, lengthFt, amps, ohmsPerKft) {
      var k = phase === 3 ? Math.sqrt(3) : 2;
      return k * lengthFt * amps * ohmsPerKft / 1000;
    },
    pickWire: function (phase, volts, lengthFt, amps, targetPct, continuous) {
      var needAmps = continuous ? amps * 1.25 : amps;
      for (var i = 0; i < WIRES.length; i++) {
        var w = WIRES[i];
        var vd = Calc.voltageDrop(phase, lengthFt, amps, w.r);
        if (rating(w) >= needAmps && (vd / volts) * 100 <= targetPct) return { wire: w, vd: vd };
      }
      return null;
    },
    battery: function (dailyWh, days, dod, invEff, volts, psh, lossPct) {
      var capWh = dailyWh * days / (dod * invEff);
      var arrayW = psh > 0 ? (dailyWh / invEff) / (psh * (1 - lossPct / 100)) : NaN;
      return { capWh: capWh, capAh: capWh / volts, arrayW: arrayW, ccAmps: arrayW / volts * 1.25 };
    },
    generator: function (rows, headroomPct) {
      var run = 0, surge = 0;
      rows.forEach(function (r) {
        if (!r.on) return;
        var rw = Math.max(0, r.run || 0), sw = Math.max(rw, r.start || 0);
        run += rw;
        surge = Math.max(surge, sw - rw);
      });
      return { run: run, surge: surge, peak: run + surge, rated: run * (1 + headroomPct / 100) };
    }
  };
  window.FarmPowerMath = Calc;

  if ($("wire")) {
  // ---------- wire UI
  var sizeSel = $("w-size");
  WIRES.forEach(function (w) { var o = document.createElement("option"); o.value = w.awg; o.textContent = w.awg + " AWG"; if (w.awg === "10") o.selected = true; sizeSel.appendChild(o); });
  function wireVolts() { return $("w-volts").value === "custom" ? num("w-custom") : parseFloat($("w-volts").value); }
  function updateWire() {
    $("w-custom-wrap").hidden = $("w-volts").value !== "custom";
    $("w-load-label").textContent = $("w-mode").value === "watts" ? "Load (watts)" : "Load (amps)";
    var V = wireVolts(), phase = parseInt($("w-circuit").value, 10), L = num("w-len"), load = num("w-load"), target = num("w-target");
    var cont = $("w-cont").checked;
    if (!(V > 0) || !(L >= 0) || !(load >= 0) || !(target > 0)) { $("w-headline").textContent = "Enter positive numbers to see results."; return; }
    var I = $("w-mode").value === "watts" ? (phase === 3 ? load / (Math.sqrt(3) * V) : load / V) : load;
    var w = WIRES.filter(function (x) { return x.awg === sizeSel.value; })[0];
    var vd = Calc.voltageDrop(phase, L, I, w.r), pct = vd / V * 100;
    var need = cont ? I * 1.25 : I, okAmp = rating(w) >= need, okDrop = pct <= target;
    $("w-headline").innerHTML = esc(w.awg) + " AWG copper: " + (okAmp && okDrop ? '<span class="ok">works for this run</span>' : '<span class="bad">' + (okAmp ? "too much voltage drop" : "too small for the current") + "</span>");
    $("w-vd").textContent = fmt(vd, 2) + " V (" + fmt(pct, 1) + "%) at " + fmt(I, 1) + " A";
    $("w-vend").textContent = fmt(V - vd, 1) + " V of " + fmt(V, 0) + " V";
    $("w-amp").textContent = rating(w) + " A" + (cont ? " (needs " + fmt(need, 1) + " A with 125% continuous)" : " (needs " + fmt(need, 1) + " A)");
    var pick = Calc.pickWire(phase, V, L, I, target, cont);
    $("w-rec").textContent = pick ? pick.wire.awg + " AWG copper (" + fmt(pick.vd / V * 100, 1) + "% drop)" : "Larger than 4/0 AWG: consider a higher voltage, aluminum feeder or a shorter run, and ask an electrician.";
  }
  ["w-volts", "w-custom", "w-circuit", "w-len", "w-mode", "w-load", "w-target", "w-size", "w-cont"].forEach(function (id) { $(id).addEventListener("input", updateWire); $(id).addEventListener("change", updateWire); });
  updateWire();
  }

  // ---------- table helpers
  function addRow(tbody, cells, onChange) {
    var tr = document.createElement("tr");
    cells.forEach(function (c) {
      var td = document.createElement("td");
      if (c.type === "out") { td.className = "out"; td.textContent = "–"; }
      else if (c.type === "remove") {
        var b = document.createElement("button"); b.type = "button"; b.className = "rowbtn"; b.textContent = "Remove"; b.setAttribute("aria-label", "Remove this load");
        b.addEventListener("click", function () { tr.remove(); onChange(); }); td.appendChild(b);
      } else {
        var i = document.createElement("input"); i.type = c.type; i.setAttribute("aria-label", c.label);
        if (c.type === "checkbox") { i.checked = !!c.value; } else { i.value = c.value; if (c.type === "number") { i.min = "0"; i.step = "any"; } }
        i.addEventListener("input", onChange); i.addEventListener("change", onChange); td.appendChild(i);
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
    onChange();
  }
  if ($("battery")) {
  // ---------- battery UI
  var bBody = document.querySelector("#b-table tbody");
  function bRow(name, w, h) {
    addRow(bBody, [{ type: "text", value: name, label: "Load name" }, { type: "number", value: w, label: "Watts" }, { type: "number", value: h, label: "Hours per day" }, { type: "out" }, { type: "remove" }], updateBattery);
  }
  function updateBattery() {
    $("b-dod-wrap").hidden = $("b-chem").value !== "custom";
    var daily = 0;
    Array.prototype.forEach.call(bBody.rows, function (tr) {
      var ins = tr.querySelectorAll("input");
      var wh = (parseFloat(ins[1].value) || 0) * Math.min(24, parseFloat(ins[2].value) || 0);
      tr.querySelector(".out").textContent = fmt(wh, 0);
      daily += wh;
    });
    var dod = $("b-chem").value === "custom" ? num("b-dod") / 100 : parseFloat($("b-chem").value);
    var inv = num("b-inv") / 100, V = parseFloat($("b-volts").value), days = num("b-days"), psh = num("b-psh"), loss = num("b-loss");
    if (!(dod > 0) || !(inv > 0) || !(days > 0)) { $("b-headline").textContent = "Enter positive numbers to see results."; return; }
    var r = Calc.battery(daily, days, dod, inv, V, psh, loss);
    $("b-daily").textContent = fmt(daily, 0) + " Wh (" + fmt(daily / 1000, 2) + " kWh) per day";
    $("b-cap").textContent = fmt(Math.ceil(r.capWh), 0) + " Wh = " + fmt(Math.ceil(r.capAh), 0) + " Ah at " + V + " V";
    var series = V / 12, strings = Math.ceil(r.capAh / 100);
    $("b-example").textContent = daily > 0 ? (series * strings) + " × 12 V 100 Ah batteries (" + series + " in series × " + strings + " parallel string" + (strings === 1 ? "" : "s") + "), or one " + V + " V battery of at least " + fmt(Math.ceil(r.capAh), 0) + " Ah" : "–";
    $("b-array").textContent = isFinite(r.arrayW) ? fmt(r.arrayW, 0) + " W of panels" : "Enter peak sun hours";
    $("b-cc").textContent = isFinite(r.ccAmps) ? fmt(r.ccAmps, 0) + " A at " + V + " V (MPPT)" : "–";
    $("b-headline").textContent = daily > 0 ? "About " + fmt(r.capWh / 1000, 1) + " kWh of battery and " + fmt(r.arrayW, 0) + " W of solar" : "Add your loads above.";
  }
  ["b-days", "b-chem", "b-dod", "b-volts", "b-inv", "b-psh", "b-loss"].forEach(function (id) { $(id).addEventListener("input", updateBattery); $(id).addEventListener("change", updateBattery); });
  $("b-add").addEventListener("click", function () { bRow("New load", 0, 0); });
  bRow("Internet dish and router (example)", 75, 24);
  bRow("Refrigerator (example)", 150, 10);
  bRow("LED lights (example)", 60, 5);
  updateBattery();
  }
  if ($("generator")) {
  // ---------- generator UI
  var gBody = document.querySelector("#g-table tbody");
  function gRow(name, run, start, on) {
    addRow(gBody, [{ type: "text", value: name, label: "Load name" }, { type: "number", value: run, label: "Running watts" }, { type: "number", value: start, label: "Starting watts" }, { type: "checkbox", value: on, label: "Runs at the same time" }, { type: "remove" }], updateGen);
  }
  function updateGen() {
    var rows = Array.prototype.map.call(gBody.rows, function (tr) {
      var ins = tr.querySelectorAll("input");
      return { run: parseFloat(ins[1].value) || 0, start: parseFloat(ins[2].value) || 0, on: ins[3].checked };
    });
    var head = num("g-head"); if (!(head >= 0)) head = 0;
    var r = Calc.generator(rows, head);
    $("g-run").textContent = fmt(r.run, 0) + " W";
    $("g-surge").textContent = "+" + fmt(r.surge, 0) + " W (largest single motor start)";
    $("g-peak").textContent = fmt(r.peak, 0) + " W";
    $("g-rec").textContent = "at least " + fmt(Math.ceil(r.rated / 100) * 100, 0) + " running W and " + fmt(Math.ceil(r.peak / 100) * 100, 0) + " starting (surge) W";
    $("g-headline").textContent = r.run > 0 ? "Plan for about " + fmt(r.rated / 1000, 1) + " kW running, " + fmt(r.peak / 1000, 1) + " kW surge" : "Tick at least one load.";
  }
  $("g-head").addEventListener("input", updateGen);
  $("g-add").addEventListener("click", function () { gRow("New load", 0, 0, true); });
  gRow("Well pump (example)", 1000, 2000, true);
  gRow("Refrigerator (example)", 150, 1200, true);
  gRow("Internet dish and router (example)", 75, 75, true);
  gRow("Space heater (example)", 1500, 1500, false);
  updateGen();
  }
})();
