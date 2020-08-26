const mongoose = require('mongoose');
const moment = require('moment');
let Schema = mongoose.Schema;

let BookInstanceSchema = new Schema({
    book: { type: Schema.ObjectId, ref: 'Book', required: true },
    imprint: { type: String, required: true },
    status: { type: String, required: true, enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'], default: 'Maintenance' },
    due_back: { type: Date, default: Date.now }
});

// virtual instance object url
BookInstanceSchema
    .virtual('url')
    .get(function() {
        return '/catalog/bookinstance/' + this._id;
    });

BookInstanceSchema
    .virtual('due_back_yyyy_mm_dd')
    .get(function() {
        return moment(this.due_back).format('YYYY-MM-DD');
    });

BookInstanceSchema
    .virtual('due_back_formatted')
    .get(function() {
        return moment(this.due_back).format('MMM Do, YYY');
    });

module.exports = mongoose.model('BookInstance', BookInstanceSchema);