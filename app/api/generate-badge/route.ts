import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, description, skillTagsArray, location } = body;
    const geminiPrompt = `Generate a visually appealing, modern, and unique SVG badge for the following job. The badge should be colorful, use gradients, and include an icon or symbol that represents the job's category or required skills. The design should be circular or shield-shaped, look good at 80x80 pixels, and be suitable for digital display. Return a JSON object with: title (string), description (string), and svg (string, SVG code for the badge).\nThe badge title must be creative and unique, not just the job title. Use the job's details to inspire a distinctive badge name.\nJob Title: ${title}\nCategory: ${category}\nDescription: ${description}\nRequired Skills: ${skillTagsArray.join(', ')}\nLocation: ${location}`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(geminiPrompt);
    console.log('Gemini raw result:', JSON.stringify(result, null, 2));
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Remove markdown code block if present
    const cleanedText = text.replace(/^```json\s*|```$/g, '').trim();
    let badgeJson;
    try {
      badgeJson = JSON.parse(cleanedText);
    } catch (e) {
      return NextResponse.json({
        error: 'Failed to parse Gemini response',
        fallback: true,
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#4F46E5" /><text x="50%" y="54%" text-anchor="middle" fill="#fff" font-size="16" font-family="Arial" dy=".3em">Badge</text></svg>'
      }, { status: 200 });
    }
    return NextResponse.json({
      title: badgeJson.title || 'Badge',
      description: badgeJson.description || 'Badge for job completion.',
      svg: badgeJson.svg || ''
    }, { status: 200 });
  } catch (err) {
    console.error('Gemini API error:', err);
    return NextResponse.json({
      error: 'Error generating badge',
      fallback: true,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#4F46E5" /><text x="50%" y="54%" text-anchor="middle" fill="#fff" font-size="16" font-family="Arial" dy=".3em">Badge</text></svg>'
    }, { status: 500 });
  }
}
