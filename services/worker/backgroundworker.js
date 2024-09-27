import ImageJob from "../../model/ImageJob.js";
import Calendar from "../../model/Calendar.js";
import { getImageFromText } from "../openAiServices.js";

const startBackgroundWorker = () => {
  setInterval(async () => {
    console.log("Hi, I am the background worker :) ");
    await processOneImageJob();
  }, 12000);
};

const processOneImageJob = async () => {
  try {
    const oldestPendingImageJob = await ImageJob.findOne({
      status: "PENDING",
    }).sort({ creationTime: 1 });

    if (oldestPendingImageJob) {
      oldestPendingImageJob.status = "PROCESSING";
      await oldestPendingImageJob.save();
      const calendar = await Calendar.findById(
        oldestPendingImageJob.calendar_id
      );
      const post = calendar.generated_calendar.find(
        (p) => p.post_id.toString() === oldestPendingImageJob.post_id.toString()
      );
      let image_url = await getImageFromText(
        generatePrompt(oldestPendingImageJob.imageDescr, post)
      );
      post.generated_image = image_url;
      await calendar.save();
      oldestPendingImageJob.status = "DONE";
      await oldestPendingImageJob.save();
      console.log("changing url of the post to " + image_url + " is done!");
    } else {
      console.log("All Good :)");
    }
  } catch (error) {
    console.error('Error generating and processing "PENDING" ImageJob:', error);
  }
  await ImageJob.deleteMany({ status: "DONE" });
  // const allStuckJobs = await ImageJob.find({
  //   status: "PROCESSING",
  // });
  // console.log(allStuckJobs);
};

const generatePrompt = (disc, post) => {
  var prompt =
    "I have a post with a title (" +
    post.post_title +
    " ) and the caption is : (" +
    post.post_body +
    ") . can you generate an image of " +
    disc +
    " for it .";
  console.log(prompt);
  return prompt;
};

export default startBackgroundWorker;
