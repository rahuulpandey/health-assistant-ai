import { useState } from "react";
import { 
  useListReports, 
  useDeleteReport, 
  getListReportsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, FileImage, Download, Trash2, Clock, Activity, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ReportType } from "@workspace/api-client-react/src/generated/api.schemas";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import jsPDF from "jspdf";

export function Reports() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"all" | "image" | "ocr">("all");
  const [viewingReport, setViewingReport] = useState<any | null>(null);

  const { data: reports, isLoading } = useListReports({ 
    type: activeTab === "all" ? undefined : activeTab as ReportType
  });

  const deleteMutation = useDeleteReport();

  const handleDelete = (id: number) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
          toast({
            title: "Report deleted",
            description: "The report has been permanently removed.",
          });
        }
      }
    );
  };

  const handleExportPdf = (report: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    const addText = (text: string, size: number, bold = false, color: [number, number, number] = [0, 0, 0]) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += size * 0.5;
      });
      y += 4;
    };

    // Header
    doc.setFillColor(22, 163, 74);
    doc.rect(0, 0, pageWidth, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("NIDAN.ai  —  Medical Analysis Report", margin, 9);
    y = 24;

    addText(report.filename, 16, true, [15, 23, 42]);
    addText(`Type: ${report.type.toUpperCase()}   |   Date: ${format(new Date(report.createdAt), "PPP")}`, 9, false, [100, 116, 139]);
    y += 4;

    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    addText("Summary", 13, true, [15, 23, 42]);
    const summaryClean = (report.analysisResult || "No summary available.").replace(/[#*`_~>]/g, "").trim();
    addText(summaryClean, 10, false, [51, 65, 85]);
    y += 4;

    if (report.findings) {
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
      addText("Key Findings", 13, true, [15, 23, 42]);
      const findingsClean = report.findings.replace(/[#*`_~>]/g, "").trim();
      addText(findingsClean, 10, false, [51, 65, 85]);
    }

    // Footer
    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`NIDAN.ai  |  Generated ${format(new Date(), "PPP")}  |  Page ${i} of ${totalPages}`, margin, 290);
    }

    doc.save(`nidan-report-${report.id}.pdf`);

    toast({
      title: "PDF Exported",
      description: "Your report has been downloaded as a PDF.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report History</h1>
        <p className="text-muted-foreground mt-2">Manage your analyzed medical documents and reports.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="image">Medical Images</TabsTrigger>
          <TabsTrigger value="ocr">Scanned Documents</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-primary/10 rounded-md">
                      {report.type === "image" ? <FileImage className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate max-w-[150px]">{report.filename}</CardTitle>
                      <CardDescription className="flex items-center text-xs mt-1">
                        <Clock className="w-3 h-3 mr-1 shrink-0" />
                        {format(new Date(report.createdAt), "MMM d, yyyy")}
                      </CardDescription>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary uppercase shrink-0">
                    {report.type}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-4 flex flex-col justify-between">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                  {report.analysisResult || "No summary available."}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewingReport(report)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleExportPdf(report)}>
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your report data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(report.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-lg border border-dashed">
          <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No reports found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            You haven't uploaded any documents for analysis yet, or they don't match the current filter.
          </p>
        </div>
      )}

      {/* View Report Dialog */}
      <Dialog open={!!viewingReport} onOpenChange={(open) => { if (!open) setViewingReport(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                {viewingReport?.type === "image" ? <FileImage className="w-5 h-5 text-primary" /> : <FileText className="w-5 h-5 text-primary" />}
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate">{viewingReport?.filename}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {viewingReport && format(new Date(viewingReport.createdAt), "PPP")}
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary uppercase">
                    {viewingReport?.type}
                  </span>
                </p>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-1">
            <div className="space-y-6 py-4">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground">Summary</h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {viewingReport?.analysisResult || "No summary available."}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {viewingReport?.findings && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground">Key Findings</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {viewingReport.findings}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t pt-4 flex justify-end">
            <Button onClick={() => handleExportPdf(viewingReport)}>
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
