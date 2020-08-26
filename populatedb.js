console.log('This script populates some test books, authors, genres and bookinstances to your database. Specified database as argument - e.g.: populatedb mongodb+srv://cooluser:coolpassword@cluster0-mbdj7.mongodb.net/local_library?retryWrites=true');

// get arguments passed on command line 
let userArgs = process.argv.slice(2);

/*
if (!userArgs[0].startsWith('mongodb')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}
*/
const async = require('async');
let Author = require('./models/author');
let Book = require('./models/book');
let BookInstance = require('./models/bookInstance');
let Genre = require('./models/genre');

const mongoose = require('mongoose');
// let { authorDetail } = require('./controllers/authorController');
// let { bookDetail } = require('./controllers/bookController');
// let { genreDetail } = require('./controllers/genreController');
// let { bookInstanceDetail } = require('./controllers/bookInstanceController');
let mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
let db = process.env.MONGO || 'test';
db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

let authors = [];
let books = [];
let bookInstances = [];
let genres = [];

function authorCreate(firstName, familyName, dOfBirth, dOfDeath, callback) {
    authorDetail = {
        firstName: firstName,
        familyName: familyName
    };
    if (dOfBirth !== false) authorDetail.dateOfBirth = dOfBirth;
    if (dOfDeath !== false) authorDetail.dateOfDeath = dOfDeath;

    let author = new Author(authorDetail);
    author.save((err) => {
        if (err) {
            callback(err, null);
            return;
        }
        console.log(`new author: ${author}`);
        authors.push(author);
        callback(null, author);
    });
}

function bookCreate(title, summary, isbn, author, genre, callback) {
    bookDetail = {
        title: title,
        summary: summary,
        isbn: isbn,
        author: author
    };
    if (genre !== false) bookDetail.genre = genre;

    let book = new Book(bookDetail);
    book.save((err) => {
        if (err) {
            callback(err, null);
            return;
        }
        console.log(`new book: ${book}`);
        books.push(book);
        callback(null, book);
    });
}

function genreCreate(name, callback) {
    genreDetail = { name: name };
    let genre = new Genre(genreDetail);
    genre.save((err) => {
        if (err) {
            callback(err, null);
            return;
        }
        console.log(`new genre ${genre}`);
        genres.push(genre);
        callback(null, genre);
    });
}

function bookInstanceCreate(book, imprint, dueBack, status, callback) {
    bookInstanceDetail = {
        book: book,
        imprint: imprint
    };
    if (dueBack !== false) bookInstanceDetail.due_back = dueBack;
    if (status !== false) bookInstanceDetail.status = status;

    let bookInstance = new BookInstance(bookInstanceDetail);
    bookInstance.save((err) => {
        if (err) {
            callback(err, null);
            return;
        }
        console.log(`new book instance: ${bookInstance}`);
        bookInstances.push(bookInstance);
        callback(null, bookInstance);
    });
}

function createGenreAuthors(callback) {
    async.series([
            function(callback) {
                authorCreate('Patrick', 'Rothfuss', '1973-06-06', false, callback);
            },
            function(callback) {
                authorCreate('Ben', 'Bova', '1932-11-8', false, callback);
            },
            function(callback) {
                authorCreate('Isaac', 'Asimov', '1920-01-02', '1992-04-06', callback);
            },
            function(callback) {
                authorCreate('Bob', 'Billings', false, false, callback);
            },
            function(callback) {
                authorCreate('Jim', 'Jones', '1971-12-16', false, callback);
            },
            function(callback) {
                genreCreate("Fantasy", callback);
            },
            function(callback) {
                genreCreate("Science Fiction", callback);
            },
            function(callback) {
                genreCreate("French Poetry", callback);
            },
        ],
        // optional callback
        callback);
}

