import { Request, Response } from "express";
import { FAQs, Privacy, Terms } from "@db";
import createResponseHandler from "@utils/response_handler";

const get_faqs = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  const faqs = await FAQs.find({}, { __v: 0 });
  if (!faqs || faqs.length === 0) {
    res.json({ message: "No FAQs found" });
    return;
  }
  res.json({ data: faqs, message: "FAQs fetched successfully" });
};

const get_terms = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  const terms = await Terms.find({}, { _id: 0, __v: 0 });
  if (!terms || terms.length === 0) {
    res.json({ message: "No Terms found" });
    return;
  }
  res.json({
    data: terms,
    message: "Terms fetched successfully",
  });
};

const get_privacy = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  const privacy = await Privacy.find({}, { _id: 0, __v: 0 });
  if (!privacy || privacy.length === 0) {
    res.json({ message: "No Privacy found" });
    return;
  }
  res.json({
    data: privacy,
    message: "Privacy fetched successfully",
  });
};

// const update_faqs = async (req: Request, response: Response) => {
//   const res = createResponseHandler(response);
//   const faqs = req.body;
//   if (!faqs || !Array.isArray(faqs)) {
//     res.status(400).json({ message: "Invalid request body" });
//     return;
//   }

//   const is_valid_faq = faqs.every((faq) => {
//     return faq.question && faq.answer;
//   });

//   if (!is_valid_faq) {
//     res.status(400).json({ message: "Invalid FAQ Object" });
//     return;
//   }

//   await FAQs.deleteMany({});
//   await FAQs.insertMany(faqs);

//   res.json({ message: "FAQs updated" });
// };

const add_faq = async (req: Request, response: Response) => {
  const { question, answer } = req.body;
  const res = createResponseHandler(response);
  if (!question || !answer) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }
  const faq = await FAQs.create({
    question,
    answer,
  });
  if (!faq) {
    res.status(500).json({ message: "Error creating FAQ" });
    return;
  }
  res.json({ message: "FAQ created successfully", data: faq });
};

const delete_faq = async (req: Request, response: Response) => {
  const { id } = req.body;
  const res = createResponseHandler(response);
  if (!id) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }
  const faq = await FAQs.findByIdAndDelete(id);
  if (!faq) {
    res.status(404).json({ message: "FAQ not found" });
    return;
  }
  res.json({ message: "FAQ deleted successfully", data: faq });
};

const update_terms = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  const terms = req.body;

  if (!terms || !terms.content) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  await Terms.deleteMany({});
  await Terms.create(terms);

  res.json({ message: "Terms updated" });
};

const update_privacy = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  const privacy = req.body;

  if (!privacy || !privacy.content) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  await Privacy.deleteMany({});
  await Privacy.create(privacy);

  res.json({ message: "Privacy updated" });
};

export {
  get_faqs,
  get_terms,
  get_privacy,
  add_faq,
  delete_faq,
  update_terms,
  update_privacy,
};
