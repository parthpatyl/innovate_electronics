const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
	subject: {
		type: String,
		required: [true, 'Newsletter subject is required'],
		trim: true,
		maxlength: [200, 'Subject cannot exceed 200 characters']
	},
	body: {
		type: String,
		required: [true, 'Newsletter body is required']
	},
	htmlBody: {
		type: String,
		required: [true, 'HTML body is required']
	},
	status: {
		type: String,
		enum: ['draft', 'published'],
		default: 'draft'
	},
	audience: {
		type: String,
		enum: ['all-subscribers'],
		default: 'custom'
	},
	recipients: {
		type: [String],
		default: []
	},
	sentBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Admin',
		required: false
	},
	imageData: {
		type: String,
		default: ''
	}
}, {
	timestamps: true
});

newsletterSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Newsletter', newsletterSchema); 