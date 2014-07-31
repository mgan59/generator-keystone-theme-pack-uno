var util = require('util'),
	path = require('path'),
	_ = require('lodash'),
	utils = require('keystone-utils'),
	colors = require('colors'),
	yeoman = require('yeoman-generator');


var KeystoneGenerator = module.exports = function KeystoneGenerator(args, options, config) {
	
	// Initialise default values
	this.cloudinaryURL = false;
	this.mandrillAPI = false;
	
	// Apply the Base Generator
	yeoman.generators.Base.apply(this, arguments);
	
	// Welcome
	console.log('\nWelcome to KeystoneJS -- Theme Pack Uno.\n');
	
	// This callback is fired when the generator has completed,
	// and includes instructions on what to do next.
	var done = _.bind(function done() {
		console.log(
			'\n------------------------------------------------' +
			'\n' +
			'\nYour KeystoneJS project is ready to go!' +
			'\n' +
			'\nFor help getting started, visit http://keystonejs.com/guide' +

			((this.usingTestMandrillAPI) ?
				'\n' +
				'\nWe\'ve included a test Mandrill API Key, which will simulate email' +
				'\nsending but not actually send emails. Please replace it with your own' +
				'\nwhen you are ready.'
				: '') +

			((this.usingDemoCloudinaryAccount) ?
				'\n' +
				'\nWe\'ve included a demo Cloudinary Account, which is reset daily.' +
				'\nPlease configure your own account or use the LocalImage field instead' +
				'\nbefore sending your site live.'
				: '') +

			'\n\nTo start your new website, run "node keystone".' +
			'\n');
		
	}, this);
	
	// Install Dependencies when done
	this.on('end', function () {
		
		this.installDependencies({
			bower: false,
			skipMessage: true,
			skipInstall: options['skip-install'],
			callback: done
		});
		
	});
	
	// Import Package.json
	this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
	
};

// Extends the Base Generator
util.inherits(KeystoneGenerator, yeoman.generators.Base);

