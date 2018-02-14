var dashboard_page = null;

head.ready('mootools-more'
, function() {
	
	var DashBoardModel = new Class({
		Implements: [Options, Events],
		
		initialize: function(options){
			
			this.setOptions(options);
			this.key = "value";
			
		}
	});
	
	var DashBoardPage = new Class({
		Extends: Page,
		
		options: {
			assets: null
		},
		
		initialize: function(options){
			var self = this;
			
			this.addEvent(this.ASSETS_SUCCESS, function(){
				console.log('dashboard_page.ASSETS_SUCCESS');
				self.fireEvent(self.STARTED);
			});
							
			this.addEvent(this.STARTED, function(){
					
				if(mainBodyModel.dashboard() == null){
					
					if(!self.model){
						self.model = new DashBoardModel();
						
						console.log('dashboard binding applied');
					}
					
					mainBodyModel.dashboard(self.model);
					
					//ko.tasks.schedule(this.start_timed_requests.bind(this));
					
				}
				else{
					self.model = mainBodyModel.dashboard();
				}
				
				
			});
			
			this.parent(options);
			
			
		}
		
	});

	if(mainBodyModel){
		console.log('mainBodyModel');
		dashboard_page = new DashBoardPage();
	}
	else{
		console.log('no mainBodyModel');
		
		root_page.addEvent(root_page.STARTED, function(){									
			dashboard_page = new DashBoardPage();
		});
	}	
	
	
});
