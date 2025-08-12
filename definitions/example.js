const { TableToJson } = require("dataform-table-to-json");

const query = "SELECT * FROM `<GCP_PROJECT>.<DATASET>.<TABLE>`";

const outputConfig = {
  jsonPath: "includes/config.json",
  dataformRepositoryName: "<your dataform repository>",
  dataformRepositoryLocation: "<your datafrom repository location>",
};
const notebookConfig = {
  dependencyTargets: [{ name: "prepare_config" }],
  tags: ["daily"],
  description: "This notebook converts a table to a JSON file.",
};
const tableToJson = new TableToJson({ query, outputConfig, notebookConfig });
tableToJson.publish();
