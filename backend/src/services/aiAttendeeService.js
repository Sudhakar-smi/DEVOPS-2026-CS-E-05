import Event from '../models/Event.js';
import Attendee from '../models/Attendee.js';

export const analyzeEventAttendees = async (eventId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  const attendees = await Attendee.find({ eventId }).populate('userId', 'name email');
  const totalRegistered = attendees.filter(a => a.status !== 'cancelled').length;
  const checkedInCount = attendees.filter(a => a.status === 'checked-in').length;
  const expectedCapacity = event.expectedAttendees || 100;

  const capacityRate = Math.min(100, Math.round((totalRegistered / expectedCapacity) * 100));
  const checkInRate = totalRegistered > 0 ? Math.round((checkedInCount / totalRegistered) * 100) : 0;

  // Expected turnout forecast based on historical industry benchmark (typically ~85-92%)
  const forecastTurnoutRate = Math.min(95, Math.max(75, Math.round(92 - (totalRegistered > expectedCapacity ? 5 : 0))));
  const estimatedArrivals = Math.round(totalRegistered * (forecastTurnoutRate / 100));

  // Required infrastructure calculation
  const registrationDesksNeeded = Math.max(2, Math.ceil(totalRegistered / 120));
  const coordinatorsNeeded = Math.max(4, Math.ceil(totalRegistered / 40));

  // Registration by ticket type or dietary preferences
  const ticketBreakdown = {};
  const dietaryBreakdown = {};
  attendees.forEach(a => {
    const t = a.ticketType || 'General Admission';
    ticketBreakdown[t] = (ticketBreakdown[t] || 0) + 1;

    const d = a.dietaryPreferences || 'Standard';
    dietaryBreakdown[d] = (dietaryBreakdown[d] || 0) + 1;
  });

  const insights = [];
  if (capacityRate >= 90) {
    insights.push({
      type: 'warning',
      title: 'High Capacity Alert',
      message: `Event is at ${capacityRate}% of target capacity (${totalRegistered}/${expectedCapacity}). Consider closing public registrations or expanding hall booking.`
    });
  } else {
    insights.push({
      type: 'info',
      title: 'Healthy Registration Velocity',
      message: `Currently registered ${totalRegistered} attendees (${capacityRate}% of capacity). Projected final turnout: ~${estimatedArrivals} attendees.`
    });
  }

  if (registrationDesksNeeded > 3) {
    insights.push({
      type: 'action',
      title: 'Check-In Queue Optimization',
      message: `Deploy a minimum of ${registrationDesksNeeded} entry desks with separate lines for pre-registered QR holders.`
    });
  }

  return {
    totalRegistered,
    expectedCapacity,
    capacityRate,
    checkedInCount,
    checkInRate,
    forecastTurnoutRate,
    estimatedArrivals,
    registrationDesksNeeded,
    coordinatorsNeeded,
    ticketBreakdown,
    dietaryBreakdown,
    insights
  };
};
