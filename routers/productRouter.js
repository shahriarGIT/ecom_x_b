import express from "express";
import expressAsyncHandler from "express-async-handler";
import Product from "../models/productModel.js";

import { isAdmin, isAuth } from "../utils.js";

import data from "../data.js";

const productRouter = express.Router();

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
      const deletedProduct = await product.remove();

      return res.send({ message: "Product Deleted", product: deletedProduct });
    } else {
      return res.status(404).send({ message: "Product Not Found" });
    }
  })
);

productRouter.put(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (product) {
      product.name = req.body.name;
      product.price = req.body.price;
      product.brand = req.body.brand;
      product.category = req.body.category;
      product.description = req.body.description;
      product.countInStock = req.body.countInStock;
      product.image = req.body.image;

      const savedProduct = await product.save();
      //console.log(product, "after update");

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
