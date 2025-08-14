# Dataform Table to JSON

A Dataform package that converts SQL query results to JSON format and save it as configuration file in your Dataform repository.

## The pain

Sometimes we need to select some table and generate SQL based on the data. Unfortunately Dataform doesn't support this functionality.

### Possible solutions

- **Dynamic SQL**: Create SQL dynamically and use [EXECUTE IMMEDIATE](https://cloud.google.com/bigquery/docs/reference/standard-sql/procedural-language#execute_immediate)
- **JSON Configuration**: Export query results to a JSON file, save it in your Dataform repository, and build queries based on this configuration file

### How This Module Works

This module simplifies the JSON configuration approach. Under the hood, it creates an `IPYNB` file that:

1. Executes your specified query
2. Saves the results to a JSON file
3. Pushes the file content to your Dataform repository in the specified JSON file

Since `IPYNB` is a supported model type in Dataform, you can add **tags** and **dependencyTargets** to ensure the JSON file refreshes as part of your dependency tree. For example you could have `daily` tag to update all your configuration tables and after that you could export them to JSON file and run `reporting` pipeline.

## Installation

### Step 1

To install this package in your Dataform repository, add it to your `package.json` file:

```json
{
  "dependencies": {
    "@dataform/core": "3.0.27",
    "dataform-table-to-json": "https://github.com/superformlabs/dataform-table-to-json/archive/refs/tags/v0.0.6.tar.gz"
  }
}
```

Notes:
You have to delete **dataformCoreVersion** from `workflow_settings.yaml`. @dataform/core should be higher or equal than 3.0.27

Then click **Install packages** in your Dataform workspace.

### Step 2

Create a [Bucket](https://console.cloud.google.com/storage/browser/) to save notebook execution results. Add the path to this bucket and set `defaultNotebookRuntimeOptions.outputBucket` in your `workflow_settings.yaml` file:

```yaml
defaultNotebookRuntimeOptions:
  outputBucket: "gs://your-output-bucket"
```

### Step 3

To use BigQuery Notebooks you need to:

- enable Vertex AI API

Add needed roles to the service account you will use for your Dataform pipeline execution (for example dataform-notebooks@dataform-package.iam.gserviceaccount.com):

- BigQuery Data Editor
- BigQuery Data Viewer
- BigQuery Job User
- BigQuery Read Session User
- BigQuery Studio User
- Dataform Admin
- Notebook Executor User
- Service Account Token Creator
- Service Account User
- Storage Admin

You can always test creating BigQuery Notebooks manually outside of Dataform to check that all needed permissions and APIs are enabled.

## Usage

### Basic Usage

```javascript
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
```

### Advanced Usage with All Parameters

```javascript
const { TableToJson } = require("dataform-table-to-json");

const query = "SELECT * FROM `<GCP_PROJECT>.<DATASET>.<TABLE>`";
const outputConfig = {
  jsonPath: "includes/config.json",
  dataformRepositoryName: "your-repository-name",
  dataformRepositoryLocation: "europe-west3",
  dataformCommitMessage: "ci: configuration file updated",
  dataformCommitEmail: "bot@yourcompany.com",
};
const notebookConfig = {
  description: "Converts table data to JSON format",
  tags: ["daily", "export"],
  dependencyTargets: ["your_dependent_table"],
};

const tableToJson = new TableToJson({ query, outputConfig, notebookConfig });
tableToJson.publish();
```

## Configuration Parameters

### Required Parameters

#### `query` (string)

The SQL query to execute. Must be a SELECT statement.

### Optional Parameters

#### `outputConfig` (Object)

Configuration for output settings:

| Parameter                    | Type   | Default                                                              | Description                                                                                                                                                                     |
| ---------------------------- | ------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jsonPath`                   | string | -                                                                    | **Required**: The path to the JSON file to output the results to inside your Dataform repository. Should start from **includes/**                                               |
| `dataformRepositoryName`     | string | `dataform.projectConfig`                                             | The name of the Dataform repository to output the results to                                                                                                                    |
| `dataformRepositoryLocation` | string | `dataform.projectConfig.defaultLocation`                             | The location of the Dataform repository                                                                                                                                         |
| `dataformWorkspaceName`      | string | `"Auto-deploy-dont-change"`                                          | The name of the Dataform workspace. It's a temporary workspace mode; create a delete it for each run. Modify only if you already have this workspace or can't use default name. |
| `dataformCommitMessage`      | string | `"ci: configuration file updated by dataform-table-to-json package"` | The commit message for the results                                                                                                                                              |
| `dataformCommitEmail`        | string | `"bot@superformlabs.eu"`                                             | The email address for commits                                                                                                                                                   |
| `googleCloudProjectID`       | string | `dataform.projectConfig.defaultDatabase`                             | The Google Cloud project ID                                                                                                                                                     |

#### `notebookConfig` (Object)

Configuration for the notebook action:

| Parameter           | Type          | Description                                                           |
| ------------------- | ------------- | --------------------------------------------------------------------- |
| `name`              | string        | The name of the notebook action                                       |
| `dependencyTargets` | Array<Object> | Targets of actions that this notebook is dependent on                 |
| `tags`              | Array<string> | A list of user-defined tags with which the notebook should be labeled |
| `description`       | string        | Description of the notebook                                           |

## Methods

### `setQuery(query)`

Updates the SQL query to execute.

```javascript
tableToJson.setQuery("SELECT * FROM `new-table`");
```

### `setOutputConfig(outputConfig)`

Updates the output configuration.

```javascript
tableToJson.setOutputConfig({
  jsonPath: "includes/new-config.json",
  dataformRepositoryName: "new-repository",
});
```

### `setNotebookConfig(notebookConfig)`

Updates the notebook configuration.

```javascript
tableToJson.setNotebookConfig({
  name: "new-notebook-name",
  description: "New description",
});
```

### `publish()`

Add the notebook to the list of actions. To execute run the notebook action or notebook tag.

## Error Handling

The package will throw errors in the following cases:

- **Missing Query**: If no query is provided or if the query is not a string
- **Missing Output Bucket**: If `defaultNotebookRuntimeOptions.outputBucket` is not configured in `workflow_settings.yaml`

## License

GNU General Public License. This file is part of "GA4 Dataform Package". Copyright (C) 2023-2025 Superform Labs Artem Korneev, Jules Stuifbergen, Johan van de Werken, Krisztián Korpa, Simon Breton. "GA4 Dataform Package" is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details. You should have received a copy of the GNU General Public License along with this program. If not see GNU licenses

## Contributing

If you have any further questions, feel free to contact us at: support@ga4dataform.com.
