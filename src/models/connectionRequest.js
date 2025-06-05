const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema({
    fromUserId:{
        ref:"User",
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    toUserId:{
        ref:"User",
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    status:{
        type:String,
        required:true,
        enum:{
          values:["ignored","interested","accepted","rejected"],
          message:`{VALUE} is not a valid status type`
        }
    } 
},{
    timestamps:true,
})

connectionRequestSchema.index({fromUserId:1,toUserId:1});

connectionRequestSchema.pre("save",function (next){
    if(this.fromUserId.equals(this.toUserId)){
        throw new Error("You can't send request to yourself")
    }
    next();
})

const ConnectionRequestModel = mongoose.model("ConnectionRequest", connectionRequestSchema);
module.exports = { ConnectionRequestModel };