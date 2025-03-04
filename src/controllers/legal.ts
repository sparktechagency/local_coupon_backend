import { Request, Response } from "express";
import { FAQs, Privacy, Terms } from "src/db";

const get_faqs = async (req: Request, res: Response) => {
  const faqs = await FAQs.find({}, { _id: 0, __v: 0 });
  if (!faqs || faqs.length === 0) {
    res.status(404).json({ message: "No FAQs found" });
    return;
  }
  res.json(faqs);
};

const get_terms = async (req: Request, res: Response) => {
  const terms = await Terms.find({}, { _id: 0, __v: 0 });
  if (!terms || terms.length === 0) {
    res.status(404).json({ message: "No Terms found" });
    return;
  }
  res.json(terms);
};

const get_privacy = async (req: Request, res: Response) => {
  const privacy = await Privacy.find({}, { _id: 0, __v: 0 });
  if (!privacy || privacy.length === 0) {
    res.status(404).json({ message: "No Privacy found" });
    return;
  }
  res.json(privacy);
};

const update_faqs = async (req: Request, res: Response) => {
  const faqs = req.body;
  if (!faqs || !Array.isArray(faqs)) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  const is_valid_faq = faqs.every((faq) => {
    return faq.question && faq.answer;
  });

  if (!is_valid_faq) {
    res.status(400).json({ message: "Invalid FAQ Object" });
    return;
  }

  await FAQs.deleteMany({});
  await FAQs.insertMany(faqs);

  res.json({ message: "FAQs updated" });
};

const update_terms = async (req: Request, res: Response) => {
  const terms = req.body;

  if (!terms || !terms.content) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  await Terms.deleteMany({});
  await Terms.create(terms);

  res.json({ message: "Terms updated" });
};

const update_privacy = async (req: Request, res: Response) => {
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
  update_faqs,
  update_terms,
  update_privacy,
};
