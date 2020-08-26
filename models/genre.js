const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let GenreSchema = new Schema({
    name: { type: String, required: true, min: 5, max: 95 }
});

// virtual for this genre instance url
GenreSchema
    .virtual('url')
    .get(function() {
        return '/catalog/genre/' + this._id;
    });

module.exports = mongoose.model('Genre', GenreSchema);