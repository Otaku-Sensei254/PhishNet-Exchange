// test.js
import { fetchPastebinPastes } from "./services/Scrapper.js";

const run = async () => {
  const pastes = await fetchPastebinPastes();
  console.log("Fetched pastes:", pastes);
};

run();
