import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { v2 } from "cloudinary";
import { v4 as uuidv4 } from "uuid";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import excel from "exceljs";
import Book from "../../models/book.js";
import Category from "../../models/bookCategory.js";
import { multipleUpload } from "../uploads/fileUpload.js";
// const config = require("../../config/config.json");
const fs = require("fs");

v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
};
// mongodb

export const saveBook = async (req, res) => {
  const token = req.headers["authorization"].split(" ")[1];
  jwt.verify(token, process.env.JWT_KEY, async (err, result) => {
    if (err) {
      return res.status(401).json({
        status: false,
        message: "Session expired, please log in",
      });
    } else {
      const payload = req.body;
      if (!payload.images) {
        return res.status(400).json({
          status: false,
          message: "Product image is required",
        });
      } else {
        try {
          const urls = await multipleUpload(payload.images);
          if (urls) {
            const book = new Book({
              id: uuidv4(),
              categoryId: payload.categoryId,
              title: payload.title,
              author: payload.author,
              price: payload.price,
              quantity: payload.quantity,
              image: urls,
            });
            const savedBook = await book.save();
            if (savedBook) {
              return res.status(200).json({
                status: true,
                message: "Book saved successfully",
              });
            } else {
              return res.status(400).json({
                status: false,
                message: "An error occurred, Couldn't save books",
              });
            }
          }
          // await v2.uploader.upload(file.tempFilePath, async (err, response) => {
          //   if (err) throw err;
          //
          // });
        } catch (err) {
          console.log(err);
        }
      }
    }
  });
};

// add books
export const createBooks = async (req, res) => {
  const jwtToken = req.headers["authorization"].split(" ");
  const token = jwtToken[1];
  jwt.verify(token, process.env.JWT_KEY, async (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: true,
        message: "Session expired, please log in",
      });
    }
    const payload = req.body;
    const { id, title, author, price, quantity, categoryId, images } = payload;
    const connection = await mysql.createConnection(config);
    try {
      const urls = await multipleUpload(images);
      if (urls) {
        payload.id = uuidv4();
        payload.available = true;
        payload.createdOn = new Date();
        payload.images = JSON.stringify(urls);
        const [
          rows,
          field,
        ] = await connection.query(
          `INSERT INTO books (id, categoryId, title, author, price, available, quantity, images, createdOn) VALUES (?, ?, ?, ?, ?, ? ,?, ?, ?)`,
          [
            payload.id,
            categoryId,
            title,
            author,
            price,
            payload.available,
            quantity,
            payload.images,
            payload.createdOn,
          ]
        );
        if (rows.affectedRows > 0) {
          return res.status(200).json({
            status: true,
            message: "Book added successfully",
          });
        }
      } else {
        return res.status(400).json({
          status: false,
          message: "An error occurred, try again",
        });
      }
    } catch (e) {
      console.log(e);
    }
  });
  /*  jwt.verify(token, process.env.JWT_KEY, async (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: false,
        message: "Session expired, please log in again",
      });
    } else {
      // console.log(decoded)
      const payload = req.body;
      const { id, title, author, price, quantity, categoryId, images } = payload;
      try {
        if (!payload.id) {
          const file = req.files.image;
          //  let bitmap = fs.readFileSync(file.tempFilePath);
          //  const tmp  = bitmap.toString().replace(/[“”‘’]/g,'');
          //  const base64 = new Buffer(tmp).toString('base64');
          // res.send(base64)
          //  return;
          await v2.uploader.upload(file.tempFilePath, async (err, result) => {
            if (err) throw err;
            if (result) {
              // const newBook = {...payload, id: uuidv4(), image: result.secure_url}
              payload.id = uuidv4();
              payload.image = result.secure_url;
              payload.available = true;
              payload.createdOn = new Date();
              const connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                database: process.env.DB_NAME,
              });
              const [
                rows,
                field,
              ] = await connection.query(
                `INSERT INTO books (id, categoryId, title, author, price, available, quantity, image, createdOn) VALUES (?, ?, ?, ?, ?, ?, ? ,?, ?)`,
                [
                  payload.id,
                  categoryId,
                  title,
                  author,
                  price,
                  payload.available,
                  quantity,
                  payload.image,
                  payload.createdOn,
                ]
              );
              if (rows.affectedRows > 0) {
                res.status(200).json({
                  status: true,
                  message: "Book added successfully",
                });
              } else {
                res.status(400).json({
                  status: false,
                  message: "Failed to add book",
                });
              }
            }
          });
        } else {
          if (req.files !== null) {
            const file = req.files.image;
            await v2.uploader.upload(file.tempFilePath, async (err, result) => {
              if (err) throw err;
              if (result) {
                try {
                  const connection = await mysql.createConnection({
                    host: process.env.DB_HOST,
                  });
                  const [
                    rows,
                    fields,
                  ] = await connection.query(
                    `UPDATE books SET categoryId = ?, title = ?, author = ?, price = ?, quantity = ?, image = ? WHERE id = ?`,
                    [
                      categoryId,
                      title,
                      author,
                      price,
                      quantity,
                      result.secure_url,
                      id,
                    ]
                  );
                  if (rows.affectedRows > 0) {
                    return res.status(200).json({
                      status: true,
                      message: "Book updated successfully",
                    });
                  } else {
                    res.status(400).json({
                      status: false,
                      message: "Book not updated",
                    });
                  }
                } catch (err) {}
              }
            });
          } else {
            try {
              const connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
              });
              const [
                rows,
                fields,
              ] = await connection.query(
                `UPDATE books SET categoryId = ?, title = ?, author = ?, price = ?, quantity = ? WHERE id = ?`,
                [categoryId, title, author, price, quantity, id]
              );
              if (rows.affectedRows > 0) {
                return res.status(200).json({
                  status: true,
                  message: "Book updated successfully",
                });
              } else {
                res.status(400).json({
                  status: false,
                  message: "Book not updated",
                });
              }
            } catch (err) {
              console.log(err.message);
            }
          }
        }
      } catch (err) {
        console.log(err.message);
      }
    }
  }); */
};

