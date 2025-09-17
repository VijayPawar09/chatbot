import { ChatInterface } from '@/components/ChatInterface';
import { NewsIngestion } from '@/components/NewsIngestion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Database, Info } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            RAG-Powered News Chatbot
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            A full-stack chatbot that answers queries over a news corpus using Retrieval-Augmented Generation (RAG) pipeline
          </p>
        </div>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="ingestion" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Ingestion
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="w-full">
            <ChatInterface />
          </TabsContent>

          <TabsContent value="ingestion" className="w-full">
            <div className="flex justify-center">
              <NewsIngestion />
            </div>
          </TabsContent>

          <TabsContent value="info" className="w-full">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Technical Architecture</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Frontend Stack</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• React + TypeScript</li>
                        <li>• Tailwind CSS for styling</li>
                        <li>• Real-time chat interface</li>
                        <li>• Session management</li>
                        <li>• Responsive design</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Backend Stack</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• Supabase Edge Functions</li>
                        <li>• PostgreSQL database</li>
                        <li>• RESTful APIs</li>
                        <li>• Session-based chat history</li>
                        <li>• RSS news ingestion</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">RAG Pipeline</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• News article ingestion from Reuters RSS</li>
                        <li>• Keyword-based retrieval (temp)</li>
                        <li>• Ready for embeddings integration</li>
                        <li>• Context-aware responses</li>
                        <li>• Source attribution</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Features</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• Session-based conversations</li>
                        <li>• Real-time chat interface</li>
                        <li>• News source citations</li>
                        <li>• Session clearing/reset</li>
                        <li>• Responsive typing indicators</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Next Steps</h4>
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      Add your Gemini API key to enable AI-powered responses. The system currently uses keyword-based retrieval and can be enhanced with proper embeddings and LLM integration.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
