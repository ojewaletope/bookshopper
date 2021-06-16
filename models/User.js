import mongoose from 'mongoose'
const {Model, Schema} = mongoose

const user = new Schema({
    id: String,
    name: String,
    email: String,
    phoneNumber: String,
    username: String,
    password: String,
    photo: String,
    dateJoined: {type: Date, default: Date.now()},
    active: {type: Boolean, default: true}
});

export default mongoose.model('User', user,)
