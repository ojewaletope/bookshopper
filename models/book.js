import mongoose from 'mongoose'
const {Model, Schema} = mongoose;

const book = new Schema({
    id: String,
    categoryId: String,
    title: String,
    author: String,
    price: Number,
    quantity: Number,
    image: {type: Array, default: []},
    available: {type: Boolean, default: true},
    dateAdded: {type: Date, default: Date.now()}
});
export default mongoose.model("Book", book)