//get books

// mongo db
export const getSavedBooks = async (req, res) => {
  const token = req.headers["authorization"].split(" ")[1];
  jwt.verify(token, process.env.JWT_KEY, async (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized, please log in",
      });
    } else {
      const books = await Book.aggregate([
        {
          $graphLookup: {
            from: "categories",
            startWith: "$categoryId",
            connectFromField: "categoryName",
            connectToField: "categoryId",
            maxDepth: 2,
            depthField: "numConnections",
            as: "category",
          },
        },
      ]);
      res.send(books);
    }
  });
};
export const getBooks = async (req, res) => {
  console.log(req.query)
  const token = req.headers["authorization"].split(" ")[1];
  jwt.verify(token, process.env.JWT_KEY, async (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: false,
        message: "Session expired, please log in",
      });
    } else {
      try {
        const connection = await mysql.createConnection({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          database: process.env.DB_NAME,
        });
        let numRows;
        let numPerPage = 4;
        let page = parseInt(req.query.page) || 1;
        let numPages;
        let skip = (page-1) * numPerPage;
        let limit = skip + ',' + numPerPage;
        const [count] = await connection.query(`select count(a.id) as numRows from books a inner join bookcategories b on a.categoryId = b.categoryId where a.deleted=0`);
        numRows = count[0].numRows;
        numPages = Math.ceil(numRows / numPerPage);
        console.log('number of pages:', numPages, {numRows, skip, limit});
        const [rows, fields] = await connection.query(
          `SELECT a.id, a.categoryId, b.categoryName, a.title, a.author, a.price, a.available, a.quantity, a.images AS imageUrl, a.createdOn FROM books a INNER JOIN bookcategories b ON a.categoryId = b.categoryId WHERE a.deleted = 0 LIMIT ` + limit
        );
        console.log(rows.length)
        if (rows.length > 0) {
          rows.map((item) => {
            if (item.available === 0) {
              item.available = false;
            }
            if (item.available === 1) {
              item.available = true;
            }
            item.imageUrl = JSON.parse(item.imageUrl);
          });
          let responsePayload = {
            results: rows
          };
          if (page < numPages) {
            responsePayload.pagination = {
              current: page,
              perPage: numPerPage,
              previousPage: page > 0 ? page - 1 : undefined,
              nextPage: page < numPages - 1 ? page + 1 : undefined,
              numberOfItems: rows.length,
              next: true,
            }
          }
          else responsePayload.pagination = {
            current: page,
            perPage: numPerPage,
            previousPage: page > 0 ? page - 1 : undefined,
            numberOfItems: rows.length,
            next: false,
          }
          return res.status(200).json({
            status: true,
           responsePayload
          });
        } else {
            return res.status(200).json({
            status: true,
            result: [],
          });
        }
      } catch (err) {
        console.log(err);
      }
    }
  });
};

