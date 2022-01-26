const route = require('express').Router();

//
route.get("/", (req, res) => {

    return res.status(200).send({
        response: "Creative Node API",
        status: true
    })

})

module.exports = route;