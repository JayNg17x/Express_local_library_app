const Author = require('../models/author');
const async = require('async');
const Book = require('../models/book');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

exports.authorList = function(req, res, next) {
    Author.find()
        .populate('author')
        .sort([
            ['familyName', 'ascending']
        ])
        .exec((err, results) => {
            if (err) return next(new Error(err));
            // ok, so render
            res.render('authorList', { title: 'Author List', authorList: results });
        });
};

exports.authorDetail = function(req, res, next) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
                .exec(callback);
        },
        authorBooks: function(callback) {
            Book.find({ 'author': req.params.id }, 'title summary')
                .exec(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        // no results
        if (results.author === null) {
            let err = new Error(err);
            err.status = 404;
            return next(err);
        }
        // ok, so render
        res.render('authorDetail', { title: 'Title: ', author: results.author, authorBooks: results.authorBooks });
    });
};

exports.authorCreateGet = function(req, res, next) {
    res.render('authorForm', { title: ' Create New Author' });
};

exports.authorCreatePost = [
    /*
     * firstName, familyName, dateOfBirth, dateOfDeath
     */

    // validation fields
    body('firstName').isLength({ min: 1 }).trim().withMessage('first name must be specified.').isAlphanumeric().withMessage('first name must not be alpha-numeric.'),
    body('familyName').isLength({ min: 1 }).trim().withMessage('family name must be specified.').isAlphanumeric().withMessage('family name must not be alpha-numeric.'),
    body('dateOfBirth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    body('dateOfDeat', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),

    // sanitization fields
    sanitizeBody('firstName').escape(),
    sanitizeBody('familyName').escape(),
    sanitizeBody('dateOfBirth').toDate(),
    sanitizeBody('dateOfDeath').toDate(),

    // process request after validated and sanitized data from form
    (req, res, next) => {
        // extract the validation errors from request
        const errors = validationResult(req);
        // create new author object
        let author = new Author({
            firstName: req.body.firstName,
            familyName: req.body.familyName,
            dateOfBirth: req.body.dateOfBirth,
            dateOfDeath: req.body.dateOfDeath
        });

        // check while, is there any errors in our data again
        if (!errors.isEmpty()) {
            // there are errors around, so render form again sanitized erorrs/values message 
            res.render('authorForm', { title: 'Create Author', author: author, errors: errors.array() });
            return;
        } else {
            // save defined author to db
            author.save((err) => {
                if (err) return next(err);
                // ok, so redirect to new author record 
                res.redirect(author.url);
            });
        }
    }
];

exports.authorDeleteGet = function(req, res, next) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
                .exec(callback);
        },
        authorBooks: function(callback) {
            Book.find({ 'author': req.params.id })
                .exec(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        // no results
        if (results.author === null) {
            res.redirect('/catalog/authors');
        }
        // ok, so render
        res.render('authorDelete', { title: 'Delete Author', author: results.author, authorBooks: results.authorBooks });
        return;
    });
};

exports.authorDeletePost = function(req, res, next) {
    async.parallel({
        author: (callback) => {
            Author.findById(req.params.authorId)
                .exec(callback);
        },
        authorBooks: (callback) => {
            Book.find({ 'author': req.params.authorId })
                .exec(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.authorBooks.length > 0) {
            // author has book, so don't delete. 
            // render in the same way for GET route
            res.render('authorDelete', { title: 'Delete Author', author: results.author, authorBooks: results.authorBooks });
        } else {
            Author.findOneAndRemove(req.body.authorId, (err) => {
                if (err) return next(err);
                // ok, so go to author list
                res.redirect('/catalog/authors');
            });
        }
    });
};

exports.authorUpdateGet = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update get');
};

exports.authorUpdatePost = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update post');
};