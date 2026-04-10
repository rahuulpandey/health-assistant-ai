import { Router, type IRouter } from "express";
import { db, conversations as conversationsTable, reportsTable, messages as messagesTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (req, res): Promise<void> => {
  const [conversationCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(conversationsTable);

  const [imageCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reportsTable)
    .where(eq(reportsTable.type, "image"));

  const [exportCount] = await db
    .select({ total: sql<number>`sum(export_count)` })
    .from(reportsTable);

  const [activeConvs] = await db
    .select({ count: sql<number>`count(distinct conversation_id)` })
    .from(messagesTable);

  res.json({
    totalConsultations: Number(conversationCount?.count ?? 0),
    imagesAnalyzed: Number(imageCount?.count ?? 0),
    reportsExported: Number(exportCount?.total ?? 0),
    activeConversations: Number(activeConvs?.count ?? 0),
  });
});

router.get("/stats/recent-activity", async (req, res): Promise<void> => {
  const recentConvs = await db
    .select()
    .from(conversationsTable)
    .orderBy(conversationsTable.createdAt)
    .limit(5);

  const recentReports = await db
    .select()
    .from(reportsTable)
    .orderBy(reportsTable.createdAt)
    .limit(5);

  const activities: Array<{
    id: number;
    type: "chat" | "image_analysis" | "export" | "ocr";
    description: string;
    timestamp: Date;
  }> = [];

  for (const conv of recentConvs) {
    activities.push({
      id: conv.id * 1000,
      type: "chat",
      description: `Started conversation: ${conv.title}`,
      timestamp: conv.createdAt,
    });
  }

  for (const report of recentReports) {
    activities.push({
      id: report.id * 1000 + 1,
      type: report.type === "ocr" ? "ocr" : "image_analysis",
      description: `Analyzed ${report.type === "ocr" ? "document" : "medical image"}: ${report.filename}`,
      timestamp: report.createdAt,
    });
    if (report.exportCount > 0) {
      activities.push({
        id: report.id * 1000 + 2,
        type: "export",
        description: `Exported report: ${report.filename}`,
        timestamp: report.createdAt,
      });
    }
  }

  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  res.json(activities.slice(0, 10));
});

export default router;
