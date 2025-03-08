import uploadService from "@services/uploadService";
import validateRequiredFields from "@utils/validateFields";
import { Request, Response } from "express";
import { Categories } from "src/db";

const get_categories = async (req: Request, res: Response) => {};

const add_category = async (req: Request, res: Response) => {
  const { name } = req.body || {};
  const file = req.file;

  const error = validateRequiredFields({ name, file });
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  if (file?.originalname?.split(".")[1] !== "svg") {
    res.status(400).json({ message: "Icon should be .svg format" });
    return;
  }

  const category = await Categories.findOne({ name });

  if (category) {
    res.status(400).json({ message: "Category already exists" });
    return;
  }

  try {
    const icon_url = await uploadService(file, "image");

    try {
      await Categories.create({ name, icon_url });
      res.status(200).json({ message: "Category added successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal Server Error. Failed to save to database.",
      });
      return;
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Internal Server Error. Failed to upload icon." });
    return;
  }
};

const update_category = async (req: Request, res: Response) => {};

const delete_category = async (req: Request, res: Response) => {};

export { get_categories, add_category, update_category, delete_category };
