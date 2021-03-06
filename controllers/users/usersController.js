import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { v2 } from "cloudinary";
import { v4 as uuidv4 } from "uuid";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import {singleUpload, multipleUpload} from "../uploads/fileUpload.js";
// import {multipleUpload} from "../uploads/fileUpload";

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
};

v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
export const register = async (req, res) => {
  const payload = req.body;
  // const file = req.files.image;
  try {
    User.findOne({
      $or: [{ email: payload.email }, { username: payload.username }],
    }).then( async (user) => {
      if (user) {
        let errors = {};
        if (user.username === payload.username) {
          errors.error = "Username already exists";
        } else {
          errors.error = "Email already exists";
        }
        return res.status(400).json(errors);
      } else {
        if (payload.image) {
          const result = await singleUpload(payload.image, 'users');
          if (result) {
           await bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(payload.password, salt, (err, hash) => {
                if (err) throw err;
                payload.password = hash;
                const user = new User({
                  id: uuidv4(),
                  name: payload.name,
                  email: payload.email,
                  username: payload.username,
                  password: payload.password,
                  photo: result.secure_url,
                });
                user
                    .save()
                    .then((result) => {
                      if (result) {
                        res.status(200).json({
                          status: true,
                          message: "Registration successful",
                        });
                      }
                    })
                    .catch((err) => {
                      console.log(err);
                      return res.status(400).json({
                        status: true,
                        message: "Registration failed",
                        result: err,
                      });
                    });
              });
            });
          }
          // v2.uploader.upload(file.tempFilePath, (err, result) => {
          //   if (err) console.log(err);
          //   if (result) {
          //
          //   }
          // });
        }
      }
    });
  } catch (err) {
    console.log(err);
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ email: username }, { username: username }],
    });
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const payload = {
          userId: user.id,
        };
        jwt.sign(
          payload,
          process.env.JWT_KEY,
          { expiresIn: "2h" },
          (err, token) => {
            return res.status(200).json({
              status: true,
              token,
            });
          }
        );
      } else {
        return res.status(400).json({
          status: false,
          message: "Password is incorrect",
        });
      }
    } else {
      return res.status(400).json({
        status: false,
        message: "User does not exist",
      });
    }
  } catch (err) {}
};

export const createUser = async (req, res) => {
  // return;
  const payload = req.body;
  if (!payload.name) {
    return res.status(400).json({
      status: false,
      message: "Name is required",
    });
  }
  if (!payload.email) {
    return res.status(400).json({
      status: false,
      message: "Email is required",
    });
  }
  if (!payload.phoneNumber) {
    return res.status(400).json({
      status: false,
      message: "Phone Number is required",
    });
  }
  if (!payload.username) {
    return res.status(400).json({
      status: false,
      message: "Username is required",
    });
  }
  if (!payload.password) {
    return res.status(400).json({
      status: false,
      message: "Password is required",
    });
  }
  if (!payload.id) {
    const file = req.files.image;
    // console.log(file);
    // return;
    await v2.uploader.upload(
      file.tempFilePath,
      { public_id: file.name.split(".")[0] },
      async (err, result) => {
        if (result) {
          const user = {
            ...payload,
            id: uuidv4(),
            image_url: result.secure_url,
          };
          try {
            const connection = await mysql.createConnection(config);
            const [
              rows,
              fields,
            ] = await connection.query(
              `SELECT * FROM users WHERE email = ? OR username = ?`,
              [payload.email, payload.username]
            );
            if (rows.length > 0) {
              const row = rows[0];
              if (row.email === payload.email) {
                return res.status(400).json({
                  status: false,
                  message: "Email already exists",
                });
              }
              if (row.username === payload.username) {
                return res.status(400).json({
                  status: false,
                  message: "Username already exists",
                });
              }
            } else {
              user.date_joined = new Date();
              await bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(user.password, salt, async (err, hash) => {
                  if (err) throw err;
                  user.password = hash;
                  // const [result, fields,] = await connection.query(
                  //   `INSERT INTO users (id, name, email, phonenumber, username, password, photo, date_joined) VALUES (?, ?, ?, ?, ?, ? , ?, ?)`,
                  //   [
                  //     user.id,
                  //     user.name,
                  //     user.email,
                  //     user.phoneNumber,
                  //     user.username,
                  //     user.password,
                  //     user.image_url,
                  //     user.date_joined,
                  //   ]
                  // );
                  // if (result.affectedRows > 0) {
                  //   return res.status(200).json({
                  //     status: true,
                  //     message: "Registration Successful",
                  //   });
                  // } else {
                  //   return res.status(400).json({
                  //     status: true,
                  //     message: "Registration failed",
                  //   });
                  // }
                });
              });
            }
          } catch (err) {
            console.log(err.message);
          }
        } else {
          return res.send({
            status: false,
            result: "An error occured, try again",
          });
        }
      }
    );
  } else {
    if (req.files !== null) {
      const file = req.files.image;
      // console.log();
      // return;
      await v2.uploader.upload(
        file.tempFilePath,
        { public_id: file.name.split(".")[0] },
        async (err, result) => {
          if (result) {
            try {
              const connection = await mysql.createConnection(config);
              const [
                rows,
                fields,
              ] = await connection.query(
                `UPDATE users SET name = ?, email = ?,phonenumber = ?, username = ?, photo = ? WHERE id = ?`,
                [
                  payload.name,
                  payload.email,
                  payload.phoneNumber,
                  payload.username,
                  result.secure_url,
                  payload.id,
                ]
              );
              if (rows.affectedRows > 0) {
                return res.status(200).json({
                  status: true,
                  message: "User details updated",
                });
              }
            } catch (err) {}
          }
        }
      );
    } else {
      const connection = await mysql.createConnection(config);
      const [
        rows,
        fields,
      ] = await connection.query(
        `UPDATE users SET name = ?, email = ?,phonenumber = ?, username = ? WHERE id = ?`,
        [
          payload.name,
          payload.email,
          payload.phoneNumber,
          payload.username,
          payload.id,
        ]
      );
      if (rows.affectedRows > 0) {
        return res.status(200).json({
          status: true,
          message: "User details updated",
        });
      }
    }
  }
};
export const userLogin = async (req, res) => {
  // console.log(req.body);
  // return
  const { username, password } = req.body;
  try {
    await User.find()
      .exec()
      .then((user) => {
        console.log(user);
      })
      .catch((err) => {
        console.log(err);
      });
    const connection = await mysql.createConnection(config);
    const [
      rows,
      fields,
    ] = await connection.query(
      `SELECT * FROM users WHERE email = ? OR username = ?`,
      [username, username]
    );
    const user = rows[0];
    if (user) {
      bcrypt.compare(password, user.password).then((match) => {
        if (match) {
          const payload = {
            userId: user.id,
          };
          jwt.sign(
            payload,
            process.env.JWT_KEY,
            { expiresIn: "2h" },
            (err, token) => {
              return res.status(200).json({
                status: true,
                token,
              });
            }
          );
        } else {
          return res.status(400).json({
            status: false,
            message: "Password is incorrect",
          });
        }
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "User does not exist",
      });
    }
  } catch (err) {
    console.log(err);
  }
};
