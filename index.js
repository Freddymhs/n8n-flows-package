const fs = require("fs");
const path = require("path");

const flowsDir = path.join(__dirname, "flows");
const flows = {};

function loadFlows(dir) {
  fs.readdirSync(dir).forEach((entry) => {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      loadFlows(fullPath);
    } else if (entry.endsWith(".json")) {
      const flowName = entry.replace(".json", "");
      flows[flowName] = require(fullPath);
    }
  });
}

loadFlows(flowsDir);

module.exports = flows;