KeystoneGenerator.prototype.prompts = function prompts() {
	
	var cb = this.async();
	
	var prompts = {
		
		project: [
			{
				name: 'projectName',
				message: 'What is the name of your project?',
				default: 'My Site'
			}, {
				type: 'confirm',
				name: 'includeBlog',
				message: 'Would you like to include a Blog?',
				default: true
			}, {
				type: 'confirm',
				name: 'includeGallery',
				message: 'Would you like to include an Image Gallery?',
				default: true
			}, {
				type: 'confirm',
				name: 'includeEnquiries',
				message: 'Would you like to include a Contact Form?',
				default: true
			}, {
				name: 'userModel',
				message: 'What would you like to call the User model?',
				default: 'User'
			}, {
				name: 'adminLogin',
				message: 'Enter an email address for the first Admin user:',
				default: 'user@keystonejs.com'
			}, {
				name: 'adminPassword',
				message: 'Enter a password for the first Admin user:',
				default: 'admin'
			}, {
				name: 'taskRunner',
				message: 'Would you like to include gulp or grunt? ' + (('[gulp | grunt]').grey),
			}, {
				type: 'confirm',
				name: 'includeEmail',
				message: '------------------------------------------------' +
					'\n    KeystoneJS integrates with Mandrill (from Mailchimp) for email sending.' +
					'\n    Mandrill accounts are free for up to 12k emails per month.' +
					'\n    Would you like to include Email configuration in your project?',
				default: true
			}
		],
		
		config: []
		
	};
	
	this.prompt(prompts.project, function(props) {
		
		_.each(props, function(val, key) {
			this[key] = val;
		}, this);
		
		// statically config viewEngine to hbs, easier than removing all code refs
		this.viewEngine = 'hbs';
		
		// Keep an unescaped version of the project name
		this._projectName = this.projectName;
		// ... then escape it for use in strings (most cases)
		this.projectName = utils.escapeString(this.projectName);
		this.adminLogin = utils.escapeString(this.adminLogin);
		this.adminPassword = utils.escapeString(this.adminPassword);
		
		// Clean the viewEngine selection
		if (_.contains(['handlebars', 'hbs', 'h'], this.viewEngine.toLowerCase().trim())) {
			this.viewEngine = 'hbs';
		} else if (_.contains(['swig', 's'], this.viewEngine.toLowerCase().trim())) {
			this.viewEngine = 'swig';
		} else if (_.contains(['nunjucks', 'nun', 'n'], this.viewEngine.toLowerCase().trim())) {
			this.viewEngine = 'nunjucks';
		} else {
			this.viewEngine = 'jade';
		}
		
		// Clean the userModel name
		this.userModel = utils.camelcase(this.userModel, false);
		this.userModelPath = utils.keyToPath(this.userModel, true);
		
		// Clean the taskRunner selection
		this.taskRunner = (this.taskRunner || '').toLowerCase().trim();
		
		// Additional prompts may be required, based on selections
		if (this.includeBlog || this.includeGallery || this.includeEmail) {
			
			if (this.includeEmail) {
				prompts.config.push({
					name: 'mandrillAPI',
					message: '------------------------------------------------' +
						'\n    Please enter your Mandrill API Key (optional).' +
						'\n    See http://keystonejs.com/guide/config/#mandrill for more info.' +
						'\n    ' +
						'\n    You can skip this for now (we\'ll include a test key instead)' +
						'\n    ' +
						'\n    Your Mandrill API Key:'
				});
			}
			
			if (this.includeBlog || this.includeGallery) {
				
				var blog_gallery = 'blog and gallery templates';
				
				if (!this.includeBlog) {
					blog_gallery = 'gallery template';
				} else if (!this.includeGallery) {
					blog_gallery = 'blog template';
				}
				
				prompts.config.push({
					name: 'cloudinaryURL',
					message: '------------------------------------------------' +
						'\n    KeystoneJS integrates with Cloudinary for image upload, resizing and' +
						'\n    hosting. See http://keystonejs.com/guide/config/#cloudinary for more info.' +
						'\n    ' +
						'\n    CloudinaryImage fields are used by the ' + blog_gallery + '.' +
						'\n    ' +
						'\n    You can skip this for now (we\'ll include demo account details)' +
						'\n    ' +
						'\n    Please enter your Cloudinary URL:'
				});
				
			}
			
		}
		
		if (!prompts.config.length) {
			return cb();
		}
		
		this.prompt(prompts.config, function(props) {
			
			_.each(props, function(val, key) {
				this[key] = val;
			}, this);
			
			if (this.includeEmail && !this.mandrillAPI) {
				this.usingTestMandrillAPI = true;
				this.mandrillAPI = 'NY8RRKyv1Bure9bdP8-TOQ';
			}
			
			if (!this.cloudinaryURL && (this.includeBlog || this.includeGallery)) {
				this.usingDemoCloudinaryAccount = true;
				this.cloudinaryURL = 'cloudinary://333779167276662:_8jbSi9FB3sWYrfimcl8VKh34rI@keystone-demo';
			}
			
			cb();
			
		}.bind(this));
		
	}.bind(this));
	
};

KeystoneGenerator.prototype.guideComments = function() {
	
	var cb = this.async();
	
	this.prompt([
		{
			type: 'confirm',
			name: 'includeGuideComments',
			message: '------------------------------------------------' +
				'\n    Finally, would you like to include extra code comments in' +
				'\n    your project? If you\'re new to Keystone, these may be helpful.',
			default: true
		}
	], function(props) {
		
		this.includeGuideComments = props.includeGuideComments;
		cb();
		
	}.bind(this));
	
};

KeystoneGenerator.prototype.keys = function keys() {
	
	var cookieSecretChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz!@#$%^&*()-=_+[]{}|;:",./<>?`~';
	
	this.cookieSecret = utils.randomString(64, cookieSecretChars);
	
};

KeystoneGenerator.prototype.project = function project() {
	
	this.template('_package.json', 'package.json');
	this.template('_env', '.env');
	this.template('_jshintrc', '.jshintrc');
	
	this.template('_keystone.js', 'keystone.js');
	
	this.copy('editorconfig', '.editorconfig');
	this.copy('gitignore', '.gitignore');
	this.copy('Procfile');
	
	if(this.taskRunner === 'grunt') {
		this.copy('Gruntfile.js');
	}
	
	if(this.taskRunner === 'gulp'){
		this.copy('gulpfile.js');
	}
	
};

KeystoneGenerator.prototype.models = function models() {
	
	var modelFiles = [],
		modelIndex = '';
	
	if (this.includeBlog) {
		modelFiles.push('Post');
		modelFiles.push('PostCategory');
	}
	
	if (this.includeGallery) {
		modelFiles.push('Gallery');
	}
	
	if (this.includeEnquiries) {
		modelFiles.push('Enquiry');
	}
	
	this.mkdir('models');
	
	this.template('models/_User.js', 'models/'+this.userModel+'.js');
	
	modelFiles.forEach(function(i) {
		this.template('models/' + i + '.js');
		modelIndex += 'require(\'./' + i + '\');\n';
	}, this);
	
	// we're now using keystone.import() for loading models, so an index.js
	// file is no longer required. leaving for reference.
	
	// this.write('models/index.js', modelIndex);
	
};

