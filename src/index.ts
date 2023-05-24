import runExtension from "roamjs-components/util/runExtension";
import React from "react";
import { Button } from "@blueprintjs/core";
import getCurrentUserEmail from "roamjs-components/queries/getCurrentUserEmail";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import {createPage, createBlock, deleteBlock} from "roamjs-components/writes";
import renderToast from "roamjs-components/components/Toast";

const getAllData = () => {
    const graphName = window.roamAlphaAPI.graph.name;
    const email = getCurrentUserEmail();
    const graphData = { graphName, email };
    createIndexPage();
    return JSON.stringify(graphData);
}

const createIndexPage = () => {
  const indexPageName = "Index Page";
  const allPages = getReverseChronoSortPages();
  Promise.all([createPage({title: indexPageName,})]).then(
    (data) => {
      const pageUide = data[0];
      allPages.forEach((ele, i) => {
        createBlock({node: {text: `[[${ele}]]`}, parentUid: pageUide, order: i+1})
      });
  }).catch((e) => {
    const pageUid = getPageUidByPageTitle(indexPageName);
    const indexBlocks = getBasicTreeByParentUid(pageUid);
    let deletedBlocks: Promise<string | number>[] = [];
    indexBlocks.forEach((block) => {
      deletedBlocks.push(deleteBlock(block.uid));
    });
    Promise.all(deletedBlocks).then((data) => {
      renderToast({
        content: "Regenerating the index page!",
        intent: "warning",
        id: "roam-js-graphgator-index-page"
      });
      allPages.forEach((ele, i) => {
        createBlock({node: {text: `[[${ele}]]`}, parentUid: pageUid, order: i+1})
      });
    });
  });
}

/**
 * This functions queries all pages of the database and sorts them in reverse
 * chronological order.
*/
const getReverseChronoSortPages= () => {
  let sortingField = ":edit/time";
  let pages = window.roamAlphaAPI.q('[ :find ?e :where [?e :node/title] ] ').map(
    (page: Array<number>)=> window.roamAlphaAPI.pull('[*]',page[0])
    ).sort(
      (firstPage: any, secondPage: any) => {
        let firstPageDate =(new Date(firstPage[sortingField])).valueOf();
        let secondPageDate = (new Date(secondPage[sortingField])).valueOf();
        return secondPageDate - firstPageDate;
      }
    );
  debugger;
  return pages.map((page) => page[":node/title"]);

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
