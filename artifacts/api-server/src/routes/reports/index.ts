import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, reportsTable } from "@workspace/db";
import { ai } from "@workspace/integrations-gemini-ai";
import {
  AnalyzeReportBody,
  GetReportParams,
  DeleteReportParams,
  ListReportsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reports", async (req, res): Promise<void> => {
  const query = ListReportsQueryParams.safeParse(req.query);
  let dbQuery = db.select().from(reportsTable).$dynamic();
  if (query.success && query.data.type) {
    dbQuery = dbQuery.where(eq(reportsTable.type, query.data.type));
  }
  const reports = await dbQuery.orderBy(reportsTable.createdAt);
  res.json(reports);
});

router.post("/reports/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { imageBase64, filename, type, userId } = parsed.data;

  let analysisResult = "";
  let findings = "";
  let recommendations = "";

  try {
    const prompt = type === "ocr"
      ? `You are a medical AI assistant. This is a scanned medical document or report. Please:
1. Extract and transcribe all visible text from the document
2. Identify key medical findings, test results, or diagnoses mentioned
3. Summarize the key findings in plain language
4. Provide any relevant health recommendations

Format your response as:
EXTRACTED TEXT:
[transcribed text]

KEY FINDINGS:
[bullet points of findings]

SUMMARY:
[plain language summary]

RECOMMENDATIONS:
[health recommendations]`
      : `You are a medical AI assistant specializing in medical image analysis. Please analyze this medical image and provide:
1. Image type identification (X-ray, MRI, CT scan, ultrasound, etc.)
2. Observable anatomical structures
3. Any abnormalities, anomalies, or areas of concern you can identify
4. Overall assessment

Format your response as:
IMAGE TYPE: [type]

ANATOMICAL STRUCTURES OBSERVED:
[bullet points]

FINDINGS:
[detailed findings]

ASSESSMENT:
[overall assessment]

IMPORTANT: This is for educational purposes only. Always consult a qualified radiologist or physician for official medical interpretation.`;

    const mimeType = imageBase64.startsWith("data:image/png")
      ? "image/png"
      : imageBase64.startsWith("data:image/jpg") || imageBase64.startsWith("data:image/jpeg")
      ? "image/jpeg"
      : "image/jpeg";

    const base64Data = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: { maxOutputTokens: 8192 },
    });

    analysisResult = response.text ?? "Analysis completed";

    const findingsMatch = analysisResult.match(/(?:KEY FINDINGS:|FINDINGS:)([\s\S]*?)(?:SUMMARY:|ASSESSMENT:|RECOMMENDATIONS:|$)/i);
    if (findingsMatch) {
      findings = findingsMatch[1].trim();
    }
    const recommendationsMatch = analysisResult.match(/RECOMMENDATIONS:([\s\S]*?)$/i);
    if (recommendationsMatch) {
      recommendations = recommendationsMatch[1].trim();
    }
  } catch (err) {
    req.log.error({ err }, "Failed to analyze medical image");
    analysisResult = "Image analysis could not be completed. Please try again.";
  }

  const [report] = await db
    .insert(reportsTable)
    .values({
      userId,
      type,
      filename,
      imageBase64,
      analysisResult,
      findings: findings || null,
      recommendations: recommendations || null,
      exportCount: 0,
    })
    .returning();

  res.status(201).json(report);
});

router.get("/reports/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetReportParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [report] = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.id, params.data.id));
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(report);
});

router.delete("/reports/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteReportParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [deleted] = await db
    .delete(reportsTable)
    .where(eq(reportsTable.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
