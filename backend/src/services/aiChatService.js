import { callAI } from './aiProvider.js';
import Event from '../models/Event.js';
import Budget from '../models/Budget.js';
import Task from '../models/Task.js';
import Attendee from '../models/Attendee.js';
import Schedule from '../models/Schedule.js';
import AIPlan from '../models/AIPlan.js';

export const handleAIChat = async ({ eventId, message, conversationHistory = [] }) => {
  let eventContext = null;
  let budgetStats = { totalBudget: 0, planned: 0, actual: 0, remaining: 0 };
  let taskStats = { total: 0, completed: 0, pending: 0 };
  let attendeeCount = 0;
  let event = null;

  if (eventId) {
    event = await Event.findById(eventId);
    if (event) {
      const budgets = await Budget.find({ eventId });
      const plannedSum = budgets.reduce((acc, b) => acc + (b.plannedAmount || 0), 0);
      const actualSum = budgets.reduce((acc, b) => acc + (b.actualAmount || 0), 0);
      budgetStats = {
        totalBudget: event.budget,
        planned: plannedSum,
        actual: actualSum,
        remaining: event.budget - actualSum
      };

      const tasks = await Task.find({ eventId });
      taskStats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status !== 'completed').length
      };

      attendeeCount = await Attendee.countDocuments({ eventId, status: { $ne: 'cancelled' } });
      const aiPlan = await AIPlan.findOne({ eventId }).sort({ createdAt: -1 });

      eventContext = {
        name: event.name,
        type: event.type,
        location: event.location,
        date: event.date,
        duration: event.duration,
        budget: event.budget,
        expectedAttendees: event.expectedAttendees,
        currentRegistrations: attendeeCount,
        budgetPlanned: plannedSum,
        budgetSpent: actualSum,
        budgetRemaining: event.budget - actualSum,
        tasksTotal: taskStats.total,
        tasksCompleted: taskStats.completed,
        tasksPending: taskStats.pending,
        aiPlanSummary: aiPlan?.summary || 'No AI plan generated yet'
      };
    }
  }

  const prompt = `
User Query: "${message}"

${eventContext ? `
CURRENT EVENT DATABASE CONTEXT:
- Name: ${eventContext.name}
- Type: ${eventContext.type}
- Location: ${eventContext.location}
- Expected Attendees: ${eventContext.expectedAttendees}
- Current Confirmed Registrations: ${eventContext.currentRegistrations}
- Total Allocated Budget: INR ${eventContext.budget.toLocaleString('en-IN')}
- Total Planned Spending: INR ${eventContext.budgetPlanned.toLocaleString('en-IN')}
- Total Actual Spent: INR ${eventContext.budgetSpent.toLocaleString('en-IN')}
- Remaining Budget: INR ${eventContext.budgetRemaining.toLocaleString('en-IN')}
- Tasks Progress: ${eventContext.tasksCompleted} of ${eventContext.tasksTotal} completed (${eventContext.tasksPending} pending)
` : 'No specific event selected. Answer generally as an expert event management consultant.'}

Provide a concise, practical, authoritative response with concrete figures and actionable advice.
`;

  const systemInstruction = 'You are the AI Event Assistant for organizers. Use the actual event database numbers provided. Give crisp, well-formatted answers with bullet points and realistic calculations.';

  const llmResponse = await callAI(prompt, systemInstruction, false);
  if (llmResponse && typeof llmResponse === 'string' && llmResponse.trim().length > 10) {
    return { response: llmResponse, eventContext };
  }

  // Intelligent Contextual Heuristic Fallback
  const fallbackResponse = generateHeuristicChatResponse(message, event, budgetStats, taskStats, attendeeCount);
  return { response: fallbackResponse, eventContext };
};

