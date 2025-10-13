import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PDFGenerationRequest {
  businessName: string;
  reportData: any;
  reportId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { businessName, reportData, reportId }: PDFGenerationRequest =
      await req.json();
    console.log(`Generating PDF report for: ${businessName}`);

    // Generate HTML content for the PDF
    const htmlContent = generateReportHTML(businessName, reportData);

    // For now, return the HTML content that could be converted to PDF on the client
    // In production, you would use a service like Puppeteer or jsPDF
    const pdfData = {
      html: htmlContent,
      downloadUrl: `https://example.com/reports/${reportId}.pdf`, // Mock URL
      reportId: reportId,
      generated_at: new Date().toISOString(),
    };

    console.log(`PDF report generated for: ${businessName}`);

    return new Response(JSON.stringify({ success: true, pdf: pdfData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function generateReportHTML(businessName: string, reportData: any): string {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brand Equity Report - ${businessName}</title>
    <style>
      body {
        font-family: 'Arial', sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        text-align: center;
        border-bottom: 3px solid #3b82f6;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .logo {
        font-size: 24px;
        font-weight: bold;
        color: #3b82f6;
      }
      .business-name {
        font-size: 32px;
        font-weight: bold;
        margin: 20px 0;
        color: #1f2937;
      }
      .report-date {
        color: #6b7280;
        font-size: 14px;
      }
      .score-overview {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 30px;
        border-radius: 12px;
        text-align: center;
        margin: 30px 0;
      }
      .overall-score {
        font-size: 48px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .score-label {
        font-size: 18px;
        opacity: 0.9;
      }
      .score-breakdown {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin: 30px 0;
      }
      .score-item {
        background: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        border-left: 4px solid #3b82f6;
      }
      .score-item h3 {
        margin: 0 0 10px 0;
        color: #1f2937;
      }
      .score-value {
        font-size: 24px;
        font-weight: bold;
        color: #3b82f6;
      }
      .recommendations {
        margin: 40px 0;
      }
      .recommendation {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
      }
      .recommendation h4 {
        margin: 0 0 10px 0;
        color: #1f2937;
      }
      .priority-high {
        border-left: 4px solid #ef4444;
      }
      .priority-medium {
        border-left: 4px solid #f59e0b;
      }
      .priority-low {
        border-left: 4px solid #10b981;
      }
      .footer {
        text-align: center;
        margin-top: 50px;
        padding-top: 30px;
        border-top: 1px solid #e5e7eb;
        color: #6b7280;
      }
      .cta-section {
        background: #f8fafc;
        padding: 30px;
        border-radius: 12px;
        text-align: center;
        margin: 40px 0;
      }
      .cta-button {
        background: #3b82f6;
        color: white;
        padding: 15px 30px;
        text-decoration: none;
        border-radius: 8px;
        font-weight: bold;
        display: inline-block;
        margin-top: 15px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="logo">TopServ Digital</div>
      <div class="business-name">${businessName}</div>
      <div class="report-date">Brand Equity Analysis Report - ${currentDate}</div>
    </div>
    
    <div class="score-overview">
      <div class="overall-score">${reportData.overall_score}/100</div>
      <div class="score-label">Overall Brand Equity Score</div>
    </div>
    
    <div class="score-breakdown">
      <div class="score-item">
        <h3>Website Strength</h3>
        <div class="score-value">${reportData.website_score}/100</div>
        <p>SEO, performance, and content quality assessment</p>
      </div>
      <div class="score-item">
        <h3>Social Media Presence</h3>
        <div class="score-value">${reportData.social_score}/100</div>
        <p>Engagement, followers, and content consistency</p>
      </div>
      <div class="score-item">
        <h3>Online Reputation</h3>
        <div class="score-value">${reportData.reputation_score}/100</div>
        <p>Reviews, ratings, and customer sentiment</p>
      </div>
      <div class="score-item">
        <h3>Brand Visibility</h3>
        <div class="score-value">${reportData.visibility_score}/100</div>
        <p>Search presence and online mentions</p>
      </div>
      <div class="score-item">
        <h3>Digital Consistency</h3>
        <div class="score-value">${reportData.consistency_score}/100</div>
        <p>Brand alignment across all channels</p>
      </div>
      <div class="score-item">
        <h3>Market Positioning</h3>
        <div class="score-value">${reportData.positioning_score}/100</div>
        <p>Competitive advantage and differentiation</p>
      </div>
    </div>
    
    <div class="recommendations">
      <h2>Key Recommendations</h2>
      ${
        reportData.recommendations
          ?.map(
            (rec: any) => `
        <div class="recommendation priority-${rec.priority.toLowerCase()}">
          <h4>${rec.category}: ${rec.action}</h4>
          <p><strong>Impact:</strong> ${rec.impact}</p>
          <ul>
            ${
              rec.specific_tasks
                ?.map((task: string) => `<li>${task}</li>`)
                .join("") || ""
            }
          </ul>
        </div>
      `
          )
          .join("") || "<p>No specific recommendations at this time.</p>"
      }
    </div>
    
    <div className="cta-section">
      <h3>Ready to Improve Your Brand Equity?</h3>
      <p>Our team of experts can help you implement these recommendations and boost your brand's digital presence.</p>
      <a href="https://topservdigital.com/consultation" className="cta-button md:block hidden">Book a free consultation with the experts at TopServ Digital to discuss your brand.</a>
   <a href="https://topservdigital.com/consultation" className="cta-button md:hidden block">Book your free consultation.</a>
      </div>
    
    <div class="footer">
      <p>This report was generated by TopServ Digital's Brand Equity Analyzer</p>
      <p>© 2024 TopServ Digital. All rights reserved.. lets remov it later</p>
    </div>
  </body>
  </html>
  `;
}
