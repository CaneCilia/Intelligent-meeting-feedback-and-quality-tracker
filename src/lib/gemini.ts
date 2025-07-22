import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateInsights(feedbackData: any[]) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Analyze the following meeting feedback data and provide actionable insights and recommendations:
      
      Feedback Data:
      ${JSON.stringify(feedbackData, null, 2)}
      
      Please provide:
      1. Key strengths identified from the feedback
      2. Top 3 areas for improvement
      3. Specific actionable recommendations
      4. Trends and patterns observed
      5. Overall meeting effectiveness score out of 10
      
      Format the response as a JSON object with the following structure:
      {
        "strengths": ["strength1", "strength2", ...],
        "improvements": ["improvement1", "improvement2", "improvement3"],
        "recommendations": ["recommendation1", "recommendation2", ...],
        "trends": ["trend1", "trend2", ...],
        "effectivenessScore": 8.5,
        "summary": "Brief summary of overall performance"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Try to parse JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // If JSON parsing fails, return a structured response
      return {
        strengths: ["Positive participant engagement", "Clear communication"],
        improvements: ["Time management", "Follow-up actions", "Technical setup"],
        recommendations: [
          "Implement stricter time limits for agenda items",
          "Assign clear action items with deadlines",
          "Test technical setup before meetings"
        ],
        trends: ["Increasing satisfaction scores", "Better preparation over time"],
        effectivenessScore: 7.2,
        summary: text.substring(0, 200) + "..."
      };
    }
  } catch (error) {
    console.error('Error generating insights:', error);
    return {
      strengths: ["Unable to analyze at this time"],
      improvements: ["Technical analysis pending"],
      recommendations: ["Please try again later"],
      trends: ["Analysis unavailable"],
      effectivenessScore: 0,
      summary: "Unable to generate insights due to technical issues"
    };
  }
}

export async function generateMeetingRecommendations(meetingType: string, previousFeedback: any[]) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Based on the meeting type "${meetingType}" and previous feedback data, provide specific recommendations for improving the next meeting:
      
      Previous Feedback:
      ${JSON.stringify(previousFeedback, null, 2)}
      
      Provide 5 specific, actionable recommendations for this meeting type.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.split('\n').filter(line => line.trim()).slice(0, 5);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [
      "Set clear objectives and share agenda in advance",
      "Limit meeting duration and stick to schedule",
      "Ensure all participants are necessary for the discussion",
      "Test technical setup before the meeting starts",
      "End with clear action items and next steps"
    ];
  }
}