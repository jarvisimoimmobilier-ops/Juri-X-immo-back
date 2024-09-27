import OpenAI from "openai";
import dotenv from "dotenv";
import ImageJob from "../model/ImageJob.js";
import { uploadImage } from "./imageService.js";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const schema = {
  type: "object",
  properties: {
    posts: {
      type: "array",
      description:
        "an array of posts with length = number of posts per week * 4 ",
      items: {
        type: "object",
        properties: {
          post_id: {
            type: "string",
            description:
              "ids looks like #1, #2, #3 and it will be up to #12 since I want 12 posts",
          },
          post_title: {
            type: "string",
            description:
              "The title that will show in the beginning of the post caption",
          },
          generated_image_description: {
            type: "string",
            description:
              "write a Detailed description of the image that will be in the post, make it as more precise as you can.",
          },
          post_body: {
            type: "string",
            description: "The caption text that will be in the post",
          },
          post_date: {
            type: "string",
            description:
              "The time of the publish of the post; should be something like YYYY/MM/DD-HH:MM",
          },
          generated_image: {
            type: "string",
          },
        },
        required: [
          "post_title",
          "generated_image_description",
          "pos_tbody",
          "post_date",
        ],
      },
    },
  },
};

function generatePrompt(calendar, brand, user) {
  let durationInWeeks = 4;
  if (user.currentPlan == "Free") {
    durationInWeeks = 1;
  }

  let currentDate = new Date();
  let year = currentDate.getFullYear();
  let month = String(currentDate.getMonth() + 1).padStart(2, "0");
  let day = String(currentDate.getDate()).padStart(2, "0");
  let today = `${year}/${month}/${day}`;

  // Calculate the date after the specified number of weeks
  let nextDate = new Date(currentDate);
  nextDate.setDate(currentDate.getDate() + durationInWeeks * 7);
  let nextYear = nextDate.getFullYear();
  let nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
  let nextDay = String(nextDate.getDate()).padStart(2, "0");
  let nextDateFormatted = `${nextYear}/${nextMonth}/${nextDay}`;

  var prompt =
    "Hi there, today is " +
    today +
    ", can you suggest a planning for next " +
    durationInWeeks +
    " week(s) posts (from today to " +
    nextDateFormatted +
    ") so this means you have to generate strictly " +
    calendar.calendar_config.preferred_post_frq_per_w * durationInWeeks +
    " posts, here is the brand for which I need the posts: " +
    brand.toString() +
    "\n and here is the configuration of my calendar : " +
    calendar.toString() +
    ". \n if you can take in special days in morocco and  it would be perfect; " +
    "You have to stricly respect the numbers I give you , like number of paragraphs in post , number of post per week ," +
    " number of words per paragrpah ... and remember you have to generate strictly " +
    calendar.calendar_config.preferred_post_frq_per_w * 4 +
    " posts.";
  console.log(prompt);
  return prompt;
}

const generateCalendar = async (calendar, brand, user) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4-0613",
    messages: [
      {
        role: "system",
        content:
          "You are the communication & social media manager of my company and responsible" +
          " of creating and scheduling creative and interresting posts for the company. the things you should strictly consider when creating posts for me are :" +
          "\n 1 - my brand/company data: I will share with you data about my company" +
          "\n 2 - my configuration: I will give you a config to respect while generating and scheduling posts" +
          "\n 3 - the real date: you respect the dates , if there is a holiday or something try to consider it in the posts content and publish_timing",
      },
      { role: "user", content: generatePrompt(calendar, brand, user) },
    ],
    functions: [{ name: "get_a_calendar", parameters: schema }],
    function_call: { name: "get_a_calendar" },
    temperature: 0,
  });
  var res = await addImages(
    JSON.parse(response.choices[0].message.function_call.arguments).posts,
    calendar._id
  );
  return res;
};

const addImages = async (response, calendar_id) => {
  const updatedResponse = await Promise.all(
    response.map(async (e) => {
      const imageUrl =
        "https://blog.hubspot.com/hs-fs/hubfs/CSS%20infinite%20loading%20animation%20example.gif?width=1500&name=CSS%20infinite%20loading%20animation%20example.gif";
      // const imageUrl = await getImageFromText(e.generated_image_description);
      const image_job = await ImageJob.create({
        calendar_id: calendar_id,
        post_id: e.post_id,
        imageDescr: e.generated_image_description,
      });
      return { ...e, generated_image: imageUrl };
    })
  );
  return updatedResponse;
};

async function getImageFromText(generated_image_description) {
  try {
    // Generate the image URL from the description
    const response = await generatePostImage(generated_image_description);
    const imageUrl = response.data[0]?.url;

    if (imageUrl) {
      const cloudinaryUrl = await uploadImage(imageUrl);
      return cloudinaryUrl;
    } else {
      throw new Error("No image URL generated.");
    }
  } catch (error) {
    console.error("Error in getImageFromText:", error.message);
    throw error;
  }
}

async function generatePostImage(prompt) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt, // Using the prompt argument here
      n: 1,
      size: "1024x1024",
    });

    // Return the response data directly
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }

    // Return error information
    return {
      success: false,
      error: "The image could not be generated",
    };
  }
}

// async function getImageFromText(generated_image_description) {
//   // n9raw e.generated_image_description , nssiftoh l dalle , yrj3na link , link ytsifet l cloundinary ; w returniw generated_image link
//   const response = await generatePostImage(generated_image_description);
//   console.log("response.data.url :"+JSON.stringify(response))
//   return response.data[0]?.url;
// }

export { generateCalendar, getImageFromText, generatePostImage };
