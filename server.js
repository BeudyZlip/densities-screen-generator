var express			=		require("express"),
	multer			=		require('multer'),
	app				=		express(),
	upload 			= 		multer({ dest: './uploads/'}),
	zipFolder		= 		require('zip-folder'),
	fs				= 		require("fs"),
	mv				= 		require("mv"),
	lwip			= 		require('lwip-promise'),
	objectMerge		= 		require('object-merge'),
	Q				= 		require('q'),
	CronJob 		= 		require('cron').CronJob,
	sendmail 		= 		require('sendmail')(),
	tmpUpload		= 		'./uploads/',
	persistance 	= 		10, // Time in miniutes
	port			= 		(process.env.PORT || 3008);

app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use('/javascript',  express.static(__dirname + '/javascript'));
app.use('/css',  express.static(__dirname + '/css'));
app.use('/uploads',  express.static(__dirname + '/uploads'));
app.use('/images',  express.static(__dirname + '/images'));

app.use(multer({
	dest: tmpUpload,
	rename: function (fieldname, filename) {
		return filename;
	},
	onFileUploadStart: function (file) {
		// console.log(file.originalname + ' is starting ...');
	},
	onFileUploadComplete: function (file) {
		// console.log(file.fieldname + ' uploaded to  ' + file.path)
	}
}));

app.get('/',function(req,res){
	res.sendFile(__dirname + "/index.html");
});
app.get('/sitemap.xml',function(req,res){
	res.sendFile(__dirname + "/sitemap.xml");
});
app.get('/robots.txt',function(req,res){
	res.sendFile(__dirname + "/robots.txt");
});

app.post('/api/contact',function(req,res){

	var title = (req.body.title) ? req.body.title : false,
		email = (req.body.email) ? req.body.email : false,
		message = (req.body.message) ? req.body.message : false,
		city = (req.body.city) ? req.body.city : false;

	// AntiSpam
	if(city == "d9ad583cc79c73c636385003955c4a9f") {

		var validateEmail = function(email) {
			var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
			return re.test(email);
		}

		if (title && validateEmail(email) && message) {
			sendmail({
				from: email,
				to: 'kevin.martin@studio104.fr',
				subject: title,
				content: message,
			}, function(err, reply) {
				console.log(err && err.stack);
				// console.dir(reply);
				if (err) res.end('false');
				else res.end('true');
			});
		}
		else res.end('false');

	}
	else res.end('false');
});

