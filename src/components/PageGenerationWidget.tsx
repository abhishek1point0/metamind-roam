import React from "react";
import { Button } from "@blueprintjs/core";
import renderToast from "roamjs-components/components/Toast";
import type { OnloadArgs } from "roamjs-components/types/native";

import { generatePages } from "../utils";

const PageGenerationWidget = (extensionAPI: OnloadArgs["extensionAPI"]) => () => {
  const [isToggled, setIsToggled] = React.useState(false);
  React.useEffect(() => {
    const graphName = window.roamAlphaAPI.graph.name;
    const indexPageToggleFlag = extensionAPI.settings.get(`${graphName}_indexPage`);
    const indexPage = (typeof indexPageToggleFlag === 'string' && indexPageToggleFlag !== '') ? JSON.parse(indexPageToggleFlag) : false;
    setIsToggled(indexPage);
  }, []);

  const handleToggle = () => {
    const graphName = window.roamAlphaAPI.graph.name;
    setIsToggled(!isToggled);
    extensionAPI.settings.set(`${graphName}_indexPage`, JSON.stringify(!isToggled));
  };

  const generatePage = () => {
    const res = generatePages(isToggled);
    res.then(() => {
      renderToast({
        content: "Pages are being generated!",
        intent: "primary",
        id: "roam-js-graphgator"
      });
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Button
        text="Generate New Update Log and Index Page"
        onClick={generatePage}
        style={{ color: "#FFFFFF", fontWeight: "bold", borderRadius: "0.5rem" }}
      />
      <div style={{ padding: "2rem" }}>
        <input type="checkbox" checked={isToggled} onChange={handleToggle} style={{ padding: "0.5rem" }} />
        <label style={{ padding: "0.5rem", fontWeight: "bold" }}> Manually create Index Page for your Graph </label>
      </div>
    </div>
  );
};

export default PageGenerationWidget;