KeystoneGenerator.prototype.routes = function routes() {
	
	this.mkdir('routes');
	this.mkdir('routes/views');
	
	this.template('routes/_index.js', 'routes/index.js');
	this.template('routes/_middleware.js', 'routes/middleware.js');
	
	if (this.includeEmail) {
		this.template('routes/_emails.js', 'routes/emails.js');
	}
	
	this.copy('routes/views/index.js');
	
	if (this.includeBlog) {
		this.copy('routes/views/blog.js');
		this.copy('routes/views/post.js');
		// adding two additional view routes for uno
		this.copy('routes/views/blogIndex.js');
		this.copy('routes/views/blogCategory.js');
	}
	
	if (this.includeGallery) {
		this.copy('routes/views/gallery.js');
	}
	
	if (this.includeEnquiries) {
		this.copy('routes/views/contact.js');
	}
	
};

KeystoneGenerator.prototype.templates = function templates() {
	
	if (this.viewEngine === 'hbs') {
		// do not bind a theme into place
		// point of theme-packs is to decouple themes from core (no monoliths)
		return;
	} else if (this.viewEngine === 'nunjucks') {
		
		// Copy Nunjucks Templates
		
		this.mkdir('templates');
		this.mkdir('templates/views');
		
		this.directory('templates/default-' + this.viewEngine + '/layouts', 'templates/layouts');
		this.directory('templates/default-' + this.viewEngine + '/mixins', 'templates/mixins');
		this.directory('templates/default-' + this.viewEngine + '/views/errors', 'templates/views/errors');
		
		this.copy('templates/default-' + this.viewEngine + '/views/index.html', 'templates/views/index.html');
		
		if (this.includeBlog) {
			this.copy('templates/default-' + this.viewEngine + '/views/blog.html', 'templates/views/blog.html');
			this.copy('templates/default-' + this.viewEngine + '/views/post.html', 'templates/views/post.html');
		}
		
		if (this.includeGallery) {
			this.copy('templates/default-' + this.viewEngine + '/views/gallery.html', 'templates/views/gallery.html');
		}
		
		if (this.includeEnquiries) {
			this.copy('templates/default-' + this.viewEngine + '/views/contact.html', 'templates/views/contact.html');
			if (this.includeEmail) {
				this.copy('templates/default-' + this.viewEngine + '/emails/enquiry-notification.html', 'templates/emails/enquiry-notification.html');
			}
		}
	} else {
		
		// Copy Jade/Swig Templates
		
		this.mkdir('templates');
		this.mkdir('templates/views');
		
		this.directory('templates/default-' + this.viewEngine + '/layouts', 'templates/layouts');
		this.directory('templates/default-' + this.viewEngine + '/mixins', 'templates/mixins');
		this.directory('templates/default-' + this.viewEngine + '/views/errors', 'templates/views/errors');
		
		this.copy('templates/default-' + this.viewEngine + '/views/index.' + this.viewEngine, 'templates/views/index.' + this.viewEngine);
		
		if (this.includeBlog) {
			this.copy('templates/default-' + this.viewEngine + '/views/blog.' + this.viewEngine, 'templates/views/blog.' + this.viewEngine);
			this.copy('templates/default-' + this.viewEngine + '/views/post.' + this.viewEngine, 'templates/views/post.' + this.viewEngine);
		}
		
		if (this.includeGallery) {
			this.copy('templates/default-' + this.viewEngine + '/views/gallery.' + this.viewEngine, 'templates/views/gallery.' + this.viewEngine);
		}
		
		if (this.includeEnquiries) {
			this.copy('templates/default-' + this.viewEngine + '/views/contact.' + this.viewEngine, 'templates/views/contact.' + this.viewEngine);
			if (this.includeEmail) {
				this.copy('templates/default-' + this.viewEngine + '/emails/enquiry-notification.' + this.viewEngine, 'templates/emails/enquiry-notification.' + this.viewEngine);
			}
		}
	}
	
};

KeystoneGenerator.prototype.updates = function routes() {
	
	this.directory('updates');
	
};

KeystoneGenerator.prototype.files = function files() {
	
	this.directory('public');
	
};
