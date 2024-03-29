const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

function setResponse(username, repos) {
  return `<h2>${username} has ${repos} Github repos </h2>`;
}
// Make request to Github for data
function getRepos(req, res, next) {
  try {
    console.log("Fetching Data....");
    const { username } = req.params;
    fetch(`https://api.github.com/users/${username}`)
      .then(response => response.json())
      .then(data => {
        // set data to Redis
        client.setex(username, 3600, data.public_repos);
        res.send(setResponse(username, data.public_repos));
      });
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}

// Cache middleware
function cache(req, res, next) {
  const { username } = req.params;
  client.get(username, (err, data) => {
    if (err) throw err;
    if (data !== null) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
}

app.get("/repos/:username", cache, getRepos);

app.listen(5000, () => {
  console.log(`App listening on port ${PORT}`);
});
