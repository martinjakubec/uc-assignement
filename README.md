# Node versions
node v22.14.0
npm v10.9.2

# Setup

## Environment setup

### Backend
In backend folder:
- copy .env.example file to a .env file and change the values as needed (mainly API_KEY)
- copy .env.docker.example file to a .env file and change the values as needed
- run `npm install`
- run `docker compose up -d`, which starts mysql container and backend app container
- once backend service initializes, the app should be available at localhost, with port specified in .env.docker


### Frontend
In backend folder: 
- run `npm run swagger:generate`, which will create frontend API client
In frontend folder:
- copy .env.example file to a .env file and change the values as needed
- run `npm install` 
- run `npm run dev`


## API Details

This API exposes multiple endpoints, 3 of them for the use in frontend, 2 for working with OpenAPI spec

### /history
- fetches historical currency rates for base and target currencies, between start and end dates

*Caveat: since I do not have access to the premium API key needed to query historical data from currency API, I am generating data for all the days that do not have it. Data which is already present in the database from /latest endpoint should still be real world data*

### /latest/:currency
- fetches the latest currency data for the currency queried, e.g. USD. 
- because of the limitation of free API key, this endpoint doesn't allow the possibility of fetching historical data for a single currency

### /supported-currencies
- provides data about supported currencies, used for frontend to more easily keep up in sync with backend

### /openapi-ui
- shows a user acessible UI version of OpenAPI specs

### /openapi.json
= returns OpenAPI specs in JSON format, which is then used by frontend client generating script