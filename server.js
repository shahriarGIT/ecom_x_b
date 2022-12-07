import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";

import productRouter from "./routers/productRouter.js";
import userRouter from "./routers/userRouter.js";
import uploadRouter from "./routers/uploadRouter.js";
import orderRouter from "./routers/orderRouter.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log(err));

// app.get("/", (req, res) => {
//   res.send({ name: "Server Ready!!!" });
// });

// app.get("/", (req, res) => {
//   res.send({ hello: "HELLO" });
// });

app.use("/api/products", productRouter);
app.use("/api/user", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/uploads", uploadRouter);

const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
// app.use(express.static(path.join(__dirname, "/ecom-x-frontend/build")));
// app.get("*", (req, res) =>
//   res.sendFile(path.join(__dirname, "/ecom-x-frontend/build/index.html"))
// );
app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server connection at port:${port}`);
});
