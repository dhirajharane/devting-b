const jwt=require("jsonwebtoken");
const {User}=require("../models/user");

const userAuth=async (req,res,next)=>{
    try{
       const {token}=req.cookies;
       if(!token){
        res.status(401).send("Please Login first");
       }

       const decodedObj=await jwt.verify(token,process.env.JWT_SECRET);

       const {_id}=decodedObj;

       const user= await User.findById(_id);
       req.user=user;
       if(!user){
        throw new Error("Invalid User");
       }
       next();
    } catch(err){
        res.status(400).send(err.message);
    }

       

    
}

module.exports={userAuth}