const express = require('express');
const router = express.Router();
const Product = require('../models/products');
const multer = require('multer');
const products = require('../models/products');
const fs = require('fs');


const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
    },
});

const upload = multer({ storage }).single('image');

//insert an user into database route
router.post('/add', upload, async (req, res) => {
    try {
        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            image: req.file.filename,
        });
        await product.save();
        req.session.message = {
            type: 'success',
            message: 'User added successfully!',
        };
        res.redirect('/');
    } catch (error) {
        res.json({ message: error.message, type: 'danger' });
    }
});

router.get("/", (req,res) =>{
    Product.find().exec()
    .then(products => {
        res.render('index', {
            title: "Home Page",
            products: products,
        })
    })
    .catch(err => {
        res.json({ message: err.message });
    });
})

router.get('/add', (req, res) => {
    res.render('add_products', { title: 'Add Product' });
});

//edit an user route
router.get("/edit/:id", (req, res) => {
    let id = req.params.id;
    Product.findById(id).exec()
        .then(product => {
            if (product == null) {
                res.redirect("/");
            } else {
                res.render("edit_products", {
                    title: "Edit Product",
                    product: product,
                })
            }
        })
        .catch(err => {
            res.redirect("/");
        });
})

//update user
router.post("/update/:id", upload, (req, res) => {
    let id = req.params.id;
    let new_image = "";
    if (req.file) {
        new_image = req.file.filename;
        try {
            fs.unlinkSync("./uploads/" + req.body.old_image);
        } catch (err) {
            console.log(err);
        }
    } else {
        new_image = req.body.old_image;
    }

    Product.findByIdAndUpdate(id, {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        image: new_image,
    }).exec()
        .then(result => {
            req.session.message = {
                type: 'success',
                message: "User updated successfully!",
            };
            res.redirect("/");
        })
        .catch(err => {
            res.json({ message: err.message, type: 'danger' });
        });
});

//delete user
router.get("/delete/:id", (req, res) => {
    let id = req.params.id;
    Product.findByIdAndRemove(id).exec()
        .then(result => {
            if (result.image != "") {
                try {
                    fs.unlinkSync("./uploads" + result.image);
                } catch (err) {
                    console.log(err);
                }
            }
            req.session.message = {
                type: "info",
                message: "User deleted successfully!",
            };
            res.redirect("/");
        })
        .catch(err => {
            res.json({ message: err.message });
        });
});

module.exports = router;