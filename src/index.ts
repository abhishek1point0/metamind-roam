import runExtension from "roamjs-components/util/runExtension";
import React from "react";
import { Button } from "@blueprintjs/core";
import getCurrentUserEmail from "roamjs-components/queries/getCurrentUserEmail";
import getCurrentUserDisplayName from "roamjs-components/queries/getCurrentUserDisplayName";
import renderToast from "roamjs-components/components/Toast";
import { createIndexPage, createUpdateLogPage } from "./pageOperations";

const SERVER_URL = "https://prod.metamind.network";

// Get all the required data from Roam and return it as a JSON.
const getAllData = () => {
    const graphName = window.roamAlphaAPI.graph.name;
    const email = getCurrentUserEmail();
    const fullName = getCurrentUserDisplayName();
    const graphData = { graphName, email, fullName };
    return graphData;
}

// Post the graph data to the server so that the server can sync the graph
// and be ready to publish it.
const postGraph = async (token:string, description: string) => {
  let graph:any = getAllData();
  graph = {...graph, token, description}
  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Request-Headers": "*",
      "Access-Control-Request-Method": "*"
    },
    body: JSON.stringify(graph)
}
let response = await fetch(`${SERVER_URL}/graph/`, options);
let responseJSON = await response.json();
return responseJSON;
}

// Generate the Index and Log Page for the Roam Graph.
const generatePages = async (createIndexPageFlag: boolean) => {
  const graph = getAllData();
  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Request-Headers": "*",
      "Access-Control-Request-Method": "*"
    },
    body: JSON.stringify(graph)
  }
  let res = await fetch(`${SERVER_URL}/last_sync/`, options);
  let response = await res.json();
  const lastRun = response["last_run"];
  const numberOfSync = response["number_of_sync"]+1;
  createIndexPage(createIndexPageFlag);
  createUpdateLogPage(lastRun, numberOfSync);
  return response;
}

export default runExtension({
  run: (args) => {
    args.extensionAPI.settings.panel.create({
      tabTitle: "graphgator",
      settings: [
        {
          id: "graphgator-generate",
          name: "STEP 1/2 : Generate Update Log since Last Sync",
          description:
            "Update Log is new changes made to the graph since last sync. \
            If it's first time, the update log and the index page will beidentical.",
          action: {
            type: "reactComponent",
            component: () => {
              const [isToggled, setIsToggled] = React.useState(false);
              React.useEffect(() => {
                const graphName = window.roamAlphaAPI.graph.name;
                const indexPage = JSON.parse(localStorage.getItem(`${graphName}_indexPage`)) || false;
                setIsToggled(indexPage);
              }, []);

              const handleToggle = () => {
                const graphName = window.roamAlphaAPI.graph.name;
                localStorage.setItem(`${graphName}_indexPage`, JSON.stringify(isToggled));
                setIsToggled(!isToggled);
              }

              const generatePage = () => {
                const res = generatePages(isToggled);
                res.then((data) =>{
                  renderToast({
                    content: "Pages are being generated!",
                    intent: "primary",
                    id: "roam-js-graphgator"
                  });
                })
              }

              return React.createElement("div", { style: { display: "flex", flexDirection: "column" }},
                React.createElement(Button, {
                  text: "Generate New Update Log and Index Page",
                  onClick: generatePage,
                  style: { color: "#FFFFFF", fontWeight: "bold",  borderRadius: "0.5rem"}
                }),
                React.createElement("div", {
                  style: { padding: "2rem" }},
                  React.createElement("input", {
                    type: "checkbox",
                    checked: isToggled,
                    onChange: handleToggle,
                    style: { padding: "0.5rem" }
                  }),
                  React.createElement("label", {
                    style: { padding: "0.5rem", fontWeight: "bold" }},
                    "Manually create Index Page for your Graph"
                  )
                ),
              )
            }
          },
        },
        {
          id: "graphgator-sync",
          name: "STEP 2/2 : Sync and Publish Graph",
          description: "After creating a new update log, sync the graph in it's current state.We will remember this, \
          the next time you have made updates to your graphand want a change log.",
          action: {
            type: "reactComponent",
            component: () => {
              const [tokenValue, setTokenValue] = React.useState("");
              const [graphDescription, setGraphDescription] = React.useState("");
              React.useEffect(() => {
                const graphName = window.roamAlphaAPI.graph.name;
                const description = JSON.parse(localStorage.getItem(`${graphName}_graphDescription`));
                const token = JSON.parse(localStorage.getItem(`${graphName}_graphToken`));
                if (description) {
                  setGraphDescription(description);
                  setTokenValue(token);
                }
              }, []);

              const handleTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                setTokenValue(event.target.value);
              };

              const handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
                setGraphDescription(event.target.value);
              };

              const handleButtonClick = () => {
                const res = postGraph(tokenValue, graphDescription);
                const graphName = window.roamAlphaAPI.graph.name;
                localStorage.setItem(`${graphName}_graphDescription`, JSON.stringify(graphDescription));
                localStorage.setItem(`${graphName}_graphToken`, JSON.stringify(tokenValue));
                res.then((data) => {
                  renderToast({
                    content: "Your graph is getting synced! Please wait for sometime!",
                    intent: "primary",
                    id: "roam-js-graphgator"
                  });
                });
              };
              return React.createElement("div", { style: { display: "flex", flexDirection: "column" }},
                React.createElement("input", {
                  type: "text",
                  value: tokenValue,
                  onChange: handleTokenChange,
                  placeholder: "Enter your API Token (in Graph tab)",
                  style: { padding: "0.5rem", borderRadius: "0.5rem", marginBottom: "0.5rem"}
                }),
                React.createElement("input", {
                  type: "text",
                  value: graphDescription,
                  onChange: handleDescriptionChange,
                  placeholder: "Enter a Description for your Graph (optional)",
                  style: { padding: "0.5rem", borderRadius: "0.5rem", marginBottom: "0.5rem"}
                }),
                React.createElement(Button, {
                  text: "Sync Graph with Metamind Servers",
                  onClick: handleButtonClick,
                  style: { color: "#FFFFFF", fontWeight: "bold"}
                }),
                React.createElement("div", {
                  style: { padding: "2rem", display: "flex", flexDirection: "row" }},
                  React.createElement("input", {
                    type: "checkbox",
                    checked: false,
                    disabled: true,
                    style: { padding: "0.5rem",}
                  }),
                  React.createElement("label", {
                    style: { paddingLeft: "0.5rem", fontWeight: "bold" }},
                    "Publish to the Metamind App (Coming Soon!)"
                  )
                ),
              );
            }
          },
        }
      ],
    });
  },
});
