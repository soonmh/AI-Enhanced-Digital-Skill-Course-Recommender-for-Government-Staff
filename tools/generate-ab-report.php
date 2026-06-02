<?php
/**
 * Standalone A/B Test Report Generator
 *
 * Usage: php tools/generate-ab-report.php > ab-report.html
 * Then open ab-report.html in a browser.
 */

// ── Bootstrap Database Connection ──────────────────────────────────

require_once __DIR__ . '/../backend/vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;

$envPath = __DIR__ . '/../backend/.env';
if (!file_exists($envPath)) {
    fwrite(STDERR, "Error: backend/.env not found at $envPath\n");
    exit(1);
}

$envLines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($envLines as $line) {
    if (str_starts_with($line, '#') || !str_contains($line, '=')) continue;
    [$key, $value] = explode('=', $line, 2);
    putenv(trim($key) . '=' . trim($value));
}

try {
    $capsule = new Capsule;
    $capsule->addConnection([
        'driver'   => getenv('DB_CONNECTION') ?: 'pgsql',
        'host'     => getenv('DB_HOST') ?: '127.0.0.1',
        'port'     => getenv('DB_PORT') ?: '5432',
        'database' => getenv('DB_DATABASE') ?: 'fyp_digital_skills',
        'username' => getenv('DB_USERNAME') ?: 'postgres',
        'password' => getenv('DB_PASSWORD') ?: '',
        'charset'  => 'utf8',
    ]);
    $capsule->setAsGlobal();
    $capsule->bootEloquent();
} catch (\Throwable $e) {
    echo buildErrorHtml('Database Setup Failed', $e->getMessage());
    exit(1);
}

// ── Query Data ─────────────────────────────────────────────────────

try {
    $totalInteractions = Capsule::table('recommendation_interactions')
        ->whereIn('ab_group', ['control', 'hybrid'])
        ->count();

    $dateRange = Capsule::table('recommendation_interactions')
        ->whereIn('ab_group', ['control', 'hybrid'])
        ->selectRaw('MIN(created_at) AS earliest, MAX(created_at) AS latest')
        ->first();
} catch (\Throwable $e) {
    echo buildErrorHtml('Database Connection Failed', $e->getMessage());
    exit(1);
}

if ($totalInteractions === 0) {
    echo buildNoDataHtml();
    exit(0);
}

