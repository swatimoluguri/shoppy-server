const { getCartModel, getOrderModel } = require("../db");
const Razorpay = require("razorpay");
const { now } = require("mongoose");
const crypto = require("crypto");
require("dotenv").config();
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, CLIENT_PORT } = process.env;

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

const checkout = async (req, res) => {
  try {
    const amount = req.body.amount;
    var options = {
      amount: amount * 100,
      currency: "INR",
    };
    const order = await razorpay.orders.create(options);
    const orderModel = getOrderModel();
    await orderModel.insertOne({
      order_id: order.id,
      amount: amount,
      userId: req.userId,
      items: req.body.cart.cart.items,
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const payment_verification = async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
    req.body;
  const body_data = razorpay_order_id + "|" + razorpay_payment_id;
  const response = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body_data)
    .digest("hex");
  const isValid = response === razorpay_signature;
  if (isValid) {
    const orderModel = getOrderModel();
    const cartModel = getCartModel();
    await orderModel.findOneAndUpdate(
      {
        order_id: razorpay_order_id,
      },
      {
        $set: {
          razorpay_payment_id: razorpay_payment_id,
          razorpay_signature: razorpay_signature,
          order_date: now(),
        },
      }
    );
    await cartModel.deleteMany({ userId: req.userId });
    res.redirect(`${CLIENT_PORT}/success?payment_id=${razorpay_payment_id}`);
  } else {
    res.redirect("/failed");
  }
  return;
};

const order_details = async (req, res) => {
  const orderModel = getOrderModel();
  await orderModel
    .findOne({ razorpay_payment_id: req.body.paymentId })
    .then((result) => {
      res.status(200).json({ result });
    })
    .catch((error) => {
      res.status(500).json({ message: "Server error" });
    });
};

const add_cart = async (req, res) => {
  try {
    const newItem = req.body.item;
    const cartModel = getCartModel();
    const existingItem = await cartModel.findOne({
      userId: req.userId,
      "item.id": newItem.id,
    });

    if (existingItem) {
      const maxCount = 5;
      const combinedCount = existingItem.item.count + newItem.count;
      const newCount = combinedCount <= maxCount ? combinedCount : maxCount;

      await cartModel.findOneAndUpdate(
        { userId: req.userId, "item.id": newItem.id },
        { $set: { "item.count": newCount } }
      );

      res.status(200).json({ message: "Item count updated" });
    } else {
      await cartModel.insertOne({
        userId: req.userId,
        item: req.body.item,
      });

      res.status(200).json({ message: "Item added to cart" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const reduce_cart = async (req, res) => {
  const cartModel = getCartModel();
  await cartModel.findOneAndUpdate(
    { userId: req.userId, "item.id": req.body.id },
    { $inc: { "item.count": -1 } }
  );
  res.sendStatus(200);
};

const increase_cart = async (req, res) => {
  const cartModel = getCartModel();
  await cartModel.findOneAndUpdate(
    { userId: req.userId, "item.id": req.body.id },
    { $inc: { "item.count": 1 } }
  );
  res.sendStatus(200);
};

const delete_cart = async (req, res) => {
  const cartModel = getCartModel();
  await cartModel.findOneAndDelete({
    userId: req.userId,
    "item.id": req.body.id,
  });
  res.sendStatus(200);
};

const clear_cart = async (req, res) => {
  const cartModel = getCartModel();
  await cartModel.deleteMany({ userId: req.userId });
  res.sendStatus(200);
};

module.exports = {
  checkout,
  payment_verification,
  order_details,
  add_cart,
  reduce_cart,
  increase_cart,
  delete_cart,
  clear_cart,
};
