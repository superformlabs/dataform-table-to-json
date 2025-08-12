const { TableToJson } = require("dataform-table-to-json");

const query = "SELECT * FROM `<GCP_PROJECT>.<DATASET>.<TABLE>`";

const outputConfig = {
  jsonPath: "includes/config.json",
  dataformRepositoryName: "<your dataform repository>",
  dataformRepositoryLocation: "<your datafrom repository location>",
};

const tableToJson = new TableToJson({ query, outputConfig });
tableToJson.publish();
