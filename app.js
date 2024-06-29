const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async (request, require) => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        app.listen(3000, () => {
            console.log("Server Running at http://localhost:3000/");
        });

    } catch(e) {
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
};

initializeDBAndServer();

module.exports = app;

const convertDBObjectToResponseObjectForPlayers = (dbObject) => {
    return {
        playerId: dbObject.player_id,
        playerName: dbObject.player_name
    };
};

const convertDBObjectToResponseObjectForMatch = (dbObject) => {
    return {
        matchId: dbObject.match_id,
        match: dbObject.match,
        year: dbObject.year
    };
};

// API 1 - GET Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
    const getPlayersQuery = `
        SELECT 
            *
        FROM 
            player_details
        ORDER BY 
            player_id;`;
    
    const playersArray = await db.all(getPlayersQuery);
    response.send(playersArray.map((eachPlayerDetails) => 
        convertDBObjectToResponseObjectForPlayers(eachPlayerDetails)
    ));
});

// API 2 - GET Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
    const { playerId } = request.params;

    const getPlayerQuery = `
        SELECT 
            *
        FROM 
            player_details
        WHERE 
            player_id = ${playerId};`;

    const getPlayer = await db.get(getPlayerQuery);
    response.send(convertDBObjectToResponseObjectForPlayers(getPlayer));
});

// API 3 - PUT Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
    const { playerId } = request.params;
    const playerDetails = request.body;

    const { playerName } = playerDetails;

    const updatePlayerQuery = `
        UPDATE 
            player_details
        SET 
            player_name = '${playerName}'
        WHERE
            player_id = ${playerId};`;

    const updatePlayer = await db.run(updatePlayerQuery);
    response.send("Player Details Updated");
});

// API 4 - GET Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
    const { matchId } = request.params;

    const getMatchDetailsQuery = `
        SELECT 
            * 
        FROM 
            match_details
        WHERE 
            match_id = ${matchId};`;

    const getMatchDetails = await db.get(getMatchDetailsQuery);
    response.send(convertDBObjectToResponseObjectForMatch(getMatchDetails));
});

// API 5 - GET Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
    const { playerId } = request.params;

    const getAPlayerAllMatchesQuery = `
        SELECT 
            *
        FROM 
            player_match_score
            NATURAL JOIN match_details
        WHERE 
            player_id = ${playerId};`;

    const getMatchDetails = await db.all(getAPlayerAllMatchesQuery);
    response.send(getMatchDetails.map( (eachMatch) => 
        convertDBObjectToResponseObjectForMatch(eachMatch)
    ));
});

// API 6 - GET Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
    const { matchId } = request.params;

    const getAMatchesAllPlayersQuery = `
        SELECT 
            *
        FROM 
            player_match_score
            NATURAL JOIN player_details
        WHERE 
            match_id = ${matchId};`;

    const getPlayerDetails = await db.all(getAMatchesAllPlayersQuery);
    response.send(getPlayerDetails.map( (eachPlayer) => 
        convertDBObjectToResponseObjectForPlayers(eachPlayer)
    ));
});

// API 7 - GET Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
    const { playerId } = request.params;

    const getStatisticsOfAPlayerQuery = `
        SELECT 
            player_details.player_id AS playerId,
            player_details.player_name AS playerName,
            SUM(score) AS totalScore,
            SUM(fours) AS totalFours,
            SUM(sixes) AS totalSixes
        FROM 
            player_details 
            INNER JOIN player_match_score 
            ON player_details.player_id = player_match_score.player_id
        WHERE
            player_details.player_id = ${playerId};`;
        
    const getPlayerStat = await db.get(getStatisticsOfAPlayerQuery);
    response.send(getPlayerStat);
});