const Tools = {
  activeTool: 'resistor',

  switch(toolId) {
    this.activeTool = toolId;
    document.querySelectorAll('.tool-tab').forEach(t => t.classList.remove('active'));
    if (event && event.currentTarget) {
      event.currentTarget.classList.add('active');
    } else {
      const tab = document.querySelector(`.tool-tab[onclick="Tools.switch('${toolId}')"]`);
      if (tab) tab.classList.add('active');
    }
    this.render();
  },

  render() {
    const area = document.getElementById('toolContentArea');
    if (!area) return;

    let html = '';
    switch (this.activeTool) {
      case 'resistor': html = this.getResistorHtml(); break;
      case 'ohms': html = this.getOhmsHtml(); break;
      case 'led': html = this.getLedHtml(); break;
      case 'divider': html = this.getDividerHtml(); break;
      case 'rc': html = this.getRCHtml(); break;
      case '555': html = this.get555Html(); break;
      case 'lm317': html = this.getLm317Html(); break;
      case 'pcb': html = this.getPcbHtml(); break;
      case 'units': html = this.getUnitsHtml(); break;
      case 'battery': html = this.getBatteryHtml(); break;
    }
    area.innerHTML = html;
    
    if (window.lucide) window.lucide.createIcons();
    this.attachListeners(this.activeTool);
  },

  // --- HTML GENERATORS ---
  
  getResistorHtml() {
    return `
      <h2 style="margin-bottom:16px;">Resistor Color Code Calculator</h2>
      <div style="display:flex; gap:16px;">
        <div style="flex:1;">
          <div class="form-group"><label>Band 1</label><select id="t-r-1" class="form-control">${this.rColorOptions(false)}</select></div>
          <div class="form-group"><label>Band 2</label><select id="t-r-2" class="form-control">${this.rColorOptions(false)}</select></div>
          <div class="form-group"><label>Band 3 (Multiplier)</label><select id="t-r-3" class="form-control">${this.rColorOptions(true)}</select></div>
          <div class="form-group"><label>Band 4 (Tolerance)</label><select id="t-r-4" class="form-control"><option value="5">Gold (±5%)</option><option value="10">Silver (±10%)</option></select></div>
        </div>
        <div class="card" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--color-surface-hover);">
          <div style="font-size:14px; color:var(--text-secondary);">Resistance</div>
          <div id="t-r-result" style="font-size:32px; font-weight:bold; color:var(--color-primary); margin:8px 0;">0 Ω</div>
          <div id="t-r-tol" style="font-size:14px;">±5%</div>
        </div>
      </div>
    `;
  },
  rColorOptions(isMultiplier) {
    const colors = [
      {n:'Black', v:0, m:1}, {n:'Brown', v:1, m:10}, {n:'Red', v:2, m:100}, {n:'Orange', v:3, m:1000},
      {n:'Yellow', v:4, m:10000}, {n:'Green', v:5, m:100000}, {n:'Blue', v:6, m:1000000},
      {n:'Violet', v:7, m:10000000}, {n:'Grey', v:8, m:100000000}, {n:'White', v:9, m:1000000000}
    ];
    return colors.map(c => `<option value="${isMultiplier ? c.m : c.v}">${c.n}</option>`).join('');
  },

  getOhmsHtml() {
    return `
      <h2 style="margin-bottom:16px;">Ohm's Law & Power</h2>
      <p style="color:var(--text-secondary); margin-bottom:16px;">Enter exactly two values to calculate the other two.</p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div class="form-group"><label>Voltage (V)</label><input type="number" id="t-o-v" class="form-control" step="any"></div>
        <div class="form-group"><label>Current (I) in Amps</label><input type="number" id="t-o-i" class="form-control" step="any"></div>
        <div class="form-group"><label>Resistance (R) in Ohms</label><input type="number" id="t-o-r" class="form-control" step="any"></div>
        <div class="form-group"><label>Power (P) in Watts</label><input type="number" id="t-o-p" class="form-control" step="any"></div>
      </div>
      <button class="btn btn-primary" onclick="Tools.calcOhms()" style="margin-top:16px;">Calculate</button>
      <button class="btn btn-ghost" onclick="Tools.render()" style="margin-top:16px;">Clear</button>
    `;
  },

  getLedHtml() {
    return `
      <h2 style="margin-bottom:16px;">LED Series Resistor</h2>
      <div style="display:flex; gap:16px;">
        <div style="flex:1;">
          <div class="form-group"><label>Supply Voltage (V)</label><input type="number" id="t-l-vs" class="form-control" value="5" step="any"></div>
          <div class="form-group"><label>LED Forward Voltage (Vf)</label><input type="number" id="t-l-vf" class="form-control" value="2" step="any"></div>
          <div class="form-group"><label>Desired Current (mA)</label><input type="number" id="t-l-i" class="form-control" value="20" step="any"></div>
        </div>
        <div class="card" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--color-surface-hover);">
          <div style="font-size:14px; color:var(--text-secondary);">Required Resistor</div>
          <div id="t-l-result" style="font-size:32px; font-weight:bold; color:var(--color-primary); margin:8px 0;">150 Ω</div>
          <div id="t-l-power" style="font-size:14px;">Resistor Power: 0.06 W</div>
        </div>
      </div>
    `;
  },

  getDividerHtml() {
    return `
      <h2 style="margin-bottom:16px;">Voltage Divider</h2>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div class="form-group"><label>Input Voltage (Vin)</label><input type="number" id="t-d-vin" class="form-control" value="12" step="any"></div>
        <div class="form-group"><label>Resistor 1 (Ω)</label><input type="number" id="t-d-r1" class="form-control" value="10000" step="any"></div>
        <div class="form-group"><label>Resistor 2 (Ω)</label><input type="number" id="t-d-r2" class="form-control" value="10000" step="any"></div>
        <div class="form-group"><label>Output Voltage (Vout)</label><input type="number" id="t-d-vout" class="form-control" readonly style="background:var(--color-surface-hover); font-weight:bold;"></div>
      </div>
    `;
  },

  getRCHtml() {
    return `
      <h2 style="margin-bottom:16px;">RC Time Constant</h2>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div class="form-group"><label>Resistance (Ω)</label><input type="number" id="t-rc-r" class="form-control" value="10000" step="any"></div>
        <div class="form-group"><label>Capacitance (µF)</label><input type="number" id="t-rc-c" class="form-control" value="100" step="any"></div>
        <div class="form-group"><label>Time Constant τ (seconds)</label><input type="number" id="t-rc-t" class="form-control" readonly style="background:var(--color-surface-hover); font-weight:bold;"></div>
      </div>
    `;
  },

  get555Html() {
    return `
      <h2 style="margin-bottom:16px;">555 Timer (Astable)</h2>
      <div style="display:flex; gap:16px;">
        <div style="flex:1;">
          <div class="form-group"><label>R1 (Ω)</label><input type="number" id="t-5-r1" class="form-control" value="1000" step="any"></div>
          <div class="form-group"><label>R2 (Ω)</label><input type="number" id="t-5-r2" class="form-control" value="10000" step="any"></div>
          <div class="form-group"><label>C1 (µF)</label><input type="number" id="t-5-c" class="form-control" value="10" step="any"></div>
        </div>
        <div class="card" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--color-surface-hover);">
          <div style="font-size:14px; color:var(--text-secondary);">Frequency</div>
          <div id="t-5-freq" style="font-size:32px; font-weight:bold; color:var(--color-primary); margin:8px 0;">6.86 Hz</div>
          <div id="t-5-duty" style="font-size:14px;">Duty Cycle: 52.38%</div>
        </div>
      </div>
    `;
  },

  getLm317Html() {
    return `
      <h2 style="margin-bottom:16px;">LM317 Voltage Regulator</h2>
      <p style="color:var(--text-secondary); margin-bottom:16px;">Vout = 1.25 * (1 + R2/R1)</p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div class="form-group"><label>R1 (Ω) [typically 240 or 220]</label><input type="number" id="t-lm-r1" class="form-control" value="240" step="any"></div>
        <div class="form-group"><label>R2 (Ω)</label><input type="number" id="t-lm-r2" class="form-control" value="1000" step="any"></div>
        <div class="form-group"><label>Output Voltage (V)</label><input type="number" id="t-lm-vout" class="form-control" readonly style="background:var(--color-surface-hover); font-weight:bold;"></div>
      </div>
    `;
  },

  getPcbHtml() {
    return `
      <h2 style="margin-bottom:16px;">PCB Trace Width (IPC-2221)</h2>
      <div style="display:flex; gap:16px;">
        <div style="flex:1;">
          <div class="form-group"><label>Current (Amps)</label><input type="number" id="t-p-i" class="form-control" value="1" step="any"></div>
          <div class="form-group"><label>Copper Thickness (oz/ft²)</label><input type="number" id="t-p-oz" class="form-control" value="1" step="any"></div>
          <div class="form-group"><label>Temp Rise (°C)</label><input type="number" id="t-p-t" class="form-control" value="10" step="any"></div>
        </div>
        <div class="card" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--color-surface-hover);">
          <div style="font-size:14px; color:var(--text-secondary);">Required Width</div>
          <div id="t-p-res" style="font-size:24px; font-weight:bold; color:var(--color-primary); margin:8px 0; text-align:center;">—</div>
        </div>
      </div>
    `;
  },

  getUnitsHtml() {
    return `
      <h2 style="margin-bottom:16px;">Capacitance Unit Converter</h2>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;">
        <div class="form-group"><label>PicoFarad (pF)</label><input type="number" id="t-u-p" class="form-control" step="any"></div>
        <div class="form-group"><label>NanoFarad (nF)</label><input type="number" id="t-u-n" class="form-control" step="any"></div>
        <div class="form-group"><label>MicroFarad (µF)</label><input type="number" id="t-u-m" class="form-control" step="any"></div>
      </div>
    `;
  },

  getBatteryHtml() {
    return `
      <h2 style="margin-bottom:16px;">Battery Life Estimator</h2>
      <div style="display:flex; gap:16px;">
        <div style="flex:1;">
          <div class="form-group"><label>Battery Capacity (mAh)</label><input type="number" id="t-b-c" class="form-control" value="2000" step="any"></div>
          <div class="form-group"><label>Device Current Draw (mA)</label><input type="number" id="t-b-i" class="form-control" value="50" step="any"></div>
          <div class="form-group"><label>Safety Margin (Derating %)</label><input type="number" id="t-b-d" class="form-control" value="85" step="any" title="Usually 85% due to voltage drop"></div>
        </div>
        <div class="card" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--color-surface-hover);">
          <div style="font-size:14px; color:var(--text-secondary);">Estimated Runtime</div>
          <div id="t-b-res" style="font-size:32px; font-weight:bold; color:var(--color-primary); margin:8px 0;">34 Hours</div>
        </div>
      </div>
    `;
  },

  // --- LOGIC / LISTENERS ---
  
  attachListeners(tool) {
    const bind = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', fn);
    };

    if (tool === 'resistor') {
      ['t-r-1','t-r-2','t-r-3','t-r-4'].forEach(id => bind(id, () => this.calcResistor()));
      this.calcResistor();
    }
    else if (tool === 'led') {
      ['t-l-vs','t-l-vf','t-l-i'].forEach(id => bind(id, () => this.calcLed()));
      this.calcLed();
    }
    else if (tool === 'divider') {
      ['t-d-vin','t-d-r1','t-d-r2'].forEach(id => bind(id, () => this.calcDivider()));
      this.calcDivider();
    }
    else if (tool === 'rc') {
      ['t-rc-r','t-rc-c'].forEach(id => bind(id, () => this.calcRC()));
      this.calcRC();
    }
    else if (tool === '555') {
      ['t-5-r1','t-5-r2','t-5-c'].forEach(id => bind(id, () => this.calc555()));
      this.calc555();
    }
    else if (tool === 'lm317') {
      ['t-lm-r1','t-lm-r2'].forEach(id => bind(id, () => this.calcLm317()));
      this.calcLm317();
    }
    else if (tool === 'pcb') {
      ['t-p-i','t-p-oz','t-p-t'].forEach(id => bind(id, () => this.calcPcb()));
      this.calcPcb();
    }
    else if (tool === 'units') {
      bind('t-u-p', (e) => this.calcUnits(e.target.value, 'p'));
      bind('t-u-n', (e) => this.calcUnits(e.target.value, 'n'));
      bind('t-u-m', (e) => this.calcUnits(e.target.value, 'm'));
    }
    else if (tool === 'battery') {
      ['t-b-c','t-b-i','t-b-d'].forEach(id => bind(id, () => this.calcBattery()));
      this.calcBattery();
    }
  },

  fmt(val, unit) {
    if (isNaN(val) || !isFinite(val)) return '—';
    if (unit === 'Ω') {
      if (val >= 1000000) return (val/1000000).toFixed(2) + ' MΩ';
      if (val >= 1000) return (val/1000).toFixed(2) + ' kΩ';
    }
    return val.toFixed(2) + ' ' + unit;
  },

  calcResistor() {
    const v1 = parseInt(document.getElementById('t-r-1').value);
    const v2 = parseInt(document.getElementById('t-r-2').value);
    const m = parseInt(document.getElementById('t-r-3').value);
    const tol = document.getElementById('t-r-4').value;
    const r = ((v1 * 10) + v2) * m;
    document.getElementById('t-r-result').innerText = this.fmt(r, 'Ω');
    document.getElementById('t-r-tol').innerText = '±' + tol + '%';
  },

  calcOhms() {
    const v = parseFloat(document.getElementById('t-o-v').value);
    const i = parseFloat(document.getElementById('t-o-i').value);
    const r = parseFloat(document.getElementById('t-o-r').value);
    const p = parseFloat(document.getElementById('t-o-p').value);
    
    let known = 0;
    if(!isNaN(v)) known++; if(!isNaN(i)) known++; if(!isNaN(r)) known++; if(!isNaN(p)) known++;
    
    if (known < 2) { 
      // Need 2 values
      return; 
    }
    
    let resV=v, resI=i, resR=r, resP=p;
    
    if (!isNaN(v) && !isNaN(i)) { resR = v/i; resP = v*i; }
    else if (!isNaN(v) && !isNaN(r)) { resI = v/r; resP = (v*v)/r; }
    else if (!isNaN(v) && !isNaN(p)) { resI = p/v; resR = (v*v)/p; }
    else if (!isNaN(i) && !isNaN(r)) { resV = i*r; resP = i*i*r; }
    else if (!isNaN(i) && !isNaN(p)) { resV = p/i; resR = p/(i*i); }
    else if (!isNaN(r) && !isNaN(p)) { resV = Math.sqrt(p*r); resI = Math.sqrt(p/r); }

    document.getElementById('t-o-v').value = resV.toFixed(4);
    document.getElementById('t-o-i').value = resI.toFixed(4);
    document.getElementById('t-o-r').value = resR.toFixed(4);
    document.getElementById('t-o-p').value = resP.toFixed(4);
  },

  calcLed() {
    const vs = parseFloat(document.getElementById('t-l-vs').value);
    const vf = parseFloat(document.getElementById('t-l-vf').value);
    const i = parseFloat(document.getElementById('t-l-i').value) / 1000;
    if (vs && vf && i && vs > vf) {
      const r = (vs - vf) / i;
      const p = (vs - vf) * i;
      document.getElementById('t-l-result').innerText = this.fmt(r, 'Ω');
      document.getElementById('t-l-power').innerText = 'Resistor Power: ' + p.toFixed(3) + ' W';
    } else {
      document.getElementById('t-l-result').innerText = '—';
      document.getElementById('t-l-power').innerText = '';
    }
  },

  calcDivider() {
    const vin = parseFloat(document.getElementById('t-d-vin').value);
    const r1 = parseFloat(document.getElementById('t-d-r1').value);
    const r2 = parseFloat(document.getElementById('t-d-r2').value);
    if (vin && r1 && r2) {
      const vout = vin * (r2 / (r1 + r2));
      document.getElementById('t-d-vout').value = vout.toFixed(3);
    }
  },

  calcRC() {
    const r = parseFloat(document.getElementById('t-rc-r').value);
    const c = parseFloat(document.getElementById('t-rc-c').value) / 1000000;
    if (r && c) {
      document.getElementById('t-rc-t').value = (r * c).toFixed(4);
    }
  },

  calc555() {
    const r1 = parseFloat(document.getElementById('t-5-r1').value);
    const r2 = parseFloat(document.getElementById('t-5-r2').value);
    const c = parseFloat(document.getElementById('t-5-c').value) / 1000000;
    if (r1 && r2 && c) {
      const freq = 1.44 / ((r1 + 2 * r2) * c);
      const duty = ((r1 + r2) / (r1 + 2 * r2)) * 100;
      document.getElementById('t-5-freq').innerText = this.fmt(freq, 'Hz');
      document.getElementById('t-5-duty').innerText = 'Duty Cycle: ' + duty.toFixed(2) + '%';
    }
  },

  calcLm317() {
    const r1 = parseFloat(document.getElementById('t-lm-r1').value);
    const r2 = parseFloat(document.getElementById('t-lm-r2').value);
    if (r1 && r2) {
      document.getElementById('t-lm-vout').value = (1.25 * (1 + (r2/r1))).toFixed(2);
    }
  },

  calcPcb() {
    const i = parseFloat(document.getElementById('t-p-i').value);
    const oz = parseFloat(document.getElementById('t-p-oz').value);
    const t = parseFloat(document.getElementById('t-p-t').value);
    if (i && oz && t) {
      const kInt = 0.024; const kExt = 0.048;
      const b = 0.44; const c = 0.725;
      const areaInt = Math.pow((i / (kInt * Math.pow(t, b))), (1/c));
      const areaExt = Math.pow((i / (kExt * Math.pow(t, b))), (1/c));
      const thicknessMils = oz * 1.378;
      const wIntMils = areaInt / thicknessMils;
      const wExtMils = areaExt / thicknessMils;
      const wIntMm = wIntMils * 0.0254;
      const wExtMm = wExtMils * 0.0254;
      document.getElementById('t-p-res').innerHTML = `Int: ${wIntMm.toFixed(2)}mm <br> Ext: ${wExtMm.toFixed(2)}mm`;
    }
  },

  calcUnits(val, type) {
    const v = parseFloat(val);
    if (isNaN(v)) {
      if (type !== 'p') document.getElementById('t-u-p').value = '';
      if (type !== 'n') document.getElementById('t-u-n').value = '';
      if (type !== 'm') document.getElementById('t-u-m').value = '';
      return;
    }
    let p, n, m;
    if (type === 'p') { p = v; n = v/1000; m = v/1000000; }
    if (type === 'n') { n = v; p = v*1000; m = v/1000; }
    if (type === 'm') { m = v; n = v*1000; p = v*1000000; }
    if (type !== 'p') document.getElementById('t-u-p').value = p;
    if (type !== 'n') document.getElementById('t-u-n').value = n;
    if (type !== 'm') document.getElementById('t-u-m').value = m;
  },

  calcBattery() {
    const cap = parseFloat(document.getElementById('t-b-c').value);
    const i = parseFloat(document.getElementById('t-b-i').value);
    const d = parseFloat(document.getElementById('t-b-d').value) / 100;
    if (cap && i && d) {
      const hrs = (cap / i) * d;
      document.getElementById('t-b-res').innerText = hrs.toFixed(1) + ' Hours';
    }
  }
};

window.Tools = Tools;
