import runExtension from "roamjs-components/util/runExtension";
import React from "react";
import { Button } from "@blueprintjs/core";
import getCurrentUserEmail from "roamjs-components/queries/getCurrentUserEmail";
import getCurrentUserDisplayName from "roamjs-components/queries/getCurrentUserDisplayName";
import renderToast from "roamjs-components/components/Toast";
import { createIndexPage, createUpdateLogPage } from "./pageOperations";

const getAllData = () => {
    const graphName = window.roamAlphaAPI.graph.name;
    const email = getCurrentUserEmail();
    const fullName = getCurrentUserDisplayName();
    const graphData = { graphName, email, fullName };
    return graphData;
}

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
let p = await fetch("https://stg.metamind.network/graph/", options);
let response = await p.json();
return response;
}

const getLastSync = async () => {
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
  let p = await fetch("https://stg.metamind.network/last_sync/", options);
  let response = await p.json();
  const lastRun = response["last_run"];
  createIndexPage();
  createUpdateLogPage(lastRun);
  console.log(response)
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
              return React.createElement(Button, {
                text: "Generate Pages",
                onClick: () => {
                  const res = getLastSync();
                  res.then((data) =>{
                    renderToast({
                      content: "Pages are being generated!",
                      intent: "primary",
                      id: "roam-js-graphgator"
                    });
                  })
                }
              }
              )
            }
          },
        },
        {
          id: "graphgator-sync",
          name: "Graph Sync",
          description: "Token for Roam Graph!",
          action: {
            type: "reactComponent",
            component: () => {
              const [tokenValue, setTokenValue] = React.useState("");
              const [graphDescription, setGraphDescription] = React.useState("");
              React.useEffect(() => {
                const description = JSON.parse(localStorage.getItem('graphDescription'));
                const token = JSON.parse(localStorage.getItem('graphToken'));
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
                localStorage.setItem('graphDescription', JSON.stringify(graphDescription));
                localStorage.setItem('graphToken', JSON.stringify(graphDescription));
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
                React.createElement(Button, { text: "Sync Graphgator!", onClick: handleButtonClick })
              );
            }
          },
        }
      ],
    });
  },
});
