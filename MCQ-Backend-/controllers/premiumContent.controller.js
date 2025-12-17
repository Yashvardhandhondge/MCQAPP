const createError = require('http-errors');
const PremiumContent = require('../models/PremiumContent');

/**
 * Get premium content
 * GET /api/mcq/premium-content
 */
const getPremiumContent = async (req, res, next) => {
  try {
    console.log('Premium content endpoint accessed - PUBLIC ENDPOINT');
    const content = await PremiumContent.getContent();
    // Convert to plain object and remove _id, __v, timestamps for cleaner response
    const contentObj = content.toObject();
    delete contentObj._id;
    delete contentObj.__v;
    delete contentObj.createdAt;
    delete contentObj.updatedAt;
    res.status(200).json({
      success: true,
      data: contentObj,
    });
  } catch (error) {
    console.error('Error getting premium content:', error);
    return next(createError(500, 'Failed to fetch premium content'));
  }
};

/**
 * Update premium content (Admin only)
 * PUT /api/mcq/admin/premium-content
 */
const updatePremiumContent = async (req, res, next) => {
  try {
    const {
      heroBadgeText,
      heroTitle,
      heroSubtitle,
      valueTitle,
      valueDescription,
      features,
      pricingPlans,
    } = req.body;

    let content = await PremiumContent.findOne();
    if (!content) {
      content = new PremiumContent({});
    }

    // Update fields if provided
    if (heroBadgeText !== undefined) content.heroBadgeText = heroBadgeText;
    if (heroTitle !== undefined) content.heroTitle = heroTitle;
    if (heroSubtitle !== undefined) content.heroSubtitle = heroSubtitle;
    if (valueTitle !== undefined) content.valueTitle = valueTitle;
    if (valueDescription !== undefined) content.valueDescription = valueDescription;
    if (features !== undefined) content.features = features;
    if (pricingPlans !== undefined) content.pricingPlans = pricingPlans;

    await content.save();

    res.status(200).json({
      success: true,
      message: 'Premium content updated successfully',
      data: content,
    });
  } catch (error) {
    console.error('Error updating premium content:', error);
    if (error.name === 'ValidationError') {
      return next(createError(400, error.message));
    }
    return next(createError(500, 'Failed to update premium content'));
  }
};

module.exports = {
  getPremiumContent,
  updatePremiumContent,
};

