let Book = require('../models/book');
let Author = require('../models/author');
let Genre = require('../models/genre');
let BookInstance = require('../models/bookInstance');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody, sanitize, sanitizeQuery } = require('express-validator/filter');
const async = require('async');

exports.index = function(req, res) {
    async.parallel({
        bookCount: function(callback) {
            Book.count(callback);
        },
        bookInstanceCount: function(callback) {
            BookInstance.count(callback);
        },
        bookInstanceAvailableCount: function(callback) {
            BookInstance.count({ status: 'Avaiable' }, callback);
        },
        authorCount: function(callback) {
            Author.count(callback);
        },
        genreCount: function(callback) {
            Genre.count(callback);
        }
    }, function(err, results) {
        if (err) {
            res.render('error');
        }
        res.render('index', { title: 'Express Local library Home', error: err, data: results });
    });
};

exports.bookList = function(req, res, next) {
    Book.find({}, 'title author')
        .populate('author')
        .exec((err, listBooks) => {
            if (err) next(new Error(err));
            // ok, so render
            res.render('bookList', { title: 'Book List', listBooks: listBooks });
        });
};

exports.bookDetail = function(req, res, next) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },
        bookInstance: function(callback) {
            BookInstance.find({ 'book': req.params.id })
                .exec(callback);
        }
    }, function(err, results) {
        if (err) return next(err);
        // no results
        if (results.book === null) {
            let err = new Error('Book not found :(');
            err.status = 500;
            return next(err);
        }
        // ok, so render
        res.render('bookDetail', {
            title: 'Title: ',
            book: results.book,
            bookInstance: results.bookInstance
        });
    });
};

exports.bookCreateGet = function(req, res, next) {
    // get all authors and genres for form
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        }
    }, function(err, results) {
        if (err) return next(err);
        // ok, so render
        res.render('bookForm', {
            title: 'Create New Book',
            authors: results.authors,
            genres: results.genres
        });
    });
};

exports.bookCreatePost = [
    // convert genre to an array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === undefined) {
                req.body.genre = [];
            } else {
                req.body.genre = new Array(req.body.genre);
            }
        }
        next();
    },
    // validation fields
    body('title').isLength({ min: 5 }).trim().withMessage('title of book must not be empty.'),
    body('author').isLength({ min: 1 }).trim().withMessage('author must not be empty.'),
    body('summary').isLength({ min: 10 }).trim().withMessage('summary must not be empty.'),
    body('isbn').isLength({ min: 1 }).trim().withMessage('ISBN must not be empty.'),
    // sanitization fields
    sanitizeBody('*').escape(),
    sanitizeBody('genre.*').escape(),
    // process requeset after validated and sanitized date
    (req, res, next) => {
        const errors = validationResult(req);
        // define new book object
        let book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
        });
        // check while, is there any errors around
        if (!errors.isEmpty()) {
            // there are errors, so render form again with sanitized values/errors, 
            // get all authors and genres for form
            async.parallel({
                authors: function(req, res, next) {
                    Author.find(callback);
                },
                genres: function(req, res, next) {
                    Genre.find(callback);
                }
            }, function(err, results) {
                if (err) return next(err);
                // mark our selected genres as checked
                for (let i = 0; i < results.genres.length; ++i) {
                    if (book.genre.indexOf(results.genres[i]._id > -1)) {
                        results.genres[i].checked = 'true';
                    }
                }
                res.render('bookForm', {
                    title: 'Create New Book',
                    authors: results.authors,
                    genres: results.genres,
                    book: book,
                    errors: errors.array()
                });
            });
        } else {
            book.save((err) => {
                if (err) return next(err);
                // ok, so redirect to new book record 
                res.redirect(book.url);
            });
        }
    }
];

exports.bookDeleteGet = (req, res, next) => {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },
        bookInstances: function(callback) {
            BookInstance.find({ 'book': req.params.id })
                .exec(callback);
        }
    }, function(err, results) {
        if (err) return next(err);
        // no results
        if (results.book === null) {
            res.redirect('/catalog/books');
        }
        // ok, so render
        res.render('bookDelete', { title: 'Delete Book', book: results.book, bookInstances: results.bookInstances });
    });
};

