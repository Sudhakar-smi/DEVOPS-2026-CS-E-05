import Vendor from '../models/Vendor.js';

export const getVendors = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = {};

    if (category && category !== 'All') query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const vendors = await Vendor.find(query).sort({ rating: -1 });

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorSuggestions = async (req, res, next) => {
  try {
    const { category } = req.params;
    const vendors = await Vendor.find({ category }).limit(6).sort({ rating: -1 });

    res.status(200).json({
      success: true,
      data: vendors
    });
  } catch (error) {
    next(error);
  }
};
