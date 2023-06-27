import runExtension from "roamjs-components/util/runExtension";
import React from "react";
import { Button } from "@blueprintjs/core";
import getCurrentUserEmail from "roamjs-components/queries/getCurrentUserEmail";
import renderToast from "roamjs-components/components/Toast";
import { createIndexPage, createUpdateLogPage } from "./pageOperations";

const getAllData = () => {
    const graphName = window.roamAlphaAPI.graph.name;
    const email = getCurrentUserEmail();
    const graphData = { graphName, email };
    return JSON.stringify(graphData);
}

const postGraph = async () => {
  const graph = getAllData();
  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Request-Headers": "*",
      "Access-Control-Request-Method": "*"
    },
    body: graph
}
let p = await fetch("http://localhost:8080/graph/", options);
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
    body: graph
  }
  let p = await fetch("http://localhost:8080/last_sync/", options);
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
          id: "graphgator-sync",
          name: "Sync Button",
          description:
            "The sync button to sync up the graph!",
          action: {
            type: "reactComponent",
            component: () => {
              return React.createElement(Button, {
                text: "Sync Graphgator!",
                onClick: () => {
                  const res = postGraph();
                  res.then((data) =>{
                    renderToast({
                      content: "Your graph is getting synched! Please wait for sometime!",
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
          id: "graphgator-generate",
          name: "Generate Button",
          description:
            "The generate button to generate the log and index page!",
          action: {
            type: "reactComponent",
            component: () => {
              return React.createElement(Button, {
                text: "Generate Pages",
                onClick: () => {
                  const res = getLastSync();
                  res.then((data) =>{
                    renderToast({
                      content: "Your graph is getting synched! Please wait for sometime!",
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
      ],
    });
  },
});
