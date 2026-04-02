const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// 📁 serve images
app.use("/uploads", express.static("uploads"));

const SECRET = "youssef_secret";

// ================= ADMIN =================
const admin = {
  username: "admin",
  password: bcrypt.hashSync("1234", 10)
};

// 🔐 LOGIN
app.post("/login", (req,res)=>{
  const {username, password} = req.body;

  if(username !== admin.username){
    return res.status(401).json({error:"Invalid"});
  }

  const valid = bcrypt.compareSync(password, admin.password);

  if(!valid){
    return res.status(401).json({error:"Invalid"});
  }

  const token = jwt.sign({user:username}, SECRET);

  res.json({token});
});

// 🔒 AUTH
function auth(req,res,next){
  const header = req.headers.authorization;

  if(!header){
    return res.status(403).json({error:"No token"});
  }

  const token = header.split(" ")[1];

  try{
    jwt.verify(token, SECRET);
    next();
  }catch{
    res.status(401).json({error:"Invalid token"});
  }
}

// ================= MULTER =================
const storage = multer.diskStorage({
  destination: (req,file,cb)=>{
    cb(null,"uploads/");
  },
  filename: (req,file,cb)=>{
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({storage});

// ================= PRODUCTS =================
let products = [
  {
    id:1,
    name:"Dell Laptop",
    price:25000,
    category:"laptop",
    description:"Core i7 - 16GB RAM",
    image:"https://images.unsplash.com/photo-1517336714731-489689fd1ca8"
  }
];

// GET
app.get("/products", (req,res)=>{
  res.json(products);
});

// ADD PRODUCT (🔥 صورة + حماية)
app.post("/products", auth, upload.single("image"), (req,res)=>{

  const newProduct = {
    id: Date.now(),
    name: req.body.name,
    price: Number(req.body.price),
    category: req.body.category,
    description: req.body.description,
    image: req.file 
      ? "http://localhost:3000/uploads/" + req.file.filename
      : ""
  };

  products.push(newProduct);

  console.log("✅ Product Added:", newProduct);

  res.json({message:"added", product:newProduct});
});

// DELETE
app.delete("/products/:id", auth, (req,res)=>{
  const id = Number(req.params.id);
  products = products.filter(p=>p.id !== id);
  res.json({message:"deleted"});
});

// ================= ORDERS =================
let orders = [];

app.post("/orders", (req,res)=>{
  const order = {
    id: Date.now(),
    ...req.body
  };

  orders.push(order);

  console.log("📦 New Order:", order);

  res.json({message:"Order saved"});
});

// GET ORDERS
app.get("/orders", auth, (req,res)=>{
  res.json(orders);
});

// ================= START =================
app.listen(3000, ()=> console.log("🚀 Server running on http://localhost:3000"));