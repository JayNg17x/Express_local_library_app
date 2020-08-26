const express = require('express');
const path = require('path');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

// setup mongoDB
const mongoose = require('mongoose');
let dev_db_url = 'mongodb+srv://cudayanh:kien12a9@cluster0.cxja9.azure.mongodb.net/local_library?authSource=admin';
let mongoDb = process.env.MONGODB_URI || dev_db_url;
mongoose.connect(mongoDb, { useNewUrlParser: true });
mongoose.Promise = require('bluebird');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error :('));

// import app's routes
let indexRouter = require('./routes/index');
let userRouter = require('./routes/users');
let catalogRouter = require('./routes/catalog');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// configure app's enviroment
app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());;
app.use(cookieParser());
app.use(helmet());
app.use(compression()); // compress all app's routes
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', userRouter);
app.use('/catalog', catalogRouter);

// catch 404 and forward to error handle 
app.use((req, res, next) => {
    next(createError(404));
});

// handle error
app.use((err, req, res, next) => {
    // set locals, only provide error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render error page
    res.status(err.status || 500);
    res.render('error');
});


let port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`App is running on port ${port}`);
});