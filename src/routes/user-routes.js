const express = require("express");
const User = require("../models/users");
const multer = require("multer");
const auth = require("../middleware/auth");
const sharp = require("sharp");

const userRouter = express.Router();

const upload = multer({
	limit: {
		fileSize: 1048576,
	},
	fileFilter(req, file, callback) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			return callback(new Error("Invalid file type"));
		}
		callback(undefined, true);
	},
});

userRouter.get('/', (res,req) => {
	res.send("This is the front page now")
})

userRouter.post("/users/me/avatar",	auth, upload.single("avatar"), async (req, res) => {
		const buffer =  await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
	
		req.user.avatar = buffer
		await req.user.save();
		res.send();
	},
	(error, req, res, next) => {
		res.status(400).send({ error: error.message });
	},
);

userRouter.delete("/users/me/avatar", auth, upload.single("avatar"), async (req, res) => {
	req.user.avatar = undefined
	await req.user.save();
	res.send();
});

userRouter.get("/users/:id/avatar", async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if(!user || !user.avatar) {
			throw new Error("User not found")
		}

		res.set('Content-Type', 'image/png')
		res.send(user.avatar)
	}catch (err) {
		res.status(404).send(err)
	}
})

userRouter.get("/users/me", auth, async (req, res) => {
	res.send(req.user);
});

//Sign up route
userRouter.post("/users", async (req, res) => {
	const user = new User(req.body);
	try {
		const token = await user.genAuthToken();
		await user.save();
		res.status(201).send({ user, token });
	} catch (err) {
		res.status(400).send(err);
	}
});

//Login route
userRouter.post("/users/login", async (req, res) => {
	try {
		const user = await User.findByCredentials(req.body.email, req.body.password);
		const token = await user[0].genAuthToken();
		res.send({ user: user[0], token });
	} catch (err) {
		res.status(400).send(err);
	}
});

userRouter.post("/users/logout", auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter((token) => {
			console.log(token);
			return token.token !== req.token;
		});

		await req.user.save();
		res.send();
	} catch (error) {
		res.send(error);
	}
});

userRouter.post("/users/logoutAll", auth, async (req, res) => {
	try {
		req.user.tokens = [];

		await req.user.save();
		res.send();
	} catch (error) {
		res.send(error);
	}
});

userRouter.patch("/users/me", auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowed = ["name", "email", "password", "age"];

	const isallowed = updates.every((update) => allowed.includes(update));

	if (!isallowed) {
		return res.status(404).send({ error: "Invalid update" });
	}

	try {
		updates.forEach((update) => (req.user[update] = req.body[update]));

		await req.user.save();

		res.send(req.user);
	} catch (e) {
		res.status(400).send(e);
	}
});

userRouter.delete("/users/me", auth, async (req, res) => {
	try {
		await req.user.remove();
		res.status(200).send(req.user);
	} catch (e) {
		res.status(500).send(e);
	}
});

module.exports = userRouter;
