const express = require("express");
const Tasks = require("../models/tasks");
const auth = require("../middleware/auth");

const taskRouter = express.Router();

taskRouter.post("/tasks", auth, async (req, res) => {
	const task = new Tasks({
		...req.body,
		author: req.user._id,
	});
	try {
		await task.save(task);
		res.status(201).send(task);
	} catch (error) {
		res.status(400).send(error);
	}
});

taskRouter.get("/tasks/me", auth, async (req, res) => {
	const match = {};
	const sort = {};

	if (req.query.sortBy) {
		const parts = req.query.sortBy.split(":");
		console.log(parts);
		sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
	}

	if (req.query.completed) {
		match.completed = req.query.completed === "true";
	}
	try {
		await req.user.populate({
			path: "tasks",
			match,
			options: {
				limit: parseInt(req.query.limit),
				skip: parseInt(req.query.skip),
				sort,
			},
		});
		res.status(201).send(req.user.tasks);
	} catch (error) {
		res.status(400).send();
	}
});

taskRouter.get("/tasks/:id", auth, async (req, res) => {
	const _id = req.params.id;
	try {
		const task = await Tasks.findOne({ _id, author: req.user._id });
		if (!task) {
			return res.status(404).send();
		}
		res.status(200).send(task);
	} catch (error) {
		res.status(500).send(error);
	}
});

taskRouter.patch("/tasks/:id", auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowed = ["description", "completed"];

	const isallowed = updates.every((update) => allowed.includes(update));

	if (!isallowed) {
		return res.status(404).send({ error: "Invalid update" });
	}

	try {
		const tasks = await Tasks.findOne({
			_id: req.params.id,
			author: req.user._id,
		});
		if (!tasks) {
			return res.status(404).send();
		}

		updates.forEach((update) => (tasks[update] = req.body[update]));
		console.log(tasks);
		await tasks.save();

		res.send(tasks);
	} catch (e) {
		res.status(400).send(e);
	}
});

taskRouter.delete("/tasks/:id", auth, async (req, res) => {
	try {
		const task = await Tasks.findOneAndDelete({
			_id: req.params.id,
			author: req.user._id,
		});
		if (!task) {
			return res.status(404).send();
		}
		res.status(200).send(task);
	} catch (error) {
		res.status(500).send();
	}
});

module.exports = taskRouter;
