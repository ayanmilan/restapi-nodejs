const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const checkAuth = require('../middleware/check-auth');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, './uploads/')
	},
	filename: (req, file, cb) => {
		cb(null, new Date().toISOString()+ file.originalname);
	}
});
const fileFilter = (req, file, cb) => {
	if(file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') cb(null, true);
	else cb(null, false);
};
const upload = multer({storage: storage, fileFilter: fileFilter});

const Product = require('../models/product');

router.get('/', (req, res, next) => {
	Product.find()
		.select('_id name price productImage')
		.exec()
		.then(docs => {
			const response = {
				count: docs.length,
				products: docs.map(doc => {
					return{
						name: doc.name,
						price: doc.price,
						_id: doc._id,
						productImage: doc.productImage,
						request: {
							type: 'GET',
							url: 'http://localhost:3000/products/' + doc._id
						}
					};
				})
			};
			res.status(200).json(response);
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({error: err});
		});
});

router.post('/', checkAuth, upload.single('productImage'), (req, res, next) => {
	const product = new Product({
		_id: new mongoose.Types.ObjectId(),
		name: req.body.name,
		price: req.body.price,
		productImage: req.file.path
	});
	product
		.save()
		.then(result => {
			res.status(201).json({
				message: 'Created product successfully',
				createdProduct: {
					name: result.name,
					price: result.price,
					_id: result._id,
					productImage: result.productImage,
					request: {
						type: 'GET',
						url: 'http://localhost:3000/products/' + result._id
					}	
				}
			});
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({error: err});
		});	
});

router.get('/:productId', (req, res, next) => {
	const id = req.params.productId;
	Product.findById(id)
		.select('-__v')
		.exec()
		.then( doc => {
			if(doc) {
				res.status(200).json(doc);
			}
			else {
				res.status(404).json({message: 'Not found'});
			}	
		})
		.catch(err =>{
			console.log(err);
			res.status(500).json({error: err});
		});
});

router.patch('/:productId', checkAuth, (req, res, next) => {
	const id = req.params.productId;
	const updateOps = {};
	for (const ops of req.body) {
		updateOps[ops.propName] = ops.value;
	}
	Product.update({_id: id}, {$set: updateOps})
	.exec()
	.then(result => {
		res.status(200).json({
			message: 'Product updated',
			request: {
				type: 'GET',
				url: 'http://localhost:3000/products/' + id
			}
		});
	})
	.catch(err =>{
		console.log(err);
		res.status(500).json({error: err});
	});
});

router.delete('/:productId', checkAuth, (req, res, next) => {
	const id = req.params.productId;
	Product.remove({_id: id})
	.exec()
	.then(result => {
		res.status(200).json({message: 'Product deleted'});
	})
	.catch(err =>{
		console.log(err);
		res.status(500).json({error: err});
	});
});

module.exports = router;