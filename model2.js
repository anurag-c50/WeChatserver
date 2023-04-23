const mongoose = require("mongoose");
const message = new mongoose.Schema({
  message:{     
  text:{
        type:String,
        required:true,
     },
    },
     senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
     users:Array,
    },

{
    timestamps:true
}
)
 
module.exports = mongoose.model("Message",message);