// System test: end-to-end browser flow across the types of user (Staff, Admin, HOD, Public, Trainer, Top Management).
// Needs the frontend and backend running with the demo data seeded; uses Puppeteer from frontend/node_modules.
// Usage: node tests/e2e/ui_flow.cjs   (APP_URL defaults to http://localhost:3000, API_URL to http://127.0.0.1:8000)
const path = require("path");
const fs = require("fs");
const { createRequire } = require("module");
const puppeteer = createRequire(path.join(__dirname, "..", "..", "frontend", "package.json"))("puppeteer");
const BASE = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
const API = (process.env.API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const OUT = path.join(__dirname, "output", "ui_flow_screenshots");
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const rec = (role, step, ok, info = "") => { results.push({ role, step, ok, info }); console.log(`${ok ? "PASS" : "FAIL"} | ${role.padEnd(8)} | ${step}${info ? "  -> " + info : ""}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const suffix = Math.random().toString(36).slice(2, 7);
const email = `uiflow_${suffix}@test.com`;
const PW = "Password123!";

async function apiLogin(e, p = "pass123") {
  const r = await fetch(API + "/api/login", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ email: e, password: p }) });
  return (await r.json()).token;
}
async function api(method, path, token, body) {
  const r = await fetch(API + path, { method, headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}

async function newSession(browser, label) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  page.errors = []; page.bad = [];
  page.on("pageerror", (e) => page.errors.push(String(e).slice(0, 200)));
  page.on("response", (res) => { const u = res.url(); if (u.includes("/api/") && !u.includes("/api/auth/") && res.status() >= 400) page.bad.push(`${res.status()} ${u.replace(BASE, "")}`); });
  page.label = label;
  return { ctx, page };
}
async function login(page, e, p = "pass123") {
  await page.goto(BASE + "/login", { waitUntil: "networkidle2", timeout: 180000 });
  await page.type("#email", e); await page.type("#password", p);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 180000 }).catch(() => {}), page.click('button[type="submit"]')]);
  await sleep(1000);
}
async function clickText(page, text, tag = "button") {
  const ok = await page.evaluate((text, tag) => {
    const el = [...document.querySelectorAll(tag)].find((b) => b.textContent.trim() === text || b.textContent.trim().startsWith(text));
    if (!el) return false; el.scrollIntoView(); el.click(); return true;
  }, text, tag);
  return ok;
}
async function shot(page, name) { await page.screenshot({ path: `${OUT}/${name}.png` }); }
async function bodyText(page) { return page.evaluate(() => document.body.innerText); }

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  try {
    // ---------- STAFF: register + assessment ----------
    let { ctx, page } = await newSession(browser, "Staff");
    await page.goto(BASE + "/register", { waitUntil: "networkidle2", timeout: 180000 });
    await page.type("#name", "UI Flow Tester"); await page.type("#email", email); await page.type("#password", PW); await page.type("#password_confirmation", PW);
    await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => {}), page.click('button[type="submit"]')]);
    await sleep(1500);
    rec("Staff", "Register via UI", !page.url().includes("/register"), page.url().replace(BASE, ""));
    if (!page.url().includes("/dashboard")) await login(page, email, PW);
    rec("Staff", "Lands on dashboard", page.url().includes("/dashboard"), page.url().replace(BASE, ""));
    const side = await page.evaluate(() => document.querySelector("aside").innerText);
    rec("Staff", "Sidebar shows Assessments + Courses", /Assessment/i.test(side) && /Courses/i.test(side), side.replace(/\n/g, " | "));

    await page.goto(BASE + "/assessment/start", { waitUntil: "networkidle2", timeout: 180000 });
    await sleep(1500);
    const weak = new Set([4, 6, 7]); // C5, C7, C8 (0-based section index)
    for (let sec = 0; sec < 10; sec++) {
      const val = weak.has(sec) ? "1" : "4";
      const n = await page.evaluate((val) => {
        const btns = [...document.querySelectorAll("button[title]")].filter((b) => b.textContent.trim() === val);
        btns.forEach((b) => b.click()); return btns.length;
      }, val);
      await sleep(300);
      if (sec < 9) await clickText(page, "Next");
      await sleep(400);
      if (n === 0) rec("Staff", `Section ${sec + 1} had no rating buttons`, false);
    }
    await shot(page, "staff_before_submit");
    await clickText(page, "Submit Assessment");
    await sleep(800);
    const confirmOk = await page.evaluate(() => { const b = [...document.querySelectorAll('[role="dialog"] button')].find((x) => x.textContent.trim() === "Submit"); if (b) { b.click(); return true; } return false; });
    rec("Staff", "Confirm dialog appears after all 63 answered", confirmOk);
    await sleep(4000);
    await shot(page, "staff_after_submit");
    await clickText(page, "OK");
    await sleep(3000);
    rec("Staff", "Redirected to results after submit", page.url().includes("/assessment/results"), page.url().replace(BASE, ""));
    let txt = await bodyText(page);
    rec("Staff", "Results mention pending HOD endorsement", /pending|endorse/i.test(txt), (txt.match(/.{0,60}(pending|endorse).{0,60}/i) || [""])[0]);

    await page.goto(BASE + "/courses/recommended", { waitUntil: "networkidle2", timeout: 180000 }); await sleep(2000);
    await shot(page, "staff_recommended");
    const firstCourse = await page.evaluate(() => { const a = [...document.querySelectorAll("a")].find((x) => x.textContent.includes("View Course")); return a ? a.getAttribute("href") : null; });
    rec("Staff", "Recommended page lists courses", !!firstCourse, firstCourse || "none");

    await page.goto(BASE + (firstCourse || "/courses/1"), { waitUntil: "networkidle2", timeout: 180000 }); await sleep(1500);
    rec("Staff", "Enroll button works", await clickText(page, "Enroll Now"));
    await sleep(2000);
    await page.reload({ waitUntil: "networkidle2" }); await sleep(1500);
    await page.focus('input[type="range"]'); await page.keyboard.press("End"); await sleep(2000);
    await page.reload({ waitUntil: "networkidle2" }); await sleep(1500);
    const fileInput = await page.$('input[type="file"]');
    rec("Staff", "Proof upload field visible after enrol", !!fileInput);
    if (fileInput) {
      const proof = path.join(OUT, "proof.pdf");
      fs.writeFileSync(proof, "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");
      await fileInput.uploadFile(proof); await sleep(500);
      rec("Staff", "Submit for Endorsement clicked", await clickText(page, "Submit for Endorsement"));
      await sleep(2500);
      txt = await bodyText(page);
      rec("Staff", "Course shows pending endorsement", /pending|awaiting/i.test(txt));
    }
    await shot(page, "staff_course_detail");
    await page.goto(BASE + "/courses/list", { waitUntil: "networkidle2", timeout: 180000 }); await sleep(1000);
    rec("Staff", "Course list makes no forbidden admin call", !page.bad.some((b) => b.includes("/api/admin/users")), page.bad.join(","));
    rec("Staff", "No JS page errors", page.errors.length === 0, page.errors.join(" || "));
    await ctx.close();

    // ---------- ADMIN assigns HOD (API) ----------
    const adminTok = await apiLogin("admin01@test.com");
    const users = (await api("GET", "/api/admin/users", adminTok)).body;
    const list = Array.isArray(users) ? users : users.users || users.data || [];
    const me = list.find((u) => u.email === email);
    const raj = list.find((u) => u.email === "raj@test.com");
    const r = await api("PUT", `/api/admin/users/${me.id}`, adminTok, { hod_id: raj.id });
    rec("Admin", "Assign HOD to new user", r.status === 200, String(r.status));

    // ---------- HOD: endorse via UI ----------
    ({ ctx, page } = await newSession(browser, "HOD"));
    await login(page, "raj@test.com");
    await page.goto(BASE + "/my-team", { waitUntil: "networkidle2", timeout: 180000 }); await sleep(2000);
    await shot(page, "hod_my_team");
    txt = await bodyText(page);
    rec("HOD", "Pending queue shows new user", txt.includes("UI Flow Tester"));
    const endorsedCount = await page.evaluate(() => { const b = [...document.querySelectorAll("button")].filter((x) => x.textContent.trim() === "Endorse"); b.forEach((x) => x.click()); return b.length; });
    rec("HOD", `Endorse buttons clicked (${endorsedCount})`, endorsedCount >= 2, "expects assessment + course completion");
    await sleep(3000);
    await page.reload({ waitUntil: "networkidle2" }); await sleep(1500);
    await shot(page, "hod_after_endorse");
    rec("HOD", "No JS page errors", page.errors.length === 0, page.errors.join(" || "));
    await ctx.close();

    // ---------- STAFF: certificate ----------
    ({ ctx, page } = await newSession(browser, "Staff"));
    await login(page, email, PW);
    await page.goto(BASE + "/assessment/results", { waitUntil: "networkidle2", timeout: 180000 }); await sleep(2000);
    await shot(page, "staff_results_endorsed");
    const staffTok = await apiLogin(email, PW);
    const res = (await api("GET", "/api/assessment/results", staffTok)).body;
    const code = res && res.certificate && res.certificate.verification_code;
    rec("Staff", "Certificate issued after HOD endorsement", !!code);
    if (code) {
      const pub = await browser.createBrowserContext(); const pp = await pub.newPage();
      await pp.goto(`${BASE}/c/${code}`, { waitUntil: "networkidle2", timeout: 180000 }); await sleep(1500);
      const t = await pp.evaluate(() => document.body.innerText);
      await pp.screenshot({ path: `${OUT}/public_certificate.png` });
      rec("Public", "Certificate page opens without login", t.includes("UI Flow Tester"), t.slice(0, 120).replace(/\n/g, " "));
      await pub.close();
    }
    await ctx.close();

    // ---------- TRAINER: create + edit course via UI ----------
    ({ ctx, page } = await newSession(browser, "Trainer"));
    await login(page, "trainer01@test.com");
    const tside = await page.evaluate(() => document.querySelector("aside").innerText);
    rec("Trainer", "Sidebar shows Assessments", /Assessment/i.test(tside), tside.replace(/\n/g, " | "));
    await page.goto(BASE + "/courses/create", { waitUntil: "networkidle2", timeout: 180000 }); await sleep(1000);
    await page.type("#title", `UI Course ${suffix}`);
    await page.type("#working_field", "Finance");
    await page.type("#url", "https://example.com/ui-course");
    await clickText(page, "Create Course"); await sleep(1000);
    txt = await bodyText(page);
    rec("Trainer", "Blocks save when no competency selected", /Select at least one competency/i.test(txt));
    await page.evaluate(() => { [...document.querySelectorAll('label')].filter((l) => /^(C5|C7) /.test(l.innerText.trim())).forEach((l) => l.querySelector("input").click()); });
    await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => {}), clickText(page, "Create Course")]);
    await sleep(1500);
    rec("Trainer", "Create redirects to course list", page.url().includes("/courses/list"), page.url().replace(BASE, ""));
    const ttok = await apiLogin("trainer01@test.com");
    const all = (await api("GET", "/api/courses", ttok)).body;
    const mine = all.find((c) => c.title === `UI Course ${suffix}`);
    rec("Trainer", "Course saved", !!mine);
    if (mine) {
      const d = (await api("GET", `/api/courses/${mine.id}`, ttok)).body;
      const codes = (d.competency_breakdown || []).map((c) => c.code).sort().join(",");
      rec("Trainer", "Competencies saved (C5,C7)", codes === "C5,C7", codes);
      rec("Trainer", "URL + working field saved", d.url === "https://example.com/ui-course" && d.working_field === "Finance", `${d.url} / ${d.working_field}`);
      await page.goto(`${BASE}/courses/${mine.id}/edit`, { waitUntil: "networkidle2", timeout: 180000 }); await sleep(1500);
      const pre = await page.evaluate(() => ({
        wf: document.querySelector("#working_field").value, url: document.querySelector("#url").value,
        checked: [...document.querySelectorAll("label")].filter((l) => l.querySelector('input[type="checkbox"]')?.checked).map((l) => l.innerText.trim().split(" ")[0]),
      }));
      rec("Trainer", "Edit form pre-filled (field, URL, competencies)", pre.wf === "Finance" && pre.url.includes("ui-course") && pre.checked.join(",") === "C5,C7", JSON.stringify(pre));
      await page.evaluate(() => { [...document.querySelectorAll("label")].find((l) => l.innerText.trim().startsWith("C7 ")).querySelector("input").click(); });
      await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => {}), clickText(page, "Save Changes")]);
      await sleep(1500);
      const d2 = (await api("GET", `/api/courses/${mine.id}`, ttok)).body;
      rec("Trainer", "Edit saved: C5 only, working field kept", (d2.competency_breakdown || []).map((c) => c.code).join(",") === "C5" && d2.working_field === "Finance", `${(d2.competency_breakdown || []).map((c) => c.code)} / ${d2.working_field}`);
      await api("DELETE", `/api/courses/${mine.id}`, ttok);
    }
    rec("Trainer", "No JS page errors", page.errors.length === 0, page.errors.join(" || "));
    await ctx.close();

    // ---------- ADMIN / TOP MANAGEMENT report pages ----------
    for (const [role, em, path] of [["Admin", "admin01@test.com", "/staff-analysis/2"], ["Top Mgmt", "mgmt01@test.com", "/my-team/7"]]) {
      ({ ctx, page } = await newSession(browser, role));
      await login(page, em);
      await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 180000 }); await sleep(1500);
      txt = await bodyText(page);
      rec(role, `${path} shows no NaN`, !txt.includes("NaN"));
      await ctx.close();
    }
  } catch (e) {
    rec("SCRIPT", "crashed", false, String(e).slice(0, 300));
  }
  await browser.close();
  const fails = results.filter((r) => !r.ok);
  console.log(`\nTOTAL ${results.length} PASS ${results.length - fails.length} FAIL ${fails.length}`);
  fs.writeFileSync(path.join(OUT, "..", "ui_flow_results.json"), JSON.stringify(results, null, 2));
  process.exitCode = fails.length ? 1 : 0;
})();
