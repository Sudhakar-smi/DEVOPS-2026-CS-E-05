import Task from '../models/Task.js';
import Event from '../models/Event.js';

// @desc    Get all tasks for an event
// @route   GET /api/events/:id/tasks
// @access  Private (Organizer / Admin)
export const getEventTasks = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const tasks = await Task.find({ eventId }).sort({ deadline: 1 });

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.status(200).json({
      success: true,
      count: total,
      summary: {
        total,
        completed,
        inProgress,
        pending,
        completionRate
      },
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task
// @route   POST /api/events/:id/tasks
// @access  Private (Organizer / Admin)
export const createTask = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const { title, description, assignedTo, priority, deadline, category, status } = req.body;

    if (!title || !deadline) {
      return res.status(400).json({ success: false, message: 'Title and deadline are required' });
    }

    const task = await Task.create({
      eventId,
      title,
      description: description || '',
      assignedTo: assignedTo || 'Event Team',
      priority: priority || 'medium',
      deadline: new Date(deadline),
      category: category || 'General',
      status: status || 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private (Organizer / Admin)
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Organizer / Admin)
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
