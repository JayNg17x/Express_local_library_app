const Genre = require('../models/genre');
const Book = require('../models/book');
const async = require('async');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

exports.genreList = function(req, res, next) {
    Genre.find()
        .sort([
            ['name', 'ascending']
        ])
        .exec((err, listGenre) => {
            if (err) return next(new Error(err));
            // ok, so render
            res.render('genreList', { title: 'Genre List', listGenre: listGenre });
        });
};

exports.genreDetail = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
                .exec(callback);
        },
        genreBooks: function(callback) {
            Book.find({ 'genre': req.params.id })
                .exec(callback);
        }
    }, function(err, results) {
        if (err) return next(err);
        // no results
        if (results.genre === null) {
            let err = new Error('Genre not found :(');
            err.status = 404;
            return next(err);
        }
        // ok, so render
        res.render('genreDetail', { title: 'Genre Detail:  ', genre: results.genre, genreBooks: results.genreBooks });
    });
};

exports.genreCreateGet = function(req, res) {
    res.render('genreForm', { title: 'Create New Genre' });
};

exports.genreCreatePost = [
    // Validate that the name field is not empty.
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),
    // Sanitize (trim) the name field.
    sanitizeBody('name').escape(),
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        // Create a genre object with escaped and trimmed data.
        var genre = new Genre({
            name: req.body.name
        });
        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genreForm', { title: 'Create Genre', genre: genre, errors: errors.array() });
            return;
        } else {
            // Data from form is valid.
            // Check if Genre with same name already exists.
            Genre.findOne({ 'name': req.body.name })
                .exec(function(err, foundGenre) {
                    if (err) { return next(err); }

                    if (foundGenre) {
                        // Genre exists, redirect to its detail page.
                        res.redirect(foundGenre.url);
                    } else {
                        genre.save(function(err) {
                            if (err) { return next(err); }
                            // Genre saved. Redirect to genre detail page.
                            res.redirect(genre.url);
                        });
                    }
                });
        }
    }
];

exports.genreDeleteGet = function(req, res, next) {
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.params.id)
                .exec(callback);
        },
        genreBooks: (callback) => {
            Book.find({ 'genre': req.params.id })
                .exec(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        // no results
        if (results === null) {
            res.redirect('/catalog/genres');
            return;
        }
        // ok, so render
        res.render('genreDelete', { title: 'Delete Genre', genre: results.genre, genreBooks: results.genreBooks, results: results });
    });
};

exports.genreDeletePost = function(req, res, next) {
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.params.id)
                .exec(callback);
        },
        genreBooks: (callback) => {
            Book.find({ 'genre': req.params.id })
                .exec(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        if (results.genreBooks.lenth > 0) {
            // genre has book
            res.render('genreDelete', { title: 'Delete Genre', genre: results.genre, genreBooks: results.genreBooks, results: results });
        } else {
            Genre.findByIdAndRemove(req.body.id, (err) => {
                if (err) return next(err);
                res.redirect('/catalog/genres');
            });
        }
    });
};

exports.genreUpdateGet = function(req, res, next) {
    Genre.findById(req.params.id, (err, results) => {
        if (err) return next(err);
        if (results === null) {
            res.redirect('/catalog/genres');
            return;
        }
        // ok, so render
        res.render('genreForm', { title: 'Update Genre', results: results });
    });
};

exports.genreUpdatePost = [
    // validate data to make sure that data is not empty
    body('name', 'Name must not be empty.').isLength({ min: 1 }).trim(),
    // sanitize data 
    sanitizeBody('name').escape(),
    // process request after validated and sanitized data from form
    (req, res, next) => {
        // extract validation errors from request
        let errors = validationResult(req);
        let genre = new Genre({
            name: req.body.name,
            _id: req.params.id
        });
        if (!errors.isEmpty()) {
            // there are errors, so render form again with sanitized values and errors message 
            res.render('genreForm', { title: 'Update Genre', genre: genre, errors: errors.array() });
        } else {
            // data from form is valid 
            Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, newGenre) => {
                if (err) return next(err);
                // ok, so redirect to newly updated genre record 
                res.redirect(newGenre.url);
            });
        }
    }
];