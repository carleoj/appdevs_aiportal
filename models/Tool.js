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
}, {timestamps: true});

const Tool = mongoose.model('Tool', toolSchema);

export default Tool;    