// Query 1: Funnel per group
$funnel = Capsule::table('recommendation_interactions')
    ->whereIn('ab_group', ['control', 'hybrid'])
    ->selectRaw("
        ab_group,
        COUNT(CASE WHEN interaction_type = 'impression' THEN 1 END) AS impressions,
        COUNT(CASE WHEN interaction_type = 'click' THEN 1 END) AS clicks,
        COUNT(CASE WHEN interaction_type = 'enroll' THEN 1 END) AS enrollments,
        COUNT(CASE WHEN interaction_type = 'complete' THEN 1 END) AS completions
    ")
    ->groupBy('ab_group')
    ->get()
    ->keyBy('ab_group')
    ->toArray();

// Query 2: Unique users
$uniqueUsers = Capsule::table('recommendation_interactions')
    ->whereIn('ab_group', ['control', 'hybrid'])
    ->selectRaw('ab_group, COUNT(DISTINCT user_id) AS unique_users')
    ->groupBy('ab_group')
    ->get()
    ->keyBy('ab_group')
    ->toArray();

// Query 3: Time series
$timeSeries = Capsule::table('recommendation_interactions')
    ->whereIn('ab_group', ['control', 'hybrid'])
    ->selectRaw("
        DATE(created_at) AS date,
        ab_group,
        COUNT(CASE WHEN interaction_type = 'impression' THEN 1 END) AS impressions,
        COUNT(CASE WHEN interaction_type = 'click' THEN 1 END) AS clicks,
        COUNT(CASE WHEN interaction_type = 'enroll' THEN 1 END) AS enrollments
    ")
    ->groupByRaw('DATE(created_at), ab_group')
    ->orderByRaw('DATE(created_at) ASC')
    ->get();

// Query 4: Top courses
$topCourses = Capsule::table('recommendation_interactions AS ri')
    ->join('courses AS c', 'c.id', '=', 'ri.course_id')
    ->whereIn('ri.ab_group', ['control', 'hybrid'])
    ->selectRaw("
        ri.ab_group,
        ri.course_id,
        c.title,
        COUNT(CASE WHEN ri.interaction_type = 'click' THEN 1 END) AS clicks,
        COUNT(CASE WHEN ri.interaction_type = 'enroll' THEN 1 END) AS enrollments
    ")
    ->groupByRaw('ri.ab_group, ri.course_id, c.title')
    ->orderByRaw('ri.ab_group, clicks DESC')
    ->get();

// Query 5: Position CTR
$positionData = Capsule::table('recommendation_interactions')
    ->whereIn('ab_group', ['control', 'hybrid'])
    ->whereNotNull('metadata')
    ->whereRaw("metadata->>'position' IS NOT NULL")
    ->selectRaw("
        ab_group,
        (metadata->>'position')::int AS position,
        COUNT(CASE WHEN interaction_type = 'impression' THEN 1 END) AS impressions,
        COUNT(CASE WHEN interaction_type = 'click' THEN 1 END) AS clicks
    ")
    ->groupByRaw("ab_group, (metadata->>'position')::int")
    ->orderByRaw('position ASC')
    ->get();

// ── Compute Metrics ────────────────────────────────────────────────

function safeRate($num, $denom): float
{
    return $denom > 0 ? round(($num / $denom) * 100, 2) : 0;
}

function safePctChange($new, $old): ?float
{
    if ($old == 0) return null;
    return round((($new - $old) / $old) * 100, 2);
}

function fmtDelta(?float $val): string
{
    if ($val === null) return '<td style="color:#94A3B8">N/A</td>';
    $color = $val > 0 ? '#10B981' : ($val < 0 ? '#EF4444' : '#64748B');
    $sign = $val > 0 ? '+' : '';
    return '<td style="color:' . $color . ';font-weight:600">' . $sign . $val . '%</td>';
}

$control = $funnel['control'] ?? null;
$hybrid  = $funnel['hybrid'] ?? null;

$cImp = $control->impressions ?? 0;  $hImp = $hybrid->impressions ?? 0;
$cClk = $control->clicks ?? 0;       $hClk = $hybrid->clicks ?? 0;
$cEnr = $control->enrollments ?? 0;  $hEnr = $hybrid->enrollments ?? 0;
$cCmp = $control->completions ?? 0;  $hCmp = $hybrid->completions ?? 0;

$cCtr   = safeRate($cClk, $cImp);    $hCtr   = safeRate($hClk, $hImp);
$cConv  = safeRate($cEnr, $cImp);    $hConv  = safeRate($hEnr, $hImp);
$cComp  = safeRate($cCmp, $cEnr);    $hComp  = safeRate($hCmp, $hEnr);

$deltaCtr  = safePctChange($hCtr, $cCtr);
$deltaConv = safePctChange($hConv, $cConv);

$cUsers = $uniqueUsers['control']->unique_users ?? 0;
$hUsers = $uniqueUsers['hybrid']->unique_users ?? 0;

// Time series chart data
$dates = $timeSeries->pluck('date')->unique()->sort()->values();
$controlDaily = $timeSeries->where('ab_group', 'control')->keyBy('date');
$hybridDaily  = $timeSeries->where('ab_group', 'hybrid')->keyBy('date');

$chartTimeLabels = json_encode($dates->map(fn($d) => date('M d', strtotime($d)))->values()->toArray());
$chartControlClicks = json_encode($dates->map(fn($d) => ($controlDaily[$d]->clicks ?? 0) + ($controlDaily[$d]->enrollments ?? 0))->values()->toArray());
$chartHybridClicks  = json_encode($dates->map(fn($d) => ($hybridDaily[$d]->clicks ?? 0) + ($hybridDaily[$d]->enrollments ?? 0))->values()->toArray());

// Position chart data
$positions = $positionData->pluck('position')->unique()->sort()->values();
$posControl = $positionData->where('ab_group', 'control');
$posHybrid  = $positionData->where('ab_group', 'hybrid');
$chartPosLabels = json_encode($positions->map(fn($p) => 'Position ' . ($p + 1))->values()->toArray());
$chartPosCtrC = json_encode($positions->map(function ($p) use ($posControl) {
    $row = $posControl->firstWhere('position', $p);
    return $row ? safeRate($row->clicks, $row->impressions) : 0;
})->values()->toArray());
$chartPosCtrH = json_encode($positions->map(function ($p) use ($posHybrid) {
    $row = $posHybrid->firstWhere('position', $p);
    return $row ? safeRate($row->clicks, $row->impressions) : 0;
})->values()->toArray());

// Top courses per group
$topControlCourses = $topCourses->where('ab_group', 'control')->take(10)->values();
$topHybridCourses  = $topCourses->where('ab_group', 'hybrid')->take(10)->values();

// Delta badge HTML
$ctrBadge = $deltaCtr !== null
    ? '<span class="delta ' . ($deltaCtr > 0 ? 'up' : 'down') . '">' . ($deltaCtr > 0 ? '+' : '') . $deltaCtr . '% vs control</span>'
    : '<span class="delta">N/A</span>';
$convBadge = $deltaConv !== null
    ? '<span class="delta ' . ($deltaConv > 0 ? 'up' : 'down') . '">' . ($deltaConv > 0 ? '+' : '') . $deltaConv . '% vs control</span>'
    : '<span class="delta">N/A</span>';

// ── Build HTML ─────────────────────────────────────────────────────

$generated = date('Y-m-d H:i:s');
$earliest  = $dateRange->earliest ? date('Y-m-d', strtotime($dateRange->earliest)) : 'N/A';
$latest    = $dateRange->latest   ? date('Y-m-d', strtotime($dateRange->latest))   : 'N/A';

?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>A/B Test Report — Hybrid Recommendation Engine</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:#F8FAFC;color:#1E293B;line-height:1.6}
.container{max-width:1100px;margin:0 auto;padding:2rem 1.5rem}
header{background:linear-gradient(135deg,#0F172A 0%,#1E3A5F 100%);color:#fff;padding:2.5rem 0;margin-bottom:2rem;border-radius:0 0 1rem 1rem}
header .container{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem}
header h1{font-size:1.5rem;font-weight:700}
header .meta{font-size:.875rem;opacity:.8;text-align:right}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;margin-bottom:2rem}
.card{background:#fff;border-radius:.75rem;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.card .label{font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:#64748B;margin-bottom:.25rem}
.card .value{font-size:1.75rem;font-weight:700}
.card .sub{font-size:.8rem;color:#64748B;margin-top:.25rem}
.card .delta{font-size:.8rem;margin-top:.25rem;font-weight:600}
.delta.up{color:#10B981}
.delta.down{color:#EF4444}
.section{background:#fff;border-radius:.75rem;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,.1);margin-bottom:1.5rem}
.section h2{font-size:1.1rem;font-weight:600;margin-bottom:1rem;padding-bottom:.5rem;border-bottom:1px solid #E2E8F0}
.chart-row{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
@media(max-width:768px){.chart-row{grid-template-columns:1fr}}
.chart-container{position:relative;width:100%;height:320px}
.legend{display:flex;gap:1.5rem;margin-bottom:.75rem;font-size:.85rem}
.legend span{display:flex;align-items:center;gap:.4rem}
.legend .dot{width:12px;height:12px;border-radius:3px;display:inline-block}
table{width:100%;border-collapse:collapse;font-size:.875rem}
th,td{padding:.6rem .75rem;text-align:left;border-bottom:1px solid #E2E8F0}
th{background:#F1F5F9;font-weight:600;font-size:.8rem;text-transform:uppercase;letter-spacing:.03em}
tr:hover td{background:#F8FAFC}
.tables-row{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
@media(max-width:768px){.tables-row{grid-template-columns:1fr}}
.tag{display:inline-block;padding:.15rem .5rem;border-radius:9999px;font-size:.75rem;font-weight:600}
.tag-blue{background:#DBEAFE;color:#1D4ED8}
.tag-green{background:#D1FAE5;color:#065F46}
footer{text-align:center;padding:2rem 0 1rem;font-size:.8rem;color:#94A3B8}
@media print{
    body{background:#fff}
    .section,.card{box-shadow:none;border:1px solid #E2E8F0;break-inside:avoid}
    header{background:#1E293B!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style>
</head>
<body>
<header>
  <div class="container">
    <div>
      <h1>A/B Test Report</h1>
      <p style="opacity:.7;margin-top:.25rem">Hybrid Recommendation Engine vs. Control Algorithm</p>
    </div>
    <div class="meta">
      <div>Data: <?php echo $earliest; ?> — <?php echo $latest; ?></div>
      <div>Generated: <?php echo $generated; ?></div>
    </div>
  </div>
</header>

<div class="container">

<!-- Summary Cards -->
<div class="cards">
  <div class="card">
    <div class="label">Total Interactions</div>
    <div class="value"><?php echo $totalInteractions; ?></div>
    <div class="sub"><?php echo $cUsers; ?> control users · <?php echo $hUsers; ?> hybrid users</div>
  </div>
  <div class="card">
    <div class="label">Click-Through Rate</div>
    <div class="value"><?php echo $hCtr; ?>%</div>
    <div class="sub">Control: <?php echo $cCtr; ?>%</div>
    <?php echo $ctrBadge; ?>
  </div>
  <div class="card">
    <div class="label">Conversion Rate</div>
    <div class="value"><?php echo $hConv; ?>%</div>
    <div class="sub">Control: <?php echo $cConv; ?>%</div>
    <?php echo $convBadge; ?>
  </div>
  <div class="card">
    <div class="label">Completion Rate</div>
    <div class="value"><?php echo $hComp; ?>%</div>
    <div class="sub">Control: <?php echo $cComp; ?>%</div>
  </div>
</div>

<!-- Funnel Chart -->
<div class="section">
  <h2>Funnel Comparison</h2>
  <div class="legend">
    <span><span class="dot" style="background:#3B82F6"></span> Control (Legacy)</span>
    <span><span class="dot" style="background:#10B981"></span> Hybrid (New)</span>
  </div>
  <div class="chart-container"><canvas id="funnelChart"></canvas></div>
</div>

<!-- Rate + Time Charts -->
<div class="chart-row">
  <div class="section">
    <h2>Rate Comparison</h2>
    <div class="chart-container"><canvas id="rateChart"></canvas></div>
  </div>
  <div class="section">
    <h2>Engagement Over Time</h2>
    <div class="chart-container"><canvas id="timeChart"></canvas></div>
  </div>
</div>

<!-- Position Analysis -->
<div class="section">
  <h2>Click-Through Rate by Recommendation Position</h2>
  <div class="chart-container"><canvas id="positionChart"></canvas></div>
</div>

<!-- Top Courses Tables -->
<div class="tables-row">
  <div class="section">
    <h2>Top Courses — <span class="tag tag-blue">Control</span></h2>
<?php if ($topControlCourses->isEmpty()): ?>
    <p style="color:#94A3B8;font-size:.875rem">No data</p>
<?php else: ?>
    <table><thead><tr><th>#</th><th>Course</th><th>Clicks</th><th>Enrollments</th></tr></thead><tbody>
<?php foreach ($topControlCourses as $i => $c): ?>
      <tr><td><?php echo $i + 1; ?></td><td><?php echo htmlspecialchars($c->title ?? 'Untitled'); ?></td><td><?php echo $c->clicks; ?></td><td><?php echo $c->enrollments; ?></td></tr>
<?php endforeach; ?>
    </tbody></table>
<?php endif; ?>
  </div>
  <div class="section">
    <h2>Top Courses — <span class="tag tag-green">Hybrid</span></h2>
<?php if ($topHybridCourses->isEmpty()): ?>
    <p style="color:#94A3B8;font-size:.875rem">No data</p>
<?php else: ?>
    <table><thead><tr><th>#</th><th>Course</th><th>Clicks</th><th>Enrollments</th></tr></thead><tbody>
<?php foreach ($topHybridCourses as $i => $c): ?>
      <tr><td><?php echo $i + 1; ?></td><td><?php echo htmlspecialchars($c->title ?? 'Untitled'); ?></td><td><?php echo $c->clicks; ?></td><td><?php echo $c->enrollments; ?></td></tr>
<?php endforeach; ?>
    </tbody></table>
<?php endif; ?>
  </div>
</div>

<!-- Detailed Statistics -->
<div class="section">
  <h2>Detailed Statistics</h2>
  <table>
    <thead>
      <tr><th>Metric</th><th><span class="tag tag-blue">Control</span></th><th><span class="tag tag-green">Hybrid</span></th><th>Difference</th><th>Change</th></tr>
    </thead>
    <tbody>
      <tr><td>Impressions</td><td><?php echo $cImp; ?></td><td><?php echo $hImp; ?></td><td><?php echo $hImp - $cImp; ?></td><?php echo fmtDelta(safePctChange($hImp, $cImp)); ?></tr>
      <tr><td>Clicks</td><td><?php echo $cClk; ?></td><td><?php echo $hClk; ?></td><td><?php echo $hClk - $cClk; ?></td><?php echo fmtDelta(safePctChange($hClk, $cClk)); ?></tr>
      <tr><td>Enrollments</td><td><?php echo $cEnr; ?></td><td><?php echo $hEnr; ?></td><td><?php echo $hEnr - $cEnr; ?></td><?php echo fmtDelta(safePctChange($hEnr, $cEnr)); ?></tr>
      <tr><td>Completions</td><td><?php echo $cCmp; ?></td><td><?php echo $hCmp; ?></td><td><?php echo $hCmp - $cCmp; ?></td><?php echo fmtDelta(safePctChange($hCmp, $cCmp)); ?></tr>
      <tr><td>Unique Users</td><td><?php echo $cUsers; ?></td><td><?php echo $hUsers; ?></td><td><?php echo $hUsers - $cUsers; ?></td><?php echo fmtDelta(safePctChange($hUsers, $cUsers)); ?></tr>
      <tr><td>Click-Through Rate</td><td><?php echo $cCtr; ?>%</td><td><?php echo $hCtr; ?>%</td><td><?php echo round($hCtr - $cCtr, 2); ?>pp</td><?php echo fmtDelta($deltaCtr); ?></tr>
      <tr><td>Conversion Rate</td><td><?php echo $cConv; ?>%</td><td><?php echo $hConv; ?>%</td><td><?php echo round($hConv - $cConv, 2); ?>pp</td><?php echo fmtDelta($deltaConv); ?></tr>
      <tr><td>Completion Rate</td><td><?php echo $cComp; ?>%</td><td><?php echo $hComp; ?>%</td><td><?php echo round($hComp - $cComp, 2); ?>pp</td><?php echo fmtDelta(safePctChange($hComp, $cComp)); ?></tr>
    </tbody>
  </table>
</div>

<footer>
  A/B Test Report · Generated <?php echo $generated; ?> · Data from recommendation_interactions table
</footer>

</div>

<script>
const BLUE = '#3B82F6';
const GREEN = '#10B981';
const BLUE_BG = 'rgba(59,130,246,0.15)';
const GREEN_BG = 'rgba(16,185,129,0.15)';

const defaultOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } }
};

// Funnel Chart
new Chart(document.getElementById('funnelChart'), {
  type: 'bar',
  data: {
    labels: ['Impressions', 'Clicks', 'Enrollments', 'Completions'],
    datasets: [
      { label: 'Control', data: [<?php echo "$cImp, $cClk, $cEnr, $cCmp"; ?>], backgroundColor: BLUE, borderRadius: 4 },
      { label: 'Hybrid',  data: [<?php echo "$hImp, $hClk, $hEnr, $hCmp"; ?>], backgroundColor: GREEN, borderRadius: 4 }
    ]
  },
  options: { ...defaultOpts, indexAxis: 'y', plugins: { legend: { display: true, position: 'bottom' } } }
});

// Rate Chart
new Chart(document.getElementById('rateChart'), {
  type: 'bar',
  data: {
    labels: ['CTR', 'Conversion', 'Completion'],
    datasets: [
      { label: 'Control', data: [<?php echo "$cCtr, $cConv, $cComp"; ?>], backgroundColor: BLUE, borderRadius: 4 },
      { label: 'Hybrid',  data: [<?php echo "$hCtr, $hConv, $hComp"; ?>], backgroundColor: GREEN, borderRadius: 4 }
    ]
  },
  options: {
    ...defaultOpts,
    plugins: { legend: { display: true, position: 'bottom' } },
    scales: { y: { ticks: { callback: function(v) { return v + '%'; } }, beginAtZero: true } }
  }
});

// Time Chart
new Chart(document.getElementById('timeChart'), {
  type: 'line',
  data: {
    labels: <?php echo $chartTimeLabels; ?>,
    datasets: [
      { label: 'Control', data: <?php echo $chartControlClicks; ?>, borderColor: BLUE, backgroundColor: BLUE_BG, fill: true, tension: 0.3, pointRadius: 3 },
      { label: 'Hybrid',  data: <?php echo $chartHybridClicks; ?>,  borderColor: GREEN, backgroundColor: GREEN_BG, fill: true, tension: 0.3, pointRadius: 3 }
    ]
  },
  options: {
    ...defaultOpts,
    plugins: { legend: { display: true, position: 'bottom' } },
    scales: { y: { beginAtZero: true } }
  }
});

// Position Chart
new Chart(document.getElementById('positionChart'), {
  type: 'bar',
  data: {
    labels: <?php echo $chartPosLabels; ?>,
    datasets: [
      { label: 'Control CTR', data: <?php echo $chartPosCtrC; ?>, backgroundColor: 'rgba(59,130,246,0.65)', borderRadius: 4 },
      { label: 'Hybrid CTR',  data: <?php echo $chartPosCtrH; ?>, backgroundColor: 'rgba(16,185,129,0.65)', borderRadius: 4 }
    ]
  },
  options: {
    ...defaultOpts,
    plugins: { legend: { display: true, position: 'bottom' } },
    scales: { y: { ticks: { callback: function(v) { return v + '%'; } }, beginAtZero: true } }
  }
});
</script>
</body>
</html>
<?php

// ── No Data HTML ───────────────────────────────────────────────────

function buildNoDataHtml(): string
{
    $generated = date('Y-m-d H:i:s');
    return <<<HTML
<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>A/B Test Report — No Data</title>
<style>
body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#F8FAFC;color:#64748B;margin:0}
.box{text-align:center;padding:3rem;background:#fff;border-radius:1rem;box-shadow:0 1px 3px rgba(0,0,0,.1);max-width:500px}
h1{color:#1E293B;margin-bottom:.5rem}p{margin-bottom:1rem}small{color:#94A3B8}
</style></head><body><div class="box">
<h1>No Interaction Data Found</h1>
<p>The recommendation_interactions table has no records with ab_group = 'control' or 'hybrid'.</p>
<p>Make sure users are interacting with the recommended courses page and A/B testing is enabled.</p>
<small>Generated: {$generated}</small>
</div></body></html>
HTML;
}

function buildErrorHtml(string $title, string $message): string
{
    $generated = date('Y-m-d H:i:s');
    $safeMsg = htmlspecialchars($message);
    return <<<HTML
<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>A/B Test Report — Error</title>
<style>
body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#F8FAFC;color:#64748B;margin:0}
.box{text-align:center;padding:3rem;background:#fff;border-radius:1rem;box-shadow:0 1px 3px rgba(0,0,0,.1);max-width:600px}
h1{color:#EF4444;margin-bottom:.5rem}p{margin-bottom:1rem}code{font-size:.8rem;background:#F1F5F9;padding:.5rem 1rem;border-radius:.5rem;display:block;text-align:left;overflow-x:auto;word-break:break-all}small{color:#94A3B8}
</style></head><body><div class="box">
<h1>{$title}</h1>
<p>Could not connect to the database. Make sure PostgreSQL is running.</p>
<code>{$safeMsg}</code>
<small>Generated: {$generated}</small>
</div></body></html>
HTML;
}
