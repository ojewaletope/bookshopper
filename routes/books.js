import express from "express";
import {
  createBooks,
  getBooks,
  addCategory,
  getCategory,
  deleteBook,
  exportBooks,
  saveCategory,
  getCategories,
  saveBook,
    getSavedBooks
} from "../controllers/books/bookController.js";

const router = express.Router();

router.get("/getBooks", getBooks);
router.post("/addBook", createBooks);
router.post("/addCategory", saveCategory);
router.get("/categories", getCategories);
router.post("/deleteBook", deleteBook);
router.get("/export", exportBooks);

export default router;
