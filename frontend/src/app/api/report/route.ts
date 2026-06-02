import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { generateReportHTML, ReportData } from "@/lib/report-template";

const COMPETENCY_NAMES: Record<string, string> = {
  C1: "Digital Literacy",
  C2: "Digital Skills",
  C3: "Communication & Collaboration",
  C4: "Problem-Solving & Critical Thinking",
  C5: "Digital Safety & Security",
  C6: "Professional Development",
  C7: "Digital Transformation & Governance",
  C8: "Digital Creation & Innovation",
  C9: "Digital Ethics & Inclusion",
  C10: "Functional Skills & Applications",
};

const COMPETENCY_MAX_SCORES: Record<string, number> = {
  C1: 75, C2: 75, C3: 50, C4: 50, C5: 50,
  C6: 50, C7: 55, C8: 20, C9: 25, C10: 50,
};

const MATURITY_COLORS: Record<number, string> = {
  1: "#ef4444", 2: "#f97316", 3: "#eab308", 4: "#22c55e", 5: "#10b981",
};

const MATURITY_LABELS: Record<number, string> = {
  1: "Novice", 2: "Developing", 3: "Capable", 4: "Proficient", 5: "Expert",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const data: ReportData = {
      userName: body.userName || "User",
      userEmail: body.userEmail || "",
      department: body.department,
      dsri: body.dsri || 0,
      maturityLevel: body.maturityLevel || 1,
      maturityLabel: MATURITY_LABELS[body.maturityLevel] || "Novice",
      maturityColor: MATURITY_COLORS[body.maturityLevel] || "#ef4444",
      competencyScores: body.competencyScores || {},
      competencyNames: COMPETENCY_NAMES,
      competencyMaxScores: COMPETENCY_MAX_SCORES,
      certificateCode: body.certificateCode,
      issuedAt: body.issuedAt || new Date().toISOString(),
      aiSummary: body.aiSummary,
      aiFindings: body.aiFindings,
      aiAdvice: body.aiAdvice,
      aiNextSteps: body.aiNextSteps,
      courses: body.courses,
    };

    const html = generateReportHTML(data);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="DSRA-Report-${data.userName.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
