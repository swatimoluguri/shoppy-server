const { MongoClient } = require("mongodb");
require("dotenv").config();
const { DB_URI } = process.env;

let dbConnection;

module.exports = {
  connectToDb: async () => {
    try {
      const client = new MongoClient(DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await client.connect();
      console.log("MongoDB connected successfully");
      dbConnection = client.db("e-commerce");
      return dbConnection;
    } catch (err) {
      console.error("MongoDB connection error:", err);
      throw err;
    }
  },
  startServer: async (app, port) => {
    try {
      if (!dbConnection) {
        throw new Error('Database connection has not been established.');
      }

      await app.listen(port);
      console.log(`App listening on port ${port}`);
    } catch (err) {
      console.error('Error starting server:', err);
      throw err;
    }
  },

  getOrderModel: () => {
    if (!dbConnection) {
      throw new Error('Database connection has not been established.');
    }
    return dbConnection.collection("orders");
  },

  getCategoryModel:()=>{
    if (!dbConnection) {
      throw new Error('Database connection has not been established.');
    }
    return dbConnection.collection("categories");
  },

  getProductsModel:()=>{
    if (!dbConnection) {
      throw new Error('Database connection has not been established.');
    }
    return dbConnection.collection("products");
  },

  getFaqsModel:()=>{
    if (!dbConnection) {
      throw new Error('Database connection has not been established.');
    }
    return dbConnection.collection("faqs");
  },


  getUserModel: () => {
    if (!dbConnection) {
      throw new Error('Database connection has not been established.');
    }
    return dbConnection.collection("users");
  },

  getCartModel: () => {
    if (!dbConnection) {
      throw new Error('Database connection has not been established.');
    }
    return dbConnection.collection("cart");
  },


  getCustomerEnquiries: () => {
    if (!dbConnection) {
      throw new Error('Database connection has not been established.');
    }
    return dbConnection.collection("customer-enquiries");
  },

  getNewsletter: () => {
    if (!dbConnection) {
      throw new Error('Database connection has not been established.');
    }
    return dbConnection.collection("newsletters");
  },

  getResetPwd: () => {
    if (!dbConnection) {
      throw new Error('Database connection has not been established.');
    }
    return dbConnection.collection("reset-password");
  }
};