const generateHeuristicChatResponse = (query, event, budgetStats, taskStats, attendeeCount) => {
  const q = (query || '').toLowerCase();

  if (!event) {
    return "Hello! I am your AI Event Planning Assistant. Please open a specific event in your dashboard to ask tailored questions regarding budget, guest volume changes, schedules, resource allocation, and risk management.";
  }

  const guests = event.expectedAttendees || 100;
  const budget = event.budget || 50000;
  const eventName = event.name;

  // Food / Catering Questions (English and Hinglish)
  if (
    q.includes('food') ||
    q.includes('catering') ||
    q.includes('meal') ||
    q.includes('lunch') ||
    q.includes('dinner') ||
    q.includes('khana') ||
    q.includes('khane') ||
    q.includes('bhojan')
  ) {
    const mealBuffer = Math.round(guests * 1.08);
    const estFoodCost = Math.round(budget * 0.32);
    return `### 🍽️ Catering & Food Arrangement for ${guests} Guests (${eventName})\n\n` +
      `- **Target Meal Plates (with 8% safety cushion):** **${mealBuffer} plates**\n` +
      `- **Estimated Catering Budget Allocation:** ₹${estFoodCost.toLocaleString('en-IN')} (~₹${Math.round(estFoodCost / mealBuffer)} per plate)\n` +
      `- **Buffet Counters Required:** **${Math.max(2, Math.ceil(guests / 80))} dual-sided counters** (maintains queue wait time < 4 minutes)\n` +
      `- **Drinking Water Requirement:** ${Math.round(guests * 2.5)} Liters (${Math.ceil(guests * 2.5 / 20)} x 20L dispensers)\n` +
      `- **Live Cooking / Snack Stations:** ${Math.max(1, Math.ceil(guests / 150))} live counters\n\n` +
      `**💡 Pro-Tip:** Reconfirm the guaranteed plate count with your caterer 48 hours prior to the event date to lock final per-head billing.`;
  }

  // Budget / Financial Health Questions
  if (
    q.includes('budget') ||
    q.includes('cost') ||
    q.includes('money') ||
    q.includes('spent') ||
    q.includes('utilization') ||
    q.includes('paisa') ||
    q.includes('kharcha') ||
    q.includes('bacha')
  ) {
    const utilization = budgetStats.totalBudget > 0 ? Math.round((budgetStats.actual / budgetStats.totalBudget) * 100) : 0;
    return `### 💰 Budget Financial Analysis for "${eventName}"\n\n` +
      `- **Total Sanctioned Budget:** ₹${budget.toLocaleString('en-IN')}\n` +
      `- **Planned Allocations:** ₹${budgetStats.planned.toLocaleString('en-IN')}\n` +
      `- **Actual Spend Logged:** ₹${budgetStats.actual.toLocaleString('en-IN')}\n` +
      `- **Remaining Balance:** **₹${budgetStats.remaining.toLocaleString('en-IN')}** (${100 - utilization}% available)\n\n` +
      `**Status:** ${
        utilization > 85
          ? '⚠️ **Overrun Risk:** Actual expenditures are nearing total ceiling. Lock miscellaneous expenses immediately.'
          : '✅ **Healthy Utilization:** Spending is within safe operational limits. Ensure an 8% contingency buffer remains untouched.'
      }`;
  }

  // Volunteer & Staffing Questions
  if (
    q.includes('volunteer') ||
    q.includes('staff') ||
    q.includes('team') ||
    q.includes('coordinator') ||
    q.includes('manpower')
  ) {
    const volunteersNeeded = Math.max(4, Math.ceil(guests / 40));
    const countersNeeded = Math.max(2, Math.ceil(guests / 120));
    return `### 👥 Staffing & Volunteer Requirements for ${guests} Guests\n\n` +
      `- **Required Volunteers / Coordinators:** **${volunteersNeeded} team members** (Ratio: 1 coordinator per 40 guests)\n` +
      `- **Registration & Check-In Desk Staff:** **${countersNeeded * 2} staff** (${countersNeeded} counters x 2 persons)\n` +
      `- **Floor & Crowd Navigation Leads:** ${Math.max(2, Math.ceil(guests / 100))} coordinators\n` +
      `- **A/V & Stage Tech Liaison:** 2 technical coordinators\n\n` +
      `**Recommendation:** Conduct a mandatory 30-minute volunteer walkthrough 2 hours before gates open.`;
  }

  // Headcount Surge / What-If in chat
  if (
    q.includes('increase') ||
    q.includes('extra') ||
    q.includes('more guests') ||
    q.includes('added') ||
    q.includes('badha')
  ) {
    return `### 📈 Headcount Surge Impact Analysis for "${eventName}"\n\n` +
      `If your attendance increases by **+100 guests**:\n` +
      `- **Additional Meals:** +108 plates (~₹${Math.round(108 * 350).toLocaleString('en-IN')})\n` +
      `- **Additional Seating:** +105 chairs\n` +
      `- **Additional Volunteers:** +2 to 3 coordinators\n` +
      `- **Check-in Counters:** +1 fast-track desk to avoid queue delays\n\n` +
      `*Tip: Use the **What-If Simulator** tab in your workspace to model different headcount scenarios and apply changes directly!*`;
  }

  // Risk / Safety Questions
  if (
    q.includes('risk') ||
    q.includes('safety') ||
    q.includes('emergency') ||
    q.includes('problem') ||
    q.includes('khatra')
  ) {
    return `### ⚠️ Top Operational Risks Identified for "${eventName}" (${event.type})\n\n` +
      `1. **Peak Entry Congestion:** ${guests} guests arriving simultaneously between 08:45 AM - 09:30 AM. *Mitigation: Deploy ${Math.max(2, Math.ceil(guests / 120))} QR-scanning counters.*\n` +
      `2. **AV & Tech Interruptions:** Projector / wireless mic signal drop during primary sessions. *Mitigation: Keep 2 wired backup mics & tested HDMI adapters at sound booth.*\n` +
      `3. **Catering Peak Overload:** Long lunch line delays. *Mitigation: Open ${Math.max(2, Math.ceil(guests / 80))} dual-sided buffet lines with clear entry/exit signs.*`;
  }

  // Task & Execution Status
  if (q.includes('task') || q.includes('todo') || q.includes('pending') || q.includes('progress')) {
    const progress = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;
    return `### 📋 Task Execution Status for "${eventName}"\n\n` +
      `- **Total Tasks:** ${taskStats.total}\n` +
      `- **Completed:** ${taskStats.completed} (${progress}%)\n` +
      `- **Pending:** ${taskStats.pending}\n\n` +
      `**Next Action:** Check the Tasks tab to resolve critical priority deadlines due within the next 48 hours.`;
  }

  // Default Assistant Summary
  return `### 🤖 Assistant Insights for "${eventName}"\n\n` +
    `Here is your real-time operational summary for **${event.type}** in **${event.location}**:\n\n` +
    `- **Capacity:** ${attendeeCount} registered / ${guests} target guests\n` +
    `- **Staffing Baseline:** ${Math.max(4, Math.ceil(guests / 40))} volunteers & ${Math.max(2, Math.ceil(guests / 120))} registration desks\n` +
    `- **Budget Logged:** ₹${budgetStats.actual.toLocaleString('en-IN')} of ₹${budget.toLocaleString('en-IN')} total\n` +
    `- **Task Completion:** ${taskStats.completed}/${taskStats.total} completed\n\n` +
    `*Try asking: "How much food should I arrange?", "What are the top risks?", or "How many volunteers are required?"*`;
};
