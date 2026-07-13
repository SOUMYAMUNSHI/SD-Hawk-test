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
