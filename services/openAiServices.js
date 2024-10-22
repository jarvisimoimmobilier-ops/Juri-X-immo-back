import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

async function createThread() {
  const thread = await openai.beta.threads.create();
  return thread.id;
}

async function sendMessageToOpenAI(message, assistant_id, thread_id) {
  const messageToSend = await openai.beta.threads.messages.create(thread_id, {
    role: "user",
    content: message,
  });
  let run = await openai.beta.threads.runs.createAndPoll(thread_id, {
    assistant_id: assistant_id,
  });
  if (run.status === "completed") {
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    for (const message of messages.data.reverse()) {
      console.log(`${message.role} > ${message.content[0].text.value}`);
    }
    console.log(thread);
  } else {
    console.log(run.status);
  }
}

export { createThread, sendMessageToOpenAI };
