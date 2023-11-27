import runExtension from "roamjs-components/util/runExtension";
import React from "react";
import { Button } from "@blueprintjs/core";
import renderToast from "roamjs-components/components/Toast";
import { postGraph } from "./utils";
import PageGenerationWidget from "./components/PageGenerationWidget";
import GraphPublishingWidget from "./components/GraphPublishingWidget";

export default runExtension({
  run: (args) => {
    args.extensionAPI.settings.panel.create({
      tabTitle: "Metamind Roam",
      settings: [
        {
          id: "graphgator-generate",
          name: "STEP 1/2 : Generate Update Log since Last Sync",
          description:
            "Update Log is new changes made to the graph since last sync. \
            If it's first time, the update log and the index page will beidentical.",
          action: {
            type: "reactComponent",
            component: PageGenerationWidget(args.extensionAPI)
          }
        },
        {
          id: "graphgator-sync",
          name: "STEP 2/2 : Sync and Publish Graph",
          description: "After creating a new update log, sync the graph in it's current state.We will remember this, \
          the next time you have made updates to your graphand want a change log.",
          action: {
            type: "reactComponent",
            component: GraphPublishingWidget(args.extensionAPI)
          }
        }
      ]
    });
  }
});
