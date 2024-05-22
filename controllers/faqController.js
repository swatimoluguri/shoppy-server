const { getFaqsModel } = require("../db");

const get_faqs = (req, res) => {
  let faqs = [];
  const faqsModel = getFaqsModel();
  faqsModel
    .find()
    .forEach((ques) => faqs.push(ques))
    .then(() => res.json(faqs))
    .catch(() => {
      res.status(500).json({ error: "Could not fetch faqs" });
    });
};

module.exports = {
  get_faqs,
};
