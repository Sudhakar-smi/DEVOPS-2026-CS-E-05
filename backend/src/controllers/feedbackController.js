import Feedback from '../models/Feedback.js';
import Event from '../models/Event.js';
import Notification from '../models/Notification.js';

// @desc    Submit feedback for an event
// @route   POST /api/events/:id/feedback
// @access  Private (Attendee / Logged-in user)
export const submitFeedback = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const { rating, comment, category = 'General' } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user already submitted feedback
    let feedback = await Feedback.findOne({ eventId, userId });
    if (feedback) {
      feedback.rating = Number(rating);
      feedback.comment = comment;
      feedback.category = category;
      await feedback.save();

      return res.status(200).json({
        success: true,
        message: 'Your feedback has been updated. Thank you!',
        data: feedback
      });
    }

    feedback = await Feedback.create({
      eventId,
      userId,
      rating: Number(rating),
      comment,
      category,
      sentiment: Number(rating) >= 4 ? 'positive' : Number(rating) === 3 ? 'neutral' : 'negative'
    });

    // Notify organizer
    await Notification.create({
      userId: event.organizerId,
      title: 'New Feedback Received',
      message: `An attendee rated "${event.name}" with ${rating} stars: "${comment.slice(0, 50)}..."`,
      type: 'feedback',
      link: `/organizer/events/${eventId}`
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. Thank you for your review!',
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all feedback for an event
// @route   GET /api/events/:id/feedback
// @access  Public
export const getEventFeedback = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const feedbacks = await Feedback.find({ eventId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });

    const total = feedbacks.length;
    const avgRating = total > 0
      ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / total).toFixed(1)
      : 0;

    // Rating star counts [1 star, 2 stars, 3 stars, 4 stars, 5 stars]
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach(f => {
      if (ratingDistribution[f.rating] !== undefined) {
        ratingDistribution[f.rating]++;
      }
    });

    res.status(200).json({
      success: true,
      total,
      averageRating: Number(avgRating),
      ratingDistribution,
      data: feedbacks
    });
  } catch (error) {
    next(error);
  }
};
