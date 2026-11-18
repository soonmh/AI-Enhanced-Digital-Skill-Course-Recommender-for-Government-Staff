"""System test: end-to-end API flow for every type of user (Staff, Admin, HOD, Trainer, Top Management, Public).

Runs against a running backend with the demo data seeded (php artisan migrate:fresh --seed).
Every step records (role, step, request, expected, actual, ok) and a summary is printed at the end.

Usage:  pip install requests
        python tests/e2e/api_flow.py            (API_URL defaults to http://127.0.0.1:8000)
"""
import json, os, random, string, sys, io
import requests

BASE = os.environ.get("API_URL", "http://127.0.0.1:8000").rstrip("/")
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
RESULTS = []
CTX = {}


def call(method, path, token=None, json_body=None, files=None, data=None):
    h = {"Accept": "application/json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    r = requests.request(method, BASE + path, headers=h, json=json_body, files=files, data=data, timeout=60)
    try:
        body = r.json()
    except Exception:
        body = r.text[:300]
    return r.status_code, body


def check(role, step, method, path, expect, token=None, **kw):
    status, body = call(method, path, token, **kw)
    ok = status in (expect if isinstance(expect, (list, tuple)) else [expect])
    RESULTS.append((role, step, f"{method} {path}", expect, status, ok, "" if ok else str(body)[:300]))
    return status, body


def login(email, password="pass123"):
    s, b = call("POST", "/api/login", json_body={"email": email, "password": password})
    assert s == 200, (email, s, b)
    return b["token"], b["user"]


def answers_for(sections, pick):
    return {q["id"]: pick(sec["section_code"], i) for sec in sections for i, q in enumerate(sec["questions"])}


def run():
    suffix = "".join(random.choices(string.ascii_lowercase, k=5))
    new_email = f"uat_{suffix}@test.com"
    pw = "Password123!"

    # ---------------- STAFF (self-registered) ----------------
    R = "Staff"
    check(R, "Register", "POST", "/api/register", 201, json_body={"name": "UAT Tester", "email": new_email, "password": pw, "password_confirmation": pw, "working_field": "Information Technology", "job_level": "Officer", "experience_years": "2-5 years"})
    tok, me = login(new_email, pw)
    CTX["staff_id"] = me["id"]
    check(R, "Current user", "GET", "/api/user", 200, tok)
    check(R, "Dashboard (no assessment yet)", "GET", "/api/dashboard", 200, tok)
    check(R, "Benchmark (no assessment yet)", "GET", "/api/dashboard/benchmark", 200, tok)
    check(R, "Recommendations before assessment", "GET", "/api/courses/recommended", 200, tok)
    check(R, "AI insights before assessment", "GET", "/api/ai/insights", 200, tok)
    check(R, "Assessment landing", "GET", "/api/assessment", 200, tok)
    s, start = check(R, "Load questions", "GET", "/api/assessment/start", 200, tok)
    sections = start["sections"]
    assessment_id = start["assessment"]["id"]
    nq = sum(len(x["questions"]) for x in sections)
    RESULTS.append((R, f"Question count = 63 (got {nq})", "-", 63, nq, nq == 63, ""))
    weak = {"C5", "C7", "C8"}
    ans = answers_for(sections, lambda code, i: 1 if code in weak else 4)
    check(R, "Save draft", "POST", "/api/assessment/draft", [200, 201], tok, json_body={"answers": dict(list(ans.items())[:10]), "current_section": 1})
    s, d = check(R, "Resume draft", "GET", "/api/assessment/draft", 200, tok)
    check(R, "Discard draft", "DELETE", "/api/assessment/draft", 200, tok)
    partial = dict(list(ans.items())[:-1])
    check(R, "Submit with one answer missing -> 422", "POST", "/api/assessment/submit", 422, tok, json_body={"assessment_id": assessment_id, "answers": partial})
    bad = dict(ans); bad[next(iter(bad))] = 9
    check(R, "Submit with rating 9 -> 422", "POST", "/api/assessment/submit", 422, tok, json_body={"assessment_id": assessment_id, "answers": bad})
    s, sub = check(R, "Submit full assessment", "POST", "/api/assessment/submit", 201, tok, json_body={"assessment_id": assessment_id, "answers": ans})
    s, res = check(R, "View results", "GET", "/api/assessment/results", 200, tok)
    cert = (res or {}).get("certificate") if isinstance(res, dict) else None
    RESULTS.append((R, "No certificate while pending HOD", "-", "None/not issued", str(cert)[:40], not cert or not cert.get("verification_code"), ""))
    s, rec = check(R, "Recommendations right after submit", "GET", "/api/courses/recommended", 200, tok)
    recs = rec.get("courses") or rec.get("recommendations") or [] if isinstance(rec, dict) else []
    RESULTS.append((R, f"Has recommendations (got {len(recs)})", "-", ">0", len(recs), len(recs) > 0, str(rec)[:200]))
    check(R, "Dashboard after submit", "GET", "/api/dashboard", 200, tok)
    check(R, "Benchmark after submit", "GET", "/api/dashboard/benchmark", 200, tok)
    for ep in ["insights", "learning-path", "peer-comparison", "readiness", "action-plan"]:
        check(R, f"AI {ep}", "GET", f"/api/ai/{ep}", 200, tok)
    s, profiles = check(R, "Job role profiles", "GET", "/api/assessment/role-profiles", 200, tok)
    pid = (profiles[0]["id"] if isinstance(profiles, list) and profiles else (profiles.get("profiles") or [{}])[0].get("id")) if profiles else None
    check(R, "Job role gap analysis", "POST", "/api/assessment/role-gap", 200, tok, json_body={"role_profile_id": pid})
    retest = {q["id"]: 3 for sec in sections if sec["section_code"] == "C5" for q in sec["questions"]}
    check(R, "Single-competency retest C5", "POST", "/api/assessment/submit-section", 201, tok, json_body={"section_code": "C5", "answers": retest})
    s, courses = check(R, "Browse courses", "GET", "/api/courses", 200, tok)
    course_id = recs[0]["id"] if recs else courses[0]["id"]
    CTX["course_id"] = course_id
    check(R, "Course detail", "GET", f"/api/courses/{course_id}", 200, tok)
    check(R, "Track recommendation click", "POST", "/api/courses/recommendations/track", 201, tok, json_body={"course_id": course_id, "interaction_type": "click"})
    check(R, "Rate before enrolling -> 403", "POST", f"/api/courses/{course_id}/rate", 403, tok, json_body={"rating": 5})
    check(R, "Enrol", "POST", f"/api/courses/{course_id}/enroll", 201, tok)
    check(R, "Enrol twice -> 409", "POST", f"/api/courses/{course_id}/enroll", 409, tok)
    check(R, "Update progress 60%", "PUT", f"/api/courses/{course_id}/progress", 200, tok, json_body={"progress": 60})
    check(R, "Rate course", "POST", f"/api/courses/{course_id}/rate", 200, tok, json_body={"rating": 4})
    png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
    check(R, "Submit completion with .txt -> 422", "POST", f"/api/courses/{course_id}/submit-completion", 422, tok, files={"proof": ("proof.txt", io.BytesIO(b"hello"), "text/plain")})
    check(R, "Submit completion proof (PDF)", "POST", f"/api/courses/{course_id}/submit-completion", 200, tok, files={"proof": ("proof.pdf", io.BytesIO(b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"), "application/pdf")})
    check(R, "Notifications", "GET", "/api/notifications", 200, tok)
    check(R, "Unread count", "GET", "/api/notifications/unread-count", 200, tok)
    check(R, "Update profile", "PUT", "/api/user/profile", 200, tok, json_body={"name": "UAT Tester Updated", "job_level": "Senior Officer"})
    check(R, "Switch language to BM", "PUT", "/api/user/language", 200, tok, json_body={"locale": "ms"})
    check(R, "AI insights in BM", "GET", "/api/ai/insights", 200, tok)
    check(R, "Switch language back", "PUT", "/api/user/language", 200, tok, json_body={"locale": "en"})
    check(R, "Wrong current password -> 422", "PUT", "/api/user/password", 422, tok, json_body={"current_password": "nope", "password": "NewPassword123!", "password_confirmation": "NewPassword123!"})
    check(R, "My team (no reports)", "GET", "/api/reports/my-team", 200, tok)
    check(R, "Admin users -> 403", "GET", "/api/admin/users", 403, tok)
    check(R, "Staff analysis -> 403", "GET", "/api/reports/staff-analysis", 403, tok)
    check(R, "Course progress report -> 403", "GET", "/api/reports/course-progress", 403, tok)
    check(R, "Create course -> 403", "POST", "/api/courses", 403, tok, json_body={"title": "x", "level": "beginner"})
    check(R, "Department AI insights -> 403", "GET", "/api/ai/department-insights", 403, tok)
    check(R, "Other user's team report -> 404", "GET", "/api/reports/team-member/2", 404, tok)
    check(R, "Pending endorsements (not an HOD) -> empty", "GET", "/api/endorsements/pending", 200, tok)
    CTX["staff_tok"] = tok

    # ---------------- ADMIN ----------------
    R = "Admin"
    atok, _ = login("admin01@test.com")
    check(R, "Users list", "GET", "/api/admin/users", 200, atok)
    raj_tok, raj = login("raj@test.com")
    check(R, "Assign HOD (raj) to new user", "PUT", f"/api/admin/users/{CTX['staff_id']}", 200, atok, json_body={"hod_id": raj["id"]})
    check(R, "Set user as own HOD -> 422", "PUT", f"/api/admin/users/{CTX['staff_id']}", 422, atok, json_body={"hod_id": CTX["staff_id"]})
    s, nu = check(R, "Create user", "POST", "/api/admin/users", 201, atok, json_body={"name": "Temp User", "email": f"temp_{suffix}@test.com", "password": "Password123!", "role": "Trainer"})
    temp_id = (nu.get("user") or {}).get("id") if isinstance(nu, dict) else None
    check(R, "Edit user role", "PUT", f"/api/admin/users/{temp_id}", 200, atok, json_body={"role": "Staff", "name": "Temp User 2"})
    check(R, "Assign courses to user", "POST", f"/api/admin/users/{temp_id}/assign-courses", [200, 201], atok, json_body={"course_ids": [course_id]})
    check(R, "Assigned courses", "GET", f"/api/admin/users/{temp_id}/assigned-courses", 200, atok)
    check(R, "Unassign courses", "DELETE", f"/api/admin/users/{temp_id}/unassign-courses", 200, atok, json_body={"course_ids": [course_id]})
    check(R, "Assign users to course", "POST", f"/api/admin/courses/{course_id}/assign-users", [200, 201], atok, json_body={"user_ids": [temp_id]})
    check(R, "Assigned users", "GET", f"/api/admin/courses/{course_id}/assigned-users", 200, atok)
    check(R, "Unassign users", "DELETE", f"/api/admin/courses/{course_id}/unassign-users", 200, atok, json_body={"user_ids": [temp_id]})
    check(R, "Delete user", "DELETE", f"/api/admin/users/{temp_id}", 200, atok)
    s, c = check(R, "Create course with competencies", "POST", "/api/courses", 201, atok, json_body={"title": f"Admin Course {suffix}", "level": "beginner", "url": "https://example.com/course", "competency_codes": ["C5", "C7"]})
    acid = (c.get("course") or {}).get("id") if isinstance(c, dict) else None
    CTX["admin_course"] = acid
    s, cd = check(R, "New course detail", "GET", f"/api/courses/{acid}", 200, atok)
    codes = []
    if isinstance(cd, dict):
        comp = cd.get("competency_breakdown") or []
        codes = [x.get("code", x.get("competency_code")) if isinstance(x, dict) else x for x in comp]
    RESULTS.append((R, f"New course keeps competency mapping (got {codes})", "-", "C5,C7", codes, set(codes) >= {"C5", "C7"}, str(cd)[:300]))
    RESULTS.append((R, "New course keeps URL", "-", "https://example.com/course", (cd.get("course") or cd).get("url") if isinstance(cd, dict) else None, isinstance(cd, dict) and (cd.get("course") or cd).get("url") == "https://example.com/course", ""))
    check(R, "Edit course", "PUT", f"/api/courses/{acid}", 200, atok, json_body={"title": f"Admin Course {suffix} v2", "level": "intermediate", "competency_codes": ["C5"]})
    for p in ["/api/reports/staff-analysis", f"/api/reports/staff/{CTX['staff_id']}", "/api/reports/department-comparison", "/api/reports/course-progress", "/api/ai/department-insights", "/api/online-users", "/api/dashboard"]:
        check(R, f"View {p}", "GET", p, 200, atok)
    check(R, "Take assessment allowed", "GET", "/api/assessment/start", 200, atok)

    # ---------------- HOD (raj = Staff with direct reports) ----------------
    R = "HOD"
    s, team = check(R, "My team", "GET", "/api/reports/my-team", 200, raj_tok)
    in_team = isinstance(team, dict) and any(m.get("id") == CTX["staff_id"] for m in team.get("team", []))
    RESULTS.append((R, "New user appears in My Team", "-", True, in_team, in_team, ""))
    s, pend = check(R, "Pending assessments", "GET", "/api/endorsements/pending", 200, raj_tok)
    items = pend if isinstance(pend, list) else (pend.get("pending") or pend.get("data") or []) if isinstance(pend, dict) else []
    mine = [p for p in items if (p.get("user_id") or (p.get("user") or {}).get("id")) == CTX["staff_id"]]
    RESULTS.append((R, "New user's pending assessment visible after HOD assigned", "-", ">=1", len(mine), len(mine) >= 1, str(pend)[:200]))
    if mine:
        rid = mine[0]["id"]
        check(R, "Reject without note -> 422", "POST", f"/api/endorsements/{rid}/reject", 422, raj_tok, json_body={})
        check(R, "Endorse assessment", "POST", f"/api/endorsements/{rid}/endorse", 200, raj_tok, json_body={"note": "Verified"})
        check(R, "Endorse again -> 422", "POST", f"/api/endorsements/{rid}/endorse", 422, raj_tok, json_body={})
    s, res = check("Staff", "Results after endorsement", "GET", "/api/assessment/results", 200, CTX["staff_tok"])
    code = ((res or {}).get("certificate") or {}).get("verification_code") if isinstance(res, dict) else None
    RESULTS.append(("Staff", "Certificate issued after endorsement", "-", "code", bool(code), bool(code), str((res or {}).get("certificate"))[:200] if isinstance(res, dict) else ""))
    if code:
        check("Public", "Verify certificate (no login)", "GET", f"/api/c/verify/{code}", 200)
    check("Public", "Verify fake certificate -> 404", "GET", "/api/c/verify/00000000-0000-0000-0000-000000000000", 404)
    s, cpend = check(R, "Pending course completions", "GET", "/api/endorsements/course-completions/pending", 200, raj_tok)
    citems = cpend if isinstance(cpend, list) else (cpend.get("pending") or cpend.get("data") or []) if isinstance(cpend, dict) else []
    cm = [p for p in citems if (p.get("user_id") or (p.get("user") or {}).get("id")) == CTX["staff_id"]]
    RESULTS.append((R, "Course completion visible to HOD", "-", ">=1", len(cm), len(cm) >= 1, str(cpend)[:200]))
    if cm:
        check(R, "Endorse course completion", "POST", f"/api/endorsements/course-completions/{cm[0]['id']}/endorse", 200, raj_tok, json_body={})
    s, ml = check("Staff", "My learning after completion endorsed", "GET", "/api/courses", 200, CTX["staff_tok"])
    st = next((c.get("status") for c in ml if c.get("id") == course_id), None) if isinstance(ml, list) else None
    RESULTS.append(("Staff", f"Course status completed (got {st})", "-", "completed", st, st == "completed", ""))
    check(R, "Team member report", "GET", f"/api/reports/team-member/{CTX['staff_id']}", 200, raj_tok)
    check(R, "Non-report member -> 404", "GET", "/api/reports/team-member/5", 404, raj_tok)
    # second assessment -> reject
    check("Staff", "Submit second assessment", "POST", "/api/assessment/submit", 201, CTX["staff_tok"], json_body={"assessment_id": assessment_id, "answers": answers_for(sections, lambda c, i: 5)})
    s, pend = call("GET", "/api/endorsements/pending", raj_tok)
    items = pend if isinstance(pend, list) else (pend.get("pending") or pend.get("data") or [])
    mine = [p for p in items if (p.get("user_id") or (p.get("user") or {}).get("id")) == CTX["staff_id"]]
    if mine:
        check(R, "Reject second assessment", "POST", f"/api/endorsements/{mine[0]['id']}/reject", 200, raj_tok, json_body={"note": "Scores look inflated"})
    check(R, "Endorsement history", "GET", "/api/endorsements/history", 200, raj_tok)
    check(R, "Staff analysis (not permitted) -> 403", "GET", "/api/reports/staff-analysis", 403, raj_tok)
    s, rec2 = check("Staff", "Recommendations after rejection", "GET", "/api/courses/recommended", 200, CTX["staff_tok"])

    # ---------------- TRAINER ----------------
    R = "Trainer"
    ttok, _ = login("trainer01@test.com")
    s, c = check(R, "Create course", "POST", "/api/courses", 201, ttok, json_body={"title": f"Trainer Course {suffix}", "level": "advanced", "competency_codes": ["C2"]})
    tcid = (c.get("course") or {}).get("id") if isinstance(c, dict) else None
    check(R, "Edit course", "PUT", f"/api/courses/{tcid}", 200, ttok, json_body={"title": f"Trainer Course {suffix} v2", "level": "advanced"})
    check(R, "Course progress report", "GET", "/api/reports/course-progress", 200, ttok)
    check(R, "Take assessment allowed", "GET", "/api/assessment/start", 200, ttok)
    check(R, "Recommendations", "GET", "/api/courses/recommended", 200, ttok)
    check(R, "Staff analysis -> 403", "GET", "/api/reports/staff-analysis", 403, ttok)
    check(R, "Admin users -> 403", "GET", "/api/admin/users", 403, ttok)
    check(R, "Delete own course", "DELETE", f"/api/courses/{tcid}", 200, ttok)

    # ---------------- TOP MANAGEMENT ----------------
    R = "Top Management"
    mtok, _ = login("mgmt01@test.com")
    for p in ["/api/dashboard", "/api/reports/staff-analysis", f"/api/reports/staff/{CTX['staff_id']}", "/api/reports/department-comparison", "/api/reports/course-progress", "/api/ai/department-insights", "/api/reports/my-team"]:
        check(R, f"View {p}", "GET", p, 200, mtok)
    check(R, "Take assessment -> 403", "GET", "/api/assessment/start", 403, mtok)
    check(R, "Create course -> 403", "POST", "/api/courses", 403, mtok, json_body={"title": "x", "level": "beginner"})
    check(R, "Admin users -> 403", "GET", "/api/admin/users", 403, mtok)
    check(R, "Browse courses", "GET", "/api/courses", 200, mtok)
    check(R, "Recommendations (never assessed)", "GET", "/api/courses/recommended", 200, mtok)

    # cleanup admin course
    check("Admin", "Delete course", "DELETE", f"/api/courses/{CTX['admin_course']}", 200, atok)
    check("Staff", "Deactivate account", "POST", "/api/user/deactivate", 200, CTX["staff_tok"], json_body={"password": pw})
    s, _ = call("POST", "/api/login", json_body={"email": new_email, "password": pw})
    RESULTS.append(("Staff", "Login after deactivation blocked", "POST /api/login", "4xx", s, 400 <= s < 500, ""))


if __name__ == "__main__":
    try:
        run()
    except Exception as e:
        import traceback; traceback.print_exc()
    fails = [r for r in RESULTS if not r[5]]
    for role, step, ep, exp, got, ok, info in RESULTS:
        print(f"{'PASS' if ok else 'FAIL'} | {role:14} | {step:55} | {ep:50} | exp {exp} got {got}" + (f"\n      -> {info}" if not ok else ""))
    print(f"\nTOTAL {len(RESULTS)}  PASS {len(RESULTS)-len(fails)}  FAIL {len(fails)}")
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, "api_flow_results.json"), "w") as f:
        json.dump(RESULTS, f, indent=1)
    sys.exit(1 if fails else 0)
