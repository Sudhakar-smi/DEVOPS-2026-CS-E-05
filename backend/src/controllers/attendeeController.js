import Attendee from '../models/Attendee.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// @desc    Register logged-in user for an event
// @route   POST /api/events/:id/register
// @access  Private (Attendee / All authenticated)
export const registerForEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const { ticketType = 'General Admission', dietaryPreferences = 'Standard', notes = '' } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This event has been cancelled and cannot accept registrations.' });
    }

    // Check if already registered
    const existingRegistration = await Attendee.findOne({ eventId, userId });
    if (existingRegistration) {
      if (existingRegistration.status === 'cancelled') {
        existingRegistration.status = 'registered';
        existingRegistration.ticketType = ticketType;
        existingRegistration.dietaryPreferences = dietaryPreferences;
        existingRegistration.notes = notes;
        await existingRegistration.save();

        return res.status(200).json({
          success: true,
          message: 'Your event registration has been successfully reactivated!',
          data: existingRegistration
        });
      }
      return res.status(400).json({ success: false, message: 'You are already registered for this event.' });
    }

    // Check capacity
    const currentCount = await Attendee.countDocuments({ eventId, status: { $ne: 'cancelled' } });
    if (currentCount >= event.expectedAttendees * 1.15) {
      return res.status(400).json({ success: false, message: 'Event has reached maximum venue capacity limit.' });
    }

    const attendee = await Attendee.create({
      eventId,
      userId,
      ticketType,
      dietaryPreferences,
      notes,
      status: 'registered',
      qrCodeRef: `TKT-${eventId.toString().slice(-4).toUpperCase()}-${userId.toString().slice(-4).toUpperCase()}-${Date.now().toString().slice(-4)}`
    });

    // Notify event organizer
    await Notification.create({
      userId: event.organizerId,
      title: 'New Event Registration',
      message: `${req.user.name} registered for "${event.name}".`,
      type: 'registration',
      link: `/organizer/events/${eventId}`
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your digital ticket is confirmed.',
      data: attendee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Organizer manually adds a guest / attendee to an event
// @route   POST /api/events/:id/attendees/manual
// @access  Private (Organizer / Admin)
export const registerGuestManual = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const { name, email, ticketType = 'General Admission', dietaryPreferences = 'Standard', notes = '', status = 'registered' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Guest name and email are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Find or create guest user
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: 'Password123!',
        role: 'attendee'
      });
    }

    // Check existing registration
    let attendee = await Attendee.findOne({ eventId, userId: user._id });
    if (attendee) {
      attendee.status = status;
      attendee.ticketType = ticketType;
      attendee.dietaryPreferences = dietaryPreferences;
      attendee.notes = notes;
      await attendee.save();
    } else {
      attendee = await Attendee.create({
        eventId,
        userId: user._id,
        ticketType,
        dietaryPreferences,
        notes,
        status,
        qrCodeRef: `TKT-${eventId.toString().slice(-4).toUpperCase()}-${user._id.toString().slice(-4).toUpperCase()}-${Date.now().toString().slice(-4)}`
      });
    }

    const populated = await Attendee.findById(attendee._id).populate('userId', 'name email phone organization');

    res.status(201).json({
      success: true,
      message: `Guest ${name} added to roster successfully`,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attendees for a specific event
// @route   GET /api/events/:id/attendees
// @access  Private (Organizer / Admin)
export const getEventAttendees = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view attendee roster' });
    }

    const attendees = await Attendee.find({ eventId })
      .populate('userId', 'name email phone organization avatar')
      .sort({ registrationDate: -1 });

    res.status(200).json({
      success: true,
      count: attendees.length,
      data: attendees
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my registered events
// @route   GET /api/attendees/my-registrations
// @access  Private (Attendee / All)
export const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await Attendee.find({ userId: req.user.id })
      .populate({
        path: 'eventId',
        populate: { path: 'organizerId', select: 'name organization email' }
      })
      .sort({ registrationDate: -1 });

    const validRegistrations = registrations.filter(r => r.eventId != null);

    res.status(200).json({
      success: true,
      count: validRegistrations.length,
      data: validRegistrations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update attendee status (Check-in or Cancel)
// @route   PUT /api/attendees/:id/status
// @access  Private
export const updateAttendeeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const attendee = await Attendee.findById(req.params.id).populate('eventId');

    if (!attendee) {
      return res.status(404).json({ success: false, message: 'Registration record not found' });
    }

    const isOrganizer = attendee.eventId.organizerId.toString() === req.user.id;
    const isSelf = attendee.userId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isSelf && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this registration' });
    }

    attendee.status = status || attendee.status;
    await attendee.save();

    res.status(200).json({
      success: true,
      message: `Registration status updated to ${attendee.status}`,
      data: attendee
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export attendees as CSV
// @route   GET /api/events/:id/attendees/export-csv
// @access  Private (Organizer / Admin)
export const exportAttendeesCSV = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const attendees = await Attendee.find({ eventId }).populate('userId', 'name email phone organization');

    const headers = ['Attendee Name', 'Email', 'Organization', 'Phone', 'Ticket Type', 'Status', 'Registration Date', 'Dietary Preferences'];
    const rows = attendees.map(a => [
      `"${a.userId?.name || 'N/A'}"`,
      `"${a.userId?.email || 'N/A'}"`,
      `"${a.userId?.organization || 'N/A'}"`,
      `"${a.userId?.phone || 'N/A'}"`,
      `"${a.ticketType || 'General'}"`,
      `"${a.status}"`,
      `"${new Date(a.registrationDate).toLocaleDateString()}"`,
      `"${a.dietaryPreferences || 'Standard'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendees-${eventId}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
