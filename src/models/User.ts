import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
    handle: string
    name: string
    email: string
    password: string
    description: string
    image: string
    links: string
    followers: mongoose.Types.ObjectId[] //Se agrega para funcionalidad Follow
    following: mongoose.Types.ObjectId[] //Se agrega para funcionalidad Follow
}


const userSchema = new Schema({
    handle: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    links: {
        type: String,
        default: '[]'
    }, //Se agrega para funcionalidad Follow
    followers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }], //Se agrega para funcionalidad Follow
    following: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }] 
})

const User = mongoose.model<IUser>('User', userSchema)
export default User