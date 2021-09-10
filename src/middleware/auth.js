const jwt = require("jsonwebtoken");
const User = require("../models/users");

const auth = async (req, res, next) => {
	try {
		const token = req.header("Authorization").replace("Bearer ", "");
		const decodedToken = jwt.verify(token, process.env.jwtSecret);
		const user = await User.findOne({
			_id: decodedToken._id,
			"tokens.token": token,
		});

		if (!user) {
			throw new Error();
		}
		req.token = token;
		req.user = user;
		next();
	} catch (err) {
		res.send({ Error: "Please authenticate first" });
	}
};

module.exports = auth;
