import Budget from '../models/Budget.js';
import Event from '../models/Event.js';

// @desc    Get budget items and health summary for an event
// @route   GET /api/events/:id/budget
// @access  Private (Organizer / Admin)
export const getEventBudget = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const items = await Budget.find({ eventId }).sort({ plannedAmount: -1 });

    const totalBudget = event.budget || 0;
    const plannedSum = items.reduce((acc, b) => acc + (b.plannedAmount || 0), 0);
    const actualSum = items.reduce((acc, b) => acc + (b.actualAmount || 0), 0);
    const remaining = totalBudget - actualSum;
    const utilizationRate = totalBudget > 0 ? Math.round((actualSum / totalBudget) * 100) : 0;
    const plannedVsBudgetRate = totalBudget > 0 ? Math.round((plannedSum / totalBudget) * 100) : 0;

    const isOverPlanned = plannedSum > totalBudget;
    const isOverSpent = actualSum > totalBudget;

    res.status(200).json({
      success: true,
      summary: {
        totalBudget,
        plannedSum,
        actualSum,
        remaining,
        utilizationRate,
        plannedVsBudgetRate,
        isOverPlanned,
        isOverSpent,
        overPlannedAmount: isOverPlanned ? plannedSum - totalBudget : 0,
        overSpentAmount: isOverSpent ? actualSum - totalBudget : 0
      },
      data: items
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add budget item
// @route   POST /api/events/:id/budget
// @access  Private (Organizer / Admin)
export const addBudgetItem = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const { category, plannedAmount, actualAmount = 0, notes = '' } = req.body;

    if (!category || plannedAmount === undefined) {
      return res.status(400).json({ success: false, message: 'Category and planned amount are required' });
    }

    const item = await Budget.create({
      eventId,
      category,
      plannedAmount: Number(plannedAmount),
      actualAmount: Number(actualAmount),
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Budget line item added',
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update budget item
// @route   PUT /api/budget/:id
// @access  Private (Organizer / Admin)
export const updateBudgetItem = async (req, res, next) => {
  try {
    const item = await Budget.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Budget item not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Budget item updated',
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete budget item
// @route   DELETE /api/budget/:id
// @access  Private (Organizer / Admin)
export const deleteBudgetItem = async (req, res, next) => {
  try {
    const item = await Budget.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Budget item not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Budget item deleted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Batch replace or initialize budget items
// @route   POST /api/events/:id/budget/batch
// @access  Private (Organizer / Admin)
export const batchUpdateBudget = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }

    await Budget.deleteMany({ eventId });
    const formattedDocs = items.map(it => ({
      eventId,
      category: it.category,
      plannedAmount: Number(it.plannedAmount || it.amount || 0),
      actualAmount: Number(it.actualAmount || 0),
      notes: it.notes || it.description || ''
    }));

    const created = await Budget.insertMany(formattedDocs);

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: created
    });
  } catch (error) {
    next(error);
  }
};
