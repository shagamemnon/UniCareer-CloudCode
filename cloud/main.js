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
        success: function (customer) {

            var User = request.user;
            User.set("stripe_customer_id", customer.id);
            User.save(null, {
                success: function (customer) {

                    response.success("Customer saved to parse = " + User.get("email"));
                },
                error: function (customer, error) {
                    response.error("Failed to save customer id to parse");
                }

            });

        },
        error: function (httpResponse) {
            response.error("Error");
        }
    }).then(function (customer) {
        return Stripe.Charges.create({
            amount: request.params.amount,
            currency: "usd",
            customer: customer.id
        }, {
            success: function (results) {
                response.success(results);
            },
            error: function (httpResponse) {
                response.error(httpResponse);
            }
        });
    });
});

Parse.Cloud.define("stripeChargeCustomer", function(request, response) {
      Stripe.Charges.create({
      amount: request.params.amount,
      currency: "usd",
      customer: request.params.customerId,
      description: request.params.description
    },{
    success: function(results) {
      response.success(results);
    },
    error: function(httpResponse) {
      response.error(httpResponse);
    }
 
});
});

Parse.Cloud.define("stripeDeleteCard", function (request, response) {
    Parse.Cloud.httpRequest({
        method: "DELETE",
        url: "https://" + stripeSecretKey + ':@' + stripeBaseUrl + "/customers/" + request.params.customerId + "/sources/" + request.params.cardId,
        // body: "id="+request.params.cardId,
        success: function (cards) {
            console.log(JSON.stringify(cards));
            response.success(cards);
        },
        error: function (httpResponse) {
            response.error('Request failed with response code ' + httpResponse.status);
        }
    });
});

Parse.Cloud.define("stripeGetDefaultCard", function (request, response) {

    Stripe.Customers.retrieve(request.params.customerId, {
        expand: ["data.source"],
        success: function (stripeCustomer) {

            console.log("Customer info received: " + JSON.stringify(stripeCustomer));

            var creditCardResponse = {

                "id": stripeCustomer.id,
                "cardId": stripeCustomer.sources.data[0].id,
                "cardHolderEmail": stripeCustomer.email,
                "cardBrand": stripeCustomer.sources.data[0].brand,
                "cardLast4Digits": stripeCustomer.sources.data[0].last4

            };
            response.success(creditCardResponse);

        }, error: function (error) {

            console.log("Failed to Fetch Stripe Customer for Stripe customerId: " + customerId);
            console.log("error " + JSON.stringify(error));

            var error = new Parse.Error(Parse.Error.OTHER_CAUSE, "Fetch Stripe Customer Failed");
            response.error(error);

        }
    });

});

Parse.Cloud.define("stripeAddCardToCustomer", function (request, response) {
    Parse.Cloud.httpRequest({
        method: "POST",
        url: "https://" + stripeSecretKey + ':@' + stripeBaseUrl + "/customers/" + request.params.customerId + "/cards",
        body: "card=" + request.params.tokenId,

        //check for duplicate fingerPrintIds
        success: function (httpResponse) {
            var jsonObj = JSON.parse(httpResponse.text)
            var jsonResult = (jsonObj['fingerprint']);
            console.log("New fingerprint:" + jsonObj['fingerprint']);
            console.log(httpResponse.text);
            var cardResponse = {

                "fingerPrint": jsonResult,
            };

            response.success(cardResponse);
            //response.success(httpResponse.text);

        },
        error: function (httpResponse) {
            response.error('Request failed with response code ' + httpResponse.status);
        }
    });


});

Parse.Cloud.define("addRating", function (request, response) {
    var userId = request.params.user_id;
    var rating = request.params.rating;
    var query = new Parse.Query("User");
    query.equalTo("objectId", userId);
    query.find({
        success: function (results) {
            if (results.length > 0) {
                var user = results[0];
                Parse.Cloud.useMasterKey();
                user.add("rating", rating);
                var ratings = user.get('rating');
                var medianRating = 0.0;
                ratings.forEach(function (item, i, arr) {
                    medianRating = medianRating + item;
                });
                medianRating = medianRating / ratings.length;
                user.set("medianRating", medianRating);
                user.save(null, {
                    success: function (results) {
                        response.success(medianRating);
                    },
                    error: function () {
                        response.error(String(error));
                    }
                })
            } else {
                response("Can find user");
            }
        },
        error: function () {
            response.error(String(error));
        }
    });
});

/*
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
 */
