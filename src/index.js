const express = require("express");
require("./db/mongoose.js");
const userRouter = require("./routes/user-routes");
const taskRouter = require("./routes/task-routes");
const app = express();

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(process.env.PORT, () => {
	console.log("listening on port " + process.env.PORT);
});