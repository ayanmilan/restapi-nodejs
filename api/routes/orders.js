const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const checkAuth = require('../middleware/check-auth');

const Order = require('../models/order');
const Product = require('../models/product');

router.get('/', checkAuth, (req, res, next) => {
	Order.find()
		.select('-__v')
		.populate('product', 'name')
		.exec()
		.then(docs => {
			res.status(200).json({
				count: docs.length,
				orders: docs.map(doc => {
					return {
						product: doc.product,
						quantity: doc.quantity,
						_id: doc._id,
						request: {
							type: 'GET',
							url: 'http://localhost:3000/orders/' + doc._id
						}
					};
				})
			});
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({error: err});
		})
});

router.post('/', checkAuth, (req, res, next) => {
	Product.findById(req.body.productId)
		.then(product => {
			if (!product) return res.status(404).json({message: 'Product not found'});
			const order = new Order({
			_id: mongoose.Types.ObjectId(),
			quantity: req.body.quantity,
			product: req.body.productId
			});
			return order.save();
		})
		.then( result => {
			res.status(201).json({
				message: 'Created order successfully',
				createdOrder: {
					product: result.product,
					quantity: result.quantity,
					_id: result._id,
				},
				request: {
					type: 'GET',
					url: 'http://localhost:3000/orders/' + result._id
				}
			});
		})
		.catch(err =>{
			console.log(err);
			res.status(500).json({error: err});
		});
});

router.get('/:orderId', checkAuth, (req, res, next) => {
	const id = req.params.orderId;
	Order.findById(id)
		.select('-__v')
		.populate('product')
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

router.delete('/:orderId', checkAuth, (req, res, next) => {
	const id = req.params.orderId;
	Order.remove({_id: id})
	.exec()
	.then(result => {
		res.status(200).json({message: 'Order deleted'});
	})
	.catch(err =>{
		console.log(err);
		res.status(500).json({error: err});
	});
});

module.exports = router;