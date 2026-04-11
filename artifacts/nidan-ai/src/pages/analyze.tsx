import { useState, useCallback } from "react";
import { useUser } from "@clerk/react";
import { useAnalyzeReport } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, FileText, Image as ImageIcon, CheckCircle2, AlertCircle, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ReportType } from "@workspace/api-client-react/src/generated/api.schemas";

export function Analyze() {
  const { user } = useUser();
  const { toast } = useToast();
  const analyzeMutation = useAnalyzeReport();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<ReportType>("image");
  const [result, setResult] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setSelectedFile(file);
      setResult(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload an image or PDF document.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleAnalyze = async () => {
    if (!previewUrl || !selectedFile || !user) return;

    try {
      const base64Data = previewUrl.split(',')[1];
      
      analyzeMutation.mutate(
        {
          data: {
            userId: user.id,
            filename: selectedFile.name,
            type: analysisType,
            imageBase64: base64Data
          }
        },
        {
          onSuccess: (data) => {
            setResult(data);
            toast({
              title: "Analysis Complete",
              description: "Your report has been successfully analyzed.",
            });
          },
          onError: () => {
            toast({
              title: "Analysis Failed",
              description: "There was an error analyzing your report. Please try again.",
              variant: "destructive"
            });
          }
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Medical Analysis</h1>
        <p className="text-muted-foreground mt-2">Upload medical images or scanned reports for AI-powered analysis.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>Select the type of document and upload the file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={analysisType} onValueChange={(v) => setAnalysisType(v as ReportType)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="image">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Medical Image
                  </TabsTrigger>
                  <TabsTrigger value="ocr">
                    <FileText className="w-4 h-4 mr-2" />
                    Scanned Report
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {!selectedFile ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer flex flex-col items-center justify-center space-y-4"
                >
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <UploadCloud className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Drag & drop your file here</p>
                    <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, or PDF up to 10MB</p>
                  </div>
                  <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                    Browse Files
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden border bg-muted/30 aspect-video flex items-center justify-center">
                    {previewUrl?.startsWith('data:image') ? (
                      <img src={previewUrl} alt="Preview" className="max-h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                        <span className="font-medium">{selectedFile.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center bg-muted p-3 rounded-md">
                    <span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                    <Button variant="ghost" size="sm" onClick={resetForm}>Remove</Button>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleAnalyze} 
                disabled={!selectedFile || analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? "Analyzing..." : "Analyze Document"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>AI-generated insights from your document.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {!result && !analyzeMutation.isPending && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <p>Upload and analyze a document to see results here.</p>
                </div>
              )}
              
              {analyzeMutation.isPending && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8">
                  <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-muted-foreground font-medium">Processing your document...</p>
                  <p className="text-xs text-muted-foreground">This may take a few moments.</p>
                </div>
              )}

              {result && !analyzeMutation.isPending && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-primary bg-primary/10 p-3 rounded-md">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium text-sm">Analysis complete</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold flex items-center mb-2">
                        <Activity className="w-4 h-4 mr-2" />
                        Summary
                      </h4>
                      <div className="bg-muted p-3 rounded-md">
                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {result.analysisResult}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>

                    {result.findings && (
                      <div>
                        <h4 className="text-sm font-semibold flex items-center mb-2">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Key Findings
                        </h4>
                        <div className="bg-muted p-3 rounded-md">
                          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {result.findings}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
