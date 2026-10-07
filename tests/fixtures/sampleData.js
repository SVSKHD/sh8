/* loads firebase/sample-data.json into the store's localStorage slot, so
   tests run against the same example docs a real project can import —
   which also keeps the sample file honest about the app's data shape */
import data from "../../firebase/sample-data.json";

export function loadSampleData() {
  const state = {};
  for (const [coll, { docs }] of Object.entries(data.collections)) {
    if (coll === "spl_settings") continue;
    state[coll.replace(/^spl_/, "")] = JSON.parse(JSON.stringify(docs));
  }
  localStorage.setItem("us-app-v1", JSON.stringify(state));
}

export const sampleCollections = data.collections;
