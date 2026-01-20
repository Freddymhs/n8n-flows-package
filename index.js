const fs = require("fs");
const path = require("path");

const flowsDir = path.join(__dirname, "flows");
const flows = {};

fs.readdirSync(flowsDir)
  .filter((file) => file.endsWith(".json"))
  .forEach((file) => {
    const flowName = file.replace(".json", "");
    flows[flowName] = require(path.join(flowsDir, file));
  });

module.exports = flows;
