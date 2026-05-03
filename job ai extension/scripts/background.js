import { CONFIG } from './config.js';

async function callGeminiAPI(apiKey, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.2,
                response_mime_type: "application/json"
            }
        })
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeJob') {
        (async () => {
            try {
                const { resumeText } = await chrome.storage.local.get(['resumeText']);
                const finalApiKey = CONFIG.GEMINI_API_KEY !== "YOUR_API_KEY_HERE" ? CONFIG.GEMINI_API_KEY : null;

                if (!finalApiKey || !resumeText) {
                    sendResponse({ error: 'Missing API Key in config.js, or Missing Resume in extension popup.' });
                    return;
                }

                const prompt = `
You are an expert ATS (Applicant Tracking System) and career coach.
I will provide you with the text extracted from a webpage that contains a Job Description, and my Resume.
Your task is to analyze them and provide a JSON response.

Page Text (contains JD):
${request.pageText}

My Resume:
${resumeText}

Analyze the match between the resume and the job requirements found in the page text. 
Respond ONLY with a valid JSON object matching this schema, no markdown blocks:
{
  "score": <number 0-100 representing ATS match>,
  "skill_gaps": [<array of 3-5 strings detailing missing critical skills>],
  "matched_skills": [<array of 3-5 strings detailing matched skills and projects>],
  "insights": <string, a 2 sentence summary of why it's a good or bad fit>
}
`;

                const result = await callGeminiAPI(finalApiKey, prompt);
                sendResponse({ success: true, data: result });
                
            } catch (error) {
                console.error("Background Error:", error);
                sendResponse({ error: error.message || "Failed to analyze job." });
            }
        })();
        
        return true; // Indicates asynchronous response
    }

    if (request.action === 'generateCoverLetter') {
        (async () => {
             try {
                const { resumeText } = await chrome.storage.local.get(['resumeText']);
                const finalApiKey = CONFIG.GEMINI_API_KEY !== "YOUR_API_KEY_HERE" ? CONFIG.GEMINI_API_KEY : null;
                
                const prompt = `
You are an expert career coach. Write a professional, concise, and highly tailored cover letter.
Do not use markdown formatting, just plain text.
Base it on this job page text:
${request.pageText}

And my resume:
${resumeText}
`;
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${finalApiKey}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.7 }
                    })
                });

                if (!response.ok) throw new Error("API Error");
                const data = await response.json();
                sendResponse({ success: true, letter: data.candidates[0].content.parts[0].text });

             } catch(e) {
                 sendResponse({ error: e.message });
             }
        })();
        return true;
    }
});
