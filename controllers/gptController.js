import {OpenAI} from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
});

export async function generatePostImage(req, res) {
  try {

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: "man on the moon",
      n: 1,
      size: "1024x1024",
    });

    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }

    res.status(400).json({
      success: false,
      error: "The image could not be generated",
    });
  }
}
