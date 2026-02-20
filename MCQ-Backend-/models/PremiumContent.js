const mongoose = require('mongoose');

const premiumContentSchema = new mongoose.Schema(
  {
    // Hero Section
    heroBadgeText: {
      type: String,
      default: 'Ace Your 2026 Exams',
      trim: true,
    },
    heroTitle: {
      type: String,
      default: 'Your Complete\nMCQ Preparation Solution',
      trim: true,
    },
    heroSubtitle: {
      type: String,
      default: 'Join 1,000+ students preparing for Maharashtra competitive exams',
      trim: true,
    },
    
    // Value Proposition
    valueTitle: {
      type: String,
      default: 'Save 80-90% on Study Materials',
      trim: true,
    },
    valueDescription: {
      type: String,
      default: 'Get comprehensive question banks, PYQs, and solutions at a fraction of book costs',
      trim: true,
    },
    
    // Features
    features: {
      type: [
        {
          icon: {
            type: String,
            required: true,
            trim: true,
          },
          text: {
            type: String,
            required: true,
            trim: true,
          },
        },
      ],
      default: [
        { icon: 'library', text: '4000+ questions for each subject' },
        { icon: 'calendar', text: 'Include all PYQ from 2015' },
        { icon: 'analytics', text: 'Solid analytics' },
        { icon: 'trophy', text: 'Compete with your peers' },
        { icon: 'sparkles', text: 'AI analyzed solutions for all questions' },
      ],
    },
    
    // Pricing Plans
    pricingPlans: {
      type: [
        {
          id: {
            type: String,
            required: true,
            enum: ['PCM', 'PCB', 'PCMB'],
          },
          name: {
            type: String,
            required: true,
            trim: true,
          },
          description: {
            type: String,
            required: true,
            trim: true,
          },
          price: {
            type: Number,
            required: true,
            min: 0,
          },
          gradient: {
            type: [String],
            required: true,
            validate: {
              validator: function (v) {
                return v.length === 2;
              },
              message: 'Gradient must have exactly 2 colors',
            },
          },
          icon: {
            type: String,
            required: true,
            trim: true,
          },
          isPopular: {
            type: Boolean,
            default: false,
          },
          discountPrice: {
            type: Number,
            min: 0,
            default: null,
          },
          discountEndDate: {
            type: Date,
            default: null,
          },
        },
      ],
      default: [
        {
          id: 'PCM',
          name: 'PCM',
          description: 'Physics, Chemistry, Mathematics',
          price: 99,
          gradient: ['#6366F1', '#4F46E5'],
          icon: 'calculator',
          isPopular: false,
        },
        {
          id: 'PCB',
          name: 'PCB',
          description: 'Physics, Chemistry, Biology',
          price: 99,
          gradient: ['#8B5CF6', '#7C3AED'],
          icon: 'flask',
          isPopular: false,
        },
        {
          id: 'PCMB',
          name: 'PCMB',
          description: 'Physics, Chemistry, Mathematics, Biology',
          price: 99,
          gradient: ['#10B981', '#059669'],
          icon: 'school',
          isPopular: true,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one document exists
premiumContentSchema.statics.getContent = async function () {
  let content = await this.findOne();
  if (!content) {
    content = await this.create({});
  }
  return content;
};

const PremiumContent = mongoose.model('PremiumContent', premiumContentSchema);

module.exports = PremiumContent;








