const validator=require ("validator");
const validateSignUpData=(req)=>{
    const {firstName,lastName,emailId,password}=req.body;

    if(!firstName || !lastName){
        throw new Error("first name and last name are required");
    }
    else if(!validator.isEmail(emailId)){
        throw new Error("Please enter a valid email address");
    }
    else if(!validator.isStrongPassword(password)){
        throw new Error("Please create a strong password");
    }
}

const validateEditProfileData=(req)=>{
    
    const allowedEditFields = ["firstName","lastName","About", "Skills", "photoURL","age","gender"];

    const isEditAllowed = Object.keys(req.body).every((field) =>
      allowedEditFields.includes(field)
    );

    return isEditAllowed; 
}

module.exports={validateSignUpData,validateEditProfileData};