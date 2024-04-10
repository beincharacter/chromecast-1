const express = require("express");
const { setupRSocketClient } = require("./rsocketClient");

const app = express();
const PORT = process.env.PORT || 9999;


setupRSocketClient();

app.get("/", async (req, res) => {
  try {

    // Send response
    res.send("Connected to RSocket client");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