exports.bookDeletePost = (req, res, next) => {
    async.parallel({
        book: (callback) => {
            Book.findById(req.body.id).populate('author').populate('genre').exec(callback);
        },
        bookInstances: (callback) => {
            BookInstance.find({ 'book': req.body.id }).exec(callback);
        },
    }, (err, results) => {
        if (err) { return next(err); }
        // Success
        if (results.bookInstances.length > 0) {
            // Book has book_instances. Render in same way as for GET route.
            res.render('bookDelete', { title: 'Delete Book', book: results.book, bookInstances: results.bookInstances });
            return;
        } else {
            // Book has no BookInstance objects. Delete object and redirect to the list of books.
            Book.findByIdAndRemove(req.body.id, (err) => {
                if (err) { return next(err); }
                // Success - got to books list.
                res.redirect('/catalog/books');
            });
        }
    });
};

exports.bookUpdateGet = function(req, res, next) {
    async.parallel({
        authors: (callback) => {
            Author.find(callback);
        },
        genres: (callback) => {
            Genre.find(callback);
        },
        book: (callback) => {
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        }
    }, (err, results) => {
        if (err) return next(err);
        // no results 
        if (results === null) {
            let err = new Error(err);
            err.status = 404;
            return next(err);
        }
        // mark our selected genres as checked 
        for (let i = 0; i < results.genres.length; ++i) {
            for (let j = 0; j < results.book.genre.length; ++j) {
                if (results.genres[i]._id.toString() === results.book.genre[j]._id.toString()) {
                    results.genres[i].checked = 'true';
                }
            }
        }
        // ok, so render
        res.render('bookForm', {
            title: 'Update book',
            authors: results.authors,
            genres: results.genres,
            books: results.books
        });
    });
};

// exports.bookUpdatePost = (req, res, next) => {
//     res.send('NOT IMPLEMENTED YET!');
// };

exports.bookUpdatePost = [
    // convert genre to an array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined') {
                req.body.genre = [];
            } else {
                req.body.genre = new Array(req.body.genre);
            }
        }
        // never forget to call next() middleware
        next();
    },
    // validation fields
    body('title', 'Invalid title').isLength({ min: 1 }).trim(),
    body('author', 'Invalid author').isLength({ min: 1 }).trim(),
    body('summary', 'Invalid summary').isLength({ min: 1 }).trim(),
    body('isbn', 'Invalid isbn').isLength({ min: 1 }).trim(),
    // sanitization fields
    sanitizeBody('title').escape(),
    sanitizeBody('author').escape(),
    sanitizeBody('summary').escape(),
    sanitizeBody('isbn').escape(),
    sanitizeBody('genre.*').escape(),
    // process request after validated and sanitized form data
    (req, res, next) => {
        let errors = validationResult(req);
        // create new book object
        let book = new Book({
            title: req.body.title,
            author: req.body.title,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre,
            _id: req.params.id
        });
        // check while, is there any errors
        if (!errors.isEmpty()) {
            // there are errors, so render form again with sanitized values/errors
            // but first, need to get all genres and authors 
            async.parallel({
                authors: (callback) => {
                    Author.find(callback);
                },
                genres: (callback) => {
                    Genre.find(callback);
                }
            }, (err, results) => {
                if (err) return next(err);
                // mark our selected genre as checked 
                for (let i = 0; i < results.genres.length; ++i) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }
                res.render('bookForm', {
                    title: 'Update Form',
                    authors: results.authors,
                    genres: results.genres,
                    book: book,
                    errors: errors.array()
                });
            });
            return;
        } else {
            // form data is valid 
            Book.findByIdAndUpdate(req.params.id, book, {}, (err, newBook) => {
                if (err) return next(err);
                res.redirect(newBook.url);
            });
        }
    }
];