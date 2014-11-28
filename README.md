Advertising-SE
=============

**Advertiser-SE runs on port 7001**

Run Advertiser-SE:

    npm install
    node bin/www
    
**Swagger-UI runs at IP:7001/advse-swaggerui**

**Example**

POST to IP:7001/adv_se/audDemographics a JSON object like the following (attributes are based on the Context Object from Graph API):

````
{
	"audMng" : {
		"personalization_gender" : ["Female", "Male"],
		"personalization_income" : ["high"]
	},
	"demographics" : {
		"personalization_gender" : ["ALL"],
		"personalization_age_range" : ["25-34"],
		"personalization_country" : ["ALL"],
		"personalization_education" : ["ALL"]
	}
}
````

The response will look like the following:
````
{
    "audMng": {
        "num": 34
    },
    "demographics": {
        "personalization_gender": {
            "Male": 14,
            "Female": 20
        },
        "personalization_age_range": {
            "25-34": 3
        },
        "personalization_country": {
            "IT": 7,
            "GR": 10,
            "FR": 7,
            "ES": 5,
            "UK": 5
        },
        "personalization_education": {
            "High School Degree": 34
        }
    }
}
````
*Note*: audMng corresponds to what we are searching for and demographics to the requested statistics based on the search creteria.
