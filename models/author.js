const mongoose = require('mongoose');
const moment = require('moment'); // using moment to handle birth/date
// define schema
let Schema = mongoose.Schema;

let AuthorSchema = Schema({
    firstName: { type: String, required: true, maxLength: 50 },
    familyName: { type: String, requiered: true, maxLength: 50 },
    dateOfBirth: { type: Date },
    dateOfDeath: { type: Date }
});

// virtual for author `full name`
AuthorSchema
    .virtual('name')
    .get(function() {
        let fullName = '';
        if (this.firstName && this.familyName) {
            fullName = this.firstName + ' ' + this.familyName;
        }

        if (!this.firstName && !this.familyName) {
            fullName = '';
        }
        return fullName;
    });

// virtual for this author instance url 
AuthorSchema
    .virtual('url')
    .get(function() {
        return '/catalog/author/' + this._id;
    });

AuthorSchema
    .virtual('dateOfBirth_yyy_mm_dd')
    .get(function() {
        return moment(this.dateOfBirth).format('YYYY-MM-DD');
    });

AuthorSchema
    .virtual('lifespan')
    .get(function() {
        let lifetime = '';
        if (this.dateOfBirth) {
            lifetime = moment(this.dateOfBirth).format('MMMM Do, YYYY');
        }
        lifetime += ' - ';
        if (this.dateOfDeath) {
            lifetime_string += moment(this.dateOfDeath).format('MMMM Do, YYYY');
        }
        return lifetime;
    });


AuthorSchema
    .virtual('dateOfDeath_yyy_mm_dd')
    .get(function() {
        return moment(this.dateOfDeath).format('YYYY-MM-DD');
    });

// exports model
module.exports = mongoose.model('Author', AuthorSchema);