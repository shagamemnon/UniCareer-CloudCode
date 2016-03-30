
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});


Parse.Cloud.beforeSave("Experience", function(request, response){

var newEntry = request.object;

var checkPrevious = new Parse.Query("Experience");
checkPrevious.equalTo("positionTitle", newEntry.get("positionTitle"));
checkPrevious.equalTo("companyName", newEntry.get("companyName"));

checkPrevious.first({
	success: function(object) {
	
	if(object){
		 response.error({errorCode: 123, errorMsg: "Already entered this value"});
	} else {
		response.success();
	}
	},
	error: function(error) {
		response.error("Could not validate uniqueness of object");
	}
});
});

