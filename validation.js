//VALIDATON
const Joi = require("@hapi/joi");

//REGISTER
const registerValidation = (data) => {
  const schema = Joi.object({
    namePodcast: Joi.string().min(6).required(),
    email: Joi.string().min(6).required().email(),
    password: Joi.string().required().min(6),
  });

  return schema.validate(data);
};

const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
  });

  return schema.validate(data);
};

const podcastValidation = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(6).required(),
    description: Joi.string().min(6).required(),
  });

  return schema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.podcastValidation = podcastValidation;
