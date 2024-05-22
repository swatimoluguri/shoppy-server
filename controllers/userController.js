const {
  getCartModel,
  getOrderModel,
  getUserModel,
  getResetPwd,
} = require("../db");
const { Recipient, EmailParams, Sender, MailerSend } = require("mailersend");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { now } = require("mongoose");
require("dotenv").config();
const { MAILERSEND_APIKEY, JWT_SECRET } = process.env;

const mailerSend = new MailerSend({
  apiKey: MAILERSEND_APIKEY,
});

function generateOTP() {
  const otp = Math.floor(1000 + Math.random() * 9000);
  return otp.toString();
}

const signup = async (req, res) => {
  const { firstName, lastName, email } = req.body.formData;
  const hashedPassword = await bcrypt.hash(req.body.formData.password, 10);
  req.body.formData.password = hashedPassword;
  const userModel = getUserModel();
  const cartModel = getCartModel();
  const alreadyExisting = await userModel.findOne({ email: email });
  let user;
  if (alreadyExisting) {
    return res.status(400).json({
      message: "User already registered for entered email. Please Sign in",
    });
  } else {
    await userModel
      .insertOne(req.body.formData)
      .then((result) => {
        user = result.insertedId;
        const token = jwt.sign({ userId: user }, JWT_SECRET, {
          expiresIn: "7d",
        });

        req.body.cart.cart.items.forEach(async (item) => {
          await cartModel.insertOne({ userId: user.toString(), item: item });
        });
        const username = firstName + " " + lastName;
        res.status(200).json({ username, token });
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

const signin = async (req, res) => {
  const { email, password } = req.body.formData;
  const userModel = getUserModel();
  const cartModel = getCartModel();
  try {
    const user = await userModel.findOne({ email: email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "No user found for entered email" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid Password" });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    req.body.cart.cart.items.forEach(async (item) => {
      await cartModel.insertOne({ userId: user._id.toString(), item: item });
    });

    const username = user.firstName + " " + user.lastName;
    const cart = await cartModel
      .find({ userId: user._id.toString() })
      .toArray();
    res.status(200).json({ username, cart, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const send_mail = async (req, res) => {
  const email = req.body.email;
  const userModel = getUserModel();
  try {
    const user = await userModel.findOne({ email: email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "No user found for entered email" });
    }
    const sentFrom = new Sender(
      "swati@trial-0p7kx4x8kn2g9yjr.mlsender.net",
      "Shoppy"
    );
    const recipients = [new Recipient(email)];
    const otp = generateOTP();
    const resetOTP = getResetPwd();
    try {
      await resetOTP
        .insertOne({ email: email, otp: otp, time: now(), status: 0 })
        .then(async () => {
          const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setReplyTo(sentFrom)
            .setSubject("Password recovery for Shoppy")
            .setHtml(
              "<strong>Please use " +
                otp +
                " to reset your password.</strong><br><br><i>Keep Shopping with Shoppy :)</i>"
            );

          await mailerSend.email
            .send(emailParams)
            .then(() => {
              res.status(200).json({ redirect: "/otp-verify" });
            })
            .catch((error) => {
              return res.status(400).json({
                message: "Failed to send email. Please try again in some time.",
              });
            });
        });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const verify_otp = async (req, res) => {
  const { otp, email } = req.body;
  const userModel = getUserModel();
  try {
    const user = await userModel.findOne({ email: email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "No user found for entered email" });
    }
    const otpModel = getResetPwd();
    const otpRecord = await otpModel.findOne(
      { email: email },
      { sort: { time: -1 } }
    );
    if (otpRecord) {
      if (!(otp === otpRecord.otp)) {
        return res.status(400).json({ message: "Invalid OTP entered" });
      }
      if (otp === otpRecord.otp && otpRecord.status === 1) {
        return res.status(400).json({ message: "Entered OTP has expired." });
      }
      if (otp === otpRecord.otp && otpRecord.status === 0) {
        await otpModel.findOneAndUpdate(
          { email: email },
          { $set: { status: 1 } },
          { sort: { time: -1 } }
        );
        res.status(200).json({ redirect: "/", email });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const change_password = async (req, res) => {
  const { newPassword, email } = req.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const userModel = getUserModel();
  try {
    const user = await userModel.findOne({ email: email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "No user found for entered email" });
    } else {
      await userModel
        .findOneAndUpdate(
          { email: email },
          { $set: { password: hashedPassword } }
        )
        .then(() => {
          res.status(200).json({ redirect: "/signin" });
        });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const account_details = async (req, res) => {
  const userId = new ObjectId(req.userId);
  const userModel = getUserModel();
  const orderModel = getOrderModel();
  let user = {};

  try {
    const userResponse = await userModel.findOne({ _id: userId });
    if (!userResponse) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = userResponse.firstName + " " + userResponse.lastName;
    user.email = userResponse.email;

    const orders = await orderModel
      .find({ userId: userId.toString(), razorpay_payment_id: { $ne: null } })
      .toArray();
    user.orders = orders;

    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  signup,
  signin,
  send_mail,
  verify_otp,
  change_password,
  account_details,
};
