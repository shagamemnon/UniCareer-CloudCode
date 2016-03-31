//Stripe Test SecretKey

var Stripe = require('stripe')

Stripe.initialize('sk_test_ePDSBK4YqUagVl3dkjzjpDt1');

var stripeSecretKey = 'sk_test_ePDSBK4YqUagVl3dkjzjpDt1';
var stripeBaseURL = 'api.stripe.com/v1';

Parse.Cloud.define("saveStripeCustomerIdAndCharge", function (request, response) {
        Stripe.Customers.create({
        card: request.params.token,
   	description: request.params.desc,
   	email: request.params.email
        }, {
                success: function(customer) {
 
                            var User = request.user;
                            User.set("stripe_customer_id",customer.id );
                            User.save(null, {
                                success: function(customer){
 
               response.success("Customer saved to parse = " + User.get("email"));
                                },
                                error: function(customer, error) {
                response.error("Failed to save customer id to parse");
                                }
 
                            });
 
                },
                error: function(httpResponse) {
                        response.error("Error");
                }
        }).then(function(customer){
    return Stripe.Charges.create({
      amount: request.params.amount, 
      currency: "usd",
      customer: customer.id
    },{
    success: function(results) {
      response.success(results);
    },
    error: function(httpResponse) {
      response.error(httpResponse);
    }
});
});
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

