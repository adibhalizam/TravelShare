// models/Itinerary.js
const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    destination: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    activities: [String],
    activities: [{
        description: { type: String, required: true },
        date: { type: Date, required: true }
    }],
    image: {
        type: String,
        required: true
    },
    notes: String,
    expenses: [{ 
        description: { type: String, required: true },
        amount: { type: Number, required: true }
    }],
    comments: [{  // Embedded Comments Array
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
}, {
    timestamps: true
});

const Itinerary = mongoose.model('Itinerary', itinerarySchema);

module.exports = Itinerary;
