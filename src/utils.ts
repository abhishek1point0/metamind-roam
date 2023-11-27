import getAllPageName from "roamjs-components/queries/getAllPageNames";
import _ from "lodash";
import getCurrentUserDisplayName from "roamjs-components/queries/getCurrentUserDisplayName";
import getCurrentUserEmail from "roamjs-components/queries/getCurrentUserEmail";
import { SERVER_URL } from "./constants";
import { createIndexPage, createUpdateLogPage } from "./pageOperations";

const convertToMilisecond = (stringDate: string|number) => {
  return (new Date(Number(stringDate)));
}

/**
 * Get all the pages titles from the blocks.
 *
 * @param blocks Blocks of Roam Research
 * @param numberOfPages Total number of pages
 * @returns Arrays of page names.
 */
const generatePagesFromBlock = (blocks:any, numberOfPages: number) => {
  let pages: Array<string> = [];
  blocks.forEach((block: any) => {
    const { page } = block[0];
    if (_.has(page, "title")) {
      const { title } = page;
      const { uid } = page;
      const dateObj = Date.parse(uid);
      if (isNaN(dateObj) && !_.includes(pages, title) && numberOfPages > pages.length) {
        pages.push(title);
      }
    }
  });
  return pages;
}

/**
 * This function returns a list of pages sorted in reverse chronological order based on the last time they were edited.
 * @returns List of pages sorted in reverse chronological order based on the last time they were edited.
 */
export const getReverseChronoSortPages = () => {
    let sortingField = ":edit/time";
    let pages = window.roamAlphaAPI.q('[ :find ?e :where [?e :node/title] ] ').map(
      (page: Array<number>) => window.roamAlphaAPI.pull('[*]', page[0])
    ).sort(
      (firstPage: any, secondPage: any) => {
        let firstPageDate = (convertToMilisecond(firstPage[sortingField])).valueOf();
        let secondPageDate = (convertToMilisecond(secondPage[sortingField])).valueOf();
        return secondPageDate - firstPageDate;
      }
    );
    return pages.map((page) => page[":node/title"]);

};

/**
 * This function returns a list of pages which are created after the filter Date.
 * @param epochTime Epoch time to filter the pages from.
 * @returns List of pages
 */
export const getDateFilteredPages = (epochTime: number) => {
  let sortingField = ":create/time";
  let pages = window.roamAlphaAPI.q('[ :find ?e :where [?e :node/title] ] ').map(
    (page: Array<number>) => window.roamAlphaAPI.pull('[*]', page[0])
  ).filter(
    (page: any) => {
      let pageDate = (convertToMilisecond(page[sortingField]));
      let filterDate = (convertToMilisecond(epochTime));
      let isDatePage = isNaN(Date.parse(page[":block/uid"]));
      return pageDate > filterDate && isDatePage;
    }
  );
  return pages.map((page) => page[":node/title"]);
}

/**
 * This functions queries all blocks to find out the most recetly created pages.
 * @returns List of Pages in order of most recently edited/created block
 *
 */
export const getRecentEditedPages = () => {
  let numberOfPages = getAllPageName().length;
  let blocks = window.roamAlphaAPI.q('[:find (pull ?e [* {:block/page [*]}]) :where [?e :block/string]]').sort(
    (firstBlock: any, secondBlock: any) => {
      const firstBlockDate = (convertToMilisecond(firstBlock[0]["time"])).valueOf();
      const secondBlockDate = (convertToMilisecond(secondBlock[0]["time"])).valueOf();
      return secondBlockDate - firstBlockDate;
    }
  )
  let pages = generatePagesFromBlock(blocks, numberOfPages);
  return pages;
}


/**
 * This function returns a list of pages which are renamed after the filter Date.
 * @param filterDate Epoch time to filter the pages from.
 * @returns List of pages
 */
export const getRenamedPage = (filterDate: number) => {
  let sortingField = ":edit/time";
  let filteredDate = (convertToMilisecond(filterDate));
  let pages = window.roamAlphaAPI.q('[ :find ?e :where [?e :node/title] ] ').map(
    (page: Array<number>) => window.roamAlphaAPI.pull('[*]', page[0])
  ).filter(
    (page: any) => {
      let pageDate = (convertToMilisecond(page[sortingField]));
      let isDatePage = isNaN(Date.parse(page[":block/uid"]));
      return isDatePage && (pageDate > filteredDate) && ( page[sortingField] !== page[":create/time"]);
    }
  );
  return pages.map((page) => page[":node/title"]);
}

/**
 * This functions returns a list of pages which are modified after the filter Date.
 * @param filterDate Epoch time to filter the pages from.
 * @returns List of pages
 */
export const getModifiedPage = (filterDate: number) => {
  let numberOfPages = getAllPageName().length;
  let blocks = window.roamAlphaAPI.q('[:find (pull ?e [* {:block/page [*]}]) :where [?e :block/string]]').filter((block: any) => {
    let pageDate = (convertToMilisecond(block[0]["time"]));
    let filteredDate = (convertToMilisecond(filterDate));
    return pageDate > filteredDate;
  });
  let pages = generatePagesFromBlock(blocks, numberOfPages)
  return pages;
};

// Get all the required data from Roam and return it as a JSON.
const getAllData = () => {
  const graphName = window.roamAlphaAPI.graph.name;
  const email = getCurrentUserEmail();
  const fullName = getCurrentUserDisplayName();
  const graphData = { graphName, email, fullName };
  return graphData;
};

export const generatePages = async (createIndexPageFlag: boolean) => {
  const graph = getAllData();
  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Request-Headers": "*",
      "Access-Control-Request-Method": "*"
    },
    body: JSON.stringify(graph)
  };
  let res = await fetch(`${SERVER_URL}/last_sync/`, options);
  let response = await res.json();
  const lastRun = response["last_run"];
  const numberOfSync = response["number_of_sync"] + 1;
  createIndexPage(createIndexPageFlag);
  createUpdateLogPage(lastRun, numberOfSync);
  return response;
};

// Post the graph data to the server so that the server can sync the graph
// and be ready to publish it.
export const postGraph = async (token: string, description: string) => {
  let graph: any = getAllData();
  graph = { ...graph, token, description };
  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Request-Headers": "*",
      "Access-Control-Request-Method": "*"
    },
    body: JSON.stringify(graph)
  };
  let response = await fetch(`${SERVER_URL}/graph/`, options);
  return response;
};
