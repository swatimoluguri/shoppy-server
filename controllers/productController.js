const { getProductsModel, getCategoryModel } = require("../db");
const { ObjectId } = require("mongodb");

const products_get = (req, res) => {
  console.log('here');
  let products = [];
  const productModel = getProductsModel();
  productModel
    .find()
    .forEach((product) => products.push(product))
    .then(() => {
      res.json(products);
    })
    .catch(() => {
      res.status(500).json({ error: "Could not fetch products" });
    });
};

const category_products= async (req, res) => {
  const category = req.params.id;
  const categoryModel = getCategoryModel();
  const productModel = getProductsModel();
  categoryModel
    .findOne({ name: category })
    .then((result) => {
      if (result) {
        const response = result.title;
        if (!["all", "high"].includes(response)) {
          return productModel.find({ category: response }).toArray();
        } else {
          if (response === "all") {
            return productModel.find().toArray();
          }
          if (response === "high") {
            return productModel.find({ "rating.rate": { $gt: 4 } }).toArray();
          }
        }
      } else {
        throw new Error("Category not found");
      }
    })
    .then((products) => {
      res.status(200).json(products);
    })
    .catch((error) => {
      res.status(500).json({ error: "Could not fetch categories" });
    });
};

const product_details= (req, res) => {
  const prodId = new ObjectId(req.params.id);
  const categoryModel = getCategoryModel();
  const productModel = getProductsModel();
  productModel
    .findOne({ _id: prodId })
    .then((result) => {
      productModel
        .find({ category: result.category, _id: { $ne: prodId } })
        .toArray()
        .then((relProds) => {
          categoryModel
            .find({ title: result.category })
            .toArray()
            .then((cat) => {
              result.category = cat[0].name;
              result.relProds = relProds;
              res.json(result);
            });
        });
    })
    .catch(() => {
      res.status(500).json({ error: "Could not fetch products" });
    });
};

module.exports = {
  products_get,
  category_products,
  product_details
};
