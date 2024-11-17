import OpenAI from "openai";
import dotenv from "dotenv";
import { getAssistantConfig } from "../utils/functions.js";
import { notFoundError } from "../errors/index.js";

dotenv.config();

const assistantsConfig = getAssistantConfig();

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

async function createThread(avatar_id) {
  if (!assistantsConfig || !assistantsConfig[avatar_id]) {
    throw new notFoundError(`No assistant found with appId: ${avatar_id}`);
  }
  const thread = await openai.beta.threads.create();
  return thread.id;
}

async function sendMessageToOpenAI(message, avatar_id, thread_id) {
  const messageToSend = await openai.beta.threads.messages.create(thread_id, {
    role: "user",
    content: message,
  });
  let run = await openai.beta.threads.runs.createAndPoll(thread_id, {
    assistant_id: assistantsConfig[avatar_id].openAI_id,
  });
  if (run.status === "completed") {
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    // log the tockens
    console.log(`terminal`, run.usage);

    const allMessages = messages.data[0].content;

    const formattedMessages = allMessages
      .map((message) => message.text.value)
      .join("\n");
    return { formattedMessages, usage: run.usage };
  } else {
    console.log(run.status);
  }
}

export { createThread, sendMessageToOpenAI };
