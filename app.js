const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());
let db = null;

const initilizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Server is:${e.message}`);
    process.exit(1);
  }
};
initilizeDBAndServer();

const convertDBResponse = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

//GET LIST OF ALL STATES
app.get("/states/", async (request, response) => {
  const getstateQuery = `
    SELECT
    * 
    FROM state;`;
  const listOfStates = await db.all(getstateQuery);
  response.send(listOfStates.map((eachState) => convertDBResponse(eachState)));
});

//GET SPECIFIC STATE ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
    *
    FROM 
      state
    WHERE 
      state_id = ${stateId};`;
  const getState = await db.get(getStateQuery);
  response.send(convertDBResponse(getState));
});

//POST METHOD DISTRICT
app.post("/districts/", async (request, response) => {
  const detailsOfBody = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = detailsOfBody;
  const addDetailsQuery = `
    INSERT INTO 
       district (district_name,state_id,cases,cured,active,deaths)
    VALUES 
    (
       '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;

  let dbResponse = await db.run(addDetailsQuery);
  let district_id = dbResponse.lastID;
  response.send("District Successfully Added");
});

//convert District snake case to camelcase

const convertDBResponseDistrict = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//GET METHOD
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
SELECT 
*
FROM 
  district
WHERE 
  district_id = ${districtId};`;

  const getDistrict = await db.get(getDistrictQuery);
  response.send(convertDBResponseDistrict(getDistrict));
});

//DELETE DISTRICT TABLE
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE 
       FROM
    district
    WHERE
       district_id = ${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

//PUT METHOD UPDATED THE DISTRICT
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const detailsOfBody = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = detailsOfBody;
  const updateQuery = `
    UPDATE 
        district
    SET
       district_name = '${districtName}',
       state_id = ${stateId},
       cases = ${cases},
       active = ${active},
       deaths = ${deaths}
    WHERE 
       district_id = ${districtId};`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

//GET STATES ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesQuery = `
    SELECT
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM
      district
    WHERE
      state_id = ${stateId};`;
  const stats = await db.get(getStatesQuery);

  console.log(stats);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//GET SPECIFIC DISTRICT ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
SELECT
   state_id 
FROM
   district
WHERE
   district_id = ${districtId};`;
  const getDistrictResponse = await db.run(getDistrictQuery);

  const getStateNameQuery = `
  SELECT
  state_name AS stateName
  FROM 
    state
WHERE
    state_id = ${getDistrictResponse.state_id};`;
  const getStateResponse = await db.run(getStateNameQuery);
  response.send(getStateResponse);
});

module.exports = app;
