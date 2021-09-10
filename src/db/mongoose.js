const mongoose = require("mongoose");

mongoose.connect(process.env.Database,
	{
		useNewUrlParser: true,
	},
);

module.exports = mongoose;
