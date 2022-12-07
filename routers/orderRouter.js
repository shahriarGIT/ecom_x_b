import express from "express";
import expressAsyncHandler from "express-async-handler";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";

import { isAdmin, isAuth } from "../utils.js";

import data from "../data.js";

const orderRouter = express.Router();

orderRouter.post(
  "/",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    if (req.body.orderItems.length === 0) {
      res.status(400).send({ message: "Cart is Empty" });
    } else {
      const order = new Order({
        seller: req.body.orderItems[0].seller,
        orderItems: req.body.orderItems,
        shippingAddress: req.body.shippingAddress,
        paymentMethod: req.body.paymentMethod,
        totalPrice: req.body.totalPrice,
        user: req.user._id,
      });
      const createdOrder = await order.save();

      res
        .status(201)
        .send({ message: "New Order Created", order: createdOrder });

      try {
        const productBoughtArray = req.body.orderItems;
        productBoughtArray.forEach(async (item) => {
          const product = await Product.findOneAndUpdate(
            { _id: item.productId },
            {
              $inc: {
                countInStock: -item.quantity,
              },
            }
          );
          product = await product.save();
        });
      } catch (error) {
        res.send(error.message);
      }
    }
  })
);

orderRouter.get(
  "/:id",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    if (order) {
      return res.status(200).send(order);
    }
    return res.status(404).send({ message: "Order Not Found" });
  })
);

export default orderRouter;
