export interface ReportData {
  userName: string;
  userEmail: string;
  department?: string;
  dsri: number;
  maturityLevel: number;
  maturityLabel: string;
  maturityColor: string;
  competencyScores: Record<string, number>;
  competencyNames: Record<string, string>;
  competencyMaxScores: Record<string, number>;
  certificateCode?: string;
  issuedAt: string;
  aiSummary?: string;
  aiFindings?: string[];
  aiAdvice?: string;
  aiNextSteps?: string[];
  courses?: { title: string; level: string; url?: string }[];
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function generateRadarSVG(
  codes: string[],
  scores: Record<string, number>,
  maxScores: Record<string, number>,
  names: Record<string, string>
): string {
  const cx = 220, cy = 200, r = 160;
  const n = codes.length;

  function pointsAt(radius: number): string {
    return codes
      .map((_, i) => {
        const p = polarToCartesian(cx, cy, radius, (360 / n) * i);
        return `${p.x},${p.y}`;
      })
      .join(" ");
  }

  function scorePoints(): string {
    return codes
      .map((code, i) => {
        const max = maxScores[code] || 50;
        const pct = (scores[code] || 0) / max;
        const p = polarToCartesian(cx, cy, r * pct, (360 / n) * i);
        return `${p.x},${p.y}`;
      })
      .join(" ");
  }

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridPolygons = gridLevels
    .map((lvl) => `<polygon points="${pointsAt(r * lvl)}" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>`)
    .join("\n");

  const axes = codes
    .map((_, i) => {
      const p = polarToCartesian(cx, cy, r, (360 / n) * i);
      return `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="#e5e7eb" stroke-width="0.5"/>`;
    })
    .join("\n");

  const labels = codes
    .map((code, i) => {
      const max = maxScores[code] || 50;
      const pct = Math.round(((scores[code] || 0) / max) * 100);
      const labelR = r + 28;
      const p = polarToCartesian(cx, cy, labelR, (360 / n) * i);
      const anchor = p.x < cx ? "end" : p.x > cx ? "start" : "middle";
      const dy = p.y < cy ? -4 : p.y > cy ? 8 : 4;
      return `
        <text x="${p.x}" y="${p.y + dy}" text-anchor="${anchor}" font-size="10" font-weight="700" fill="#374151">${code}</text>
        <text x="${p.x}" y="${p.y + dy + 13}" text-anchor="${anchor}" font-size="8" fill="#6b7280">${pct}%</text>
      `;
    })
    .join("\n");

  return `<svg width="440" height="400" viewBox="0 0 440 400" xmlns="http://www.w3.org/2000/svg">
    ${gridPolygons}
    ${axes}
    <polygon points="${scorePoints()}" fill="rgba(99,102,241,0.2)" stroke="#6366f1" stroke-width="2"/>
    ${codes
      .map((code, i) => {
        const max = maxScores[code] || 50;
        const pct = (scores[code] || 0) / max;
        const p = polarToCartesian(cx, cy, r * pct, (360 / n) * i);
        return `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#6366f1" stroke="#fff" stroke-width="1.5"/>`;
      })
      .join("\n")}
    ${labels}
  </svg>`;
}

function generateCircularProgress(score: number, color: string, size = 120): string {
  const r = 45;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="8"/>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="${color}" stroke-width="8"
      stroke-dasharray="${dash} ${circ}" stroke-linecap="round"
      transform="rotate(-90 60 60)" style="transition: stroke-dasharray 0.5s"/>
    <text x="60" y="56" text-anchor="middle" font-size="28" font-weight="800" fill="${color}">${Math.round(score)}</text>
    <text x="60" y="72" text-anchor="middle" font-size="10" fill="#9ca3af">/ 100</text>
  </svg>`;
}

function maturityBar(level: number, color: string): string {
  const levels = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
  return `<div style="display:flex;gap:4px;margin-top:8px;">
    ${levels
      .map(
        (c, i) =>
          `<div style="flex:1;height:10px;border-radius:${i === 0 ? "4px 0 0 4px" : i === 4 ? "0 4px 4px 0" : "0"};background:${i < level ? c : "#e5e7eb"}"></div>`
      )
      .join("")}
  </div>
  <div style="display:flex;justify-content:space-between;margin-top:4px;">
    ${[1, 2, 3, 4, 5].map((n) => `<span style="font-size:9px;color:#9ca3af;flex:1;text-align:center">L${n}</span>`).join("")}
  </div>`;
}

export function generateReportHTML(data: ReportData): string {
  const codes = Object.keys(data.competencyScores);
  const radarSVG = generateRadarSVG(codes, data.competencyScores, data.competencyMaxScores, data.competencyNames);

  const competencyRows = codes
    .map((code) => {
      const max = data.competencyMaxScores[code] || 50;
      const val = data.competencyScores[code] || 0;
      const pct = Math.round((val / max) * 100);
      const color = pct >= 70 ? "#22c55e" : pct >= 50 ? "#eab308" : pct >= 31 ? "#f97316" : "#ef4444";
      return `<tr>
        <td style="padding:6px 10px;font-weight:600;font-size:12px;color:#374151">${code}</td>
        <td style="padding:6px 10px;font-size:12px;color:#6b7280">${data.competencyNames[code] || code}</td>
        <td style="padding:6px 10px;font-size:12px;text-align:center;font-weight:600;color:${color}">${pct}%</td>
        <td style="padding:6px 10px"><div style="background:#f1f5f9;border-radius:4px;height:8px;width:100%"><div style="background:${color};border-radius:4px;height:8px;width:${pct}%"></div></div></td>
      </tr>`;
    })
    .join("");

  const coursesSection = data.courses?.length
    ? `
    <div style="margin-top:24px">
      <h3 style="font-size:14px;font-weight:700;color:#374151;margin-bottom:12px">Recommended Courses</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <tr style="background:#f8fafc"><th style="padding:6px 10px;text-align:left;color:#6b7280;font-weight:600">Course</th><th style="padding:6px 10px;text-align:left;color:#6b7280;font-weight:600;width:80px">Level</th></tr>
        ${data.courses!.slice(0, 5).map((c) => `<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:6px 10px;color:#374151">${c.title}</td><td style="padding:6px 10px;color:#6b7280">${c.level || "-"}</td></tr>`).join("")}
      </table>
    </div>`
    : "";

  const aiSection = data.aiSummary
    ? `
    <div style="margin-top:24px">
      <h3 style="font-size:14px;font-weight:700;color:#374151;margin-bottom:8px">AI-Powered Insights</h3>
      <p style="font-size:12px;color:#4b5563;line-height:1.6;margin-bottom:12px">${data.aiSummary}</p>
      ${data.aiFindings?.length ? `
        <div style="margin-bottom:12px">
          <h4 style="font-size:12px;font-weight:600;color:#374151;margin-bottom:6px">Key Findings</h4>
          <ul style="margin:0;padding-left:18px;font-size:11px;color:#4b5563;line-height:1.8">
            ${data.aiFindings.map((f) => `<li>${f}</li>`).join("")}
          </ul>
        </div>` : ""}
      ${data.aiNextSteps?.length ? `
        <div>
          <h4 style="font-size:12px;font-weight:600;color:#374151;margin-bottom:6px">Recommended Next Steps</h4>
          <ul style="margin:0;padding-left:18px;font-size:11px;color:#4b5563;line-height:1.8">
            ${data.aiNextSteps.map((s) => `<li>${s}</li>`).join("")}
          </ul>
        </div>` : ""}
    </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page { margin: 0; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; background: white; }
