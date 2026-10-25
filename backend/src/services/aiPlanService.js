import { callAI } from './aiProvider.js';

/**
 * Generate a complete, structured AI Event Plan
 */
export const generateEventPlan = async (eventData) => {
  const {
    name,
    type,
    categoryGroup,
    budget = 100000,
    expectedAttendees = 100,
    duration = '1 day',
    location = 'City Venue',
    preferences = {},
    requirements = ''
  } = eventData;

  const numBudget = Number(budget);
  const numGuests = Number(expectedAttendees);

  const prompt = `
Generate a comprehensive, production-ready event plan in strictly valid JSON for the following event:
- Event Name: ${name}
- Event Type: ${type} (Category: ${categoryGroup || 'General'})
- Expected Guests/Attendees: ${numGuests}
- Total Budget: INR ${numBudget}
- Duration: ${duration}
- Location: ${location}
- Preferences: Catering: ${preferences.cateringType || 'Standard'}, Theme: ${preferences.theme || 'Modern'}, Venue: ${preferences.indoorOutdoor || 'Indoor'}
- Additional Requirements: ${requirements || 'None'}

Return ONLY a JSON object matching this exact structure:
{
  "summary": "2-3 sentences overview of the strategic plan",
  "budgetPlan": [
    { "category": "Venue", "amount": 30000, "percentage": 30, "description": "...", "priority": "High" }
  ],
  "schedule": [
    { "day": 1, "time": "09:00 AM", "activity": "Registration & Welcome", "description": "...", "location": "Main Lobby" }
  ],
  "resources": [
    { "item": "Event Volunteers", "quantity": "8 persons", "category": "Staffing", "notes": "..." }
  ],
  "checklist": [
    { "task": "Book venue and confirm AV setup", "category": "Venue", "timeline": "2 weeks before", "completed": false }
  ],
  "risks": [
    { "title": "Registration Bottleneck", "severity": "High", "reason": "High attendee volume", "recommendation": "Set up multiple QR scan desks", "mitigation": "Deploy 4 fast-track registration counters" }
  ],
  "recommendations": [
    { "title": "Catering Buffer", "category": "Catering", "explanation": "...", "action": "..." }
  ]
}

Ensure the sum of all amounts in budgetPlan is strictly <= INR ${numBudget}.
`;

  const systemInstruction = `You are an elite event planning AI director. Provide realistic, category-specific figures and practical schedules for ${type}. Always respond in pure JSON.`;

  const llmResult = await callAI(prompt, systemInstruction, true);
  if (llmResult && llmResult.budgetPlan && Array.isArray(llmResult.budgetPlan)) {
    return normalizePlan(llmResult, numBudget, numGuests);
  }

  // High-precision heuristic fallback engine
  return generateHeuristicPlan({
    name,
    type,
    categoryGroup,
    budget: numBudget,
    expectedAttendees: numGuests,
    duration,
    location,
    preferences,
    requirements
  });
};

const normalizePlan = (plan, totalBudget, guests) => {
  const sum = plan.budgetPlan.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  if (sum > 0) {
    plan.budgetPlan = plan.budgetPlan.map(item => ({
      ...item,
      amount: Math.round((Number(item.amount) / sum) * totalBudget),
      percentage: Math.round(((Number(item.amount) / sum) * 100))
    }));
  }
  return plan;
};

/**
 * Intelligent Domain-Specific Heuristic Planner Engine
 */
