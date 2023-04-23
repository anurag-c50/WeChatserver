const Register = require("./model");
const Conversation = require("./model3");
const Message = require("./model2");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
module.exports.register = async(req,res,next)=>{
    try{
        const {username,email,password,confirmpassword} = req.body;
        const usernameCheck = await Register.findOne({username});
        const emailCheck = await Register.findOne({email});
        if(usernameCheck){
            return res.json({msg:"Username already used", status:false});
        }
        if(emailCheck)
            return res.json({msg:"Email already used", status:false});
            const hashpassword = await bcrypt.hash(password,10);
            const hashpassword1 = await bcrypt.hash(confirmpassword,10);
            const chat = await Register.create({
                username,
                email,
                password:hashpassword,
                confirmpassword:hashpassword1
            });
            return res.json({status:true,chat});

    } catch (ex){
        next (ex);
    }
}
module.exports.login = async(req,res,next)=>{
    try{
        const {email,password} = req.body;
        const useremail = await Register.findOne({email:email})
        if(!useremail){
        return res.json({msg:"Incorrect username or password", status:false})
        }
        const isMatch = await bcrypt.compare(password,useremail.password);
        if(isMatch){
            const token = await useremail.generateAuthToken();
            return res.json({status:true,useremail,token});
        }
        else{
        return res.json({msg:"Incorrect username or password", status:false})
        }
    } catch (ex){
        next (ex);
    }
}
module.exports.forget = async(req,res,next)=>{
   try{
    const {email} = req.body;
    const useremail = await Register.findOne({email:email});
    if(!useremail){
    return res.json({msg:"Incorrect email", status:false})
    }
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user:"ajjha5244@gmail.com",
            pass:"nxjjngcibmsjeatw",
        },
    });
    
    const secret = "mynameisanuragjhaandiamsoftwareen" + useremail.password;
    const token = jwt.sign({_id:useremail._id},secret,{
        expiresIn:"120s"
    });
    const setusertoken = await Register.findByIdAndUpdate({_id:useremail._id},{verifytoken:token},{new:true});
    if(setusertoken){
    var mailOptions ={
        from: "youremail@gmail.com",
        to: email,
        subject:"Sending Email For password Rest",
        text:`This Link Valid For 2 MINUTES https://wechatv3.netlify.app/resetpassword/${useremail.id}/${setusertoken.verifytoken}`
    };
   }
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log("Email sent" + info.response);
        }
    });
    return res.json({status:true,useremail});
} catch (ex){
    next (ex);
}
}
module.exports.reset = async(req,res,next)=>{
    const {id,token} = req.params;
    const olduser = await Register.findOne({ _id:id,verifytoken:token});
    if(!olduser){
        return res.json({status:false,msg:"User Not Exists"});
    }
    const secret = "mynameisanuragjhaandiamsoftwareen" + olduser.password;
    try{
    const verify = jwt.verify(token, secret);
    if(olduser && verify._id){
    res.json({status:true})
    }else{
        res.json({status:false,msg:"User not valid"})
       }
}catch (ex){
    next (ex);
}}
module.exports.setpassword = async(req,res,next)=>{
    const {id,token} = req.params;
    const {password} = req.body;
    const olduser = await Register.findOne({ _id:id});
    if(!olduser){
        return res.json({status:false,msg:"User Not Exists"});
    }
    const secret = "mynameisanuragjhaandiamsoftwareen" + olduser.password;
    try{
    const verify = jwt.verify(token, secret);
    if(olduser && verify._id){
    const saltRounds = 10;
    const hasingpassword = await bcrypt.hash(password,saltRounds);
    await Register.findByIdAndUpdate({_id:id},{password:hasingpassword});
    res.json({status:true});
    }else{
        res.json({status:false,msg:"User not valid"})
       }
}catch (ex){
    next (ex);
}
}
module.exports.setAvatar = async(req,res,next)=>{
    try{
    const {avatarImage,users,users1} = req.body;
    if(users){
        const username1 = users.chat._id;
        const setavatar = await Register.findByIdAndUpdate({_id:username1},{avatarImage:avatarImage,isAvatarImageSet:true});
        return res.json({setavatar,status:true})
    }else{
        const username1 = users1.useremail._id;
        const setavatar = await Register.findByIdAndUpdate({_id:username1},{avatarImage:avatarImage,isAvatarImageSet:true});
        return res.json({setavatar,status:true})
    }
  
}catch (ex){
    next (ex);
}
}
module.exports.getUser = async(req,res,next)=>{
    try{
        const {id} = req.body;
        const data = await Register.findById({ _id:id})
        return res.json(data);
    }catch(ex){
        next(ex);
    }
}
module.exports.searchUser = async(req,res,next)=>{
    try{
        const {senderId} = req.body;
        // console.log(senderId)
        const data = await Register.find().select([
            "username",
            "avatarImage",
            "_id",
        ])
        //   console.log(data)
          if(data){
            return res.json({status:true,data});
          }
         else{
            return res.json({status:false})
         }
        }catch(ex){
        next(ex);
    }
}
module.exports.conversation = async(req,res,next)=>{
        const {senderId,reciverId} = req.body;
        const exit = await Conversation.findOne({members:{$all:[senderId,reciverId]}})
        if(exit){
        return res.json("Conversation already created");
        }
        const newChat = new Conversation({members:[senderId,reciverId]})
        try{
        const result = await newChat.save();
        console.log(result)
        return res.json(result); 
        }catch(ex){
        next(ex);
    }
}
module.exports.conversationget = async(req,res,next)=>{
    try{
        const {senderId} = req.body;    
        let token = req.headers['authorization'];
        if(token){    
        const verifytoken = jwt.verify(token,"mynameisanuragjhaandiamsoftwareen",(err,res)=>{
            if(err){
                return "token expired";
            }return res;
        })
        if(verifytoken === "token expired"){
            return res.json({status:false});
        }else{
        const data = await Conversation.find({members:{$all:[senderId]}})
        return res.json(data)
        }
    }
        }catch(ex){
            next(ex)
        }
}
module.exports.conversationdelete = async(req,res,next)=>{
    try{
        const {senderId,reciverId} = req.body;
        const data = await Conversation.findOneAndDelete({members:{$all:[senderId,reciverId]}});
        return res.json(data) ;
        }catch(ex){
        next(ex);
    }
}
module.exports.messageadd = async(req,res,next)=>{
    try{
       const {senderId,reciverId,text} = req.body;
       const data = await Message.create({
        message:{text:text},
        users:[senderId,reciverId],
        senderId:senderId,
    });
       return res.json(data);
        }catch(ex){
        next(ex);
    }
}
module.exports.messageget = async(req,res,next)=>{
    try{
        const {senderId,reciverId} = req.body;
            const data = await Message.find({
                users:{
                    $all:[senderId,reciverId],
                },
            }).sort({updatedAt: 1});
            const ProjectMessage = data.map((msg)=>{
                return{
                    senderId: msg.senderId.toString() === senderId,
                    text: msg.message.text,
                    createdAt: msg.createdAt,
                }
            });
            return res.json(ProjectMessage);
        }catch(ex){
        next(ex);
    }
}
module.exports.profileUpdate = async(req,res,next)=>{
    try{
        const {id,name,email}= req.body;
        if(name!==undefined){
            const data = await Register.findByIdAndUpdate({_id:id},{username:name});
            return res.json("Name Updated");
        }
        else if(email!==undefined){
            const data = await Register.findByIdAndUpdate({_id:id},{email:email});
            return res.json("Email Updated");
        }
    }catch(ex){
        next(ex);
    }
}
