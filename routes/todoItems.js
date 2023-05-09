const router = require("express").Router();
const todoItemsModel = require("../models/todoItems");
const userModel = require("../models/user");
const permissionModel = require("../models/permissions")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middlewares/authMiddleware");

//add Todo Item to database
router.post("/api/item", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;

    const newItem = new todoItemsModel({
      item: req.body.item,
      users: [userId],
    });
    //save this item in database
    const saveItem = await newItem.save();
    res.status(200).json(saveItem);
  } catch (err) {
    res.json(err);
  }
});

//get all todos from database
router.get("/api/items", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;

    const allTodoItems = await todoItemsModel.find({ users: { $in: [userId] } });

    const authorizedTodoItems = allTodoItems.map((todoItem) => {
      if (!todoItem.users.includes(userId)) {
        todoItem.users.push(userId);
        todoItem.save();
      }
      return todoItem;
    });

    res.status(200).json(authorizedTodoItems);
  } catch (err) {
    res.json(err);
  }
});

//update todo item
router.put("/api/item/:id", async (req, res) => {
  try {
    //find the item by its id and update it
    const updateItem = await todoItemsModel.findByIdAndUpdate(req.params.id, {
      $set: req.body,
    });
    res.status(200).json(updateItem);
  } catch (err) {
    res.json(err);
  }
});

//Delete todo item from database
router.delete("/api/item/:id", async (req, res) => {
  try {
    //find the item by its id and delete it
    const deleteItem = await todoItemsModel.findByIdAndDelete(req.params.id);
    res.status(200).json("Item Deleted");
  } catch (err) {
    res.json(err);
  }
});

//signup user
router.post("/api/signup", async (req, res) => {
  try {
    const { userName, familyName, email, password, sex, color, age } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = new userModel({
      userName,
      familyName,
      email,
      password,
      sex,
      color,
      age,
    });
    await user.save();

    //gerar token de autenticação
    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.SECRET_JWT
    );

    res.status(201).json({ token, userId: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//Get all Users
router.get("/api/users", async (req, res) => {
  try {
    const users = await userModel.find().select("-_id -password").lean();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


//login user
router.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate user
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "E-mail e senha são obrigatórios" });
    }

    // Find user in database
    const user = await userModel.findOne({ email });

    // Verify if user exists
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Verify password and user
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Senha incorreta" });
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id,
        userName: user.userName,
        familyName: user.familyName,
        color: user.color,
      },
      process.env.SECRET_JWT,
      { expiresIn: 86400 * 30 }
    );

    // Send token to the client
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Logout user - i'm not using this route, instead i'm using this same function on the frontend
router.post("/api/logout", (req, res) => {
  localStorage.removeItem("jwt");
  res.status(200).json({ message: "Logout successful" });
});

//permission route
router.post("/api/items/authorize-all", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const { targetUserId } = req.body;

    const result = await todoItemsModel.updateMany(
      { users: userId },
      { $addToSet: { users: targetUserId } }
    );

    const authorizedTodoItems = await todoItemsModel.find({ users: targetUserId });

    res.status(200).json(authorizedTodoItems);
  } catch (err) {
    res.json(err);
  }
});

//user permissions
router.post("/api/authorizations", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;

    // Verifica se o permissionTo é um id de usuário válido
    const permissionToUser = await userModel.findById(req.body.permissionTo);
    if (!permissionToUser) {
      return res.status(400).json({ message: "Invalid permissionTo user ID" });
    }

    const newPermission = new permissionModel({
      nameTo: req.body.nameTo,
      permissionTo: req.body.permissionTo,
      permissionFrom: userId,
    });
    //save this item in database
    const savePermission = await newPermission.save();
    res.status(200).json(savePermission);
  } catch (err) {
    res.json(err);
  }
});

//get all users permissions
router.get("/api/all-authorizations", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const authorizations = await permissionModel.find({ userId: userId });
    res.status(200).json(authorizations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Delete permission
router.delete("/api/permission/:id", async (req, res) => {
  try {
    //find the item by its id and delete it
    const deleteItem = await permissionModel.findByIdAndDelete(req.params.id);
    res.status(200).json("Item Deleted");
  } catch (err) {
    res.json(err);
  }
});



//export router
module.exports = router;
