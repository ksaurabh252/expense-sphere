const { createClient } = require("redis");

const client = createClient({
  url: "redis://localhost:6379",
});

client.on("error", (err) => console.log("Redis Client Error", err));

async function start() {
  await client.connect();

  console.log("Connected with Docker Redis");

  await client.set("hi", "Welcome to the docker");

  const value = await client.get("hi");

  console.log(value);
}

module.exports = { start, client };
