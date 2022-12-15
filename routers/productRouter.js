import express from "express";
import expressAsyncHandler from "express-async-handler";
import Product from "../models/productModel.js";
import multer from "multer";
import dotenv from "dotenv";
import { isAdmin, isAuth } from "../utils.js";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import sharp from "sharp";

dotenv.config();

const bucketRegion = process.env.BUCKET_REGION;
const bucketName = process.env.BUCKET_NAME;
const bucketAccessKey = process.env.BUCKET_ACCESS_KEY;
const bucketSecretKey = process.env.BUCKET_SECRET_KEY;

// import data from "../data.js";

const productRouter = express.Router();

const s3 = new S3Client({
  credentials: {
    accessKeyId: bucketAccessKey,
    secretAccessKey: bucketSecretKey,
  },
  region: bucketRegion,
});

productRouter.get(
  "/addProduct",
  expressAsyncHandler(async (req, res) => {
    await Product.deleteMany({});
    const addedProducts = await Product.insertMany(data.products);
    res.send({ message: "Product Created", product: addedProducts });
  })
);

productRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    const name = req.query.name || "";
    const category = req.query.category || "";
    const order = req.query.order || "";
    const pageNumber = Number(req.query.pageNumber) || 1;

    const numberOfProductsInPage = 6;

    const nameFilter = name ? { name: { $regex: name, $options: "i" } } : {};
    const categoryFilter = category ? { category } : {};
    const sortFilter =
      order === "lowest"
        ? { price: 1 }
        : order === "highest"
        ? { price: -1 }
        : { _id: -1 };

    const count = await Product.count({
      ...nameFilter,
      ...categoryFilter,
    });

    const products = await Product.find({
      ...nameFilter,
      ...categoryFilter,
    })
      .sort(sortFilter)
      .skip(numberOfProductsInPage * (pageNumber - 1)) // -1 bcoz in page 1 skip 0 item
      .limit(numberOfProductsInPage);

    for (let p of products) {
      const getObjParams = {
        Bucket: bucketName,
        Key: p.image,
      };

      const command = new GetObjectCommand(getObjParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      p.imageURL = url;
    }

    res.send({
      products,
      page: pageNumber,
      totalPages: Math.ceil(count / numberOfProductsInPage),
    });
  })
);

productRouter.get(
  "/category",
  expressAsyncHandler(async (req, res) => {
    const categories = await Product.find().distinct("category");
    res.status(200).send(categories);
  })
);

productRouter.get(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const productDetail = await Product.findById(productId);

    const getObjParams = {
      Bucket: bucketName,
      Key: productDetail.image,
    };

    const command = new GetObjectCommand(getObjParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    productDetail.imageURL = url;

    if (!productDetail) {
      res.status(404).send({ message: "Product Not Found" });
    }

    res.send(productDetail);
  })
);

productRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (product) {
      const getObjParams = {
        Bucket: bucketName,
        Key: product.image,
      };

      const command = new DeleteObjectCommand(getObjParams);
      s3.send(command);

      const deletedProduct = await product.remove();

      return res.send({ message: "Product Deleted", product: deletedProduct });
    } else {
      return res.status(404).send({ message: "Product Not Found" });
    }
  })
);

const uploadImageBucket = async () => {};

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

//const buffer =await sharp.apply(req.file.buffer).resize({height:400,width: 250,fit:"contain"}).toBuffer();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

productRouter.put(
  "/:id",
  upload.single("image"),
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;

    //Key: req.body.name, // image name ( req.body.name) here if we upload 2image with same
    // name then the image will overwrite so we need unique key
    //Body: req.file.buffer, // actual image in binary
    //ContentType: req.file.mimetype, // file type

    const product = await Product.findById(productId);

    if (product) {
      const generatedImageName = randomImageName();
      const params = {
        Bucket: bucketName,
        Key: generatedImageName,
        Body: req.file.buffer, // actual image in binary
        ContentType: req.file.mimetype, // file type
      };

      const command = new PutObjectCommand(params);

      const imguploadSuccess = await s3.send(command);

      product.name = req.body.name;
      product.price = req.body.price;
      product.brand = req.body.brand;
      product.category = req.body.category;
      product.description = req.body.description;
      product.countInStock = req.body.countInStock;
      product.image = generatedImageName;
      product.imageURL = "";

      const savedProduct = await product.save();

      return res.send({ product: savedProduct, message: "Product Updated" });
    } else {
      return res.status(404).send({ message: "Product Not Found" });
    }
  })
);

productRouter.post(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const product = new Product({
      name: "Sample Name" + Date.now(),
      price: 0,
      category: "Sample Category",
      brand: "Sample Brand",
      countInStock: 0,
      description: "Sample Description",
      rating: 0,
      numReviews: 0,
      image: "/images/p10.jpg",
    });

    const createdProduct = await product.save();

    return res.send({ message: "Product Created", product: createdProduct });
  })
);

export default productRouter;
