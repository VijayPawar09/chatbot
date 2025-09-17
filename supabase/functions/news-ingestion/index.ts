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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting news ingestion...');

    // Fetch RSS feeds from Reuters sitemap
    const rssUrls = [
      'https://feeds.reuters.com/reuters/businessNews',
      'https://feeds.reuters.com/reuters/technologyNews', 
      'https://feeds.reuters.com/reuters/worldNews',
      'https://feeds.reuters.com/reuters/politicsNews',
      'https://feeds.reuters.com/reuters/sportsNews'
    ];

    const allArticles = [];

    for (const rssUrl of rssUrls) {
      try {
        console.log(`Fetching RSS from: ${rssUrl}`);
        const response = await fetch(rssUrl);
        const rssText = await response.text();
        
        // Parse RSS XML (basic string parsing for Deno)
        const items = [];
        
        // More robust regex patterns for Reuters RSS
        const itemMatches = rssText.match(/<item[^>]*>[\s\S]*?<\/item>/gi);
        
        if (itemMatches) {
          for (const itemXml of itemMatches.slice(0, 10)) {
            // Extract title (handle both CDATA and plain text)
            let title = '';
            const titleCdataMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i);
            const titlePlainMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
            if (titleCdataMatch) {
              title = titleCdataMatch[1].trim();
            } else if (titlePlainMatch) {
              title = titlePlainMatch[1].trim();
            }
            
            // Extract link
            const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
            const link = linkMatch ? linkMatch[1].trim() : '';
            
            // Extract description (handle both CDATA and plain text)
            let description = '';
            const descCdataMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i);
            const descPlainMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
            if (descCdataMatch) {
              description = descCdataMatch[1].trim();
            } else if (descPlainMatch) {
              description = descPlainMatch[1].trim();
            }
            
            // Extract publication date
            const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
            const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
            
            // Clean up HTML entities and tags from description
            description = description
              .replace(/<[^>]*>/g, '') // Remove HTML tags
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&#x27;/g, "'")
              .replace(/&nbsp;/g, ' ')
              .trim();
            
            if (title && link && description && title.length > 5 && description.length > 20) {
              items.push({ title, link, description, pubDate });
            }
          }
        }
        
        console.log(`Parsed ${items.length} items from ${rssUrl}`);
        
        for (const item of items) {
          if (item.title && item.link && item.description) {
            allArticles.push({
              title: item.title,
              content: item.description,
              url: item.link,
              published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
              source: 'Reuters',
              embedding_text: `${item.title} ${item.description}`
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching RSS from ${rssUrl}:`, error);
      }
    }

    console.log(`Found ${allArticles.length} articles`);

    // Insert articles into database with better conflict handling
    if (allArticles.length > 0) {
      const { data, error } = await supabase
        .from('news_articles')
        .upsert(allArticles, { 
          onConflict: 'url',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
    }


    console.log(`Successfully ingested ${allArticles.length} articles`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        articlesIngested: allArticles.length,
        message: 'News ingestion completed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in news-ingestion function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});