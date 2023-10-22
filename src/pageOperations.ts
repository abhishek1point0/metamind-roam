import _ from "lodash";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import getBlockUidByTextOnPage from "roamjs-components/queries/getBlockUidByTextOnPage";
import { createPage, createBlock, deleteBlock } from "roamjs-components/writes";
import renderToast from "roamjs-components/components/Toast";
import { getRenamedPage, getRecentEditedPages, getModifiedPage, getDateFilteredPages } from "./utils";

export const createIndexPage = (createIndexPageIsManual: boolean) => {
  const indexPageName = `M/Index Page`;
  let allPages = getRecentEditedPages();
  allPages = _.without(allPages, indexPageName);
  const pageUid = getPageUidByPageTitle(indexPageName);
  if (pageUid === "" && createIndexPageIsManual) {
    Promise.all([createPage({ title: indexPageName, })]);
  }
  if (!createIndexPageIsManual) {
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
  }
};

const createBlocks = (pageUid: string, renamedPage: any, modifiedPage: any, newPages: any) => {
  Promise.all([
    createBlock({ node: { text: "**Renamed Pages**", heading: 2 }, parentUid: pageUid, order: 1})
  ]).then((data) => {
    let blockUid = data[0];
    renamedPage.forEach((ele: string, index: number) => {
      createBlock({ node: { text: `[[${ele}]]` }, parentUid: blockUid, order: index + 1 });
    })
  });
  Promise.all([
    createBlock({ node: { text: "**Modified Pages**", heading: 2 }, parentUid: pageUid, order: 2})
  ]).then((data) => {
    let blockUid = data[0];
    modifiedPage.forEach((ele: string, index: number) => {
      createBlock({ node: { text: `[[${ele}]]` }, parentUid: blockUid, order: index + 1 });
    })
  });
  Promise.all([
    createBlock({ node: { text: "**New Pages**", heading: 2 }, parentUid: pageUid, order: 3  })
  ]).then((data) => {
    let blockUid = data[0];
    newPages.forEach((ele: string, index: number) => {
      createBlock({ node: { text: `[[${ele}]]` }, parentUid: blockUid, order: index + 1 });
    })
  });
}

export const createUpdateLogPage = (lastRunSeconds: number, numberOfSync: number) => {
  const pageTitle = `Update No. #${numberOfSync}`;
  let modifiedPages: any = [];
  let renamedPages: any = [];
  let lastRunMiliSeconds = lastRunSeconds * 1000;
  let newPages = getDateFilteredPages(lastRunMiliSeconds);
  newPages = _.without(newPages, pageTitle, "Index Page");

  // If the last run is 1, then it means that the page is being created for the first time.
  // Hence, all pages are new pages.
  if (lastRunMiliSeconds !== 1) {
    // Order of the page changes to show.
    modifiedPages = getModifiedPage(lastRunMiliSeconds);
    renamedPages = getRenamedPage(lastRunMiliSeconds);

    // Making sure to remove the duplicated pages.
    modifiedPages = _.without(modifiedPages, pageTitle, "Index Page",...newPages);
    renamedPages = _.without(renamedPages, pageTitle, "Index Page",...modifiedPages, ...newPages);
  }

  Promise.all([createPage({ title: pageTitle, })]).then(
    (data) => {
      const pageUid = data[0];
      generateUpdateLogIndexPage(pageTitle, pageUid)
      createBlocks(pageUid, renamedPages, modifiedPages, newPages);
    }).catch((e) => {
      const pageUid = getPageUidByPageTitle(pageTitle);
      const indexBlocks = getBasicTreeByParentUid(pageUid);
      let deletedBlocks: Promise<string | number>[] = [];
      indexBlocks.forEach((block) => {
        deletedBlocks.push(deleteBlock(block.uid));
      });
      Promise.all(deletedBlocks).then((data) => {
        renderToast({
          content: `Regenerating the Update Log for ${pageTitle}`,
          intent: "warning",
          id: "roam-js-graphgator-log-page"
        });
        generateUpdateLogIndexPage(pageTitle, pageUid)
        createBlocks(pageUid, renamedPages, modifiedPages, newPages);
      });
    });
}

export const generateUpdateLogIndexPage = (updatePageTitle: string, updateLogPageUid: string) => {
  const pageTitle = `M/Update Logs`;
  const pageUid = getPageUidByPageTitle(pageTitle);
  if (pageUid === "") {
    Promise.all([createPage({ title: pageTitle, })]).then(
      (data) => {
        const pageUid = data[0];
        createUpdateLogBlock(updatePageTitle, pageTitle, pageUid, updateLogPageUid);
      }
    )
  }
  else {
    createUpdateLogBlock(updatePageTitle, pageTitle, pageUid, updateLogPageUid);
  }
}

function createUpdateLogBlock(updatePageTitle: string, pageTitle: string, pageUid: string, updateLogPageUid: string) {
  const blockText = `[[${updatePageTitle}]]\n**Title** :\n**Date** : [[${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })}]]`;
  const blockUid = getBlockUidByTextOnPage({ text: blockText, title: pageTitle });
  if (blockUid !== "") {
    Promise.all([deleteBlock(blockUid)]);
  }
  createBlock({ node: { text: blockText }, parentUid: pageUid }).then((data) => {
    const blockUid = data;
    createBlock({ node: { text: `{{[[embed]]: ((${blockUid}))}}` }, parentUid: updateLogPageUid });
  });
}
