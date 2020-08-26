const BookInstance = require('../models/bookInstance');
const async = require('async');
const Book = require('../models/book');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const { bookList } = require('./bookController');
const bookInstance = require('../models/bookInstance');

exports.bookInstanceList = function(req, res, next) {
    BookInstance.find()
        .populate('book')
        .exec((err, results) => {
            if (err) next(new Error(err));
            // ok, so render
            res.render('bookInstanceList', { title: 'Book Instance List', bookInstanceList: results });
        });
};

exports.bookInstanceDetail = function(req, res, next) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec((err, bookInstance) => {
            if (err) return next(err);
            // no results
            if (bookInstance === null) {
                let err = new Error('Book instance not found :(');
                err.status = 404;
                return next(err);
            }
            // ok, so render
            res.render('bookInstanceDetail', { title: 'Book: ', bookInstance: bookInstance });
        });
};

exports.bookInstanceCreateGet = function(req, res, next) {
    Book.find({}, 'title')
        .exec((err, books) => {
            if (err) return next(err);
            // ok, so render
            res.render('bookInstanceForm', { title: 'Create New Book Instance', bookList: books });
            return;
        });
};

exports.bookInstanceCreatePost = [
    // validation fields 
    body('imprint').isLength({ min: 1 }).trim().withMessage('Imprint must not be empty.'),
    body('due_back', 'Invalid due_back').trim().optional({ checkFalsy: true }),
    // sanitizatio fields
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').escape(),
    sanitizeBody('due_back').toDate(),

    // process request after validated and sanitized date form
    (req, res, next) => {
        // extract the validation errors from request
        let errors = validationResult(req);
        // define new book instance
        let bookinstace = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });
        // check while, is there any errors around
        if (!errors.isEmpty()) {
            // render form again with sanitized values/error message 
            Book.find({}, 'title')
                .exec((err, results) => {
                    if (err) return next(err);
                    // ok, so render
                    res.render('bookInstanceForm', {
                        title: 'Create New Book Instance',
                        bookList: results,
                        selectedBook: bookinstace.book._id,
                        bookinstace: bookinstace,
                        errors: errors.array()
                    });
                });
        } else {
            // save new defined book instance to db
            bookinstace.save((err) => {
                if (err) return next(err);
                // ok, so redirect to new bookInstance record
                res.redirect(bookinstace.url);
            });
        }
    }
];

exports.bookInstanceDeleteGet = function(req, res, next) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec((err, bookInstance) => {
            if (err) return next(err);
            // no results
            if (bookInstance === null) {
                res.redirect('/catalog/bookInstances');
                return;
            }
            // ok, so render
            res.render('bookInstanceDelete', { title: 'Delete Book Instance', bookInstance: bookInstance });
        })
};

exports.bookInstanceDeletePost = function(req, res, next) {
    BookInstance.findByIdAndRemove(req.body.id, (err) => {
        if (err) return next(err);
        // ok, so redirect to bookInstance item list 
        res.redirect('/catalog/bookInstances');
    });
};

exports.bookInstanceUpdateGet = function(req, res, next) {
    res.send('Not IMPLEMENTED YET!');
};

exports.bookInstanceUpdatePost = function(req, res, next) {
    res.send('NOT IMPLEMENTED YET!');
};