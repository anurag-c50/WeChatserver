const mongoose = require("mongoose");
const jwt = require('jsonwebtoken')
const weChat = new mongoose.Schema({
    username: {
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    confirmpassword:{
        type:String,
        required:true
    },
    isAvatarImageSet: {
        type: Boolean,
        default: false,
      },
      avatarImage: {
        type: String,
        default: "",
      },
    tokens:[
        {
        token:{
            type:String,
            required:true,
        }
    }
    ],
    verifytoken:{
        type:String,
    }
})

weChat.methods.generateAuthToken = async function(){
    try{
        const token = jwt.sign({_id:this._id.toString()},"mynameisanuragjhaandiamsoftwareen",{expiresIn:"86400s"})
        this.tokens = this.tokens.concat({token:token})
        await this.save();
        return token;
    }catch(error){
        console.log(`the error is ${error}`);
    }
}
 
module.exports = mongoose.model("Register",weChat);