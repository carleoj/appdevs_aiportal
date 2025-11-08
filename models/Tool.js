import mongoose from "mongoose";

const toolSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    likesCount: {
        type: Number,
        required: true,
        default: 0
    },
    link: {
        type: String,
        required: true
    },
    category: {
    type: [String],  
    required: true
  },
  comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", 
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
}, {timestamps: true});

// Virtual field for comment count
toolSchema.virtual("commentsCount").get(function () {
  return this.comments ? this.comments.length : 0;
});

toolSchema.set("toJSON", { virtuals: true });
toolSchema.set("toObject", { virtuals: true });

const Tool = mongoose.model('Tool', toolSchema);

export default Tool;    