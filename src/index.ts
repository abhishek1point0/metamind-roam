import runExtension from "roamjs-components/util/runExtension";
import React from "react";
import { Button } from "@blueprintjs/core";

const getAllData = () => {
    // const graphData = window.roamAlphaAPI.q(`[:find ?e ?a ?v
    //   :where
    //   [?e :block/page ?v]
    //   [or [?a :block/string]
    //       [?a :block/children]]]`);
    const graphData = window.roamAlphaAPI.q(`[:find ?page ?block-text
      :where
      [?e :block/page ?page]
      [?e :block/uid ?block]
      [?e :block/string ?block-text]]`);
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
                  const res = postGraph()
                  res.then((data) =>{
                    console.log(data);
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
