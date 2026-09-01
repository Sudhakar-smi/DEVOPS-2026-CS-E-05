export const validateEventInput = (req, res, next) => {
  const { name, type, budget, expectedAttendees, date, location } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Event name is required' });
  }
  if (!type || type.trim() === '') {
    return res.status(400).json({ success: false, message: 'Event type is required' });
  }
  if (budget === undefined || Number(budget) < 0 || isNaN(Number(budget))) {
    return res.status(400).json({ success: false, message: 'Budget must be a non-negative number' });
  }
  if (expectedAttendees === undefined || Number(expectedAttendees) < 1 || isNaN(Number(expectedAttendees))) {
    return res.status(400).json({ success: false, message: 'Expected attendees must be at least 1' });
  }
  if (!date || isNaN(new Date(date).getTime())) {
    return res.status(400).json({ success: false, message: 'A valid event date is required' });
  }
  if (!location || location.trim() === '') {
    return res.status(400).json({ success: false, message: 'Event location/city is required' });
  }

  next();
};

export const validateFeedbackInput = (req, res, next) => {
  const { rating, comment } = req.body;

  if (rating === undefined || Number(rating) < 1 || Number(rating) > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
  }
  if (!comment || comment.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Comment must be at least 3 characters long' });
  }

  next();
};
