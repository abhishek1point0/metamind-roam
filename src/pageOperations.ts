import _ from "lodash";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import { createPage, createBlock, deleteBlock } from "roamjs-components/writes";
import renderToast from "roamjs-components/components/Toast";
import { getRenamedPage, getRecentEditedPages, getModifiedPage, getDateFilteredPages } from "./utils";

export const createIndexPage = () => {
  const indexPageName = "Index Page";
  let allPages = getRecentEditedPages();
  allPages = _.without(allPages, indexPageName);
  Promise.all([createPage({ title: indexPageName, })]).then(
    (data) => {
      const pageUide = data[0];
      allPages.forEach((ele: any, i: any) => {
        createBlock({ node: { text: `[[${ele}]]` }, parentUid: pageUide, order: i + 1 });
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
          createBlock({ node: { text: `[[${ele}]]` }, parentUid: pageUid, order: i + 1 });
        });
      });
    });
};

const createBlocks = (pageUid: string, renamedPage: any, modifiedPage: any, newPages: any) => {
  Promise.all([
    createBlock({ node: { text: "Renamed Pages" }, parentUid: pageUid, order: 1})
  ]).then((data) => {
    let blockUid = data[0];
    renamedPage.forEach((ele: string, index: number) => {
      createBlock({ node: { text: `[[${ele}]]` }, parentUid: blockUid, order: index + 1 });
    })
  });
  Promise.all([
    createBlock({ node: { text: "Modified Pages" }, parentUid: pageUid, order: 2})
  ]).then((data) => {
    let blockUid = data[0];
    modifiedPage.forEach((ele: string, index: number) => {
      createBlock({ node: { text: `[[${ele}]]` }, parentUid: blockUid, order: index + 1 });
    })
  });
  Promise.all([
    createBlock({ node: { text: "New Pages" }, parentUid: pageUid, order: 3  })
  ]).then((data) => {
    let blockUid = data[0];
    newPages.forEach((ele: string, index: number) => {
      createBlock({ node: { text: `[[${ele}]]` }, parentUid: blockUid, order: index + 1 });
    })
  });
}

export const createUpdateLogPage = (lastRun: number) => {
  const graphName = window.roamAlphaAPI.graph.name;
  const pageTitle = `Update Logs for ${graphName}`;

  // Order of the page changes to show.
  let newPages = getDateFilteredPages(lastRun);
  let modifiedPage = getModifiedPage(lastRun);
  let renamedPage = getRenamedPage(lastRun);

  // Making sure to remove the duplicated pages.
  newPages = _.without(newPages, pageTitle, "Index Page");
  modifiedPage = _.without(modifiedPage, pageTitle, "Index Page",...newPages);
  renamedPage = _.without(renamedPage, pageTitle, "Index Page",...modifiedPage);

  Promise.all([createPage({ title: pageTitle, })]).then(
    (data) => {
      const pageUid = data[0];
      createBlocks(pageUid, renamedPage, modifiedPage, newPages);
    }).catch((e) => {
      const pageUid = getPageUidByPageTitle(pageTitle);
      const indexBlocks = getBasicTreeByParentUid(pageUid);
      let deletedBlocks: Promise<string | number>[] = [];
      indexBlocks.forEach((block) => {
        deletedBlocks.push(deleteBlock(block.uid));
      });
      Promise.all(deletedBlocks).then((data) => {
        renderToast({
          content: "Regenerating the log page!",
          intent: "warning",
          id: "roam-js-graphgator-log-page"
        });
        createBlocks(pageUid, renamedPage, modifiedPage, newPages);
      });
    });
}