function createBooks(callback) {
    async.parallel([
            function(callback) {
                bookCreate('Anh van dung day cho em ve (The Kien Nguyen, #1)', 'I have stolen princesses back from sleeping barrow kings. I burned down the town of Trebon. I have spent the night with Felurian and left with both my sanity and my life. I was expelled from the University at a younger age than most people are allowed in. I tread paths by moonlight that others fear to speak of during day. I have talked to Gods, loved women, and written songs that make the minstrels weep.', '9781473211896', authors[0], [genres[0], ], callback);
            },
            function(callback) {
                bookCreate("Ngay mai (The Kien Nguyen, #2)", 'Picking up the tale of Kvothe Kingkiller once again, we follow him into exile, into political intrigue, courtship, adventure, love and magic... and further along the path that has turned Kvothe, the mightiest magician of his age, a legend in his own time, into Kote, the unassuming pub landlord.', '9788401352836', authors[0], [genres[0], ], callback);
            },
            function(callback) {
                bookCreate("The Slow Regard of Silent Things (Kingkiller Chronicle)", 'Deep below the University, there is a dark place. Few people know of it: a broken web of ancient passageways and abandoned rooms. A young woman lives there, tucked among the sprawling tunnels of the Underthing, snug in the heart of this forgotten place.', '9780756411336', authors[0], [genres[0], ], callback);
            },
            function(callback) {
                bookCreate("Apes and Angels", "Humankind headed out to the stars not for conquest, nor exploration, nor even for curiosity. Humans went to the stars in a desperate crusade to save intelligent life wherever they found it. A wave of death is spreading through the Milky Way galaxy, an expanding sphere of lethal gamma ...", '9780765379528', authors[1], [genres[1], ], callback);
            },
            function(callback) {
                bookCreate("Death Wave", "In Ben Bova's previous novel New Earth, Jordan Kell led the first human mission beyond the solar system. They discovered the ruins of an ancient alien civilization. But one alien AI survived, and it revealed to Jordan Kell that an explosion in the black hole at the heart of the Milky Way galaxy has created a wave of deadly radiation, expanding out from the core toward Earth. Unless the human race acts to save itself, all life on Earth will be wiped out...", '9780765379504', authors[1], [genres[1], ], callback);
            },
            function(callback) {
                bookCreate('Test Book 1', 'Summary of test book 1', 'ISBN111111', authors[4], [genres[0], genres[1]], callback);
            },
            function(callback) {
                bookCreate('Test Book 2', 'Summary of test book 2', 'ISBN222222', authors[4], false, callback)
            }
        ],
        // optional callback
        callback);
}

function createBookInstances(callback) {
    async.parallel([
            function(callback) {
                bookInstanceCreate(books[0], 'Seoul South Korea, 2014.', false, 'Available', callback)
            },
            function(callback) {
                bookInstanceCreate(books[1], ' Hanoi Vietnam, 2011.', false, 'Loaned', callback)
            },
            function(callback) {
                bookInstanceCreate(books[2], ' Gollancz, 2015.', false, false, callback)
            },
            function(callback) {
                bookInstanceCreate(books[3], 'New York Tom Doherty Associates, 2016.', false, 'Available', callback)
            },
            function(callback) {
                bookInstanceCreate(books[3], 'New York Tom Doherty Associates, 2016.', false, 'Available', callback)
            },
            function(callback) {
                bookInstanceCreate(books[3], 'New York Tom Doherty Associates, 2016.', false, 'Available', callback)
            },
            function(callback) {
                bookInstanceCreate(books[4], 'New York, NY Tom Doherty Associates, LLC, 2015.', false, 'Available', callback)
            },
            function(callback) {
                bookInstanceCreate(books[4], 'New York, NY Tom Doherty Associates, LLC, 2015.', false, 'Maintenance', callback)
            },
            function(callback) {
                bookInstanceCreate(books[4], 'New York, NY Tom Doherty Associates, LLC, 2015.', false, 'Loaned', callback)
            },
            function(callback) {
                bookInstanceCreate(books[0], 'Imprint XXX2', false, false, callback)
            },
            function(callback) {
                bookInstanceCreate(books[1], 'Imprint XXX3', false, false, callback)
            }
        ],
        callback);
}

async.series([
        createGenreAuthors,
        createBooks,
        createBookInstances
    ],
    function(err, results) {
        if (err) console.error('ERROR: ', err);
        else {
            console.log('Book instances: ', bookInstances);
        }
        // all done, so disconnect from db 
        mongoose.connection.close();
    });