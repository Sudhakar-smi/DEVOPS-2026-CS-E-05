import Schedule from '../models/Schedule.js';
import Event from '../models/Event.js';

// @desc    Get event schedule
// @route   GET /api/events/:id/schedule
// @access  Public
export const getEventSchedule = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const scheduleItems = await Schedule.find({ eventId }).sort({ day: 1, order: 1, startTime: 1 });

    // Group by day for convenience
    const daysMap = {};
    scheduleItems.forEach(item => {
      const d = item.day || 1;
      if (!daysMap[d]) daysMap[d] = [];
      daysMap[d].push(item);
    });

    res.status(200).json({
      success: true,
      count: scheduleItems.length,
      days: Object.keys(daysMap).map(d => ({
        day: Number(d),
        sessions: daysMap[d]
      })),
      data: scheduleItems
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add schedule session
// @route   POST /api/events/:id/schedule
// @access  Private (Organizer / Admin)
export const createScheduleItem = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const { day = 1, startTime, endTime, title, description, speakerOrLead, location, order = 0 } = req.body;

    if (!startTime || !endTime || !title) {
      return res.status(400).json({ success: false, message: 'Start time, end time, and title are required' });
    }

    const item = await Schedule.create({
      eventId,
      day: Number(day),
      startTime,
      endTime,
      title,
      description: description || '',
      speakerOrLead: speakerOrLead || '',
      location: location || 'Main Stage',
      order: Number(order)
    });

    res.status(201).json({
      success: true,
      message: 'Schedule session added',
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update schedule session
// @route   PUT /api/schedule/:id
// @access  Private (Organizer / Admin)
export const updateScheduleItem = async (req, res, next) => {
  try {
    const item = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Schedule session not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Schedule session updated',
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete schedule session
// @route   DELETE /api/schedule/:id
// @access  Private (Organizer / Admin)
export const deleteScheduleItem = async (req, res, next) => {
  try {
    const item = await Schedule.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Schedule session not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Schedule session deleted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Batch replace or sync schedule from AI Plan
// @route   POST /api/events/:id/schedule/batch
// @access  Private (Organizer / Admin)
export const batchUpdateSchedule = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }

    await Schedule.deleteMany({ eventId });
    const formattedDocs = items.map((it, idx) => ({
      eventId,
      day: Number(it.day || 1),
      startTime: it.startTime || it.time || '09:00 AM',
      endTime: it.endTime || '10:00 AM',
      title: it.title || it.activity || 'Session',
      description: it.description || '',
      speakerOrLead: it.speakerOrLead || '',
      location: it.location || 'Main Stage',
      order: idx
    }));

    const created = await Schedule.insertMany(formattedDocs);

    res.status(200).json({
      success: true,
      message: 'Schedule synced successfully',
      data: created
    });
  } catch (error) {
    next(error);
  }
};
