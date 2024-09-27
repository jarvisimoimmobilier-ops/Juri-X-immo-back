import mongoose from "mongoose";
const { Schema } = mongoose;

const CalendarSchema = new mongoose.Schema({
  calendar_name: {
    type: String,
    required: [true, "Please provide a name"],
    minlength: 3,
    maxlength: 20,
    trim: true,
  },
  brand: { type: Schema.Types.ObjectId, ref: "Brand" },
  calendar_config: {
    objective_of_posts: {
      type: String,
      required: [true, "Please provide objectives"],
      trim: true,
    },
    language: {
      type: String,
      required: [true, "Please provide language"],
    },
    preferred_n_paragraphs: {
      type: Number,
    },
    preferred_n_words_per_p: {
      type: Number,
    },
    preferred_post_frq_per_w: {
      type: Number,
    },
    addEmojis: {
      type: Boolean,
    },
    hashtags: {
      type: [String],
    },
    includePeopleInImages: {
      type: Boolean,
    },
    additional_notes: {
      type: String,
    },
    platforms: [
      {
        type: String,
        enum: ["facebook", "instagram", "linkedin"],
      },
    ],
  },
  generated_calendar: [
    {
      post_id: {
        type: String,
      },
      post_title: {
        type: String,
      },
      generated_image: {
        type: String,
      },
      post_body: {
        type: String,
      },
      post_date: {
        type: Date,
      },
    },
  ],
  creation_Time: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

CalendarSchema.methods.toString = function () {
  return (
    "\n - Objective of Posts: " +
    this.calendar_config.objective_of_posts +
    "\n - Language: " +
    this.calendar_config.language +
    "\n - Each post should contain strictly : " +
    this.calendar_config.preferred_n_paragraphs +
    " paragraphs " +
    "\n - and Each Paragraph should contain strictly " +
    this.calendar_config.preferred_n_words_per_p +
    " with inaccuracy of 10  words " +
    "\n - Preferred number of posts per week : " +
    this.calendar_config.preferred_post_frq_per_w +
    "\n - Platforms where posts will be published: " +
    (this.calendar_config.platforms.length > 0
      ? this.calendar_config.platforms.join(", ")
      : "Not specified") +
    "\n - adding emojis to the text : " +
    (this.calendar_config.addEmojis === true
      ? "Yes, please"
      : "No , dont add emojis to text") +
    "\n - including people in images : " +
    (this.calendar_config.includePeopleInImages === true
      ? "yes, I want to have some people in images if necessary"
      : "I dont want people in generated images") +
    "\n - Hashtags to add: " +
    (this.calendar_config.hashtags
      ? this.calendar_config.hashtags.join(" - ")
      : "Not specified") +
    "\n - Additional Notes: " +
    this.calendar_config.additional_notes +
    "\n"
  );
};

CalendarSchema.pre(/^find/, function (next) {
  this.populate("brand");
  next();
});

export default mongoose.model("Calendar", CalendarSchema);
