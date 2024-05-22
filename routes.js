const express = require("express");
const jwt = require("jsonwebtoken");
const productController = require("./controllers/productController");
const userController = require("./controllers/userController");
const cartController = require("./controllers/cartController");
const faqController = require("./controllers/faqController");
const newsletterController = require("./controllers/newsletterController");
const router = express.Router();
require("dotenv").config();
const { JWT_SECRET } = process.env;

//middleware
const verifyToken = (req, res, next) => {
  const token = req.body.token;
  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(500).json({ message: "Failed to authenticate token" });
    }
    req.userId = decoded.userId;
    next();
  });
};

//product
router.get("/products", productController.products_get);
router.get("/category/:id", productController.category_products);
router.get("/products/:id", productController.product_details);

//user
router.post("/sign-up", userController.signup);
router.post("/sign-in", userController.signin);
router.post("/send-mail", userController.send_mail);
router.post("/verify-otp", userController.verify_otp);
router.post("/change-password", userController.change_password);
router.post("/account-details", verifyToken, userController.account_details);

//cart
router.post("/checkout", verifyToken, cartController.checkout);
router.post(
  "/checkout/payment-verification",
  cartController.payment_verification
);
router.post("/order-details", cartController.order_details);
router.post("/add-cart", verifyToken, cartController.add_cart);
router.post("/reduce-cart", verifyToken, cartController.reduce_cart);
router.post("/increase-cart", verifyToken, cartController.increase_cart);
router.post("/delete-cart", verifyToken, cartController.delete_cart);
router.post("/clear-cart", verifyToken, cartController.clear_cart);

//faqs
router.get("/faqs", faqController.get_faqs);

//newsletter
router.post("/newsletter", newsletterController.newsletter);

//contact us
router.post("/contact-us", newsletterController.contact_us);

module.exports=router;
