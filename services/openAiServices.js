import OpenAI from "openai";
import dotenv from "dotenv";
import { getAssistantConfig } from "../utils/functions.js";
import { notFoundError } from "../errors/index.js";

dotenv.config();

const assistantsConfig = getAssistantConfig();

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

async function createThread(assistant_app_id) {
  if (!assistantsConfig || !assistantsConfig[assistant_app_id]) {
    throw new notFoundError(
      `No assistant found with appId: ${assistant_app_id}`
    );
  }
  const thread = await openai.beta.threads.create();
  return thread.id;
}

async function sendMessageToOpenAI(message, assistant_app_id, thread_id) {
  console.log(process.env["OPENAI_API_KEY"]);
  const messageToSend = await openai.beta.threads.messages.create(thread_id, {
    role: "user",
    content: message,
  });
  console.log(message);
  let run = await openai.beta.threads.runs.createAndPoll(thread_id, {
    assistant_id: assistantsConfig[assistant_app_id].openAI_id,
  });
  if (run.status === "completed") {
    const messages = await openai.beta.threads.messages.list(run.thread_id);

    const allMessages = messages.data[0].content;

    const formattedMessages = allMessages
      .map((message) => message.text.value)
      .join("\n");
    console.log(formattedMessages);
    return formattedMessages;
  } else {
    console.log(run.status);
  }
}

export { createThread, sendMessageToOpenAI };
