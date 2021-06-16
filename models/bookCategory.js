import mongoose from 'mongoose';

const {Schema} = mongoose

const category = new Schema({
    categoryId: String,
    categoryName: String
});

export default mongoose.model("Category", category)
