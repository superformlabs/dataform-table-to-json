const file_context = require("./includes/notebook_template.json");

/**
 * @typedef {Object} NotebookConfig
 * @property {string} [name] - The name of the notebook action
 * @property {Array<Object>} [dependencyTargets] - Targets of actions that this notebook is dependent on
 * @property {Array<string>} [tags] - A list of user-defined tags with which the notebook should be labeled
 * @property {string} [description] - Description of the notebook.
 */
/**
 * @typedef {Object} OutputConfig
 * @property {string} jsonPath - The path to the JSON file to output the results to.
 * @property {string} dataformRepositoryName - The name of the Dataform repository to output the results to.
 * @property {string} dataformRepositoryLocation - The location of the Dataform repository to output the results to.
 * @property {string} [dataformWorkspaceName] - The name of the Dataform workspace to output the results to.
 * @property {string} [dataformCommitMessage] - The message to commit the results to.
 * @property {string} [dataformCommitEmail] - The email to commit the results to.
 * @property {string} [googleCloudProjectID] - The Google Cloud project to output the results to.
 */

/**
 * @param {string} query - SQL query to execute (required)
 * @param {NotebookConfig} [notebookConfig] - Configuration for the notebook (optional)
 * @param {OutputConfig} [outputConfig] - Configuration for output settings (optional)
 */
class TableToJson {
  constructor(options) {
    const { query, notebookConfig = {}, outputConfig = {} } = options;
    if (!query || typeof query !== "string") {
      throw new Error(
        "Query parameter is required and must be a SELECT statement."
      );
    }
    this._query = query;
    this._outputConfig = this._setDefaultOutputConfig(outputConfig);
    this._notebookConfig = notebookConfig;
    this._file_context = file_context;
  }

  /**
   * Sets default values for outputConfig if not provided
   * @param {OutputConfig} outputConfig - The output configuration
   * @returns {OutputConfig} - Configuration with default values
   * @private
   */
  _setDefaultOutputConfig(outputConfig) {
    return {
      ...outputConfig,
      dataformRepositoryName:
        outputConfig?.dataformRepositoryName || dataform.projectConfig,
      dataformRepositoryLocation:
        outputConfig?.dataformRepositoryLocation ||
        dataform.projectConfig.defaultLocation,
      dataformWorkspaceName:
        outputConfig?.dataformWorkspaceName || "Auto-deploy-dont-change",
      googleCloudProjectID:
        outputConfig?.googleCloudProjectID ||
        dataform.projectConfig.defaultDatabase,
      dataformCommitMessage:
        outputConfig?.dataformCommitMessage ||
        "ci: configuration file updated by dataform-table-to-json package",
      dataformCommitEmail:
        outputConfig?.dataformCommitEmail || "bot@superformlabs.eu",
    };
  }

  /**
   * @param {string} query - SQL query to execute (required)
   */
  setQuery(query) {
    this._query = query;
  }

  /**
   * @param {OutputConfig} outputConfig - Configuration for output settings (optional)
   */
  setOutputConfig(outputConfig) {
    this._outputConfig = outputConfig;
  }

  /**
   * @param {NotebookConfig} notebookConfig - Configuration for the notebook (optional)
   */
  setNotebookConfig(notebookConfig) {
    this._notebookConfig = notebookConfig;
  }

  /**
   * Updates the notebook context with the replaceObject.
   * @param {Object} replaceObject - The object to replace in the notebook context.
   * @returns {string} - The updated notebook context.
   * @private
   */
  _updateNotebookContext(replaceObject) {
    let new_context = JSON.stringify(this._file_context);
    for (const [key, value] of Object.entries(replaceObject)) {
      new_context = new_context.replace(key, value);
    }
    this._file_context = JSON.parse(new_context);
  }

  /**
   * Publishes the notebook to the output bucket.
   */

  publish() {
    if (!this._query) throw new Error("Query parameter not provided.");

    this._updateNotebookContext({
      "%%query%%": this._query,
      "%%DATAFORM_REPOSITORY_NAME%%": this._outputConfig.dataformRepositoryName,
      "%%DATAFORM_REPOSITORY_WORKSPACE%%":
        this._outputConfig.dataformWorkspaceName,
      "%%DATAFORM_REPOSITORY_REGION%%":
        this._outputConfig.dataformRepositoryLocation,
      "%%GOOGLE_CLOUD_PROJECT%%": this._outputConfig.googleCloudProjectID,
      "%%DATAFORM_CONFIG_PATH%%": this._outputConfig.jsonPath,
      "%%DATAFORM_COMMIT_MESSAGE%%": this._outputConfig.dataformCommitMessage,
      "%%DATAFORM_COMMIT_EMAIL%%": this._outputConfig.dataformCommitEmail,
    });

    if (
      !dataform.projectConfig.defaultNotebookRuntimeOptions ||
      !dataform.projectConfig.defaultNotebookRuntimeOptions.outputBucket
    )
      throw new Error(
        "Set defaultNotebookRuntimeOptions.outputBucket in workflow_settings.yaml to provide output bucket."
      );

    notebook({
      ...this._notebookConfig,
      filename: "../includes/table_to_json.ipynb",
    }).ipynb(this._file_context);
  }
}

module.exports = {
  TableToJson,
};
