const { getCustomerEnquiries, getNewsletter } = require("../db");

const newsletter = async (req, res) => {
  try {
    const newsletterModel = getNewsletter();
    await newsletterModel.insertOne(req.body).then((result) => {
      res.status(200).json({ success: result.insertedId });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const contact_us = async (req, res) => {
  try {
    const enquiryModel = getCustomerEnquiries();
    await enquiryModel.insertOne(req.body.formData).then((result) => {
      res.status(200).json({ success: result.insertedId });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  newsletter,
  contact_us,
};
