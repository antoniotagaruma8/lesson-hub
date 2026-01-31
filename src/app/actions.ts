'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function parseScheduleAction(formData: FormData) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Fallback for demo purposes if no key is set, though it won't work without a real key.
  if (!apiKey) {
    return { success: false, message: "GEMINI_API_KEY is not set in your environment variables (.env.local)." };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, message: "No file uploaded." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    const prompt = `
      You are a schedule parser. Analyze the attached image of a class schedule.
      Extract the weekly schedule and format it into a JSON object where keys are numbers 1-5 (Monday-Friday).
      
      The output must be strictly this JSON structure:
      {
        "1": [ { "id": "unique_string", "time": "HH:MM-HH:MM", "subject": "Subject Name", "room": "Room Name", "color": "bg-blue-600" } ],
        "2": [ ... ]
      }

      Rules:
      1. Use 24-hour format for time (e.g., 08:00-09:00).
      2. Assign a Tailwind CSS color class (e.g., bg-blue-600, bg-green-600, bg-purple-600, bg-orange-600, bg-red-600, bg-teal-600) to each subject. Keep the same color for the same subject across different days.
      3. Generate a unique 'id' for each slot (e.g., 'mon_1', 'tue_2').
      4. Ignore breaks, lunch times, or empty slots.
      5. Return ONLY the JSON string, no markdown formatting.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: file.type,
        },
      },
    ]);

    const response = await result.response;
    let text = response.text();
    
    // Clean markdown if present
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const scheduleData = JSON.parse(text);
    return { success: true, data: scheduleData };

  } catch (error) {
    console.error("AI Parsing Error:", error);
    return { success: false, message: "Failed to parse schedule. Please try again." };
  }
}

export async function generateLinkTitleAction(url: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { success: false, title: null };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analyze this URL: "${url}"
      Generate a short, concise, and user-friendly title for this link.
      If it's a Google Doc/Slide/Sheet, identify it (e.g. "Google Slides").
      If it's a YouTube video, label it "YouTube Video".
      Return ONLY the title text, no quotes.
    `;

    const result = await model.generateContent(prompt);
    const title = result.response.text().trim();
    return { success: true, title };
  } catch (error) {
    return { success: false, title: null };
  }
}