export const exportBooks = async (req, res) => {
  const token = req.headers["authorization"].split(" ")[1];
  jwt.verify(token, process.env.JWT_KEY, async (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: false,
        message: "Session expired, please log in again",
      });
    }
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
      });
      const [rows, fields] = await connection.query(
        `SELECT  b.categoryName, a.title, a.author, a.price, a.quantity FROM books a INNER JOIN bookcategories b ON a.categoryId = b.categoryId WHERE a.deleted = 0`
      );
      const jsonBooks = JSON.parse(JSON.stringify(rows));
      let workbook = new excel.Workbook();
      let workSheet = workbook.addWorksheet("Books");
      workSheet.columns = [
        { header: "Category", key: "categoryId", width: 10 },
        { header: "Title", key: "title", width: 10 },
        { header: "Author", key: "author", width: 10 },
        { header: "Price", key: "price", width: 10 },
        { header: "Quantity", key: "quantity", width: 10 },
      ];
      workSheet.addRow(jsonBooks);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "books.xlsx"
      );
      return workbook.xlsx.write(res).then(() => {
        res.status(200).end();
      });
    } catch (err) {
      console.log(err);
    }
  });
};
export const deleteBook = async (req, res) => {
  const payload = req.body;
  const { itemId } = payload;
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
    });
    for (let i = 0; i <= itemId.length; i++) {
      console.log(itemId.length);
      const [
        rows,
        fields,
      ] = await connection.query(`UPDATE books SET deleted = 1 WHERE id = ?`, [
        itemId[i],
      ]);
      if (rows.affectedRows > 0) {
        return res.send("hi");
      } else {
        return res.send("nay");
      }
    }
  } catch (err) {
    console.log(err.message);
  }
};

// mongodb
export const saveCategory = async (req, res) => {
  const token = req.headers["authorization"].split(" ")[1];
  const { categoryName } = req.body;
  jwt.verify(token, process.env.JWT_KEY, async (err, result) => {
    if (err) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized, please log in",
      });
    } else {
      try {
        if (!categoryName) {
          return res.status(400).json({
            message: "Category name is requires",
          });
        }
        const category = await Category.findOne({ categoryName: categoryName });
        if (category) {
          return res.status(400).json({
            status: false,
            message: "Category exists",
          });
        } else {
          const newCategory = new Category({
            categoryId: uuidv4(),
            categoryName: categoryName.toLowerCase(),
          });
          const result = await newCategory.save();
          if (result) {
            return res.status(200).json({
              status: true,
              message: "Category added successfully",
            });
          } else {
            return res.status(200).json({
              status: false,
              message: "Failed to add category",
            });
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
  });
};
export const getCategories = async (req, res) => {
  const token = req.headers["authorization"].split(" ")[1];
  jwt.verify(token, process.env.JWT_KEY, async (err, result) => {
    if (err) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized, please log in",
      });
    } else {
      try {
        const categories = await Category.find(
          {},
          { categoryId: 1, categoryName: 1, _id: 0 }
        );
        if (categories) {
          return res.status(200).json({
            status: true,
            result: categories,
          });
        } else {
          return res.status(200).json({
            status: true,
            result: [],
          });
        }
      } catch (err) {}
    }
  });
};
// mysql
export const addCategory = async (req, res) => {
  const token = req.headers["authorization"].split(" ")[1];
  jwt.verify(token, process.env.JWT_KEY, async (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: false,
        message: "Session expired, please log in",
      });
    } else {
      const payload = req.body;
      try {
        if (!payload.categoryId) {
          payload.createdOn = new Date();
          const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
          });
          const [
            rows,
            field,
          ] = await connection.query(
            `INSERT INTO bookcategories (categoryName, createdOn) VALUES (?, ?)`,
            [payload.categoryName, payload.createdOn]
          );
          if (rows.affectedRows > 0) {
            return res.status(200).json({
              status: true,
              message: "Category added successfully",
            });
          } else {
            return res.status(400).json({
              status: false,
              message: "Unable to add category",
            });
          }
        } else {
          const [
            rows,
            fields,
          ] = await connection.query(
            `UPDATE bookcategories SET name = ? WHERE categoryId = ?`,
            [payload.name, payload.categoryId]
          );
          if (rows.affectedRows > 0) {
            return res.status(200).json({
              status: true,
              message: "Category updated successfully",
            });
          } else {
            return res.status(400).json({
              status: false,
              message: "Unable to update category",
            });
          }
        }
      } catch (err) {
        console.log(err.message);
      }
    }
  });
};

export const getCategory = async (req, res) => {
  const token = req.headers["authorization"].split(" ")[1];
  jwt.verify(token, process.env.JWT_KEY, async (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: false,
        message: "Session expired, please log in",
      });
    } else {
      try {
        const connection = await mysql.createConnection({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          database: process.env.DB_NAME,
        });
        const [rows, fields] = await connection.query(
          `SELECT * FROM bookcategories`
        );
        if (rows.length > 0) {
          return res.status(200).json({
            status: true,
            result: rows,
          });
        } else {
          return res.status(200).json({
            status: true,
            result: [],
          });
        }
      } catch (err) {
        console.log(err.message);
      }
    }
  });
};
