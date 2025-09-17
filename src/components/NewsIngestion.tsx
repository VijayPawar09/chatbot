import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const NewsIngestion = () => {
  const [isIngesting, setIsIngesting] = useState(false);
  const [lastIngestResult, setLastIngestResult] = useState<{
    success: boolean;
    articlesIngested?: number;
    message?: string;
    error?: string;
  } | null>(null);

  const ingestNews = async () => {
    setIsIngesting(true);
    setLastIngestResult(null);

    try {
      const response = await fetch(`https://syoepzxmmpseqlvwpark.supabase.co/functions/v1/news-ingestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      setLastIngestResult(result);

      if (result.success) {
        toast({
          title: "News Ingestion Complete",
          description: `Successfully ingested ${result.articlesIngested} articles`,
        });
      } else {
        toast({
          title: "Ingestion Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : "Failed to ingest news"
      };
      setLastIngestResult(errorResult);
      
      toast({
        title: "Error",
        description: errorResult.error,
        variant: "destructive"
      });
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          News Ingestion
        </CardTitle>
        <p className="text-muted-foreground">
          Fetch and store the latest news articles from Reuters RSS feeds covering business, technology, world news, politics, and sports.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button
          onClick={ingestNews}
          disabled={isIngesting}
          className="w-full flex items-center gap-2"
          size="lg"
        >
          {isIngesting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Ingesting News...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Start News Ingestion
            </>
          )}
        </Button>

        {lastIngestResult && (
          <div className={`p-4 rounded-lg border ${
            lastIngestResult.success 
              ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
              : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {lastIngestResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                lastIngestResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {lastIngestResult.success ? 'Success!' : 'Error'}
              </span>
            </div>
            
            <p className={`text-sm ${
              lastIngestResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
            }`}>
              {lastIngestResult.success 
                ? `${lastIngestResult.articlesIngested} articles have been successfully ingested and are now available for chat queries.`
                : lastIngestResult.error
              }
            </p>
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Sources:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Reuters Business News</li>
            <li>Reuters Technology News</li>
            <li>Reuters World News</li>
            <li>Reuters Politics News</li>
            <li>Reuters Sports News</li>
          </ul>
          <p className="mt-3">
            <strong>Note:</strong> This process fetches up to 50 recent articles from RSS feeds and stores them in the database for the RAG chatbot to use.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};