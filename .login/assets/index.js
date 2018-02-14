var login_page = null;

//head.js({ crypto: "/public/apps/login/bower/cryptojslib/rollups/sha1.js" }); //no dependencies

//head.load({ li: "/public/bower/li/lib/index.js" });//parse Link header

head.ready('mootools-more', function() {

	//if(mainBodyModel.login() == null){
		
		//mainBodyModel.login(new LoginModel());
		
	//}

	//console.log('Login binding applied');
	
	var LoginPage = new Class({
		Extends: Page,
		
		options: {
			assets: {
				js: [
					{ model: "/public/apps/login/models/index.js" },
					{ li: "/public/bower/li/lib/index.js" },
					{ resilient: "/public/bower/resilient/resilient.min.js" },
					{ crypto: "/public/apps/login/bower/cryptojslib/rollups/sha1.js" }
				],
				css: {
					login_css: '/public/apps/login/css/index.css',
					////dns_css: '/public/apps/dns/index.css',
					////green_css: '/public/bower/gentelella/vendors/iCheck/skins/flat/green.css'
				}
			},
		},
		
		initialize: function(options){
			var self = this;
			
			this.addEvent(this.ASSETS_SUCCESS, function(){
				console.log('login_page.ASSETS_SUCCESS');
				self.fireEvent(self.STARTED);
			});
							
			this.addEvent(this.STARTED, function(){
					
				if(mainBodyModel.login() == null){
					
					if(!self.model){
						self.model = new LoginModel();
						
						console.log('login binding applied');
					}
					
					mainBodyModel.login(self.model);
					
					//ko.tasks.schedule(this.start_timed_requests.bind(this));
					
				}
				else{
					self.model = mainBodyModel.login();
				}
				
				
			});
			
			this.parent(options);
			
			
		}
		
	});

	if(mainBodyModel){
		console.log('mainBodyModel');
		login_page = new LoginPage();
	}
	else{
		console.log('no mainBodyModel');
		
		root_page.addEvent(root_page.STARTED, function(){									
			login_page = new LoginPage();
		});
	}	
		
});

