import { callAI } from './aiProvider.js';
import Event from '../models/Event.js';

export const simulateWhatIf = async ({
  eventId,
  currentValues,
  simulatedValues
}) => {
  // If eventId is given, fetch original event if currentValues not fully supplied
  let event = null;
  if (eventId) {
    event = await Event.findById(eventId);
  }

  const origGuests = Number(currentValues?.guests || event?.expectedAttendees || 100);
  const simGuests = Number(simulatedValues.guests ?? origGuests);

  const origBudget = Number(currentValues?.budget || event?.budget || 100000);
  const simBudget = Number(simulatedValues.budget ?? origBudget);

  const origDuration = currentValues?.duration || event?.duration || '1 day';
  const simDuration = simulatedValues.duration || origDuration;

  const eventType = currentValues?.type || event?.type || 'Conference';
  const location = simulatedValues.location || currentValues?.location || event?.location || 'Venue';

  const guestDelta = simGuests - origGuests;
  const budgetDelta = simBudget - origBudget;

  const prompt = `
Perform an analytical What-If Event Simulation comparison strictly in JSON.
Original Event State:
- Type: ${eventType}
- Guests: ${origGuests}
- Budget: INR ${origBudget}
- Duration: ${origDuration}

Simulated Changes:
- Guests: ${simGuests} (Delta: ${guestDelta >= 0 ? '+' : ''}${guestDelta})
- Budget: INR ${simBudget} (Delta: ${budgetDelta >= 0 ? '+' : ''}${budgetDelta})
- Duration: ${simDuration}
- Location: ${location}

Return JSON with exact fields:
{
  "summary": "Brief executive analysis of the simulation impact",
  "resourceDeltas": [
    { "item": "Organizing Volunteers", "original": "8", "simulated": "14", "delta": "+6 volunteers", "reason": "Higher guest ratio" }
  ],
  "financialImpact": {
    "estimatedAdditionalCost": 35000,
    "costPerHead": 450,
    "feasibility": "Feasible / Deficit Alert / Optimal",
    "budgetStatus": "Adequate / Under-budgeted by INR X"
  },
  "riskAssessment": [
    { "risk": "Venue Capacity Limit", "severity": "High", "mitigation": "Verify hall square footage" }
  ],
  "recommendations": [
    "Add 2 fast registration counters",
    "Increase catering buffer by 40 meals"
  ]
}
`;

  const systemInstruction = 'You are a quantitative event operations simulation engine. Return precise mathematical impacts and resource deltas in pure JSON.';

  const llmResult = await callAI(prompt, systemInstruction, true);
  if (llmResult && llmResult.resourceDeltas && Array.isArray(llmResult.resourceDeltas)) {
    return {
      original: { guests: origGuests, budget: origBudget, duration: origDuration, eventType, location },
      simulated: { guests: simGuests, budget: simBudget, duration: simDuration, eventType, location },
      deltas: { guestDelta, budgetDelta },
      analysis: llmResult
    };
  }

  // High-precision mathematical deterministic simulation engine
  const origVolunteers = Math.max(4, Math.ceil(origGuests / 40));
  const simVolunteers = Math.max(4, Math.ceil(simGuests / 40));
  const volDelta = simVolunteers - origVolunteers;

  const origCounters = Math.max(2, Math.ceil(origGuests / 120));
  const simCounters = Math.max(2, Math.ceil(simGuests / 120));
  const counterDelta = simCounters - origCounters;

  const origMeals = Math.round(origGuests * 1.08);
  const simMeals = Math.round(simGuests * 1.08);
  const mealDelta = simMeals - origMeals;

  const origChairs = Math.round(origGuests * 1.05);
  const simChairs = Math.round(simGuests * 1.05);
  const chairDelta = simChairs - origChairs;

  // Estimated per head variable costs based on event type
  let estPerHeadVariable = 550;
  if (eventType.toLowerCase().includes('wedding')) estPerHeadVariable = 1200;
  else if (eventType.toLowerCase().includes('hackathon')) estPerHeadVariable = 450;
  else if (eventType.toLowerCase().includes('concert')) estPerHeadVariable = 300;
  else if (eventType.toLowerCase().includes('sports')) estPerHeadVariable = 350;

  const estAdditionalCost = guestDelta > 0 ? guestDelta * estPerHeadVariable : 0;
  const netSurplusOrDeficit = simBudget - (origBudget + estAdditionalCost);

  const resourceDeltas = [
    {
      item: 'Organizing Staff / Volunteers',
      original: `${origVolunteers} members`,
      simulated: `${simVolunteers} members`,
      delta: `${volDelta >= 0 ? '+' : ''}${volDelta} coordinators`,
      reason: `Maintaining 1:40 coordinator-to-guest crowd management ratio.`
    },
    {
      item: 'Registration & Check-In Desks',
      original: `${origCounters} counters`,
      simulated: `${simCounters} counters`,
      delta: `${counterDelta >= 0 ? '+' : ''}${counterDelta} counters`,
      reason: `Prevents entry queue delays for ${simGuests} attendees.`
    },
    {
      item: 'Catering / Meals (incl. 8% buffer)',
      original: `${origMeals} plates`,
      simulated: `${simMeals} plates`,
      delta: `${mealDelta >= 0 ? '+' : ''}${mealDelta} plates`,
      reason: `Variable food requirement scaling with guest headcount.`
    },
    {
      item: 'Seating & Furniture',
      original: `${origChairs} chairs`,
      simulated: `${simChairs} chairs`,
      delta: `${chairDelta >= 0 ? '+' : ''}${chairDelta} chairs`,
      reason: `Direct seating setup for auditorium/dining area.`
    }
  ];

  const riskAssessment = [];
  if (guestDelta > 150) {
    riskAssessment.push({
      risk: 'Venue Maximum Capacity & Fire Safety Threshold',
      severity: 'High',
      mitigation: `Ensure venue carpet area accommodates at least ${Math.round(simGuests * 12)} sq.ft with emergency exits.`
    });
    riskAssessment.push({
      risk: 'Entry Queue Chokepoints',
      severity: 'Medium',
      mitigation: `Increase active check-in desks to ${simCounters} and deploy pre-printed attendee ID passes.`
    });
  }

  if (netSurplusOrDeficit < 0) {
    riskAssessment.push({
      risk: `Budget Deficit Alert of ₹${Math.abs(netSurplusOrDeficit).toLocaleString('en-IN')}`,
      severity: 'Critical',
      mitigation: `The simulated guest increase requires an estimated additional ₹${estAdditionalCost.toLocaleString('en-IN')}. Increase sanctioned budget or reduce discretionary decor/swag line items.`
    });
  } else {
    riskAssessment.push({
      risk: 'Healthy Financial Coverage',
      severity: 'Low',
      mitigation: `Budget allocation adequately supports the simulated configuration with ₹${netSurplusOrDeficit.toLocaleString('en-IN')} contingency cushion.`
    });
  }

  const recommendations = [
    `Update catering contract to minimum guarantee of ${simMeals} plates at least 72 hours before the event.`,
    `Deploy ${simCounters} registration counters to maintain average check-in speed under 12 seconds per attendee.`,
    simBudget >= (origBudget + estAdditionalCost) 
      ? `Allocate ₹${estAdditionalCost.toLocaleString('en-IN')} from the increased budget directly towards catering and seating expansion.`
      : `Re-allocate funds from marketing or high-end decor to cover essential food and venue expansion.`
  ];

  const analysis = {
    summary: `Simulating ${simGuests} guests (vs ${origGuests}) with budget ₹${simBudget.toLocaleString('en-IN')} (vs ₹${origBudget.toLocaleString('en-IN')}). Expected variable expenditure impact: ₹${estAdditionalCost.toLocaleString('en-IN')}.`,
    resourceDeltas,
    financialImpact: {
      estimatedAdditionalCost: estAdditionalCost,
      costPerHead: estPerHeadVariable,
      feasibility: netSurplusOrDeficit >= 0 ? 'Fully Feasible' : 'Budget Deficit Expected',
      budgetStatus: netSurplusOrDeficit >= 0 
        ? `Surplus / Contingency Cushion of ₹${netSurplusOrDeficit.toLocaleString('en-IN')}` 
        : `Deficit of ₹${Math.abs(netSurplusOrDeficit).toLocaleString('en-IN')}`
    },
    riskAssessment,
    recommendations
  };

  return {
    original: { guests: origGuests, budget: origBudget, duration: origDuration, eventType, location },
    simulated: { guests: simGuests, budget: simBudget, duration: simDuration, eventType, location },
    deltas: { guestDelta, budgetDelta },
    analysis
  };
};
