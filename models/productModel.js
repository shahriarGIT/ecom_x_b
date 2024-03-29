import mongoose from "mongoose";

//    seller: { type: mongoose.Schema.Types.ObjectID, ref: "User" },
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    imageURL: { type: String },
    imageZoomed: { type: String, required: true },
    imageZoomedURL: { type: String },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    countInStock: { type: Number, required: true },
    rating: { type: Number, required: true },
    numReviews: { type: Number, required: true },
    seller: { type: mongoose.Schema.Types.ObjectID, ref: "User" },
  },
  {
    timestamps: true,
  }
);
const Product = mongoose.model("Product", productSchema);

export default Product;
