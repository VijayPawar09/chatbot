import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Processing chat message: ${message} for session: ${sessionId}`);

    // Store user message
    await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        message,
        is_user: true
      });

    // Enhanced keyword-based retrieval
    const keywords = message.toLowerCase()
      .split(' ')
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'way', 'why'].includes(word));
    
    let relevantArticles = [];
    if (keywords.length > 0) {
      // Create search patterns for each keyword
      const searchConditions = keywords.flatMap(keyword => [
        `title.ilike.%${keyword}%`,
        `content.ilike.%${keyword}%`,
        `embedding_text.ilike.%${keyword}%`
      ]);
      
      const { data: articles } = await supabase
        .from('news_articles')
        .select('*')
        .or(searchConditions.join(','))
        .order('created_at', { ascending: false })
        .limit(5);
      
      relevantArticles = articles || [];
    }

    console.log(`Found ${relevantArticles.length} relevant articles`);

    // Prepare context from relevant articles
    let context = '';
    if (relevantArticles.length > 0) {
      context = relevantArticles.map(article => 
        `Title: ${article.title}\nSource: ${article.source}\nContent: ${article.content}\nURL: ${article.url}\n`
      ).join('\n---\n');
    }

    // Generate AI response using Gemini
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    let botResponse = "I understand you're asking about news. I couldn't find specific articles matching your query. Please try asking about business, technology, world news, politics, or sports.";

    if (geminiApiKey) {
      try {
        const prompt = context.length > 0 
          ? `You are a helpful news assistant. Based on the following news articles, answer the user's question: "${message}"

News Articles:
${context}

Please provide a comprehensive answer based on these articles. If the articles don't contain relevant information, say so and suggest what topics you can help with (business, technology, world news, politics, sports).`
          : `You are a helpful news assistant. The user asked: "${message}"

I don't have any relevant news articles for this query. Please let them know you can help with questions about business, technology, world news, politics, and sports, but they need to ingest news articles first using the news ingestion feature.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 1024,
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            botResponse = data.candidates[0].content.parts[0].text;
          }
        } else {
          console.error('Gemini API error:', await response.text());
        }
      } catch (error) {
        console.error('Error calling Gemini API:', error);
      }
    }

    // Store bot response
    await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        message: botResponse,
        is_user: false,
        retrieved_sources: relevantArticles.map(a => ({ 
          title: a.title, 
          url: a.url, 
          source: a.source 
        }))
      });

    return new Response(
      JSON.stringify({ 
        response: botResponse,
        sources: relevantArticles.map(a => ({ 
          title: a.title, 
          url: a.url, 
          source: a.source 
        }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});