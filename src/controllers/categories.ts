import uploadService from "@services/uploadService";
import validateRequiredFields from "@utils/validateFields";
import { Request, Response } from "express";
import { Categories, Coupon } from "@db";
import createResponseHandler from "@utils/response_handler";
import { isObjectIdOrHexString } from "mongoose";

const get_categories = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  const { popular, lang } = req.query;

  if (popular) {
    try {
      const categories = await Coupon.find(
        { add_to_carousel: true },
        { __v: 0 }
      );
      res.json({
        message: "Popular Categories fetched successfully",
        data: categories,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  try {
    const categoriesFromDB = await Categories.find({}, { __v: 0 });

    const categories = categoriesFromDB.map((category) => {
      const translation = category.translations.find(
        (t: any) => t.language_code === lang
      )?.name;

      return {
        id: category._id,
        name: translation || category.name,
        icon_url: category.icon_url,
      };
    });

    res.json({
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const get_all_categories = async (req: Request, response: Response) => {
  const res = createResponseHandler(response);
  try {
    const categories = await Categories.find({}, { __v: 0 });
    res.json({
      message: "Categories fetched successfully",
      data: categories.map((category) => ({
        ...category.toObject(),
        id: category._id,
      })),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const add_category = async (req: Request, res: Response) => {
  const { name, translations: rawTranslations } = req.body || {};
  const file = req.file;

  let translations = [];

  try {
    translations = JSON.parse(rawTranslations || "[]");
  } catch (err) {
    res.status(400).json({ message: "Invalid JSON format for translations" });
    return;
  }

  const error = validateRequiredFields({ name, file, translations });
  if (error) {
    res.status(400).json({ message: error });
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
      await Categories.create({ name, icon_url, translations });
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

const update_category = async (req: Request, res: Response) => {
  const { id, name, translations } = req.body || {};
  const file = req.file;

  const error = validateRequiredFields({ id });
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  // if (file?.originalname?.split(".")[1] !== "svg") {
  //   res.status(400).json({ message: "Icon should be .svg format" });
  //   return;
  // }

  try {
    JSON.parse(translations || []);
  } catch (err) {
    res.status(400).json({ message: "Invalid JSON format for translations" });
    return;
  }

  const category = await Categories.findOne({ _id: id });

  if (!category) {
    res.status(400).json({ message: "Category doesn't exist" });
    return;
  }

  try {
    const icon_url = await uploadService(file, "image");

    try {
      await category.updateOne({
        ...(name && { name }),
        ...(icon_url && { icon_url }),
        ...(translations && { translations: JSON.parse(translations) }),
      });
      res.status(200).json({ message: "Category updated successfully" });
      return;
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

const delete_category = async (req: Request, res: Response) => {
  const { id } = req.query || {};

  if (!id && !isObjectIdOrHexString(id)) {
    res.status(400).json({ message: "Invalid category id" });
    return;
  }

  const category = await Categories.findById(id);

  if (!category) {
    res.status(400).json({ message: "Category doesn't exist" });
    return;
  }

  try {
    await category?.deleteOne();
    res.json({ message: `Category ${category?.name} deleted` });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const get_popular_categories = async (req: Request, res: Response) => {
  try {
    const popularCategories = await Coupon.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category_info",
        },
      },
      {
        $unwind: "$category_info",
      },
      {
        $group: {
          _id: "$category_info._id",
          categoryName: { $first: "$category_info.name" },
          icon_url: { $first: "$category_info.icon_url" },
          downloadCount: { $sum: "$downloadCount" },
          shareCount: { $sum: "$shareCount" },
        },
      },
      {
        $sort: {
          downloadCount: -1,
          shareCount: -1,
        },
      },
      {
        $limit: 8,
      },
    ]);

    res.status(200).json({ popularCategories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch popular categories" });
  }
};

export {
  get_categories,
  get_all_categories,
  add_category,
  update_category,
  delete_category,
  get_popular_categories,
};
