const router = require('express').Router();
const validator = require('../functions/validators');
const con = require('../server');
const Customer = require('../models/customer.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateCusID } = require('../functions/cusID');
const { validationResult } = require('express-validator');
require('dotenv').config();

router.post('/register', validator.validate('regCus'),async(req,res) => {
    const fname = req.body.fname;
    const lname = req.body.lname;
    const email = req.body.email;
    const address = req.body.address;
    const pNo = req.body.pNo;
    const password = req.body.password;
    let hashedPassword = "";
    let cus_id;

  const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions
  
        if (!errors.isEmpty()) {
          res.json({ "errors": errors.array() });
          return;
        }
  
    try {
      const result = await Customer.findOne({email});
      if (result) res.json({"emailerror": "Email is already in use!"}); 
      else{
          hashedPassword = await bcrypt.hash(password, 10);
          cus_id = await generateCusID.call();
          const newCustomer = new Customer({cus_id,fname,lname,email,hashedPassword,address,pNo});
          await newCustomer.save();
          res.json({"success": "Account creation is successfull"});
        }            
    } catch (error) {
      res.json(error);   
    }
  });//customer registration 

router.post('/login', validator.validate('cusLogin'),async (req,res) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions

    if (!errors.isEmpty()) {
      res.json({ "errors": errors.array() });
      return;
    }

  try {
    const doc = await Customer.findOne({email});

    if(!doc){
    return res.json({"emailerror":"Email is incorrect"});
    }

    const isSame = await bcrypt.compare(password, doc.hashedPassword);
  
    if(!isSame){
     return res.json({"emailerror":"Password is incorrect"});
    }
    else{
    const token = jwt.sign({id:doc._id}, process.env.JWT_TOKEN, {expiresIn: '24h'});
    res.json({"success":"Login was successful", 'id':doc.cus_id,'token':token});
    }
    
  } catch (error) {
    console.log(error);
  }
});//customer login

router.get('/profile/:id', async(req,res) => {
    const id = req.params.id;
  
    try{
      const customer = await Customer.findOne({cus_id:id});
      res.json(customer);
      
    }catch (error) {
      //console.log(error)
       res.status(400);
    }
  
  });//view customer profile data
  
router.post('/profile/update/:id', validator.validate('cusProfUpdate'),async(req,res) => {
    const id = req.params.id;
    const fname = req.body.fname;
    const lname = req.body.lname;
    const address = req.body.address;
    const pNo = req.body.pNo;
  
    const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions
  
      if (!errors.isEmpty()) {
        res.json({ "errors": errors.array() });
        return;
      }
  
    try {
      const customer = await Customer.findOne({cus_id:id});
      customer.fname = fname;
      customer.lname = lname;
      customer.address = address;
      customer.pNo = pNo;
          
      await customer.save();
      res.json({"success":"Profile data updated, Successfully"})
    } catch (error) {
      res.json({"emailerror":"Profile data update failed"})
      console.log(error);
    }
  
  });//update customer profile data

router.post('/profile/reset-password/:id', validator.validate('cusPasRes'),async(req,res) => {
  const id = req.params.id;
  const password = req.body.password;
  const repassword = req.body.repassword;

  const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions

    if (!errors.isEmpty()) {
      res.json({ "errors": errors.array() });
      return;
    }

  try {
    if(password != repassword){
      res.json({"emailerror":"Passwords don't match with each other"})
    }
    const hash = await bcrypt.hash(password, 10);
    const customer = await Customer.findOne({cus_id:id});
    customer.hashedPassword = hash;

    await customer.save();
    res.json({"success":"Password reset is successfull"})
  } catch (error) {
    res.json({"emailerror":"Password reset is unsuccessfull"})
    console.log(error);
  }
});//update customer profile data

router.get('/profile/logout', (req,res) => {

    res.json({'logout': true});
    
  });//customer logout

module.exports = router;