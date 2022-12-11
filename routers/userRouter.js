import bcrypt from "bcryptjs";
import express from "express";
import expressAsyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import { generateToken, isAdmin, isAuth } from "../utils.js";

const userRouter = express.Router();

userRouter.post(
  "/signin",
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        res.send({
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          isSeller: user.isSeller,
          token: generateToken(user),
        });
        return;
      }
    }

    return res.status(401).send({ message: "Invalid Email or Password" });
  })
);

userRouter.post(
  "/register",
  expressAsyncHandler(async (req, res) => {
    let user = await User.findOne({ email: req.body.email });

    if (user) {
      return res.status(409).send({ message: "Email already exist" });
    }

    user = new User({
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
    });

    const createdUser = await user.save();

    return res.send({
      _id: createdUser._id,
      name: createdUser.name,
      email: createdUser.email,
      isAdmin: createdUser.isAdmin,
      isSeller: user.isSeller,
      token: generateToken(createdUser),
    });
  })
);

userRouter.put(
  "/profile",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const user = req.body;

    const userExist = await User.findById(user.userId);

    if (userExist) {
      userExist.name = user.name;
      userExist.email = user.email;

      const updatedUser = await userExist.save();

      return res.send({ ...updatedUser._doc, token: user.token });
    }

    return res.status(404).send({ message: "User Not Found" });
  })
);

userRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    const users = await User.find({});

    if (users) {
      return res.send(users);
    }

    return res.status(401).send({ message: "Users not found" });
  })
);

userRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (user) {
      const deletedUser = await user.remove();
      return res.send({ message: "User Delete", user: deletedUser });
    }

    return res.status(404).send({ message: "User Not Found" });
  })
);

userRouter.get(
  "/:id",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (user) {
      return res.send(user);
    }
    return res.status(404).send({ message: "User Not Found" });
  })
);

userRouter.put(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const userId = req.params.id;
    const user = req.body;

    const prevUser = await User.findById(userId);

    if (prevUser) {
      prevUser.name = user.name;
      prevUser.email = user.email;
      prevUser.password = user.password ? user.password : prevUser.password;

      const updatedUser = await prevUser.save();
      return res.send(updatedUser);
    }
    return res.status(404).send({ message: "User Not Found" });
  })
);

export default userRouter;
