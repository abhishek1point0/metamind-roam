import runExtension from "roamjs-components/util/runExtension";
import React from "react";
import { Button } from "@blueprintjs/core";
import getCurrentUserEmail from "roamjs-components/queries/getCurrentUserEmail";
import getCurrentUserDisplayName from "roamjs-components/queries/getCurrentUserDisplayName";
import renderToast from "roamjs-components/components/Toast";
import { createIndexPage, createUpdateLogPage } from "./pageOperations";

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
let response = await fetch("https://prod.metamind.network/graph/", options);
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
  let res = await fetch("https://prod.metamind.network/last_sync/", options);
  let response = await res.json();
  const lastRun = response["last_run"];
  if (createIndexPageFlag) {
    createIndexPage();
  }
  createUpdateLogPage(lastRun);
  return response;
}

export default runExtension({
  run: (args) => {
    args.extensionAPI.settings.panel.create({
      tabTitle: "graphgator",
      settings: [
        {
          id: "graphgator-generate",
          name: "Generate Button",
          description:
            "The button to generate the log and index page!",
          action: {
            type: "reactComponent",
            component: () => {
              const [isToggled, setIsToggled] = React.useState(false);
              React.useEffect(() => {
                const graphName = window.roamAlphaAPI.graph.name;
                const indexPage = JSON.parse(localStorage.getItem(`${graphName}_indexPage`));
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
              React.createElement(Button,{ text: "Generate Updates", onClick: generatePage, style: { color: "#0F60BD"}}),
              React.createElement("div", { style: { padding: "2rem" }},
              React.createElement("p", null, "Click the toggle button to enable/disable Index Page Generation!"),
              React.createElement("input", { type: "checkbox", checked: isToggled, onChange: handleToggle }),
              React.createElement("label", { style: { padding: "0.5rem" }}, "Manage index page update manually!")),
              )
            }
          },
        },
        {
          id: "graphgator-sync",
          name: "Publish Graph",
          description: "Token for Roam Graph!",
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
                React.createElement("input", { type: "text", value: tokenValue, onChange: handleTokenChange, placeholder: "Enter your token here!" }),
                React.createElement("input", { type: "text", value: graphDescription, onChange: handleDescriptionChange, placeholder: "Enter Graph description here!" }),
                React.createElement(Button, { text: "Publish Graph", onClick: handleButtonClick }),
              );
            }
          },
        }
      ],
    });
  },
});
