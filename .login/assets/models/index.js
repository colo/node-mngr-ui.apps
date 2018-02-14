var LoginModel = new Class({
	Implements: [Options, Events],
	
	options : {
	},
					
	initialize: function(options){
		var self = this;
		
		self.setOptions(options);
		//Cookie.options = {domain : '192.168.0.80:8080'};
			
		//var error = Cookie.read('bad') || false;
		
	
		//self.clearpasswordname = Math.random().toString(36).substring(7);
		
		//self.error = ko.observable(error);
		
		//self.name = "Hola";
	
		self.clearpassword = ko.observable();
		
		self.password = ko.observable(null);
		
		self.submit = function(form){
			console.log(form.clearpassword.value);
			
			//console.log(self.clearpassword());
			
			var hash = CryptoJS.SHA1(form.clearpassword.value);
			console.log(hash.toString());
			
			self.password(hash.toString());
			
			//console.log(self.password());
			
			//form.clearpassword.value = "";
			
			//console.log(window.location.host);
		
			var servers = [
				window.location.protocol+'//'+window.location.host
			];
			var client = resilient({
				 service: { 
					 basePath: '/login/api',
					 headers : { "Content-Type": "application/json" },
					 data: { "username": form.username.value, "password": form.password.value }
				 }
			 });
			client.setServers(servers);
			

			client.post('/', function(err, res){
				if(err){
					console.log('Error:', err);
					console.log('Response:', err.data);
				}
				else{
					//console.log('Ok:', res);
					//console.log('Body:', res.data);
					//console.log(li.parse(res.headers.Link));
					
					window.location.replace(li.parse(res.headers.Link).next);
					
					
				}
			});
	
			return false;//don't submit
		};
	},

});

/**
 * http://www.matteoagosti.com/blog/2013/02/24/writing-javascript-modules-for-both-browser-and-node/
 * 
 * */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = LoginModel;
}
else {
	if (typeof define === 'function' && define.amd) {
		define([], function() {
			return LoginModel;
		});
	}
	else {
		window.LoginModel = LoginModel;
	}
}