</style>
</head>
<body>
  <!-- PAGE 1 -->
  <div style="width:210mm;min-height:297mm;padding:20mm 18mm 15mm;display:flex;flex-direction:column">
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid ${data.maturityColor}">
      <div>
        <div style="font-size:20px;font-weight:800;color:#1f2937">Digital Skills Readiness Assessment Report</div>
        <div style="font-size:11px;color:#6b7280;margin-top:4px">Generated ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:14px;font-weight:700;color:#1f2937">${data.userName}</div>
        <div style="font-size:10px;color:#6b7280">${data.userEmail}</div>
        ${data.department ? `<div style="font-size:10px;color:#6b7280">${data.department}</div>` : ""}
      </div>
    </div>

    <!-- DSRI Score + Maturity -->
    <div style="display:flex;align-items:center;gap:30px;margin-bottom:24px;padding:20px;background:#f8fafc;border-radius:12px;border:1px solid #e5e7eb">
      <div style="text-align:center">
        ${generateCircularProgress(data.dsri, data.maturityColor)}
        <div style="font-size:11px;color:#6b7280;margin-top:4px">DSRI Score</div>
      </div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600;color:#6b7280;margin-bottom:4px">Maturity Level</div>
        <div style="font-size:22px;font-weight:800;color:${data.maturityColor}">L${data.maturityLevel} — ${data.maturityLabel}</div>
        ${maturityBar(data.maturityLevel, data.maturityColor)}
      </div>
    </div>

    <!-- Radar + Table side by side -->
    <div style="display:flex;gap:20px;flex:1">
      <div style="flex:0 0 380px">
        <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:8px">Competency Radar</div>
        ${radarSVG}
      </div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:8px">Score Breakdown</div>
        <table style="width:100%;border-collapse:collapse">
          <tr style="background:#f8fafc;border-bottom:2px solid #e5e7eb">
            <th style="padding:6px 10px;text-align:left;font-size:10px;color:#6b7280;font-weight:700">Code</th>
            <th style="padding:6px 10px;text-align:left;font-size:10px;color:#6b7280;font-weight:700">Competency</th>
            <th style="padding:6px 10px;text-align:center;font-size:10px;color:#6b7280;font-weight:700;width:50px">%</th>
            <th style="padding:6px 10px;font-size:10px;color:#6b7280;font-weight:700;width:100px">Level</th>
          </tr>
          ${competencyRows}
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top:auto;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:9px;color:#9ca3af">
      <span>Digital Skills Readiness Assessment · DSRA Platform</span>
      <span>Page 1 of ${data.aiSummary ? "2" : "1"}</span>
    </div>
  </div>

  ${data.aiSummary || data.courses?.length ? `
  <!-- PAGE 2 -->
  <div style="width:210mm;min-height:297mm;padding:20mm 18mm 15mm;display:flex;flex-direction:column">
    <div style="font-size:16px;font-weight:700;color:#1f2937;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #6366f1">Detailed Insights</div>

    ${aiSection}
    ${coursesSection}

    ${data.certificateCode ? `
    <div style="margin-top:auto;padding:16px;background:#fffbeb;border-radius:8px;border:1px solid #fde68a">
      <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:4px">Certificate Verification</div>
      <div style="font-size:10px;color:#78716c">Verify online: ${typeof window !== "undefined" ? window.location.origin : ""}/c/${data.certificateCode}</div>
      <div style="font-size:10px;color:#78716c;margin-top:2px">Issued: ${new Date(data.issuedAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</div>
    </div>` : ""}

    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:9px;color:#9ca3af">
      <span>Digital Skills Readiness Assessment · DSRA Platform</span>
      <span>Page 2 of 2</span>
    </div>
  </div>` : ""}
</body>
</html>`;
}