export const generateHeuristicPlan = ({
  name,
  type,
  categoryGroup = 'Personal',
  budget,
  expectedAttendees,
  duration,
  location,
  preferences = {},
  requirements = ''
}) => {
  const normType = (type || '').toLowerCase();
  const days = duration.includes('2 day') ? 2 : duration.includes('3 day') ? 3 : duration.includes('5 day') || duration.includes('week') ? 5 : 1;

  // 1. Budget Breakdown Ratios by Specific Event Category
  let ratios = {};
  if (normType.includes('wedding') || normType.includes('anniversary') || normType.includes('marriage')) {
    ratios = {
      'Catering & Royal Banquet': 0.32,
      'Venue & Heritage Palace / Resort': 0.28,
      'Decoration, Mandap & Floral': 0.13,
      'Photography & Cinematography': 0.09,
      'Music, Sangeet & Entertainment': 0.07,
      'Guest Hospitality & Transport': 0.05,
      'Contingency Buffer': 0.06
    };
  } else if (normType.includes('hackathon') || normType.includes('tech') || normType.includes('coding')) {
    ratios = {
      'Catering (Meals, Pizza & Energy Drinks)': 0.28,
      'Venue & Gigabit WiFi / LAN Network': 0.22,
      'Prizes, Cash Awards & Winner Grants': 0.22,
      'Swag, T-Shirts & Badge Kits': 0.10,
      'Mentors & Judges Hospitality': 0.08,
      'Server Cloud Credits & Tech Buffer': 0.10
    };
  } else if (normType.includes('sport') || normType.includes('tournament') || normType.includes('cricket') || normType.includes('football')) {
    ratios = {
      'Sports Arena / Grounds & Stadium Booking': 0.30,
      'Referees, Umpires & Paramedic Team': 0.20,
      'Trophies, Medals & Cash Prizes': 0.18,
      'Hydration, Energy Food & Athlete Catering': 0.16,
      'Sports Equipment, Kits & Scoreboards': 0.10,
      'First Aid & Ambulance Standby Buffer': 0.06
    };
  } else if (normType.includes('concert') || normType.includes('music') || normType.includes('festival')) {
    ratios = {
      'Artist / Performer Fees': 0.35,
      'Stage, Lighting & Pro Sound AV Rig': 0.25,
      'Venue, Barricades & Permits': 0.15,
      'Security Bouncers & Crowd Marshals': 0.10,
      'Ticketing, PR & Digital Marketing': 0.08,
      'Emergency Medical Team': 0.07
    };
  } else if (normType.includes('conference') || normType.includes('summit') || normType.includes('corporate')) {
    ratios = {
      'Venue & Main Plenary Hall': 0.30,
      'Executive Buffet & Coffee Breaks': 0.25,
      'AV, LED Wall & Live Streaming': 0.18,
      'Speaker Hospitality & Honorariums': 0.12,
      'Delegate Badges & Stationery Kits': 0.08,
      'Contingency Reserve': 0.07
    };
  } else {
    // Balanced generic / custom event ratios
    ratios = {
      'Venue & Hall Rental': 0.30,
      'Catering & Refreshments': 0.30,
      'Decoration & Setup': 0.14,
      'Audio / Visual & Technology': 0.10,
      'Photography & Media Coverage': 0.08,
      'Contingency Buffer': 0.08
    };
  }

  const budgetPlan = Object.entries(ratios).map(([category, ratio]) => {
    const amount = Math.round(budget * ratio);
    return {
      category,
      amount,
      percentage: Math.round(ratio * 100),
      description: `Target allocation for ${category.toLowerCase()} scaled for ${expectedAttendees} attendees in ${location}.`,
      priority: ratio >= 0.15 ? 'High' : 'Medium'
    };
  });

  // 2. Day-wise Schedule Itinerary by Event Category
  const schedule = [];
  for (let d = 1; d <= days; d++) {
    if (normType.includes('wedding') || normType.includes('marriage')) {
      schedule.push(
        { day: d, time: '09:00 AM', activity: d === 1 ? 'Guest Arrival & Welcome Drinks' : 'Haldi & Chooda Ceremony', description: 'Traditional welcome with garland and welcome refreshments', location: 'Palace Courtyard' },
        { day: d, time: '12:30 PM', activity: 'Royal Festive Lunch', description: 'Curated multi-cuisine festive banquet', location: 'Dining Pavilion' },
        { day: d, time: '04:30 PM', activity: d === 1 ? 'Mehendi & Sangeet Setup / Photoshoot' : 'Baraat Procession & Milni', description: 'Musical dance performances and ceremonial entrance', location: 'Main Lawn' },
        { day: d, time: '07:30 PM', activity: d === 1 ? 'Sangeet & Cocktail Night' : 'Main Wedding Rituals (Varmala & Pheras)', description: 'Grand stage performances followed by wedding rituals', location: 'Grand Ballroom' },
        { day: d, time: '10:00 PM', activity: 'Gala Wedding Dinner & Celebrations', description: 'Fine dining banquet with family photo sessions', location: 'Royal Banquet Hall' }
      );
    } else if (normType.includes('hackathon') || normType.includes('coding') || normType.includes('tech')) {
      schedule.push(
        { day: d, time: '08:30 AM', activity: `Day ${d} Participant Check-In & Breakfast`, description: 'Badge scanning, WiFi credentials, and team kit handover', location: 'Registration Desk' },
        { day: d, time: '10:00 AM', activity: d === 1 ? 'Opening Keynote & Challenge Release' : 'Midway Prototype Code Review', description: 'Problem tracks briefing and mentor assignment', location: 'Main Auditorium' },
        { day: d, time: '01:00 PM', activity: 'Networking Lunch Buffet', description: 'Nutritious meal and mentor sync', location: 'Dining Hall' },
        { day: d, time: '04:30 PM', activity: d === 1 ? 'API Workshops & Sponsor Tech Talks' : 'Pitch Deck & Demo Prep Session', description: 'Hands-on tech demos and judging rubric review', location: 'Workshop Stage B' },
        { day: d, time: '08:00 PM', activity: 'Midnight Sprint Dinner & Red Bull Station', description: 'Dinner, energy drinks and continuous coding sprint', location: 'Main Hacking Arena' }
      );
    } else if (normType.includes('sport') || normType.includes('tournament')) {
      schedule.push(
        { day: d, time: '07:30 AM', activity: `Day ${d} Team Registration & Medical Check`, description: 'Athlete weight-in, jersey inspection, and doctor checkup', location: 'Clubhouse Foyer' },
        { day: d, time: '09:00 AM', activity: d === 1 ? 'Inaugural March-Past & Fixture Kickoff' : 'Quarter-Final Knockout Rounds', description: 'Referee briefing and opening round matches', location: 'Main Grounds' },
        { day: d, time: '01:00 PM', activity: 'High-Protein Athlete Lunch & Recovery', description: 'Hydration and recovery lunch for players and officials', location: 'Sports Cafeteria' },
        { day: d, time: '03:30 PM', activity: d === days ? 'Grand Finale Championship Match' : 'Semi-Final Matches', description: 'Peak championship match with live commentary', location: 'Stadium Arena' },
        { day: d, time: '06:30 PM', activity: 'Trophy Presentation & Awards Ceremony', description: 'Distribution of cups, medals, player of the match awards', location: 'Presentation Podium' }
      );
    } else {
      schedule.push(
        { day: d, time: '09:00 AM', activity: 'Registration & Welcome Coffee', description: 'Check-in pass verification and welcome pack distribution', location: 'Reception Foyer' },
        { day: d, time: '10:30 AM', activity: 'Inaugural Keynote & Objectives Briefing', description: 'Opening address and strategic overview', location: 'Main Auditorium' },
        { day: d, time: '01:00 PM', activity: 'Networking Lunch Buffet', description: 'Curated meal and peer-to-peer discussions', location: 'Dining Area' },
        { day: d, time: '03:00 PM', activity: 'Core Activity Sessions & Panel Discussions', description: 'Subject matter expert presentations', location: 'Stage Hall' },
        { day: d, time: '06:00 PM', activity: 'Closing Remarks & Networking Reception', description: 'Summary of outcomes, awards, and networking tea', location: 'Lounge' }
      );
    }
  }

  // 3. Domain-Specific Resource Calculations
  const volunteers = Math.max(4, Math.ceil(expectedAttendees / 40));
  const registrationCounters = Math.max(2, Math.ceil(expectedAttendees / 120));
  const mealCount = Math.round(expectedAttendees * 1.08 * days);
  const chairCount = Math.round(expectedAttendees * 1.05);

  let resources = [];
  if (normType.includes('wedding') || normType.includes('marriage')) {
    resources = [
      { item: 'Guest Hospitality & Ushers', quantity: `${volunteers} coordinators`, category: 'Staffing', notes: 'Dedicated ushers for guest reception and room check-in.' },
      { item: 'Welcome & Shagun Desks', quantity: `${registrationCounters} counters`, category: 'Logistics', notes: 'Guest registration, key distribution, and gift management.' },
      { item: 'Catering & Banquet (incl. 8% buffer)', quantity: `${mealCount} plates`, category: 'Food & Beverage', notes: 'Curated multi-cuisine festive banquet per meal cycle.' },
      { item: 'Banquet Seating & Sofas', quantity: `${chairCount} chairs + 20 VIP sofas`, category: 'Furniture', notes: 'Stage lounge seating and round tables.' },
      { item: 'Bridal Green Room & Makeup Lounge', quantity: '2 VIP Suites', category: 'Venue', notes: 'Air-conditioned vanity suites with mirrors and power backups.' },
      { item: 'Photography & 4K Drone Rig', quantity: '4 Photographers + 1 Drone', category: 'Media', notes: 'Full wedding cinematography and candid photography team.' }
    ];
  } else if (normType.includes('hackathon') || normType.includes('tech')) {
    resources = [
      { item: 'Technical Mentors & Organizers', quantity: `${volunteers} team members`, category: 'Staffing', notes: 'Available 24/7 across AI, Web3, Cloud, and Mobile tracks.' },
      { item: 'Fast-Track Badge Desks', quantity: `${registrationCounters} counters`, category: 'Logistics', notes: 'Barcode pass scanning and swag bag distribution.' },
      { item: 'Hacker Catering & Midnight Pizza', quantity: `${mealCount} meal boxes`, category: 'Food & Beverage', notes: 'Includes continuous coffee, energy drinks, and midnight snacks.' },
      { item: 'High-Speed Dedicated Gigabit WiFi', quantity: '2 Primary + 1 Backup ISP Line', category: 'Tech Infrastructure', notes: 'Minimum 1 Gbps symmetric leased line with load balancing.' },
      { item: 'Heavy-Duty Power Extension Strips', quantity: `${Math.ceil(expectedAttendees / 3)} multi-plug strips`, category: 'Equipment', notes: 'Surge-protected 16A strips for laptop and device charging.' },
      { item: 'Hardware & Cloud Credits Bank', quantity: `${expectedAttendees} Cloud Vouchers`, category: 'Tech Resources', notes: 'API access keys and cloud server credits for teams.' }
    ];
  } else if (normType.includes('sport') || normType.includes('tournament')) {
    resources = [
      { item: 'Certified Referees & Umpires', quantity: `${Math.max(4, Math.ceil(expectedAttendees / 100))} officials`, category: 'Officials', notes: 'Federation certified match officials and linesmen.' },
      { item: 'Paramedics & Ambulance on Standby', quantity: '1 ICU Ambulance + 4 Paramedics', category: 'Medical & Safety', notes: 'Stationed field-side for immediate sports injury treatment.' },
      { item: 'Hydration Stations & Electrolytes', quantity: `${Math.round(expectedAttendees * 3)} Liters Water + ORS`, category: 'Athlete Health', notes: 'Chilled water dispensers and isotonic energy drinks at every dugout.' },
      { item: 'Official Sports Equipment & Match Balls', quantity: 'Complete Tournament Kit', category: 'Equipment', notes: 'Regulation balls, nets, boundary cones, and electronic scoreboards.' },
      { item: 'Player Dugouts & Spectator Bleachers', quantity: `${chairCount} seats`, category: 'Infrastructure', notes: 'Covered seating for teams and general audience.' },
      { item: 'Championship Trophies & Medals', quantity: '1 Winner Cup + 1 Runner-up + Medals', category: 'Awards', notes: 'Custom engraved brass trophies and participation certificates.' }
    ];
  } else {
    resources = [
      { item: 'Organizing Staff & Volunteers', quantity: `${volunteers} team members`, category: 'Staffing', notes: 'Ratio of 1 coordinator per 40 guests for smooth crowd navigation.' },
      { item: 'Registration & Verification Desks', quantity: `${registrationCounters} counters`, category: 'Logistics', notes: 'Prevents bottleneck queues during morning entry window.' },
      { item: 'Catering / Meals (incl. 8% buffer)', quantity: `${mealCount} meal plates`, category: 'Food & Beverage', notes: 'Includes standard 8% safety cushion for unexpected attendees.' },
      { item: 'Seating & Chairs', quantity: `${chairCount} chairs`, category: 'Furniture', notes: 'Auditorium seating capacity with 5% reserve buffer.' },
      { item: 'Audio-Visual System & Microphones', quantity: 'Dual PA System + Wireless Mics', category: 'AV & Tech', notes: 'High-clarity speech sound system with HDMI projection.' },
      { item: 'First Aid & Medical Emergency Kit', quantity: '2 Standard Medical Kits', category: 'Safety', notes: 'Stationed at central help desk with basic trauma kit.' }
    ];
  }

  // 4. Domain-Specific Checklist
  let checklist = [];
  if (normType.includes('wedding')) {
    checklist = [
      { task: 'Confirm palace / resort booking with room blocking', category: 'Venue', timeline: '8 weeks before', completed: true },
      { task: 'Finalize traditional banquet menu & tasting session', category: 'Catering', timeline: '4 weeks before', completed: false },
      { task: 'Book Mehendi artist, DJ sound rig & Sangeet choreographer', category: 'Entertainment', timeline: '3 weeks before', completed: false },
      { task: 'Send physical wedding cards & digital QR invitation passes', category: 'Invitations', timeline: '3 weeks before', completed: false },
      { task: 'Confirm floral mandap, entrance stage & lighting design', category: 'Decor', timeline: '1 week before', completed: false },
      { task: 'Coordinate bridal makeup artist & photoshoot schedule', category: 'Hospitality', timeline: '2 days before', completed: false },
      { task: 'Inspect guest welcome kits and transportation fleet', category: 'Logistics', timeline: '1 day before', completed: false }
    ];
  } else if (normType.includes('hackathon')) {
    checklist = [
      { task: 'Finalize hackathon venue, 24/7 access permits & overnight security', category: 'Venue', timeline: '6 weeks before', completed: true },
      { task: 'Partner with cloud sponsors for student server credits & APIs', category: 'Sponsorship', timeline: '4 weeks before', completed: false },
      { task: 'Confirm 1 Gbps redundant ISP leased line & power backup generator', category: 'Tech Infrastructure', timeline: '2 weeks before', completed: false },
      { task: 'Order hacker t-shirts, ID badges, and participation swag', category: 'Merchandise', timeline: '2 weeks before', completed: false },
      { task: 'Onboard industry judges and technical problem statement mentors', category: 'Mentors', timeline: '10 days before', completed: false },
      { task: 'Setup live Discord / Slack server and check-in QR scanner desks', category: 'Logistics', timeline: '2 days before', completed: false },
      { task: 'Dry-run projector, audio mic, and live demo judging scoring sheet', category: 'Operations', timeline: 'Day of event', completed: false }
    ];
  } else if (normType.includes('sport')) {
    checklist = [
      { task: 'Book stadium grounds, cricket pitch / football turf & locker rooms', category: 'Venue', timeline: '6 weeks before', completed: true },
      { task: 'Hire certified federation match referees and scorekeepers', category: 'Officials', timeline: '3 weeks before', completed: false },
      { task: 'Reserve on-site ICU ambulance and paramedic first aid team', category: 'Medical', timeline: '2 weeks before', completed: false },
      { task: 'Procure regulation match balls, team jerseys, and whistle kits', category: 'Equipment', timeline: '2 weeks before', completed: false },
      { task: 'Draw tournament match brackets and release fixture timetable', category: 'Fixtures', timeline: '1 week before', completed: false },
      { task: 'Set up player hydration stations and electrolyte supply', category: 'Logistics', timeline: '1 day before', completed: false },
      { task: 'Inspect field boundary markings, goal nets, and awards podium', category: 'Setup', timeline: 'Day of event', completed: false }
    ];
  } else {
    checklist = [
      { task: 'Confirm venue booking and sign operational contract', category: 'Venue', timeline: '4 weeks before', completed: true },
      { task: 'Finalize catering menu and dietary counts', category: 'Catering', timeline: '2 weeks before', completed: false },
      { task: 'Send formal invitation links / digital passes to guests', category: 'Invitations', timeline: '2 weeks before', completed: false },
      { task: 'Conduct sound, mic, and screen tech dry run', category: 'AV & Tech', timeline: '2 days before', completed: false },
      { task: 'Setup registration counters and badge printers', category: 'Logistics', timeline: '1 day before', completed: false },
      { task: 'Brief volunteers on safety, roles, and agenda', category: 'Staffing', timeline: 'Day of event', completed: false }
    ];
  }

  // 5. Domain-Specific Risks & Mitigations
  let risks = [];
  if (normType.includes('wedding')) {
    risks = [
      {
        title: 'Baraat & Ceremony Timeline Delay',
        severity: 'High',
        reason: 'Wedding processions often run 1–2 hours late, delaying dining and ritual muhurat.',
        recommendation: 'Start welcome drinks 45 minutes prior to scheduled baraat.',
        mitigation: 'Assign a dedicated family coordinator to manage procession speed and hold a pre-snack buffet.'
      },
      {
        title: 'Catering Shortfall during Peak Banquet Hour',
        severity: 'Medium',
        reason: 'Unregistered extended guests can stress initial food estimations.',
        recommendation: 'Maintain a strict 10% cushion with the head chef.',
        mitigation: 'Keep live chaat and roti counters running continuously to distribute load.'
      }
    ];
  } else if (normType.includes('hackathon')) {
    risks = [
      {
        title: 'Network / WiFi Outage during Midnight Sprint',
        severity: 'Critical',
        reason: '300+ laptops running git pushes, npm installs, and model weights can crash consumer routers.',
        recommendation: 'Deploy enterprise-grade mesh access points with captive portal bypass.',
        mitigation: 'Keep a 4G/5G failover cellular gateway and offline documentation packs ready.'
      },
      {
        title: 'Power Circuit Trip from Simultaneous Charging',
        severity: 'High',
        reason: 'Heavy laptop power bricks on a single circuit phase can trip MCBs.',
        recommendation: 'Distribute power loads across 3 independent phase lines.',
        mitigation: 'Deploy heavy duty 16A distribution boards and keep an on-site venue electrician.'
      }
    ];
  } else if (normType.includes('sport')) {
    risks = [
      {
        title: 'Player On-Field Injury or Heatstroke',
        severity: 'Critical',
        reason: 'High-intensity athletic competition in hot weather can cause sudden muscle tears, fractures, or dehydration.',
        recommendation: 'Ensure paramedics with spine boards and ice baths are situated directly pitch-side.',
        mitigation: 'Enforce mandatory 3-minute water breaks every 20 minutes and keep an ICU ambulance on standby.'
      },
      {
        title: 'Referee Dispute & Crowd Agitation',
        severity: 'High',
        reason: 'Close calls during knockout matches can incite spectator protests.',
        recommendation: 'Designate a tournament jury table for video/protest arbitration.',
        mitigation: 'Erect clear physical rope barricades separating team dugouts from general spectator stands.'
      }
    ];
  } else {
    risks = [
      {
        title: 'Peak-Hour Registration Congestion',
        severity: expectedAttendees > 300 ? 'High' : 'Medium',
        reason: `${expectedAttendees} attendees arriving in a tight 45-minute window can overwhelm check-in desks.`,
        recommendation: `Deploy at least ${registrationCounters} registration counters with pre-issued QR codes.`,
        mitigation: 'Implement digital fast-track check-in with self-scan QR codes.'
      }
    ];
  }

  // 6. Actionable Recommendations
  const recommendations = [
    {
      title: 'Digital Fast-Track QR Verification',
      category: 'Operations',
      explanation: 'Reduces check-in latency from 90 seconds per attendee to under 8 seconds.',
      action: 'Use the integrated attendee portal QR ticket scanner at all entry doors.'
    },
    {
      title: 'Central Safety & Emergency Lead',
      category: 'Safety',
      explanation: 'Provides a single point of escalation for medical or logistical emergencies.',
      action: 'Designate 1 senior team coordinator with direct access to venue authorities.'
    }
  ];

  return {
    summary: `Tailored strategic event blueprint for '${name}' (${type}) in ${location} for ${expectedAttendees} attendees with an optimized INR ${budget.toLocaleString('en-IN')} budget.`,
    budgetPlan,
    schedule,
    resources,
    checklist,
    risks,
    recommendations,
    isApplied: false
  };
};