app.post('/api/upload',function(req,res){

	var createArraySize = function() {
		var a = new Object();

		if( req.body.ios ) {
			a.ios = new Array();
			for( var i in req.body.ios ) {
				var size = req.body.ios[i];
				if( undefined !== req.body['iosSize'+size] && req.body['iosSize'+size].length )
					a['ios'][size] = req.body['iosSize'+size]
			}
		}
		if( req.body.android ) {
			a.android = new Array();
			for( var i in req.body.android ) {
				var size = req.body.android[i];
				if( undefined !== req.body['androidSize'+size] && req.body['androidSize'+size].length )
					a['android'][size] = req.body['androidSize'+size]
			}
		}
		return a;
	}

	var config = {
 		"files": req.files,
		"target":  Date.now(),
		"os" : createArraySize()
	}

	var createTmpDir = function() {
		var target = tmpUpload + config.target;
		fs.mkdir( target, function() {
			if( config.os.ios )
				fs.mkdir( target + '/ios' );
			if( config.os.android )
				fs.mkdir( target + '/android', function() {
					for(var key in config.os.android) {
						fs.mkdir( target + '/android/' + key );
					}
				} );
		} );
	}

	var moveFiles = function() {
		var file = config.files.imageFile;
		mv( file.path,
			tmpUpload + config.target + '/' + file.name ,
			{mkdirp: true}, function(err) {
				// console.log('moved to ' + config.target );
			});
	}

	var createImage = function() {
		var file = config.files.imageFile,
			url = tmpUpload + config.target + '/',
			extFile = file.originalname.split('.'),
			extFile = extFile[extFile.length-1]
			nameFile = file.originalname.replace('.' + extFile , ''),
			out = new Array(),
			result = Q(),
			lwipResize = function( width, height, size, dir ) {
				var dir = ( dir == 'android' ) ? dir + '/' + size : dir,
					size = ( dir == 'ios' ) ? size : '';
				if( size == '@1x' ) size = '';
				lwip
					.open( url + file.name, function(err, image){
						if( image )
							image
								.batch()
								.resize(width, height)
								.writeFile( url + dir + '/' + nameFile + size + '.' + extFile, function(err){
									// console.log( width, height, size, dir )
									return true;
								})
					})
			}
			if( config.os.ios ) {
				for(var key in config.os.ios) {
					var a = new Array(),
						width = ( eval(config.os.ios[key][0]) && eval(config.os.ios[key][0]) != 0 ) ? eval(config.os.ios[key][0]) : eval(config.os.ios[key][1]),
						height = ( eval(config.os.ios[key][1]) && eval(config.os.ios[key][1]) != 0 ) ? eval(config.os.ios[key][1]) : eval(config.os.ios[key][0]);
					if( width != "" && height != "") {
						a[0] = width;
						a[1] = height;
						a[2] = "@" + reverse(key);
						a[3] = "ios";
					}
					out.push( a );
				}
			}
			if( config.os.android ) {
				for(var key in config.os.android) {
					var a = new Array(),
						width = ( eval(config.os.android[key][0]) && eval(config.os.android[key][0]) != 0 ) ? eval(config.os.android[key][0]) : eval(config.os.android[key][1]),
						height = ( eval(config.os.android[key][1]) && eval(config.os.android[key][1]) != 0 ) ? eval(config.os.android[key][1]) : eval(config.os.android[key][0]);
					a[0] = width;
					a[1] = height;
					a[2] = key;
					a[3] = "android";
					out.push( a );
				}
			}
			out.forEach(function (f) {
				result = lwipResize( f[0], f[1], f[2], f[3] );
			});
	}

	var zip = function() {
		zipFolder(tmpUpload + config.target , tmpUpload + config.target + '.zip', function(err) {
			if(err) {
				// console.log('oh no!', err);
			} else {
				// console.log('Zippé');
				var r = JSON.stringify({
					zip: tmpUpload + config.target + '.zip',
					file: config.files.imageFile.originalname
				})
				res.end(r);
			}
		});
	}

	var deleteUpload = function() {
		deleteFolderRecursive( tmpUpload + config.target );
	}

	if(
		(
			( config.os.ios && Object.size(config.os.ios) > 0 ) ||
			( config.os.android && Object.size(config.os.android) > 0 )
		)
		&& Object.size( config.files ) > 0
	) {
		var funcs = [createTmpDir, moveFiles, createImage, zip, deleteUpload],
			result = Q();
		funcs.forEach(function (f) {
			result = result.delay(300).then(f);
		});
	}
	else {
		if( Object.size( config.files ) > 0  ) fs.unlinkSync( config.files.imageFile.path );
		res.end('false');
	}

});

var removeOlderZip = function() {
	var dateNow = new Date();
	fs.readdir(tmpUpload, function(err, items) {
		var result = Q();
		items.forEach(function (f) {
			var dateFile = fs.stat( tmpUpload + f, function(err, stats)  {
				if( Date.parse( dateNow ) - Date.parse( stats.mtime ) >= ( persistance * 60000 ) ) {
					if( stats.isFile() )
						fs.unlinkSync( tmpUpload + f );
					else if( stats.isDirectory() )
						deleteFolderRecursive( tmpUpload + f );
				}
			})
		});
	});
}

function reverse(s){
	return s.split("").reverse().join("");
}

Object.size = function(obj) {
	var size = 0, key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) size++;
	}
	return size;
};

var deleteFolderRecursive = function(path) {
	if( fs.existsSync(path) ) {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;
			if(fs.lstatSync(curPath).isDirectory()) {
				deleteFolderRecursive(curPath);
			} else {
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
 	}
};

var job = new CronJob('*/10 * * * *', function(){
	removeOlderZip();
}, null, false);
job.start();

app.listen(port ,function(){
	console.log("Working on port " + port);
});
