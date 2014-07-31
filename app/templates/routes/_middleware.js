<% if (includeGuideComments) { %>/**
 * This file contains the common middleware used by your routes.
 * 
 * Extend or replace these functions as your application requires.
 * 
 * This structure is not enforced, and just a starting point. If
 * you have more middleware you may want to group it as separate
 * modules in your project's /lib directory.
 */

<% } %>var _ = require('underscore'),
	querystring = require('querystring'),
	keystone = require('keystone');


/**
	Initialises the standard view locals<% if (includeGuideComments) { %>
	
	The included layout depends on the navLinks array to generate
	the navigation in the header, you may wish to change this array
	or replace it with your own templates / logic.<% } %>
*/

exports.initLocals = function(req, res, next) {
	
	var locals = res.locals;
	
	locals.navLinks = [
		{ label: 'Home',		key: 'home',		href: '/' }<% if (includeBlog) { %>,
		{ label: 'Blog',		key: 'blog',		href: '/blog' }<% } %><% if (includeGallery) { %>,
		{ label: 'Gallery',		key: 'gallery',		href: '/gallery' }<% } %><% if (includeEnquiries) { %>,
		{ label: 'Contact',		key: 'contact',		href: '/contact' }<% } %>
	];
	
	locals.user = req.user;
	
	////
	// Custom Local data for Uno Theme
	////
	// emulate the values found in a Ghost configuration menu
	// used in the title-page
	locals.blog = {
		title:'Your Name',
		// custom field for uno theme
		subTitle:'NYC Technologist',
		description:'FullstackJS engineer building distributed cloud technology',
		// anchor images to root
		// otherwise they won't work on nested pages `/blog/post/*`
		cover:'/images/background-cover.jpg'
	};
	// custom values for a theme, in this case coverOverlay is a style setting for Uno
	locals.theme = {
		coverOverlay:'cover-slate'
	};
	// end local-theme
	
	next();
	
};


/**
	Fetches and clears the flashMessages before a view is rendered
*/

exports.flashMessages = function(req, res, next) {
	
	var flashMessages = {
		info: req.flash('info'),
		success: req.flash('success'),
		warning: req.flash('warning'),
		error: req.flash('error')
	};
	
	res.locals.messages = _.any(flashMessages, function(msgs) { return msgs.length; }) ? flashMessages : false;
	
	next();
	
};


/**
	Prevents people from accessing protected pages when they're not signed in
 */

exports.requireUser = function(req, res, next) {
	
	if (!req.user) {
		req.flash('error', 'Please sign in to access this page.');
		res.redirect('/keystone/signin');
	} else {
		next();
	}
	
};
