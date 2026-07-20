import Groq from 'groq-sdk';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export const generateSecurityAlert = async (rule, detection) => {
  if (!groq) {
    console.warn('Groq API Key is missing. Skipping AI summary generation.');
    return `SD-Hawk Security Alert: A ${detection.type} was detected which violates your active security rules. Confidence: ${detection.confidence}%.`;
  }

  const prompt = `
    You are SD-Hawk, an elite AI security system. 
    You just detected a security violation based on the user's custom rules.
    
    Rule Violated: Alert when a "${rule.objectType}" is seen.
    Detection Details:
    - Object: ${detection.type}
    - Confidence: ${detection.confidence}%
    - Timestamp: ${new Date().toLocaleString()}
    
    Write a very brief, punchy, and urgent 2-sentence security alert to email to the user. 
    IMPORTANT: Refer to the detected object dynamically but forcefully (e.g., if it's a person, call them an "Unauthorized Person" or "Unknown Person" instead of just "a person" or "an undefined person"). Do not use pleasantries. Be direct.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant', // Fast model
      temperature: 0.7,
      max_tokens: 150,
    });

    return chatCompletion.choices[0]?.message?.content || 'Security Alert: Intrusion detected.';
  } catch (error) {
    console.error('Groq AI Error:', error);
    return `SD-Hawk Security Alert: A ${detection.type} was detected.`; // Fallback
  }
};
export const evaluateCustomPrompt = async (base64Image, customPrompt) => {
  if (!groq) {
    console.warn('Groq API Key is missing. Skipping AI Vision evaluation.');
    return { alert: true, reason: 'Groq API Key missing. Falling back to True.' };
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `You are an elite AI security system monitoring a camera feed. Answer the following question based ONLY on the image provided: "${customPrompt}". You MUST respond in pure JSON format like this: {"alert": true/false, "reason": "brief explanation"}` },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ]
        }
      ],
      model: 'qwen/qwen3.6-27b',
      temperature: 0.2,
      max_tokens: 1500,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '{}';
    console.log('Groq RAW Response:', responseText);
    
    // 1. Strip out the reasoning block entirely so it doesn't confuse the JSON parser
    const cleanResponse = responseText.replace(/<think>[\s\S]*?<\/think>/g, '');
    
    // 2. Extract JSON object using regex
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // If it STILL fails to output JSON, we do NOT aggressively fallback to scanning for "yes". 
    // We just safely default to false to prevent false alarms.
    throw new Error("AI did not output valid JSON format.");
  } catch (error) {
    console.error('Groq Vision AI Error:', error.message || error);
    // CRITICAL: If the Groq API fails or parsing fails, we default to FALSE to avoid spam.
    return { alert: false, reason: 'API/Parsing Error: ' + (error.message || 'Unknown') };
  }
};
