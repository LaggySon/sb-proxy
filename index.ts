import { google, sheets_v4, Auth } from "googleapis";
import { GaxiosResponse } from "gaxios";

import redis from "redis";

import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
const app = express();
const port = process.env.PORT || 3001;

const redisClient = redis.createClient();
// Handle Redis client errors
redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});

redisClient.connect();

app.get("/api", async (req: any, res: any) => {
  function transpose(matrix: any) {
    return matrix[0].map((col: any, i: number) =>
      matrix.map((row: any) => row[i])
    );
  }
  const { sheet } = req.query;
  const cacheKey = `sheet:${sheet}`; // Create a unique cache key

  let exists = (await redisClient.exists(cacheKey)) == 1;

  if (exists) {
    console.log("cache hit");
    res
      .status(200)
      .json(JSON.parse((await redisClient.get(cacheKey)) as string));
  } else {
    console.log("cache miss");
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      projectId: process.env.GOOGLE_PROJECTID,
      credentials: {
        private_key: (process.env.GOOGLE_PRIVATE_KEY ?? "")
          .split(String.raw`\n`)
          .join("\n"),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
      },
    });

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = String(sheet);
    const range = `COMPRESS!A1:M50`;

    const response: GaxiosResponse | null =
      await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

    const newRange = "BroadcastPanel!B36:C48";

    const newResponse: GaxiosResponse | null =
      await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: newRange,
      });

    const data = response.data.values ?? [];
    const cams = newResponse.data.values;
    const result: AllData = {
      teams: {
        team1: {
          name: data[0][1],
          short: data[0][2],
          code: data[0][3],
          logoPath: data[0][4],
          info: data[0][7],
          score: data[0][9],
          primaryCol: data[0][5],
          secondaryCol: data[0][6],
          atkDef: data[0][8].toUpperCase(),
          advInfo: data[0][10],
        },
        team2: {
          name: data[1][1],
          short: data[1][2],
          code: data[1][3],
          logoPath: data[1][4],
          info: data[1][7],
          score: data[1][9],
          primaryCol: data[1][5],
          secondaryCol: data[1][6],
          atkDef: data[1][8].toUpperCase(),
          advInfo: data[1][10],
        },
      },
      twitch: response.data.values
        .slice(35, response.data.values.length)
        .map((row: string[]) => {
          return { title: row[0], name: row[1], social: row[2] };
        }),
      maps: response.data.values
        .slice(10, 34)
        .filter((row: string[]) => row.length > 1)
        .map((row: string[]) => {
          let mapString = "";
          if (row[0]) {
            mapString =
              row[0].split("tranquility.gg/package/Maps/")[1] ?? "ERROR!.png";
            mapString = mapString.slice(0, -4);
          }
          return {
            map: mapString,
            image: "https://www." + row[0],
            type: row[1],
            winner: row[2],
            info: row[3],
            isComplete: row[4] === "TRUE",
          };
        }),
      match: {
        tier: data[3][2],
        region: data[3][3],
        dateTime: data[3][1],
        stage: data[3][5],
        week: data[3][4],
        weekNum: data[3][11],
        mapInfo: data[3][7],
        tierTag: data[3][10],
        nextMap: data[3][6],
        ticker1: data[3][8],
        ticker2: data[3][9],
        addInfo: data[5][1],
        accColor: data[5][2],
        showPreds: data[3][12] == "TRUE",
      },
    };
    result["cams"] = cams;
    // console.log(result);

    redisClient.set(cacheKey, JSON.stringify(result));
    redisClient.expire(cacheKey, 10);

    res.status(200).json(result);
  }
});

// Start the server
app.listen(port, () => {
  console.log(process.env.GOOGLE_CLIENT_EMAIL as string);
  console.log(`Server is running on port ${port}`);
});
