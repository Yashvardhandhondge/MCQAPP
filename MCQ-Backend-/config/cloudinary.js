const cloudinary = require('cloudinary').v2;

// NOTE: These credentials are for testing only as per user instruction.
cloudinary.config({
  cloud_name: 'dqt03lz3g',
  api_key: '379827429392976',
  api_secret: 'BMrFd2p9wQoYLhkTtxFq3oIdvNc',
});

module.exports = cloudinary;

