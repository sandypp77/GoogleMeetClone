const users = require('../models/users')
const Post = require('../models/posts')
const bcrypt = require("bcrypt")
const saltRounds = 10;

module.exports = class API {
    static async testing(req, res){
        res.send("Testing Success");
    }

    static async fetchAllUser(req, res){
        try{
            const posts = await users.find()
            res.status(200).json(posts)
        }catch(err) {
            res.status(404).json({message: err.message})
        }
    }

    static async register(req, res) {
        const posts = await users.findOne({
          username: req.body.username, function(err, result) {
            if (err) throw err;
            return result
          }
        })
        if (posts === null){
          try {
              const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);
              const insertResult = await users.create({
                  username: req.body.username,
                  password: hashedPwd,
              });
              res.send(insertResult);
          } catch (error) {
              console.log(error);
              res.status(500).send("Internal Server error Occured");
          }
        }else {
          res.status(404).send("Username already exists")
        }
        
    }
    static async login(req, res) {
        try {
            const user = await users.findOne({ username: req.body.username });
            console.log(user);
            if (user) {
              const cmp = await bcrypt.compare(req.body.password, user.password);
              if (cmp) {
                res.send("Auth Successful");
              } else {
                res.status(404).send("Wrong username or password.");
              } 
            } else {
              res.status(404).send("Wrong username or password.");
            }
          } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server error Occured");
          }
    }
    static async deleteUser(req, res){
      const id = req.params.id
      try{
        const user = await users.findByIdAndDelete(id)
        res.status(200).send("User deleted")
      }catch(err){
        res.status(404).send("Deleted Failed")
      }
    }
    static async uploadImage(req, res){
      const post = req.body
      const imageName = req.file.filename
      post.image = imageName
      try{
        await Post.create(post)
        res.status(201).json({message: 'Post created succesfully'})
      }catch(err){
        res.status(400).json({message: err.message})
      }
    }
    static async fetchPost(req, res){
      try {
        const posts = await Post.find()
        res.status(200).json(posts)
      } catch (error) {
        res.status(404).json({message: err.message})
      }
    }
}