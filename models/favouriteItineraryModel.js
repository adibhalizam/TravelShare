const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const favoriteItinerarySchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    itinerary: {
        type: Schema.Types.ObjectId,
        ref: 'Itinerary',
        required: true
    }
}, { timestamps: true });

const FavoriteItinerary = mongoose.model('FavoriteItinerary', favoriteItinerarySchema);

module.exports = FavoriteItinerary;
