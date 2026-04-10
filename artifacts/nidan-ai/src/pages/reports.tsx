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
import { FileText, FileImage, Download, Trash2, Clock, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ReportType } from "@workspace/api-client-react/src/generated/api.schemas";

export function Reports() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"all" | "image" | "ocr">("all");
  
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

  const handleExport = (report: any) => {
    // In a real app, this would generate a PDF or TXT. 
    // Here we'll simulate the download.
    const text = `NIDAN.ai Medical Report\n\nFilename: ${report.filename}\nDate: ${format(new Date(report.createdAt), 'PPP')}\n\nSummary:\n${report.analysisResult}\n\nFindings:\n${report.findings || 'N/A'}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nidan-report-${report.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: "Your report has been downloaded.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report History</h1>
          <p className="text-muted-foreground mt-2">Manage your analyzed medical documents and reports.</p>
        </div>
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
                      {report.type === 'image' ? <FileImage className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <CardTitle className="text-base truncate max-w-[150px]">{report.filename}</CardTitle>
                      <CardDescription className="flex items-center text-xs mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(new Date(report.createdAt), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary uppercase">
                    {report.type}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                    {report.analysisResult || "No summary available."}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => handleExport(report)}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
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
    </div>
  );
}
