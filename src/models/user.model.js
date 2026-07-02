import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"


const userSchema = new Schema(
    {
        fullname: {
            type: String,
            required: [true, "Full name is required."],
            trim: true,
        },

        email: {
            type: String,
            required: [true, "Email is required."],
            unique: true,
            trim: true,
            lowercase: true,
        },

        password: {
            type: String,
            required: function () {
                return this.authProvider === "local";
            },
            minlength: [8, "Password must be at least 8 characters."],
            select: false,
        },

        avatar: {
            type: String,
            default: null,
        },

        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },

        googleId: {
            type: String,
            default: null,
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save",async function(next){

            if(!    this.isModified("password"))
                return next;

            this.password=await bcrypt.hash(this.password,10);    
            next
})

userSchema.methods.isPasswordCorrect=async function(password){
        return await bcrypt.compare(password,this.password)
}


userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email 
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }

    )
};

userSchema.methods.generateRefreshToken = function () {

    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }

    )

};





export const User = mongoose.model("User", userSchema);