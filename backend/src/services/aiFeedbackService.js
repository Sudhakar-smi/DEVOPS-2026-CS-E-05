import { callAI } from './aiProvider.js';
import Feedback from '../models/Feedback.js';

export const analyzeEventFeedback = async (eventId) => {
  const feedbacks = await Feedback.find({ eventId }).populate('userId', 'name email');

  if (!feedbacks || feedbacks.length === 0) {
    return {
      totalResponses: 0,
      averageRating: 0,
      sentimentScore: 0,
      sentiment: 'Neutral',
      positivePoints: [],
      negativePoints: [],
      improvementSuggestions: ['No feedback submitted yet. Share the feedback link with attendees after the event.'],
      categoryBreakdown: {}
    };
  }

  const total = feedbacks.length;
  const avgRating = (feedbacks.reduce((acc, f) => acc + f.rating, 0) / total).toFixed(1);

  // Group by category ratings
  const categoryMap = {};
  feedbacks.forEach(f => {
    const cat = f.category || 'General';
    if (!categoryMap[cat]) categoryMap[cat] = { count: 0, totalRating: 0 };
    categoryMap[cat].count++;
    categoryMap[cat].totalRating += f.rating;
  });

  const categoryBreakdown = {};
  Object.keys(categoryMap).forEach(k => {
    categoryBreakdown[k] = (categoryMap[k].totalRating / categoryMap[k].count).toFixed(1);
  });

  const commentsList = feedbacks.map(f => `Rating ${f.rating}/5 [${f.category || 'General'}]: "${f.comment}"`).join('\n');

  const prompt = `
Analyze the following attendee feedback comments from a real event in strictly valid JSON:

${commentsList}

Output JSON format:
{
  "sentiment": "Positive / Mostly Positive / Mixed / Critical",
  "sentimentScore": 85,
  "summary": "Brief executive sentiment overview",
  "positivePoints": [
    "Clear keynote sessions and strong speaker line-up",
    "High quality food and refreshment stations"
  ],
  "negativePoints": [
    "Long registration line at 9 AM",
    "WiFi drops during workshop B"
  ],
  "improvementSuggestions": [
    "Deploy 2 extra QR check-in desks next year",
    "Provide dedicated 5GHz WiFi SSID for tech tracks"
  ]
}
`;

  const systemInstruction = 'You are an AI Event Analytics and Sentiment Director. Extract real sentiments, recurring complaints, and actionable improvement points in pure JSON.';

  const llmResult = await callAI(prompt, systemInstruction, true);
  if (llmResult && llmResult.positivePoints && Array.isArray(llmResult.positivePoints)) {
    return {
      totalResponses: total,
      averageRating: Number(avgRating),
      ...llmResult,
      categoryBreakdown
    };
  }

  // Heuristic rule-based feedback analyzer
  const positiveFeedbacks = feedbacks.filter(f => f.rating >= 4);
  const criticalFeedbacks = feedbacks.filter(f => f.rating <= 2);
  const sentimentScore = Math.round((positiveFeedbacks.length / total) * 100);

  const positivePoints = positiveFeedbacks.slice(0, 4).map(f => f.comment);
  if (positivePoints.length === 0) positivePoints.push('Event program concluded according to overall schedule.');

  const negativePoints = criticalFeedbacks.slice(0, 4).map(f => f.comment);
  if (negativePoints.length === 0 && feedbacks.length > 0) {
    negativePoints.push('No severe negative complaints logged.');
  }

  const improvementSuggestions = [];
  if (categoryBreakdown['Registration'] && Number(categoryBreakdown['Registration']) < 4.0) {
    improvementSuggestions.push('Streamline entry check-in speed with automated QR scanning stations.');
  }
  if (categoryBreakdown['Catering'] && Number(categoryBreakdown['Catering']) < 4.0) {
    improvementSuggestions.push('Add extra buffet counters and diversify vegan/vegetarian options.');
  }
  if (categoryBreakdown['Venue'] && Number(categoryBreakdown['Venue']) < 4.0) {
    improvementSuggestions.push('Review venue acoustics and temperature control in main conference halls.');
  }
  if (improvementSuggestions.length === 0) {
    improvementSuggestions.push('Maintain high operational standards and retain key vendor partners for subsequent editions.');
  }

  return {
    totalResponses: total,
    averageRating: Number(avgRating),
    sentiment: sentimentScore >= 75 ? 'Highly Positive' : sentimentScore >= 50 ? 'Moderately Positive' : 'Needs Attention',
    sentimentScore,
    summary: `Analyzed ${total} attendee reviews. Average rating: ${avgRating}/5.0 with ${sentimentScore}% positive sentiment.`,
    positivePoints,
    negativePoints,
    improvementSuggestions,
    categoryBreakdown
  };
};
