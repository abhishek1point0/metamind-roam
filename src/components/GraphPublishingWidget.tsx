import React from "react";
import { Button } from "@blueprintjs/core";
import renderToast from "roamjs-components/components/Toast";
import { postGraph } from "../utils";
import type { OnloadArgs } from "roamjs-components/types/native";

const GraphPublishingWidget = (extensionAPI: OnloadArgs["extensionAPI"]) => () => {
  const [tokenValue, setTokenValue] = React.useState("");
  const [tokenSwitch, setTokenSwitch] = React.useState(false);
  const [graphDescription, setGraphDescription] = React.useState("");

  React.useEffect(() => {
    const graphName = window.roamAlphaAPI.graph.name;
    const description = extensionAPI.settings.get(`${graphName}_graphDescription`);
    const descriptionString = (typeof description === 'string') ? JSON.parse(description) : "";
    const tokenSwitchValue = extensionAPI.settings.get(`${graphName}_graphgator_token`);
    const tokenSwitchString = (typeof tokenSwitchValue === 'boolean') ? tokenSwitchValue : false;
    setGraphDescription(descriptionString);
    setTokenSwitch(tokenSwitchString);
  }, []);

  const handleTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenValue(event.target.value);
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGraphDescription(event.target.value);
  };

  const handleSync = async () => {
    const graphName = window.roamAlphaAPI.graph.name;
    extensionAPI.settings.set(`${graphName}_graphDescription`, JSON.stringify(graphDescription));
    if (tokenValue !== "" && !tokenSwitch) {
      setTokenSwitch(true);
      extensionAPI.settings.set(`${graphName}_graphgator_token`, true);
    }
    const res = await postGraph(tokenValue, graphDescription);
    if (res.status === 400) {
      renderToast({
        content: "Invalid Token! Please check your token again!",
        intent: "danger",
        id: "roam-js-graphgator"
      });
      return;
    } else if (res.status === 500) {
      renderToast({
        content: "Something went wrong! Please try again!",
        intent: "danger",
        id: "roam-js-graphgator"
      });
      return;
    }
    let response = await res.json();
    response.then(() => {
      renderToast({
        content: "Your graph is getting synced! Please wait for sometime!",
        intent: "primary",
        id: "roam-js-graphgator"
      });
    });
  };

  const showTokenInput = () => {
    const graphName = window.roamAlphaAPI.graph.name;
    extensionAPI.settings.set(`${graphName}_graphgator_token`, false);
    setTokenSwitch(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {tokenSwitch ? <Button
        text="API Token Saved!"
        icon="edit"
        onClick={showTokenInput}
        style={{ color: "#8BA2B2", fontWeight: "bold", borderRadius: "0.5rem", marginBottom: "0.5rem" }}
      /> : <input
        type="text"
        value={tokenValue}
        onChange={handleTokenChange}
        placeholder="Enter your API Token (in Graph tab)"
        style={{ padding: "0.5rem", borderRadius: "0.5rem", marginBottom: "0.5rem" }}
      />}
      <input
        type="text"
        value={graphDescription}
        onChange={handleDescriptionChange}
        placeholder="Enter a Description for your Graph (optional)"
        style={{ padding: "0.5rem", borderRadius: "0.5rem", marginBottom: "0.5rem" }}
      />
      <Button
        text="Sync Graph with Metamind Servers"
        onClick={handleSync}
        style={{ color: "#FFFFFF", fontWeight: "bold" }}
      />
      <div style={{ padding: "2rem", display: "flex", flexDirection: "row" }}>
        <input
          type="checkbox"
          checked={false}
          disabled={true}
          style={{ padding: "0.5rem" }}
        />
        <label style={{ paddingLeft: "0.5rem", fontWeight: "bold" }}>
          Publish to the Metamind App (Coming Soon!)
        </label>
      </div>
    </div>
  );
}

export default GraphPublishingWidget;
