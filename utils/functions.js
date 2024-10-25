import fs from "fs";
import path from "path";
import { StatusCodes } from "http-status-codes";

export function getAssistantConfig() {
  const configPath = path.resolve("./config/config.json");

  try {
    // Read and parse the JSON file synchronously
    const data = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(data);

    // Return the assistants config as a plain JavaScript object
    return config.assistants;
  } catch (error) {
    console.error("Error reading or parsing config.json:", error);
    return null;
  }
}

export const validatePayload = (req, res, requiredFields) => {
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: `${field} is required.` });
    }
  }
  return null;
};
