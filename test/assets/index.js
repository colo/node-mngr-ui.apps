var test_page = null;

head.ready('mootools-more'
, function() {
	
	var TestModel = new Class({
		Implements: [Options, Events],
		
		initialize: function(options){
			
			this.setOptions(options);
			this.key = "value";
			
		}
	});
	
	var TestPage = new Class({
		Extends: Page,
		
		options: {
			assets: null
		},
		
		initialize: function(options){
			var self = this;
			
			this.addEvent(this.ASSETS_SUCCESS, function(){
				console.log('test_page.ASSETS_SUCCESS');
				self.fireEvent(self.STARTED);
			});
							
			this.addEvent(this.STARTED, function(){
					
				if(mainBodyModel.test() == null){
					
					if(!self.model){
						self.model = new TestModel();
						
						console.log('test binding applied');
					}
					
					mainBodyModel.test(self.model);
					
					//ko.tasks.schedule(this.start_timed_requests.bind(this));
					
				}
				else{
					self.model = mainBodyModel.test();
				}
				
				
			});
			
			this.parent(options);
			
			
		}
		
	});

	if(mainBodyModel){
		console.log('mainBodyModel');
		test_page = new TestPage();
	}
	else{
		console.log('no mainBodyModel');
		
		root_page.addEvent(root_page.STARTED, function(){									
			test_page = new TestPage();
		});
	}	
	
	
});
